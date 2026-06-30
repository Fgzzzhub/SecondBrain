import { createClient } from '@/lib/supabase/server'

export type RecapCategory =
  | 'finance'
  | 'cigarettes'
  | 'tasks'
  | 'notes'
  | 'pomodoro'
  | 'schedule'
  | 'inventory'
  | 'subscriptions'
  | 'snapshots'

interface DateRange {
  start: string // ISO date YYYY-MM-DD
  end: string   // ISO date YYYY-MM-DD
}

export async function fetchFinanceData(range: DateRange) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, type, description, wallet_type, wallet_name, category, status, created_at')
    .eq('user_id', user.id)
    .gte('created_at', `${range.start}T00:00:00`)
    .lte('created_at', `${range.end}T23:59:59`)
    .order('created_at', { ascending: false })

  const { data: autoTransactions } = await supabase
    .from('auto_transactions')
    .select('title, type, amount, category, wallet_name, frequency, billing_day')

  const income = transactions?.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0) ?? 0
  const expense = transactions?.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0) ?? 0

  const categoryBreakdown = transactions
    ?.filter(t => t.type === 'expense')
    .reduce((acc: Record<string, number>, t) => {
      const cat = t.category || 'Lainnya'
      acc[cat] = (acc[cat] || 0) + Number(t.amount)
      return acc
    }, {}) ?? {}

  const walletBreakdown = transactions
    ?.filter(t => t.description !== 'SYSTEM_CALIBRATION')
    .reduce((acc: Record<string, number>, t) => {
      let key = t.wallet_name || (t.wallet_type === 'Cash' ? 'Cash' : 'Cashless')
      if (key === 'Cashless') key = 'Livin'
      acc[key] = (acc[key] || 0) + (t.type === 'income' ? Number(t.amount) : -Number(t.amount))
      return acc
    }, {}) ?? {}

  return {
    summary: { income, expense, net: income - expense, transactionCount: transactions?.length ?? 0 },
    categoryBreakdown,
    walletBreakdown,
    autoTransactions: autoTransactions ?? [],
    transactions: transactions ?? [],
  }
}

export async function fetchCigaretteData(range: DateRange) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: logs } = await supabase
    .from('cigarette_logs')
    .select('smoked_at, log_type, pack_id')
    .eq('user_id', user.id)
    .gte('smoked_at', `${range.start}T00:00:00`)
    .lte('smoked_at', `${range.end}T23:59:59`)
    .order('smoked_at', { ascending: false })

  const { data: packs } = await supabase
    .from('cigarette_packs')
    .select('brand, initial_sticks, remaining_sticks, is_active, created_at')
    .eq('user_id', user.id)

  const dailyCounts: Record<string, number> = {}
  logs?.forEach(log => {
    const date = log.smoked_at.split('T')[0]
    dailyCounts[date] = (dailyCounts[date] || 0) + 1
  })

  const totalSmoked = logs?.length ?? 0
  const daysWithData = Object.keys(dailyCounts).length
  const avgPerDay = daysWithData > 0 ? (totalSmoked / daysWithData).toFixed(1) : '0'
  const selfCount = logs?.filter(l => l.log_type === 'self').length ?? 0
  const sharedCount = logs?.filter(l => l.log_type === 'shared').length ?? 0

  return {
    summary: { totalSmoked, avgPerDay, daysWithData, selfCount, sharedCount },
    dailyCounts,
    packs: packs ?? [],
    rawLogs: logs ?? [],
  }
}

export async function fetchTasksData(range: DateRange) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: tasks } = await supabase
    .from('tasks')
    .select('title, description, due_date, is_completed, completed_at, status, created_at')
    .eq('user_id', user.id)
    .gte('created_at', `${range.start}T00:00:00`)
    .lte('created_at', `${range.end}T23:59:59`)
    .order('created_at', { ascending: false })

  const completed = tasks?.filter(t => t.is_completed).length ?? 0
  const pending = tasks?.filter(t => !t.is_completed).length ?? 0
  const overdue = tasks?.filter(t =>
    !t.is_completed && t.due_date && new Date(t.due_date) < new Date()
  ).length ?? 0

  return {
    summary: {
      total: tasks?.length ?? 0,
      completed,
      pending,
      overdue,
      completionRate: tasks?.length ? Math.round((completed / tasks.length) * 100) : 0
    },
    tasks: tasks ?? [],
  }
}

