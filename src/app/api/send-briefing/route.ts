import webpush from 'web-push'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Vercel Cron entry point — runs daily at 00:00 UTC (07:00 WIB).
 * Fans out a personalised "daily briefing" Web Push to every saved
 * push_subscriptions row, computing per-user finance/cigarette/task/pomodoro stats.
 *
 * Auth: Vercel sends `Authorization: Bearer ${CRON_SECRET}` when CRON_SECRET is set.
 *       We verify it to prevent abuse.
 */
export async function GET(req: Request) {
  // ---- 1. Cron auth check ----
  const expected = process.env.CRON_SECRET
  if (expected) {
    const got = req.headers.get('authorization')
    if (got !== `Bearer ${expected}`) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }

  // ---- 2. VAPID config ----
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  const vapidContact = process.env.VAPID_CONTACT_EMAIL || 'mailto:admin@brain-os.local'

  if (!vapidPublic || !vapidPrivate) {
    return new NextResponse(
      'Missing VAPID keys. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in env.',
      { status: 500 },
    )
  }

  webpush.setVapidDetails(vapidContact, vapidPublic, vapidPrivate)

  // ---- 3. Fetch all subscriptions ----
  const admin = createAdminClient()
  const { data: subs, error } = await admin
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth')

  if (error) return new NextResponse(error.message, { status: 500 })
  if (!subs || subs.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: 'no subscribers' })
  }

  // Group subscriptions by user so we only build the briefing payload once per user.
  const byUser = new Map<string, typeof subs>()
  for (const s of subs) {
    const arr = byUser.get(s.user_id) ?? []
    arr.push(s)
    byUser.set(s.user_id, arr)
  }

  const results: { user: string; ok: number; failed: number; removed: number }[] = []

  for (const [userId, userSubs] of byUser) {
    const payload = await buildBriefingPayload(admin, userId)
    let ok = 0, failed = 0, removed = 0

    await Promise.all(
      userSubs.map(async (s) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: s.endpoint,
              keys: { p256dh: s.p256dh, auth: s.auth },
            },
            JSON.stringify(payload),
            { TTL: 60 * 60 * 6 }, // 6h — briefing is stale after that
          )
          ok++
        } catch (err: unknown) {
          // 404/410 → endpoint gone, prune it.
          const status = (err as { statusCode?: number })?.statusCode
          if (status === 404 || status === 410) {
            await admin.from('push_subscriptions').delete().eq('id', s.id)
            removed++
          } else {
            failed++
            console.error('push send error', status, err)
          }
        }
      }),
    )

    results.push({ user: userId.slice(0, 8), ok, failed, removed })
  }

  return NextResponse.json({ ok: true, results })
}

// Also expose POST for manual testing / for cron systems that require POST.
export async function POST(req: Request) {
  return GET(req)
}

/* ============================================================================
 * Build the briefing payload for a single user. Uses real schema.
 * ========================================================================== */
async function buildBriefingPayload(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    walletTxRes,
    yesterdayCigsRes,
    monthCigsRes,
    pendingTasksRes,
    overdueTasksRes,
    yesterdayPomoRes,
    autoTxRes,
  ] = await Promise.all([
    admin
      .from('transactions')
      .select('amount, type, wallet_name')
      .eq('user_id', userId),
    admin
      .from('cigarette_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('smoked_at', startOfYesterday.toISOString())
      .lt('smoked_at', startOfToday.toISOString()),
    admin
      .from('cigarette_logs')
      .select('smoked_at')
      .eq('user_id', userId)
      .gte('smoked_at', startOfMonth.toISOString()),
    admin
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', false),
    admin
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', false)
      .lt('due_date', now.toISOString()),
    admin
      .from('pomodoro_sessions')
      .select('duration_minutes')
      .eq('user_id', userId)
      .eq('mode', 'work')
      .gte('created_at', startOfYesterday.toISOString())
      .lt('created_at', startOfToday.toISOString()),
    admin
      .from('auto_transactions')
      .select('title, type, amount, frequency, billing_day, last_processed_at'),
  ])

  // -------- Wallet balance --------
  const balanceByWallet: Record<string, number> = {}
  for (const t of walletTxRes.data ?? []) {
    const w = t.wallet_name || 'Cashless'
    const amt = Number(t.amount)
    if (!balanceByWallet[w]) balanceByWallet[w] = 0
    balanceByWallet[w] += t.type === 'income' ? amt : -amt
  }
  const totalBalance = Object.values(balanceByWallet).reduce((s, v) => s + v, 0)

  // -------- Cigarettes --------
  const cigsYesterday = yesterdayCigsRes.count ?? 0
  const monthLogs = monthCigsRes.data ?? []
  const cigsByDay: Record<string, number> = {}
  for (const l of monthLogs) {
    const k = String(l.smoked_at).slice(0, 10)
    cigsByDay[k] = (cigsByDay[k] || 0) + 1
  }
  const dayCount = Math.max(Object.keys(cigsByDay).length, 1)
  const avgCigsPerDay = monthLogs.length / dayCount

  // -------- Tasks --------
  const pendingTasks = pendingTasksRes.count ?? 0
  const overdueTasks = overdueTasksRes.count ?? 0

  // -------- Pomodoro --------
  const focusMinYesterday = (yesterdayPomoRes.data ?? []).reduce(
    (s, p) => s + Number(p.duration_minutes || 0),
    0,
  )

  // -------- Automations running today --------
  const todayKey = now.toISOString().slice(0, 10)
  const todayDate = now.getDate()
  const autoTodayCount = (autoTxRes.data ?? []).filter((a) => {
    if (a.last_processed_at === todayKey) return false // already ran today
    if (a.frequency === 'daily') return true
    if (a.frequency === 'monthly' && a.billing_day === todayDate) return true
    return false
  }).length

  const fmt = (n: number) => 'Rp' + Math.round(n).toLocaleString('id-ID')
  const lines: string[] = []
  lines.push(`💰 Saldo: ${fmt(totalBalance)}`)
  if (autoTodayCount > 0) lines.push(`⚙️ ${autoTodayCount} automasi jalan hari ini`)
  lines.push(
    `🚬 Kemarin: ${cigsYesterday} batang (rata-rata ${avgCigsPerDay.toFixed(1)}/hari)`,
  )
  lines.push(`✅ ${pendingTasks} task pending${overdueTasks > 0 ? ` · ${overdueTasks} overdue` : ''}`)
  if (focusMinYesterday > 0) {
    lines.push(`⏱️ ${focusMinYesterday} menit fokus kemarin`)
  }

  return {
    title: '☀️ Selamat pagi! Briefing harian',
    body: lines.join('\n'),
    url: '/',
    tag: 'daily-briefing',
    icon: '/icon.svg',
  }
}
