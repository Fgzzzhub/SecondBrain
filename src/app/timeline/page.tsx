import { createClient } from '@/lib/supabase/server'
import { TimelineForm } from './TimelineForm'
import { TimelineCard } from './TimelineCard'
import { Sparkles } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'

export const revalidate = 0

interface LearningLog {
  id: string
  title: string
  content: string
  tags: string[]
  created_at: string
}

export default async function TimelinePage() {
  const supabase = await createClient()
  const { data: logs, error } = await supabase
    .from('learning_logs')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-8 h-full pb-12">
      <header>
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-5 h-5 text-neutral-900 dark:text-white stroke-[1.5px]" />
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900 dark:text-white">The Current</h1>
        </div>
        <p className="text-neutral-500 text-xs sm:text-sm">A zero-pressure chronological archive of things you discover every day.</p>
      </header>

      {/* Input Form at the Top */}
      <div className="max-w-lg">
        <TimelineForm />
      </div>

      {/* Timeline Section */}
      <div className="flex flex-col gap-6 max-w-lg mt-4">
        <h2 className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Timeline Feed</h2>

        {error ? (
          <div className="p-4 text-xs text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl">
            Error loading timeline. Please ensure the database table is configured.
          </div>
        ) : !logs || logs.length === 0 ? (
          <EmptyState
            message="Linimasa kamu kosong. Catat pembelajaran pertamamu di atas!"
            icon={Sparkles}
          />
        ) : (
          <div className="relative border-l border-neutral-200 dark:border-neutral-800 ml-3 pl-6 flex flex-col gap-6">
            {logs.map((log: LearningLog) => (
              <TimelineCard key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
