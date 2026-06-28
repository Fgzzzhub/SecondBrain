import { createAdminClient } from '@/lib/supabase/admin'

export async function flagOverdue() {
  const admin = createAdminClient()
  const now = new Date().toISOString()

  // Update all tasks whose due_date is in the past and are not completed
  const { error, count } = await admin
    .from('tasks')
    .update({ status: 'overdue' })
    .lt('due_date', now)
    .eq('is_completed', false)
    .neq('status', 'overdue')

  if (error) throw error

  console.log(`[flagOverdue] ${count ?? 0} tasks marked overdue`)
}
