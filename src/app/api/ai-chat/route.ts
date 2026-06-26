import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface IncomingMessage { role: 'user' | 'ai'; content: string }

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return new NextResponse(
      'GEMINI_API_KEY belum di-set di environment. Daftar gratis di https://aistudio.google.com/app/apikey',
      { status: 500 },
    )
  }

  let body: { message?: string; history?: IncomingMessage[] }
  try {
    body = await req.json()
  } catch {
    return new NextResponse('Body bukan JSON valid', { status: 400 })
  }

  const message = (body.message ?? '').trim()
  if (!message) return new NextResponse('Pesan kosong', { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const summary = await buildContextSummary(supabase, user.id)
  const systemInstruction = buildSystemPrompt(summary)

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      // Override via GEMINI_MODEL if a model has no free-tier quota on your key.
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      systemInstruction,
    })

    const history = (body.history ?? [])
      .filter((h) => typeof h?.content === 'string' && h.content.trim().length > 0)
      .map((h) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }],
      }))

    // Gemini requires the first message in history to be from 'user', not 'model'.
    const validHistory =
      history.length > 0 && history[0].role === 'model' ? history.slice(1) : history

    const chat = model.startChat({ history: validHistory })
    const result = await chat.sendMessage(message)
    const reply = result.response.text()

    return NextResponse.json({ reply })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Gemini API error'
    console.error('AI chat error:', msg)

    // Quota / rate-limit: give a clear, actionable message instead of the raw dump.
    if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
      return new NextResponse(
        'Kuota Gemini habis untuk model ini. Coba lagi sebentar, atau ganti model ' +
          'lewat env GEMINI_MODEL (mis. gemini-2.5-flash) / pakai API key baru dari ' +
          'https://aistudio.google.com/app/apikey',
        { status: 429 },
      )
    }

    return new NextResponse(`Gagal memanggil Gemini: ${msg}`, { status: 500 })
  }
}

/* ============================================================================
 * Build a compact summary of the user's data for the Gemini context.
 * Uses ACTUAL schema (verified from migrations + actions.ts):
 *   - transactions:    amount, type ('income'|'expense'), description,
 *                      category, wallet_name, created_at
 *   - cigarette_logs:  pack_id, smoked_at (one row per stick)
 *   - cigarette_packs: brand, remaining_sticks, is_active
 *   - tasks:           title, is_completed, completed_at, due_date, created_at
 *   - pomodoro_sessions: duration_minutes, mode, created_at
 *   - auto_transactions: title, type, amount, category, wallet_name, frequency,
 *                        billing_day, last_processed_at
 *   - subscriptions:   name, amount, billing_day, wallet_name
 * ========================================================================== */
