import { createAdminClient } from '@/lib/supabase/admin'

export async function snapshotDaily(date: string) {
  const admin = createAdminClient()
  
  // Get all users from auth
  const { data: { users }, error: usersError } = await admin.auth.admin.listUsers()
  if (usersError) throw usersError
  if (!users || users.length === 0) {
    console.log('[snapshotDaily] No users found.')
    return
  }

  const startOfDay = `${date}T00:00:00.000Z`
  const endOfDay = `${date}T23:59:59.999Z`

  for (const user of users) {
    try {
      // 1. Fetch transactions, cigarettes log, tasks, and pomodoros
      const [
        { data: transactions },
        { count: cigarettesCount },
        { data: tasks },
        { data: pomodoros }
      ] = await Promise.all([
        admin.from('transactions')
          .select('amount, type, category')
          .eq('user_id', user.id)
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay),

        admin.from('cigarette_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('smoked_at', startOfDay)
          .lte('smoked_at', endOfDay),

        admin.from('tasks')
          .select('is_completed')
          .eq('user_id', user.id),

        admin.from('pomodoro_sessions')
          .select('duration_minutes')
          .eq('user_id', user.id)
          .eq('mode', 'work')
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay)
      ])

      // 2. Compute summaries
      const totalIn = transactions?.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0) ?? 0
      const totalOut = transactions?.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0) ?? 0
      const focusMinutes = pomodoros?.reduce((s, p) => s + Number(p.duration_minutes || 0), 0) ?? 0

      // 3. Compute balance (sum of all transactions up to endOfDay)
      const { data: allPrevTx } = await admin
        .from('transactions')
        .select('amount, type')
        .eq('user_id', user.id)
        .lte('created_at', endOfDay)

      const balance = allPrevTx?.reduce((s, t) => {
        const amt = Number(t.amount || 0)
        return s + (t.type === 'income' ? amt : -amt)
      }, 0) ?? 0

      // 4. Save snapshot
      const snapshot = {
        user_id: user.id,
        date,
        balance,
        income: totalIn,
        expense: totalOut,
        net: totalIn - totalOut,
        cigarettes: cigarettesCount ?? 0,
        tasks_total: tasks?.length ?? 0,
        tasks_done: tasks?.filter(t => t.is_completed).length ?? 0,
        tasks_pending: tasks?.filter(t => !t.is_completed).length ?? 0,
        focus_minutes: focusMinutes,
        focus_sessions: pomodoros?.length ?? 0,
        created_at: new Date().toISOString()
      }

      const { error: upsertError } = await admin
        .from('daily_snapshots')
        .upsert(snapshot, { onConflict: 'user_id,date' })

      if (upsertError) {
        console.error(`[snapshotDaily] Error upserting for user ${user.id}:`, upsertError)
      } else {
        console.log(`[snapshotDaily] Saved snapshot for user ${user.id} on date ${date}`)
      }
    } catch (err) {
      console.error(`[snapshotDaily] Failed processing user ${user.id}:`, err)
    }
  }
}
