'use client'

import { Wallet, Smartphone, CreditCard, PiggyBank } from 'lucide-react'

interface WalletBalance {
  name: string
  balance: number
}

interface FinanceOverviewProps {
  balances: WalletBalance[]
}

export function FinanceOverview({ balances }: FinanceOverviewProps) {
  // Select icon based on wallet name
  const getWalletIcon = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('cash')) {
      return <Wallet className="w-4 h-4 text-emerald-400 stroke-[1.5px]" />
    }
    if (lowerName.includes('gopay') || lowerName.includes('dana') || lowerName.includes('ovo') || lowerName.includes('e-wallet') || lowerName.includes('shopeepay')) {
      return <Smartphone className="w-4 h-4 text-blue-400 stroke-[1.5px]" />
    }
    if (lowerName.includes('livin') || lowerName.includes('bca') || lowerName.includes('bank') || lowerName.includes('credit') || lowerName.includes('card')) {
      return <CreditCard className="w-4 h-4 text-purple-400 stroke-[1.5px]" />
    }
    return <PiggyBank className="w-4 h-4 text-neutral-400 stroke-[1.5px]" />
  }

  // Format IDR currency
  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(Math.abs(amount))
    return `${amount < 0 ? '-' : ''}${formatted}`
  }

  return (
    <div className="flex flex-col gap-2.5 w-full">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-semibold font-mono">
          My Wallets
        </span>
      </div>

      {balances.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-1.5 scrollbar-none snap-x snap-mandatory">
          {balances.map((wallet) => (
            <div
              key={wallet.name}
              className="flex-shrink-0 w-[160px] sm:w-[180px] snap-start p-4 rounded-xl border border-neutral-200 dark:border-neutral-850 bg-neutral-50/50 dark:bg-neutral-900/30 hover:bg-neutral-100 dark:hover:bg-neutral-900/50 transition-colors flex flex-col gap-3 relative overflow-hidden group"
            >
              <div className="flex justify-between items-center z-10">
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-200 truncate pr-2">
                  {wallet.name}
                </span>
                {getWalletIcon(wallet.name)}
              </div>
              <div className="z-10 flex flex-col">
                <span
                  className={`text-sm sm:text-base font-semibold font-mono tracking-tight ${
                    wallet.balance >= 0
                      ? 'text-neutral-900 dark:text-white'
                      : 'text-red-500 dark:text-red-400'
                  }`}
                >
                  {formatCurrency(wallet.balance)}
                </span>
                <span className="text-[9px] text-neutral-400 dark:text-neutral-500 font-medium">
                  Current Balance
                </span>
              </div>
              {/* Subtle hover background highlight */}
              <div className="absolute inset-0 bg-gradient-to-tr from-neutral-500/5 to-transparent dark:from-neutral-500/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-850 text-center">
          <p className="text-xs text-neutral-500">No active wallets. Add transactions to see wallet list.</p>
        </div>
      )}
    </div>
  )
}
