import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY belum di-set di environment.' },
      { status: 500 }
    )
  }

  // 1. Authenticate User
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse request body
  let body: { prompt?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 })
  }

  const prompt = (body.prompt ?? '').trim()
  if (!prompt) {
    return NextResponse.json({ error: 'Prompt cannot be empty' }, { status: 400 })
  }

  try {
    // 3. Invoke Gemini API with fallback models to avoid 429 Quota Exceeded on specific models
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    let responseText = ''
    
    const modelsToTry = [
      process.env.GEMINI_MODEL,
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'gemini-2.5-flash'
    ].filter(Boolean) as string[]

    let lastError: any = null
    for (const modelName of modelsToTry) {
      try {
        console.log(`[magic-log] Attempting parsing with model: ${modelName}`)
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
          },
          systemInstruction: `You are an AI data parser for a personal tracking app. The user will give you a raw string of their recent activities. Extract the financial transactions and cigarette consumption into a strict JSON format. Do not output any markdown formatting, backticks, or conversational text. Only raw JSON.
Schema required:
{
  "finance": [ { "amount": number, "category": string, "wallet_name": string, "type": "expense" | "income", "description": string } ],
  "cigarettes": { "sticks": number }
}
Rules:
- Finance categories must be one of: 'F&B / Nongkrong', 'Transport / Bensin', 'E-commerce', 'Internet / Digital', 'Kebutuhan Harian', 'Lainnya'. Infer the best fit.
- Default wallet to 'Cash' if not specified.
- If no finance or cigarette data is present, return an empty array/0.`,
        })

        const result = await model.generateContent(prompt)
        responseText = result.response.text().trim()
        if (responseText) {
          console.log(`[magic-log] Parsing successful with model: ${modelName}`)
          break
        }
      } catch (err: any) {
        console.warn(`[magic-log] Model ${modelName} failed/quota exceeded:`, err.message || err)
        lastError = err
      }
    }

    if (!responseText) {
      throw lastError || new Error('All generative models failed to respond.')
    }


    // 4. Parse JSON response
    let parsedData: {
      finance?: {
        amount: number
        category: string
        wallet_name: string
        type: 'expense' | 'income'
        description: string
      }[]
      cigarettes?: {
        sticks: number
      }
    }

    try {
      parsedData = JSON.parse(responseText)
    } catch (parseErr) {
      console.error('[magic-log] Malformed Gemini JSON:', responseText)
      return NextResponse.json({
        error: 'Gemini returned invalid JSON structure. Please try rephrasing your log.',
        raw: responseText
      }, { status: 422 })
    }

    const financeList = parsedData.finance || []
    const cigarettesData = parsedData.cigarettes || { sticks: 0 }

    const logsSummary: string[] = []

    // 5. Insert Finance Transactions
    for (const tx of financeList) {
      const amount = Math.abs(Number(tx.amount)) || 0
      if (amount <= 0) continue

      const finalType = tx.type === 'income' ? 'income' : 'expense'
      const finalCategory = [
        'F&B / Nongkrong',
        'Transport / Bensin',
        'E-commerce',
        'Internet / Digital',
        'Kebutuhan Harian',
        'Lainnya'
      ].includes(tx.category) ? tx.category : 'Lainnya'
      
      const walletName = tx.wallet_name || 'Cash'
      const walletType = walletName === 'Cash' ? 'Cash' : 'Cashless'

      const { error: txError } = await supabase.from('transactions').insert({
        user_id: user.id,
        amount,
        type: finalType,
        category: finalCategory,
        wallet_name: walletName,
        wallet_type: walletType,
        description: tx.description || 'Magic Logged',
        status: 'manual',
        created_at: new Date().toISOString()
      })

      if (txError) throw txError

      const formattedAmount = 'Rp' + amount.toLocaleString('id-ID')
      logsSummary.push(`${tx.description || 'Transaksi'} (${formattedAmount})`)
    }

    // 6. Insert Cigarette Logs
    const sticks = Math.abs(Number(cigarettesData.sticks)) || 0
    if (sticks > 0) {
      // Find active pack
      const { data: activePacks, error: fetchPackErr } = await supabase
        .from('cigarette_packs')
        .select('id, remaining_sticks')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gt('remaining_sticks', 0)
        .order('created_at', { ascending: false })

      if (fetchPackErr) throw fetchPackErr

      let packId = activePacks?.[0]?.id
      let remainingSticks = activePacks?.[0]?.remaining_sticks || 0

      // Self-healing default pack creation if no active pack is registered
      if (!packId) {
        const { data: newPack, error: packErr } = await supabase
          .from('cigarette_packs')
          .insert({
            brand: 'Default Pack',
            initial_sticks: 20,
            remaining_sticks: 20,
            is_active: true,
            user_id: user.id
          })
          .select('id, remaining_sticks')
          .single()

        if (packErr) throw packErr
        packId = newPack.id
        remainingSticks = 20
      }

      const newRemaining = Math.max(0, remainingSticks - sticks)

      // Update pack remaining sticks
      const { error: updateErr } = await supabase
        .from('cigarette_packs')
        .update({
          remaining_sticks: newRemaining,
          is_active: newRemaining > 0
        })
        .eq('id', packId)

      if (updateErr) throw updateErr

      // Bulk insert individual cigarette logs
      const logsToInsert = Array.from({ length: sticks }).map(() => ({
        pack_id: packId,
        user_id: user.id,
        log_type: 'self',
        smoked_at: new Date().toISOString()
      }))

      const { error: logsError } = await supabase
        .from('cigarette_logs')
        .insert(logsToInsert)

      if (logsError) throw logsError

      logsSummary.push(`${sticks} batang rokok`)
    }

    // 7. Assemble final success status
    if (logsSummary.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tidak ada data transaksi atau rokok yang terdeteksi.'
      })
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil dicatat: ${logsSummary.join(' & ')}`
    })

  } catch (err: any) {
    console.error('[magic-log] Error:', err)
    return NextResponse.json({ error: err.message || 'Server error occurred' }, { status: 500 })
  }
}
