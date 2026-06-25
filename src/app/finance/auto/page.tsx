import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AutoFinanceManager } from './AutoFinanceManager'

export const metadata = {
  title: 'Auto-Pilot Finance Rules',
  description: 'Manage automated daily allowances and monthly income/expense rules.',
}

export default async function AutoFinancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all automated rules
  const { data: rules } = await supabase
    .from('auto_transactions')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-8 h-full">
      <header>
        <h1 className="text-2xl font-medium tracking-tight text-neutral-900 dark:text-white mb-1.5">
          Auto-Pilot Finance
        </h1>
        <p className="text-neutral-500 text-xs sm:text-sm">
          Set up automatic rules for recurring daily allowances (e.g., food money) or monthly income (e.g., salary).
        </p>
      </header>

      <AutoFinanceManager initialRules={rules || []} />
    </div>
  )
}
