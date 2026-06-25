import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TripManager } from './TripManager'

export const metadata = {
  title: 'Packing List & Trip Templates',
  description: 'Manage and reuse checklists for camping, hiking, business trips, and holidays.',
}

export default async function TripsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch templates and their linked template_items
  const { data: templates } = await supabase
    .from('trip_templates')
    .select('*, template_items(*)')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-8 h-full">
      <header>
        <h1 className="text-2xl font-medium tracking-tight text-neutral-900 dark:text-white mb-1.5">
          Packing List & Trip Templates
        </h1>
        <p className="text-neutral-500 text-xs sm:text-sm">
          Create reusable checklists for your trips, check off items as you pack, and reset them when you are done.
        </p>
      </header>

      <TripManager initialTemplates={templates || []} />
    </div>
  )
}
