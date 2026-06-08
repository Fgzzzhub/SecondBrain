import { createClient } from '@/lib/supabase/server'
import dynamic from 'next/dynamic'

const HabitCorrelation = dynamic(() => import('./HabitCorrelation').then(mod => mod.HabitCorrelation), {
  loading: () => <div className="h-48 w-full animate-pulse bg-neutral-900/10 rounded-2xl border border-neutral-900" />
})

const ProductivityZone = dynamic(() => import('./ProductivityZone').then(mod => mod.ProductivityZone), {
  loading: () => <div className="h-48 w-full animate-pulse bg-neutral-900/10 rounded-2xl border border-neutral-900" />
})

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-neutral-500 text-sm">Please log in to view analytics.</p>
      </div>
    )
  }

  // Calculate 30 days ago starting from today
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString()

  // Parallel fetch logs, transactions, and completed tasks
  const [logsRes, txsRes, tasksRes] = await Promise.all([
    supabase
      .from('cigarette_logs')
      .select('smoked_at, log_type')
      .eq('user_id', user.id)
      .gte('smoked_at', thirtyDaysAgoStr),
    supabase
      .from('transactions')
      .select('amount, created_at, category, type')
      .eq('user_id', user.id)
      .eq('category', 'F&B / Nongkrong')
      .eq('type', 'expense')
      .gte('created_at', thirtyDaysAgoStr),
    supabase
      .from('tasks')
      .select('id, completed_at, title')
      .eq('user_id', user.id)
      .eq('is_completed', true)
  ])

  const cigaretteLogs = logsRes.data || []
  const transactions = txsRes.data || []
  const completedTasks = tasksRes.data || []

  return (
    <div className="flex flex-col gap-8 h-full">
      <header>
        <h1 className="text-2xl font-medium tracking-tight text-white mb-1.5 font-sans">Workspace Analytics</h1>
        <p className="text-neutral-500 text-xs sm:text-sm">
          Deep behavioral insights exploring correlation patterns between social spending, habits, and task completion.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <HabitCorrelation cigaretteLogs={cigaretteLogs} transactions={transactions} />
        <ProductivityZone completedTasks={completedTasks} />
      </div>
    </div>
  )
}
