import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { secret, amount, type, description, source, raw_subject, confidence, recipient } = body

    // 1. Auth check
    if (secret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validate payload
    if (!amount || amount <= 0 || !['plus', 'minus'].includes(type)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const admin = createAdminClient()

    // 3. Resolve user_id based on recipient email or fallback to first user
    const { data: { users }, error: listError } = await admin.auth.admin.listUsers()
    if (listError) {
      console.error('[auto-transaction] failed to list users:', listError)
      return NextResponse.json({ error: 'Failed to resolve users' }, { status: 500 })
    }

    let targetUserId = ''
    if (recipient) {
      const match = users.find(u => u.email?.toLowerCase() === recipient.toLowerCase())
      if (match) targetUserId = match.id
    }

    // Fallback to the first user if email match wasn't found (for robust personal single-user apps)
    if (!targetUserId && users && users.length > 0) {
      targetUserId = users[0].id
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'No user found' }, { status: 404 })
    }

    // 4. Determine status: confidence < 80 → 'pending_review', otherwise 'auto'
    const status = (confidence ?? 100) >= 80 ? 'auto' : 'pending_review'

    const dbType = type === 'plus' ? 'income' : 'expense'

    // 5. Insert transaction using admin client to bypass RLS
    const { error: insertError } = await admin.from('transactions').insert({
      user_id: targetUserId,
      amount,
      type: dbType,
      category: 'auto-import',
      description: description || 'Auto-Imported Transaction',
      source: source || 'email',
      status,
      raw_subject: raw_subject || null,
      confidence: confidence ?? 100,
      wallet_name: 'Cashless',
      wallet_type: 'Cashless',
      created_at: new Date().toISOString()
    })

    if (insertError) {
      console.error('[auto-transaction] Insert error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, status })
  } catch (err: any) {
    console.error('auto-transaction error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
