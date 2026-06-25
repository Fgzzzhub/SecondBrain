import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import Link from 'next/link'
import { CheckSquare, Calendar, StickyNote, ArrowUpRight } from 'lucide-react'
import { RabbitHoleWidget } from './components/RabbitHoleWidget'
import { FinanceOverview } from './components/FinanceOverview'
import { getWalletBalances } from '@/app/actions'
import { DailyBriefing } from './components/DailyBriefing'
import { SubscriptionAlerts } from './components/SubscriptionAlerts'

const quotes = [
  "Simplicity is the ultimate sophistication.",
  "Focus on being productive instead of busy.",
  "The best way to predict the future is to create it.",
  "Your mind is for having ideas, not holding them."
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Calculate local bounds of today
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const startOfTodayStr = startOfToday.toISOString()

  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)
  const endOfTodayStr = endOfToday.toISOString()

  // Fetch statistics & tracker data in parallel
  const [
    { count: pendingTasks },
    { data: schedule },
    { data: notes },
    walletBalances,
    { count: tasksCompletedToday },
    { data: todayExpensesData },
    { count: cigarettesToday },
    { data: subscriptions }
  ] = await Promise.all([
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('is_completed', false).eq('user_id', user.id),
    supabase.from('schedule').select('*').eq('user_id', user.id),
    supabase.from('notes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
    getWalletBalances(),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('is_completed', true).eq('user_id', user.id).gte('completed_at', startOfTodayStr).lte('completed_at', endOfTodayStr),
    supabase.from('transactions').select('amount').eq('user_id', user.id).eq('type', 'expense').neq('description', 'SYSTEM_CALIBRATION').gte('created_at', startOfTodayStr).lte('created_at', endOfTodayStr),
    supabase.from('cigarette_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('smoked_at', startOfTodayStr).lte('smoked_at', endOfTodayStr),
    supabase.from('subscriptions').select('*')
  ])

  const todayName = format(new Date(), 'EEEE') // e.g. "Monday"
  const todayClasses = schedule?.filter(s => s.day === todayName) || []
  
  const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(todayName)
  const quoteIndex = dayIndex >= 0 ? dayIndex % quotes.length : 0
  const randomQuote = quotes[quoteIndex]

  const todayExpensesSum = (todayExpensesData || []).reduce((sum, tx) => sum + Number(tx.amount), 0)

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <header className="flex flex-col gap-2.5">
        <p className="text-xs text-neutral-500 font-medium tracking-wide uppercase">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
        <h1 className="text-2xl font-medium tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
          Welcome back
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-450 italic font-light max-w-md">
          &ldquo;{randomQuote}&rdquo;
        </p>
      </header>

      {/* Daily Briefing Widget */}
      <DailyBriefing
        tasksCompleted={tasksCompletedToday || 0}
        todayExpenses={todayExpensesSum}
        cigarettesSmoked={cigarettesToday || 0}
      />

      {/* Subscription Due Alerts */}
      <SubscriptionAlerts initialSubscriptions={subscriptions || []} />

      {/* Top Interactive Trackers */}
      <div className="grid grid-cols-1 gap-6">
        <FinanceOverview balances={walletBalances} />
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/tasks" className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-900 bg-neutral-55/50 dark:bg-neutral-900/10 hover:bg-neutral-100/50 dark:hover:bg-neutral-900/25 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <CheckSquare className="w-4 h-4 text-neutral-400 dark:text-neutral-500 stroke-[1.5px]" />
            <ArrowUpRight className="w-3.5 h-3.5 text-neutral-405 group-hover:text-neutral-900 dark:group-hover:text-neutral-300 transition-colors" />
          </div>
          <p className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">{pendingTasks || 0}</p>
          <p className="text-xs text-neutral-500 mt-1">Pending tasks</p>
        </Link>

        <Link href="/schedule" className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-900 bg-neutral-55/50 dark:bg-neutral-900/10 hover:bg-neutral-100/50 dark:hover:bg-neutral-900/25 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <Calendar className="w-4 h-4 text-neutral-400 dark:text-neutral-500 stroke-[1.5px]" />
            <ArrowUpRight className="w-3.5 h-3.5 text-neutral-405 group-hover:text-neutral-900 dark:group-hover:text-neutral-300 transition-colors" />
          </div>
          <p className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">{todayClasses.length}</p>
          <p className="text-xs text-neutral-500 mt-1">Classes today</p>
        </Link>

        <Link href="/notes" className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-900 bg-neutral-55/50 dark:bg-neutral-900/10 hover:bg-neutral-100/50 dark:hover:bg-neutral-900/25 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <StickyNote className="w-4 h-4 text-neutral-400 dark:text-neutral-500 stroke-[1.5px]" />
            <ArrowUpRight className="w-3.5 h-3.5 text-neutral-405 group-hover:text-neutral-900 dark:group-hover:text-neutral-300 transition-colors" />
          </div>
          <p className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">{notes?.length || 0}</p>
          <p className="text-xs text-neutral-500 mt-1">Recent notes</p>
        </Link>
      </div>

      {/* Rabbit Hole Curiosity widget */}
      <RabbitHoleWidget />

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Today's Schedule */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">Today&apos;s Schedule</h2>
          <div className="flex flex-col gap-3">
            {todayClasses.length > 0 ? (
              todayClasses.map((cls) => (
                <div key={cls.id} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/5 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-neutral-900 dark:text-white">{cls.subject}</h4>
                    <p className="text-xs text-neutral-500 mt-1">Room {cls.room}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                      {cls.start_time.slice(0, 5)} - {cls.end_time.slice(0, 5)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-5 text-center rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
                <p className="text-xs text-neutral-500">No classes scheduled for today.</p>
              </div>
            )}
          </div>
        </section>

        {/* Quick Notes */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">Recent Notes</h2>
          <div className="flex flex-col gap-3">
            {notes && notes.length > 0 ? (
              notes.map((note) => (
                <div key={note.id} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/5">
                  <h4 className="text-sm font-medium text-neutral-900 dark:text-white truncate">{note.title}</h4>
                  <p className="text-xs text-neutral-550 dark:text-neutral-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {note.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-5 text-center rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
                <p className="text-xs text-neutral-550 dark:text-neutral-500">No notes created yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
