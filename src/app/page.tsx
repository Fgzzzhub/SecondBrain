import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { Cigarette, DollarSign, StickyNote, ArrowUpRight, Sparkles, Banknote, Building2, CreditCard } from 'lucide-react'
import { RabbitHoleWidget } from './components/RabbitHoleWidget'
import { getWalletBalances } from '@/app/actions'
import { DailyBriefing } from './components/DailyBriefing'
import { SubscriptionAlerts } from './components/SubscriptionAlerts'
import { GlassCard } from './components/ui/GlassCard'
import { StatCard } from './components/ui/StatCard'
import { getLocalDayBounds } from '@/lib/dateUtils'
import { MagicInput } from './components/MagicInput'

interface WalletType {
  name: string
  balance: number
  type?: string
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 11) return 'Good morning.'
  if (hour < 15) return 'Good afternoon.'
  if (hour < 19) return 'Good evening.'
  return 'Good night.'
}

function WalletIconComponent({ type, color, size }: { type: string, color: string, size: number }) {
  if (type === 'cash') return <Banknote size={size} color={color} strokeWidth={1.8} />
  if (type === 'bank') return <Building2 size={size} color={color} strokeWidth={1.8} />
  return <CreditCard size={size} color={color} strokeWidth={1.8} />
}

function formatRupiah(amount: number) {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function WalletCard({ wallet }: { wallet: WalletType }) {
  const getAccent = (name: string, type: string) => {
    const cardBg = '#131722' // Unified premium dark background
    if (type === 'cash' || name.toLowerCase().includes('cash'))
      return { primary: '#10B981', bg: cardBg } // Green accent
    if (name.toLowerCase().includes('livin') || name.toLowerCase().includes('mandiri'))
      return { primary: '#F59E0B', bg: cardBg } // Gold/Amber accent
    if (name.toLowerCase().includes('bca'))
      return { primary: '#3B82F6', bg: cardBg } // Blue accent
    return { primary: '#818CF8', bg: cardBg } // Indigo/Violet accent
  }

  const walletType = wallet.type || (
    wallet.name.toLowerCase().includes('cash') ? 'cash' :
    (wallet.name.toLowerCase().includes('livin') || wallet.name.toLowerCase().includes('mandiri') || wallet.name.toLowerCase().includes('bca')) ? 'bank' : 'cashless'
  )
  const accent = getAccent(wallet.name, walletType)

  return (
    <div
      className="wallet-card-hover"
      style={{
        position: 'relative',
        width: '200px',
        minWidth: '200px',
        height: '120px',
        borderRadius: '20px',
        background: accent.bg,
        overflow: 'hidden',
        flexShrink: 0,
        cursor: 'pointer',
        border: `1px solid rgba(255, 255, 255, 0.08)`,
        boxShadow: `
          0 4px 14px rgba(0, 0, 0, 0.25),
          inset 0 1px 0 rgba(255, 255, 255, 0.04)
        `,
        transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {/* Noise texture overlay — very subtle matte texture */}
      <div style={{
        position: 'absolute',
        inset: 0,

        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.02'/%3E%3C/svg%3E")`,
        opacity: 0.3,
        pointerEvents: 'none',
        mixBlendMode: 'overlay',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '16px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
        {/* Top row: nama + ikon */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: '0.01em',
          }}>
            {wallet.name}
          </span>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: `${accent.primary}15`,
            border: `1px solid ${accent.primary}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <WalletIconComponent type={walletType} color={accent.primary} size={14} />
          </div>
        </div>

        {/* Bottom: nominal + label */}
        <div>
          <p style={{
            fontSize: '22px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.9)',
            letterSpacing: '-0.02em',
            margin: '0 0 2px',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {formatRupiah(wallet.balance)}
          </p>
          <p style={{
            fontSize: '11px',
            color: `${accent.primary}`,
            opacity: 0.8,
            margin: 0,
            fontWeight: 500,
          }}>
            Current Balance
          </p>
        </div>
      </div>
    </div>
  )
}

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
    { data: subscriptions },
    { data: settings }
  ] = await Promise.all([
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('is_completed', false).eq('user_id', user.id),
    supabase.from('schedule').select('*').eq('user_id', user.id),
    supabase.from('notes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
    getWalletBalances(),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('is_completed', true).eq('user_id', user.id).gte('completed_at', startOfTodayStr).lte('completed_at', endOfTodayStr),
    supabase.from('transactions').select('amount').eq('user_id', user.id).eq('type', 'expense').neq('description', 'SYSTEM_CALIBRATION').gte('created_at', startOfTodayStr).lte('created_at', endOfTodayStr),
    supabase.from('cigarette_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('smoked_at', startOfTodayStr).lte('smoked_at', endOfTodayStr),
    supabase.from('subscriptions').select('*'),
    supabase.from('user_preferences').select('*').eq('id', user.id).maybeSingle()
  ])

  const todayName = format(new Date(), 'EEEE')
  const todayClasses = schedule?.filter(s => s.day === todayName) || []

  const todayExpensesSum = (todayExpensesData || []).reduce((sum, tx) => sum + Number(tx.amount), 0)

  // Map variables for context-visual stat cards
  const dailyTarget = (settings as any)?.cigarette_daily_target ?? null
  const monthlyBudget = (settings as any)?.monthly_budget ?? null
  const latestNoteTitle = notes?.[0]?.title ?? null
  const expensesToday = todayExpensesSum
  const notesCount = notes?.length || 0
  const cigarettesTodayVal = cigarettesToday || 0

  return (
    <div className="stagger flex flex-col gap-5 md:gap-6">
      {/* Greeting + Magic Input Wrapper (tight gap) */}
      <div className="flex flex-col gap-3">
        {/* Greeting — clean, minimal */}
        <div style={{ padding: '4px 0 0' }}>
          <p style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: '4px',
          }}>
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long', day: 'numeric', month: 'long'
            })}
          </p>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.92)',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            margin: 0,
          }}>
            {getGreeting()}
          </h1>
        </div>

        {/* Magic Input (Natural Language Logging) */}
        <MagicInput />
      </div>

      {/* Daily Briefing Widget */}
      <DailyBriefing
        tasksCompleted={tasksCompletedToday || 0}
        todayExpenses={todayExpensesSum}
        cigarettesSmoked={cigarettesTodayVal}
      />

      {/* MY WALLETS */}
      <section style={{ marginBottom: '0px' }}>
        <p style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '12px',
          paddingLeft: '2px',
        }}>
          My Wallets
        </p>
        <div 
          style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          className="hide-scrollbar"
        >
          {walletBalances.map(w => <WalletCard key={w.name} wallet={w} />)}
        </div>
      </section>

      {/* Subscription Due Alerts */}
      <SubscriptionAlerts initialSubscriptions={subscriptions || []} />

      {/* Stat Cards — 3 col */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
      }}>

        {/* CIGARETTES TODAY */}
        <Link href="/cigarettes" style={{
          padding: '14px',
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.04)',
          border: '0.5px solid rgba(255,255,255,0.07)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          textDecoration: 'none',
        }}>
          <p style={{
            fontSize: '10px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            margin: 0,
          }}>
            Rokok
          </p>

          <p style={{
            fontSize: '28px',
            fontWeight: 700,
            color: cigarettesTodayVal > (dailyTarget ?? 10)
              ? '#EF4444'
              : cigarettesTodayVal > (dailyTarget ?? 10) * 0.7
              ? '#F59E0B'
              : '#F1F5F9',
            margin: 0,
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}>
            {cigarettesTodayVal}
          </p>

          {/* Progress bar vs daily target */}
          {dailyTarget && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{
                height: '3px',
                borderRadius: '2px',
                background: 'rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min((cigarettesTodayVal / dailyTarget) * 100, 100)}%`,
                  borderRadius: '2px',
                  background: cigarettesTodayVal > dailyTarget
                    ? '#EF4444'
                    : cigarettesTodayVal > dailyTarget * 0.7
                    ? '#F59E0B'
                    : '#10B981',
                  transition: 'width 0.6s cubic-bezier(0.25,0.46,0.45,0.94)',
                }} />
              </div>
              <p style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.28)',
                margin: 0,
              }}>
                target {dailyTarget}
              </p>
            </div>
          )}
        </Link>

        {/* EXPENSES TODAY */}
        <Link href="/finance" style={{
          padding: '14px',
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.04)',
          border: '0.5px solid rgba(255,255,255,0.07)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          textDecoration: 'none',
        }}>
          <p style={{
            fontSize: '10px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            margin: 0,
          }}>
            Pengeluaran
          </p>

          <p style={{
            fontSize: expensesToday >= 100000 ? '18px' : '24px',
            fontWeight: 700,
            color: '#F1F5F9',
            margin: 0,
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}>
            {/* Format singkat: Rp 36k bukan Rp 36.000 agar muat di card kecil */}
            {expensesToday >= 1000000
              ? `${(expensesToday / 1000000).toFixed(1)}jt`
              : expensesToday >= 1000
              ? `${Math.round(expensesToday / 1000)}k`
              : `${expensesToday}`}
          </p>

          {/* Budget usage bar */}
          {monthlyBudget && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{
                height: '3px',
                borderRadius: '2px',
                background: 'rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  // Persentase dari budget harian (budget bulanan / 30)
                  width: `${Math.min((expensesToday / (monthlyBudget / 30)) * 100, 100)}%`,
                  borderRadius: '2px',
                  background: expensesToday > monthlyBudget / 30 ? '#EF4444' : '#6366F1',
                  transition: 'width 0.6s cubic-bezier(0.25,0.46,0.45,0.94)',
                }} />
              </div>
              <p style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.28)',
                margin: 0,
              }}>
                {Math.round((expensesToday / (monthlyBudget / 30)) * 100)}% daily
              </p>
            </div>
          )}
        </Link>

        {/* RECENT NOTES */}
        <Link href="/notes" style={{
          padding: '14px',
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.04)',
          border: '0.5px solid rgba(255,255,255,0.07)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          textDecoration: 'none',
        }}>
          <p style={{
            fontSize: '10px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            margin: 0,
          }}>
            Notes
          </p>

          <p style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#F1F5F9',
            margin: 0,
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}>
            {notesCount}
          </p>

          {/* Judul note terbaru */}
          {latestNoteTitle && (
            <p style={{
              fontSize: '10px',
              color: 'rgba(255,255,255,0.28)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.3,
            }}>
              {latestNoteTitle}
            </p>
          )}
        </Link>
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