export async function fetchNotesData(range: DateRange) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: notes } = await supabase
    .from('notes')
    .select('title, content, created_at')
    .eq('user_id', user.id)
    .gte('created_at', `${range.start}T00:00:00`)
    .lte('created_at', `${range.end}T23:59:59`)
    .order('created_at', { ascending: false })

  return { summary: { total: notes?.length ?? 0 }, notes: notes ?? [] }
}

export async function fetchPomodoroData(range: DateRange) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: sessions } = await supabase
    .from('pomodoro_sessions')
    .select('duration_minutes, mode, task_id, created_at')
    .eq('user_id', user.id)
    .gte('created_at', `${range.start}T00:00:00`)
    .lte('created_at', `${range.end}T23:59:59`)

  const workSessions = sessions?.filter(s => s.mode === 'work') ?? []
  const totalFocusMinutes = workSessions.reduce((s, p) => s + (p.duration_minutes ?? 0), 0)

  return {
    summary: {
      totalSessions: workSessions.length,
      totalFocusMinutes,
      totalFocusHours: (totalFocusMinutes / 60).toFixed(1),
      avgSessionMinutes: workSessions.length
        ? Math.round(totalFocusMinutes / workSessions.length)
        : 0,
    },
    sessions: sessions ?? [],
  }
}

export async function fetchScheduleData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: schedule } = await supabase
    .from('schedule')
    .select('subject, day, start_time, end_time, room')
    .eq('user_id', user.id)
    .order('day')

  return { summary: { total: schedule?.length ?? 0 }, schedule: schedule ?? [] }
}

export async function fetchInventoryData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: inventory } = await supabase
    .from('inventories')
    .select('item_name, status, quantity, location')
    .eq('user_id', user.id)

  const byStatus = inventory?.reduce((acc: Record<string, number>, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1
    return acc
  }, {}) ?? {}

  return { summary: { total: inventory?.length ?? 0, byStatus }, items: inventory ?? [] }
}

export async function fetchSubscriptionsData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('name, amount, billing_day, wallet_name')
    .eq('user_id', user.id)

  const totalMonthly = subscriptions?.reduce((s, sub) => s + Number(sub.amount), 0) ?? 0

  return {
    summary: { total: subscriptions?.length ?? 0, totalMonthly },
    subscriptions: subscriptions ?? []
  }
}

export async function fetchSnapshotsData(range: DateRange) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: snapshots } = await supabase
    .from('daily_snapshots')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', range.start)
    .lte('date', range.end)
    .order('date', { ascending: true })

  return { summary: { totalDays: snapshots?.length ?? 0 }, snapshots: snapshots ?? [] }
}

// Master fetcher — call based on selected categories
export async function fetchRecapData(categories: RecapCategory[], range: DateRange) {
  const result: Record<string, any> = {}

  await Promise.all(categories.map(async (cat) => {
    switch (cat) {
      case 'finance':       result.finance       = await fetchFinanceData(range); break
      case 'cigarettes':   result.cigarettes    = await fetchCigaretteData(range); break
      case 'tasks':        result.tasks         = await fetchTasksData(range); break
      case 'notes':        result.notes         = await fetchNotesData(range); break
      case 'pomodoro':     result.pomodoro      = await fetchPomodoroData(range); break
      case 'schedule':     result.schedule      = await fetchScheduleData(); break
      case 'inventory':    result.inventory     = await fetchInventoryData(); break
      case 'subscriptions':result.subscriptions = await fetchSubscriptionsData(); break
      case 'snapshots':    result.snapshots     = await fetchSnapshotsData(range); break
    }
  }))

  return result
}