async function buildContextSummary(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfMonthISO = startOfMonth.toISOString()

  const startOfWeek = new Date(now)
  const dayOfWeek = startOfWeek.getDay() // 0 (Sun) - 6 (Sat)
  startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek)
  startOfWeek.setHours(0, 0, 0, 0)
  const startOfWeekISO = startOfWeek.toISOString()

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = yesterday.toISOString().slice(0, 10) // YYYY-MM-DD

  const todayKey = now.toISOString().slice(0, 10)

  const [
    txRes,
    cigRes,
    activePacksRes,
    tasksRes,
    pomoRes,
    autoTxRes,
    subsRes,
  ] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, type, category, description, wallet_name, created_at')
      .eq('user_id', userId)
      .neq('description', 'SYSTEM_CALIBRATION')
      .gte('created_at', startOfMonthISO)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('cigarette_logs')
      .select('smoked_at, pack_id, cigarette_packs(brand)')
      .eq('user_id', userId)
      .gte('smoked_at', startOfMonthISO)
      .order('smoked_at', { ascending: false }),
    supabase
      .from('cigarette_packs')
      .select('brand, remaining_sticks, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('remaining_sticks', 0),
    supabase
      .from('tasks')
      .select('title, is_completed, completed_at, due_date, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(80),
    supabase
      .from('pomodoro_sessions')
      .select('duration_minutes, mode, created_at')
      .eq('user_id', userId)
      .gte('created_at', startOfWeekISO)
      .order('created_at', { ascending: false }),
    supabase
      .from('auto_transactions')
      .select('title, type, amount, category, wallet_name, frequency, billing_day, last_processed_at')
      .eq('user_id', userId),
    supabase
      .from('subscriptions')
      .select('name, amount, billing_day, wallet_name'),
  ])

  // Pomodoro table may not exist yet (migration applied later) — degrade gracefully.
  const pomodoros = pomoRes.data ?? []
  const transactions = txRes.data ?? []
  const cigarettes = cigRes.data ?? []
  const activePacks = activePacksRes.data ?? []
  const tasks = tasksRes.data ?? []
  const autoTx = autoTxRes.data ?? []
  const subscriptions = subsRes.data ?? []

  // -------------- Finance --------------
  const totalIn = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount || 0), 0)
  const totalOut = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount || 0), 0)
  const net = totalIn - totalOut

  const expensesByCategory: Record<string, number> = {}
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const k = t.category || 'Lainnya'
      expensesByCategory[k] = (expensesByCategory[k] || 0) + Number(t.amount || 0)
    })

  const expensesByWallet: Record<string, number> = {}
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const k = t.wallet_name || 'Cashless'
      expensesByWallet[k] = (expensesByWallet[k] || 0) + Number(t.amount || 0)
    })

  // -------------- Cigarettes --------------
  // Each row is one stick smoked. Count per day.
  const cigPerDay: Record<string, number> = {}
  cigarettes.forEach((c) => {
    const day = String(c.smoked_at).slice(0, 10)
    cigPerDay[day] = (cigPerDay[day] || 0) + 1
  })
  const totalCigsThisMonth = cigarettes.length
  const cigDayCount = Object.keys(cigPerDay).length || 1
  const avgCigsPerDay = (totalCigsThisMonth / cigDayCount).toFixed(1)
  const cigsToday = cigPerDay[todayKey] || 0
  const cigsYesterday = cigPerDay[yesterdayKey] || 0
  const last7Days = Object.entries(cigPerDay)
    .sort((a, b) => (a[0] > b[0] ? -1 : 1))
    .slice(0, 7)

  // -------------- Tasks --------------
  const tasksTotal = tasks.length
  const tasksDone = tasks.filter((t) => t.is_completed).length
  const tasksPending = tasks.filter((t) => !t.is_completed).length
  const tasksOverdue = tasks.filter(
    (t) => !t.is_completed && t.due_date && new Date(t.due_date) < now,
  ).length

  // -------------- Pomodoro --------------
  const focusSessions = pomodoros.filter((p) => p.mode === 'work').length
  const focusMinutes = pomodoros
    .filter((p) => p.mode === 'work')
    .reduce((s, p) => s + Number(p.duration_minutes || 0), 0)

  // -------------- Auto-Pilot --------------
  const autoSummary = autoTx.map((a) => {
    const sign = a.type === 'income' ? '+' : '-'
    const schedule = a.frequency === 'monthly'
      ? `bulanan tgl ${a.billing_day ?? '?'}`
      : 'harian'
    return `${a.title}: ${sign}Rp${Number(a.amount).toLocaleString('id-ID')} (${schedule})`
  })

  return {
    monthLabel: now.toLocaleString('id-ID', { month: 'long', year: 'numeric' }),
    finance: {
      totalIn,
      totalOut,
      net,
      txCount: transactions.length,
      expensesByCategory,
      expensesByWallet,
    },
    cigarettes: {
      total: totalCigsThisMonth,
      avgPerDay: avgCigsPerDay,
      today: cigsToday,
      yesterday: cigsYesterday,
      last7Days: Object.fromEntries(last7Days),
      activePacks: activePacks.map((p) => ({
        brand: p.brand,
        remaining: p.remaining_sticks,
      })),
    },
    tasks: { total: tasksTotal, done: tasksDone, pending: tasksPending, overdue: tasksOverdue },
    pomodoro: { sessions: focusSessions, minutes: focusMinutes, hours: (focusMinutes / 60).toFixed(1) },
    autoTransactions: autoSummary,
    subscriptions: subscriptions.map((s) => ({
      name: s.name,
      amount: Number(s.amount),
      billing_day: s.billing_day,
      wallet: s.wallet_name,
    })),
  }
}

