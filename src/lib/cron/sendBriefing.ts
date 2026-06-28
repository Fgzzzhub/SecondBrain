import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

export async function sendMorningBriefing() {
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  const vapidContact = process.env.VAPID_CONTACT_EMAIL || 'mailto:admin@brain-os.local'

  if (!vapidPublic || !vapidPrivate) {
    throw new Error('Missing VAPID keys. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in env.')
  }

  webpush.setVapidDetails(vapidContact, vapidPublic, vapidPrivate)

  const admin = createAdminClient()
  
  // Fetch all subscriptions
  const { data: subs, error } = await admin
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth')

  if (error) throw error
  if (!subs || subs.length === 0) {
    console.log('[sendMorningBriefing] No push subscriptions found.')
    return { sent: 0 }
  }

  // Group by user_id
  const byUser = new Map<string, typeof subs>()
  for (const s of subs) {
    const arr = byUser.get(s.user_id) ?? []
    arr.push(s)
    byUser.set(s.user_id, arr)
  }

  const results: { user: string; ok: number; failed: number; removed: number }[] = []

  for (const [userId, userSubs] of byUser) {
    try {
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
              { TTL: 60 * 60 * 6 }, // 6 hours
            )
            ok++
          } catch (err: any) {
            const status = err?.statusCode
            if (status === 404 || status === 410) {
              await admin.from('push_subscriptions').delete().eq('id', s.id)
              removed++
            } else {
              failed++
              console.error(`[sendMorningBriefing] Push error for sub ${s.id}:`, status, err)
            }
          }
        })
      )

      results.push({ user: userId.slice(0, 8), ok, failed, removed })
    } catch (err) {
      console.error(`[sendMorningBriefing] Failed preparing briefing for user ${userId}:`, err)
    }
  }

  console.log('[sendMorningBriefing] Daily briefing report:', results)
  return { results }
}

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
      .select('title, type, amount, frequency, billing_day, last_processed_at')
      .eq('user_id', userId),
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
    if (a.last_processed_at === todayKey) return false // already processed today
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
