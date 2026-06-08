import { createClient } from '@/lib/supabase/server'
import { AddTransactionForm } from './AddTransactionForm'
import { CalibrationForm } from './CalibrationForm'
import { TransactionList } from './TransactionList'
import { Wallet, Banknote, CreditCard } from 'lucide-react'
import { MonthSelector } from '../components/MonthSelector'
import { format } from 'date-fns'
import { getWalletBalances } from '@/app/actions'
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

  // Fetch only selected month transactions & all-time wallet balances in parallel
  const [walletBalances, { data: monthlyTransactions }] = await Promise.all([
    getWalletBalances(),
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', `${currentMonthStr}-01T00:00:00`)
      .lt('created_at', `${nextMonthStr}-01T00:00:00`)
      .order('created_at', { ascending: false })
  ])

  const typedMonthlyTransactions = (monthlyTransactions || []) as Transaction[]

  // Compute balance metrics from wallet balances (all-time)
  const cashBalance = walletBalances.find(w => w.name === 'Cash')?.balance || 0
  const cashlessBalance = walletBalances
    .filter(w => w.name !== 'Cash')
    .reduce((sum, w) => sum + w.balance, 0)

  // Total net worth
  const netBalance = cashBalance + cashlessBalance

  return (
    <div className="flex flex-col gap-8 h-full">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-white mb-1.5">Finance Tracker</h1>
          <p className="text-neutral-550 text-xs sm:text-sm">Manage your expenses, allowance, and study gear budget.</p>
        </div>
        <MonthSelector currentMonth={currentMonthStr} />
      </header>

      {/* Expense Category Analytics */}
      <ExpenseChart transactions={typedMonthlyTransactions} selectedMonthStr={currentMonthStr} />

      {/* Grid Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Net Balance */}
        <div className="p-5 rounded-2xl border border-neutral-900 bg-neutral-900/10">
          <div className="flex justify-between items-start mb-4">
            <Wallet className="w-4 h-4 text-neutral-400 stroke-[1.5px]" />
          </div>
          <p className={`text-2xl font-semibold tracking-tight font-mono ${
            netBalance >= 0 ? 'text-white' : 'text-red-400'
          }`}>
            {netBalance >= 0 ? '' : '-'}{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Math.abs(netBalance))}
          </p>
          <p className="text-xs text-neutral-500 mt-1">Total Net Worth</p>
        </div>

        {/* Physical Cash */}
        <div className="p-5 rounded-2xl border border-neutral-900 bg-neutral-900/10">
          <div className="flex justify-between items-start mb-4">
            <Banknote className="w-4 h-4 text-emerald-400 stroke-[1.5px]" />
          </div>
          <p className={`text-2xl font-semibold tracking-tight font-mono ${
            cashBalance >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {cashBalance >= 0 ? '' : '-'}{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Math.abs(cashBalance))}
          </p>
          <p className="text-xs text-neutral-500 mt-1">Physical Cash</p>
        </div>

        {/* Cashless/Digital */}
        <div className="p-5 rounded-2xl border border-neutral-900 bg-neutral-900/10">
          <div className="flex justify-between items-start mb-4">
            <CreditCard className="w-4 h-4 text-blue-400 stroke-[1.5px]" />
          </div>
          <p className={`text-2xl font-semibold tracking-tight font-mono ${
            cashlessBalance >= 0 ? 'text-blue-400' : 'text-red-400'
          }`}>
            {cashlessBalance >= 0 ? '' : '-'}{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Math.abs(cashlessBalance))}
          </p>
          <p className="text-xs text-neutral-500 mt-1">Cashless/Digital</p>
        </div>
      </div>

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
