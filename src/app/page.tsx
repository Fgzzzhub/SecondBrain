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
    if (type === 'cash' || name.toLowerCase().includes('cash'))
      return { primary: '#10B981', secondary: '#059669', bg: 'linear-gradient(135deg, #064E3B 0%, #065F46 50%, #047857 100%)' }
    if (name.toLowerCase().includes('livin') || name.toLowerCase().includes('mandiri'))
      return { primary: '#F59E0B', secondary: '#D97706', bg: 'linear-gradient(135deg, #1C1506 0%, #2D1F07 50%, #1A1204 100%)' }
    if (name.toLowerCase().includes('bca'))
      return { primary: '#3B82F6', secondary: '#2563EB', bg: 'linear-gradient(135deg, #0C1A3A 0%, #0F2350 50%, #0A1628 100%)' }
    return { primary: '#6366F1', secondary: '#4F46E5', bg: 'linear-gradient(135deg, #1E1B4B 0%, #2D2A6E 40%, #1A1740 100%)' }
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
        border: `1px solid ${accent.primary}25`,
        boxShadow: `
          0 4px 20px rgba(0,0,0,0.4),
          0 1px 0 rgba(255,255,255,0.08) inset,
          0 0 0 0.5px rgba(255,255,255,0.06)
        `,
        transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      {/* Noise texture overlay — subtle grain */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
        opacity: 0.4,
        pointerEvents: 'none',
        mixBlendMode: 'overlay',
      }} />

      {/* Specular highlight arc di kiri atas */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        left: '-40px',
        width: '140px',
        height: '140px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${accent.primary}20 0%, transparent 70%)`,
        pointerEvents: 'none',
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
            color: 'rgba(255,255,255,0.75)',
            letterSpacing: '0.01em',
          }}>
            {wallet.name}
          </span>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: `${accent.primary}20`,
            border: `1px solid ${accent.primary}30`,
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
            color: 'rgba(255,255,255,0.95)',
            letterSpacing: '-0.02em',
            margin: '0 0 2px',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {formatRupiah(wallet.balance)}
          </p>
          <p style={{
            fontSize: '11px',
            color: `${accent.primary}`,
            opacity: 0.7,
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

  const todayExpensesSum = (todayExpensesData || []).reduce((sum, tx) => sum + Number(tx.amount), 0)

  return (
    <div className="stagger flex flex-col gap-8 md:gap-10">
      {/* Greeting — clean, minimal */}
      <div style={{ padding: '4px 0 20px' }}>
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

      {/* Daily Briefing Widget */}
      <DailyBriefing
        tasksCompleted={tasksCompletedToday || 0}
        todayExpenses={todayExpensesSum}
        cigarettesSmoked={cigarettesToday || 0}
      />

      {/* MY WALLETS */}
      <section style={{ marginBottom: '24px' }}>
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
