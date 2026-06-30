import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { fetchRecapData } from '@/lib/recap/dataFetchers'
import { formatAsMarkdown } from '@/lib/recap/formatters'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Called from cron — generates weekly recap automatically
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: { users } } = await supabase.auth.admin.listUsers()
  if (!users || users.length === 0) {
    return NextResponse.json({ error: 'No user found' }, { status: 404 })
  }
  const userId = users[0].id

  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 7)

  const range = {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }

  const categories: any[] = ['finance', 'cigarettes', 'tasks', 'pomodoro', 'snapshots']

  const data = await fetchRecapData(categories, range)
  const periodLabel = `Weekly Recap — ${start.toLocaleDateString('id-ID')} s/d ${end.toLocaleDateString('id-ID')}`

  const content = formatAsMarkdown({
    data,
    categories,
    periodLabel,
    periodStart: range.start,
    periodEnd: range.end,
  })

  const { error: insertErr } = await supabase.from('recap_history').insert({
    user_id: userId,
    title: periodLabel,
    period_start: range.start,
    period_end: range.end,
    categories,
    format: 'markdown',
    content,
    trigger_type: 'scheduled',
  })

  if (insertErr) {
    console.error('[recap/scheduled] Failed to save to history:', insertErr)
  }

  return NextResponse.json({ success: true, periodLabel })
}
