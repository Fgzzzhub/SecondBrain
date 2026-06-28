import { createClient } from '@/lib/supabase/server'
import { AddTransactionForm } from './AddTransactionForm'
import { CalibrationForm } from './CalibrationForm'
import { TransactionList } from './TransactionList'
import { Wallet, Banknote, CreditCard } from 'lucide-react'
import { MonthSelector } from '../components/MonthSelector'
import { format } from 'date-fns'
import { getWalletBalances } from '@/app/actions'
import { PendingTransactions } from '../components/finance/PendingTransactions'
import dynamic from 'next/dynamic'

const ExpenseChart = dynamic(() => import('./ExpenseChart').then(mod => mod.ExpenseChart), {
  loading: () => <div className="h-40 w-full animate-pulse bg-neutral-900/10 rounded-2xl border border-neutral-900" />
})

interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense'
  description: string
  created_at: string
  wallet_type?: 'Cash' | 'Cashless'
  wallet_name?: string
  category?: string
  raw_subject?: string
  confidence?: number
  source?: string
}

export default async function FinancePage({
  searchParams
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const params = await searchParams
  const currentMonthStr = params.month || format(new Date(), 'yyyy-MM')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null
  
  // Parse year and month to query only current month's transactions
  const [year, month] = currentMonthStr.split('-').map(Number)
  const nextMonthStr = month === 12
    ? `${year + 1}-01`
    : `${year}-${String(month + 1).padStart(2, '0')}`

  // Fetch only selected month transactions, pending review ones, and all-time wallet balances in parallel
  const [walletBalances, { data: monthlyTransactions }, { data: pendingTransactions }] = await Promise.all([
    getWalletBalances(),
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'pending_review') // Exclude unconfirmed automatic transactions
      .gte('created_at', `${currentMonthStr}-01T00:00:00`)
      .lt('created_at', `${nextMonthStr}-01T00:00:00`)
      .order('created_at', { ascending: false }),
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false })
  ])

  const typedMonthlyTransactions = (monthlyTransactions || []) as Transaction[]
  const typedPendingTransactions = (pendingTransactions || []) as Transaction[]

  // Compute balance metrics from wallet balances (all-time)
  const cashBalance = walletBalances.find(w => w.name === 'Cash')?.balance || 0
  const cashlessBalance = walletBalances
    .filter(w => w.name !== 'Cash')
    .reduce((sum, w) => sum + w.balance, 0)

  // Total net worth
  const netBalance = cashBalance + cashlessBalance

  return (
    <div className="flex flex-col gap-6 md:gap-8 h-full">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-white mb-1.5">Finance Tracker</h1>
          <p className="text-neutral-550 text-xs sm:text-sm">Manage your expenses, allowance, and study gear budget.</p>
        </div>
        <MonthSelector currentMonth={currentMonthStr} />
      </header>

      {/* Expense Category Analytics */}
      <ExpenseChart transactions={typedMonthlyTransactions} selectedMonthStr={currentMonthStr} />

      {/* Grid Summaries — compact rows on mobile, stacked cards on larger screens */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
        {[
          { icon: Wallet, iconColor: 'text-neutral-400', label: 'Total Net Worth', value: netBalance, valueColor: netBalance >= 0 ? 'text-white' : 'text-red-400' },
          { icon: Banknote, iconColor: 'text-emerald-400', label: 'Physical Cash', value: cashBalance, valueColor: cashBalance >= 0 ? 'text-emerald-400' : 'text-red-400' },
          { icon: CreditCard, iconColor: 'text-blue-400', label: 'Cashless/Digital', value: cashlessBalance, valueColor: cashlessBalance >= 0 ? 'text-blue-400' : 'text-red-400' },
        ].map(({ icon: Icon, iconColor, label, value, valueColor }) => (
          <div
            key={label}
            className="px-4 py-3 sm:p-5 rounded-2xl border border-neutral-900 bg-neutral-900/10 flex items-center justify-between gap-3 sm:flex-col sm:items-start sm:justify-start"
          >
            <div className="flex items-center gap-2 sm:w-full sm:justify-between sm:mb-4">
              <Icon className={`w-4 h-4 ${iconColor} stroke-[1.5px] flex-shrink-0`} />
              <span className="text-xs text-neutral-500 sm:hidden">{label}</span>
            </div>
            <div className="flex flex-col items-end sm:items-start min-w-0">
              <p className={`text-base sm:text-2xl font-semibold tracking-tight font-mono truncate ${valueColor}`}>
                {value < 0 ? '-' : ''}{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Math.abs(value))}
              </p>
              <p className="hidden sm:block text-xs text-neutral-500 mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Transactions for Review */}
      {typedPendingTransactions.length > 0 && (
        <PendingTransactions transactions={typedPendingTransactions} />
      )}

      {/* Add form */}
      <div className="max-w-md flex flex-col gap-2">
        <AddTransactionForm />
        <CalibrationForm />
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Transaction History</h3>
        <TransactionList transactions={typedMonthlyTransactions} />
      </div>
    </div>
  )
}
