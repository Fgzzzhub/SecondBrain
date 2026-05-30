'use client'

import { deleteTransaction } from '@/app/actions'
import { Trash2, ArrowDownLeft, ArrowUpRight } from 'lucide-react'

interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense'
  description: string
  created_at: string
}

interface TransactionListProps {
  transactions: Transaction[]
}

export function TransactionList({ transactions }: TransactionListProps) {
  const handleDelete = async (id: string, desc: string) => {
    if (confirm(`Delete transaction: "${desc}"?`)) {
      await deleteTransaction(id)
    }
  }

  return (
    <div className="border border-neutral-900 rounded-xl overflow-hidden bg-neutral-900/10">
      {transactions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-900 text-[10px] text-neutral-500 uppercase font-semibold font-mono tracking-wider bg-neutral-950/40">
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Date</th>
                <th className="py-3 px-4 text-center w-12">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-neutral-900/40 hover:bg-neutral-900/20 transition-colors text-xs">
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1.5 font-medium px-2 py-0.5 rounded-full ${
                      tx.type === 'income' 
                        ? 'text-green-400 bg-green-950/20' 
                        : 'text-red-400 bg-red-950/20'
                    }`}>
                      {tx.type === 'income' ? (
                        <>
                          <ArrowDownLeft className="w-3 h-3 stroke-[2px]" />
                          Income
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-3 h-3 stroke-[2px]" />
                          Expense
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-neutral-200 font-medium">
                    {tx.description}
                  </td>
                  <td className={`py-3.5 px-4 text-right font-mono font-semibold ${
                    tx.type === 'income' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(tx.amount))}
                  </td>
                  <td className="py-3.5 px-4 text-right text-neutral-500 font-mono">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleDelete(tx.id, tx.description)}
                      className="text-neutral-600 hover:text-red-400 p-1 rounded transition-colors"
                      title="Delete log"
                    >
                      <Trash2 className="w-3.5 h-3.5 stroke-[1.5px]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center">
          <p className="text-xs text-neutral-500">No transactions recorded yet.</p>
        </div>
      )}
    </div>
  )
}
