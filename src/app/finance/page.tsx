import { createClient } from '@/lib/supabase/server'
import { AddTransactionForm } from './AddTransactionForm'
import { TransactionList } from './TransactionList'
import { Wallet, Banknote, CreditCard } from 'lucide-react'
import { MonthSelector } from '../components/MonthSelector'
import { format, parse } from 'date-fns'

export default async function FinancePage({
  searchParams
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const params = await searchParams
  const currentMonthStr = params.month || format(new Date(), 'yyyy-MM')

  const supabase = await createClient()
  
  // Fetch all transactions to compute correct net worth and balances
  const { data: allTransactions } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })

  const typedAllTransactions = (allTransactions || []) as any[]

  // Compute all-time balance metrics
  // Cash balances
  const cashTransactions = typedAllTransactions.filter(tx => tx.wallet_type === 'Cash')
  const cashIncome = cashTransactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + Number(tx.amount), 0)
  const cashExpense = cashTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + Number(tx.amount), 0)
  const cashBalance = cashIncome - cashExpense

  // Cashless balances
  const cashlessTransactions = typedAllTransactions.filter(tx => tx.wallet_type !== 'Cash')
  const cashlessIncome = cashlessTransactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + Number(tx.amount), 0)
  const cashlessExpense = cashlessTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + Number(tx.amount), 0)
  const cashlessBalance = cashlessIncome - cashlessExpense

  // Total net worth
  const netBalance = cashBalance + cashlessBalance

  // Filter transactions for the selected month
  const monthlyTransactions = typedAllTransactions.filter(tx => {
    try {
      const txMonth = format(new Date(tx.created_at), 'yyyy-MM')
      return txMonth === currentMonthStr
    } catch (e) {
      return false
    }
  })

  return (
    <div className="flex flex-col gap-8 h-full">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-white mb-1.5">Finance Tracker</h1>
          <p className="text-neutral-550 text-xs sm:text-sm">Manage your expenses, allowance, and study gear budget.</p>
        </div>
        <MonthSelector currentMonth={currentMonthStr} />
      </header>

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
      <div className="max-w-md">
        <AddTransactionForm />
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Transaction History</h3>
        <TransactionList transactions={monthlyTransactions} />
      </div>
    </div>
  )
}
