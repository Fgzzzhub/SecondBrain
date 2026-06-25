import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SubscriptionManager } from './SubscriptionManager'

export const metadata = {
  title: 'Subscription & Digital Guard',
  description: 'Manage your recurring digital bills and link them to your finance system.',
}

export default async function SubscriptionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch subscriptions ordered by billing day
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .order('billing_day', { ascending: true })

  return (
    <div className="flex flex-col gap-8 h-full">
      <header>
        <h1 className="text-2xl font-medium tracking-tight text-neutral-900 dark:text-white mb-1.5">
          Subscription & Digital Guard
        </h1>
        <p className="text-neutral-500 text-xs sm:text-sm">
          Keep track of recurring bills, forecast next due dates, and record payments directly into your finance tracker.
        </p>
      </header>

      <SubscriptionManager initialSubscriptions={subscriptions || []} />
    </div>
  )
}
