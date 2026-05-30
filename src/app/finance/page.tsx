import { createClient } from '@/lib/supabase/server'
import { AddTransactionForm } from './AddTransactionForm'
import { TransactionList } from './TransactionList'
import { Wallet, ArrowDownLeft, ArrowUpRight } from 'lucide-react'

export default async function FinancePage() {
  const supabase = await createClient()
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })

  const typedTransactions = (transactions || []) as any[]

  // Compute balance metrics
  const totalIncome = typedTransactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + Number(tx.amount), 0)

  const totalExpense = typedTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + Number(tx.amount), 0)

  const netBalance = totalIncome - totalExpense

  return (
    <div className="flex flex-col gap-8 h-full">
      <header>
        <h1 className="text-2xl font-medium tracking-tight text-white mb-1.5">Finance Tracker</h1>
        <p className="text-neutral-500 text-xs sm:text-sm">Manage your expenses, allowance, and study gear budget.</p>
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
          <p className="text-xs text-neutral-500 mt-1">Total Balance</p>
        </div>

        {/* Total Income */}
        <div className="p-5 rounded-2xl border border-neutral-900 bg-neutral-900/10">
          <div className="flex justify-between items-start mb-4">
            <ArrowDownLeft className="w-4 h-4 text-green-400 stroke-[1.5px]" />
          </div>
          <p className="text-2xl font-semibold tracking-tight font-mono text-green-400">
            +{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalIncome)}
          </p>
          <p className="text-xs text-neutral-500 mt-1">Total Income</p>
        </div>

        {/* Total Expenses */}
        <div className="p-5 rounded-2xl border border-neutral-900 bg-neutral-900/10">
          <div className="flex justify-between items-start mb-4">
            <ArrowUpRight className="w-4 h-4 text-red-400 stroke-[1.5px]" />
          </div>
          <p className="text-2xl font-semibold tracking-tight font-mono text-red-400">
            -{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalExpense)}
          </p>
          <p className="text-xs text-neutral-500 mt-1">Total Expenses</p>
        </div>
      </div>

      {/* Add form */}
      <div className="max-w-md">
        <AddTransactionForm />
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Transaction History</h3>
        <TransactionList transactions={typedTransactions} />
      </div>
    </div>
  )
}