function fmtIDR(n: number) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID')
}

function buildSystemPrompt(s: ReturnType<typeof buildContextSummary> extends Promise<infer R> ? R : never): string {
  return `
Kamu adalah asisten personal AI di aplikasi life-management milik user.
Jawab dalam Bahasa Indonesia santai dan langsung ke poin. Hindari bertele-tele.
Gunakan emoji secukupnya (1-3 per jawaban max).
Format angka rupiah seperti "Rp 1.250.000". Format persentase 1 desimal.
Kalau user minta insight, beri analisis actionable yang spesifik ke data — jangan generic.
Kalau data tidak ada / kosong untuk pertanyaan, katakan jujur "data belum cukup" daripada mengarang.

## DATA USER (${s.monthLabel})

### 💰 FINANCE
- Total pemasukan bulan ini: ${fmtIDR(s.finance.totalIn)}
- Total pengeluaran bulan ini: ${fmtIDR(s.finance.totalOut)}
- Net cashflow: ${fmtIDR(s.finance.net)}
- Jumlah transaksi: ${s.finance.txCount}
- Pengeluaran per kategori: ${JSON.stringify(
    Object.fromEntries(
      Object.entries(s.finance.expensesByCategory).map(([k, v]) => [k, fmtIDR(v)]),
    ),
  )}
- Pengeluaran per dompet: ${JSON.stringify(
    Object.fromEntries(
      Object.entries(s.finance.expensesByWallet).map(([k, v]) => [k, fmtIDR(v)]),
    ),
  )}
- Automasi terjadwal: ${s.autoTransactions.length > 0 ? s.autoTransactions.join(' | ') : '(belum ada)'}
- Langganan aktif: ${
    s.subscriptions.length > 0
      ? s.subscriptions
          .map((sub) => `${sub.name} (${fmtIDR(sub.amount)} tgl ${sub.billing_day} dari ${sub.wallet})`)
          .join(' | ')
      : '(belum ada)'
  }

### 🚬 CIGARETTES
- Hari ini: ${s.cigarettes.today} batang
- Kemarin: ${s.cigarettes.yesterday} batang
- Rata-rata per hari (bulan ini): ${s.cigarettes.avgPerDay} batang
- Total bulan ini: ${s.cigarettes.total} batang
- 7 hari terakhir (per tanggal): ${JSON.stringify(s.cigarettes.last7Days)}
- Pack aktif tersisa: ${
    s.cigarettes.activePacks.length > 0
      ? s.cigarettes.activePacks.map((p) => `${p.brand}: ${p.remaining}`).join(', ')
      : '(tidak ada pack aktif)'
  }

### ✅ TASKS
- Total: ${s.tasks.total}
- Selesai: ${s.tasks.done}
- Pending: ${s.tasks.pending}
- Overdue: ${s.tasks.overdue}

### ⏱️ POMODORO (minggu ini)
- Sesi fokus selesai: ${s.pomodoro.sessions}
- Total menit fokus: ${s.pomodoro.minutes} menit (${s.pomodoro.hours} jam)
${s.pomodoro.sessions === 0 ? '(catatan: belum ada sesi pomodoro tercatat minggu ini)' : ''}

---
Selalu jawab berdasarkan data di atas. Jangan mengarang transaksi/log yang tidak ada.
`.trim()
}
