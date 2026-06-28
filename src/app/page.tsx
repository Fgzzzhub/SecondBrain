import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { Cigarette, DollarSign, StickyNote, ArrowUpRight, Sparkles } from 'lucide-react'
import { RabbitHoleWidget } from './components/RabbitHoleWidget'
import { FinanceOverview } from './components/FinanceOverview'
import { getWalletBalances } from '@/app/actions'
import { DailyBriefing } from './components/DailyBriefing'
import { SubscriptionAlerts } from './components/SubscriptionAlerts'
import { GlassCard } from './components/ui/GlassCard'
import { StatCard } from './components/ui/StatCard'
import { getLocalDayBounds } from '@/lib/dateUtils'
import { MagicInput } from './components/MagicInput'


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

  const cookieStore = await cookies()
  const rawTimezone = cookieStore.get('user-timezone')?.value || 'UTC'
  const userTimezone = decodeURIComponent(rawTimezone)
  const { startOfTodayStr, endOfTodayStr } = getLocalDayBounds(userTimezone)

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

  const todayName = format(new Date(), 'EEEE')
  const todayClasses = schedule?.filter(s => s.day === todayName) || []

  const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(todayName)
  const quoteIndex = dayIndex >= 0 ? dayIndex % quotes.length : 0
  const randomQuote = quotes[quoteIndex]

  const todayExpensesSum = (todayExpensesData || []).reduce((sum, tx) => sum + Number(tx.amount), 0)

  return (
    <div className="stagger flex flex-col gap-8 md:gap-10">
      {/* Header */}
      <header className="flex flex-col gap-2.5">
        <p className="text-[11px] text-[var(--text-muted)] font-semibold tracking-widest uppercase">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--text-primary)]">
          Welcome <span className="text-gradient-accent">back</span>
        </h1>
        <p className="text-sm text-[var(--text-secondary)] italic font-light max-w-md flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 mt-1 text-[rgb(var(--color-primary))] flex-shrink-0" />
          <span>&ldquo;{randomQuote}&rdquo;</span>
        </p>
      </header>

      {/* Magic Input (Natural Language Logging) */}
      <MagicInput />

      {/* Daily Briefing Widget */}

      <DailyBriefing
        tasksCompleted={tasksCompletedToday || 0}
        todayExpenses={todayExpensesSum}
        cigarettesSmoked={cigarettesToday || 0}
      />

      {/* Subscription Due Alerts */}
      <SubscriptionAlerts initialSubscriptions={subscriptions || []} />

      {/* Wallet Overview */}
      <div className="grid grid-cols-1 gap-6">
        <FinanceOverview balances={walletBalances} />
      </div>

      {/* Stat grid */}
      <div className="stagger grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Cigarettes Today"
          value={cigarettesToday || 0}
          icon={<Cigarette className="w-4 h-4 stroke-[1.5px]" />}
          href="/cigarettes"
          numberColor="warning"
        />
        <StatCard
          label="Expenses Today"
          value={`Rp ${todayExpensesSum.toLocaleString('id-ID')}`}
          icon={<DollarSign className="w-4 h-4 stroke-[1.5px]" />}
          href="/finance"
          numberColor="danger"
        />
        <StatCard
          label="Recent Notes"
          value={notes?.length || 0}
          icon={<StickyNote className="w-4 h-4 stroke-[1.5px]" />}
          href="/notes"
        />
      </div>

      {/* Rabbit Hole Curiosity widget */}
      <RabbitHoleWidget />

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">Today&apos;s Schedule</h2>
          <div className="flex flex-col gap-3">
            {todayClasses.length > 0 ? (
              todayClasses.map((cls) => (
                <GlassCard key={cls.id} padding="md" className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">{cls.subject}</h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Room {cls.room}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-[rgb(var(--color-primary))] tabular-nums">
                      {cls.start_time.slice(0, 5)} – {cls.end_time.slice(0, 5)}
                    </p>
                  </div>
                </GlassCard>
              ))
            ) : (
              <GlassCard variant="subtle" padding="md" className="text-center border-dashed">
                <p className="text-xs text-[var(--text-secondary)]">No classes scheduled for today.</p>
              </GlassCard>
            )}
          </div>
        </section>

        {/* Quick Notes */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">Recent Notes</h2>
          <div className="flex flex-col gap-3">
            {notes && notes.length > 0 ? (
              notes.map((note) => (
                <Link key={note.id} href="/notes" className="block group">
                  <GlassCard padding="md" className="group-hover:border-[rgba(var(--color-primary),0.4)]">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate">{note.title}</h4>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[rgb(var(--color-primary))] flex-shrink-0 transition-colors" />
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1.5 line-clamp-2 leading-relaxed">
                      {note.content}
                    </p>
                  </GlassCard>
                </Link>
              ))
            ) : (
              <GlassCard variant="subtle" padding="md" className="text-center border-dashed">
                <p className="text-xs text-[var(--text-secondary)]">No notes created yet.</p>
              </GlassCard>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
