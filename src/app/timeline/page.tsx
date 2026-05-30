import { createClient } from '@/lib/supabase/server'
import { TimelineForm } from './TimelineForm'
import { DeleteLogButton } from './DeleteLogButton'
import { Sparkles, Calendar } from 'lucide-react'

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
          <div className="p-8 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-900/10">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Your timeline is empty. Record your first learning log above!</p>
          </div>
        ) : (
          <div className="relative border-l border-neutral-200 dark:border-neutral-800 ml-3 pl-6 flex flex-col gap-6">
            {logs.map((log: LearningLog) => {
              const formattedDate = new Date(log.created_at).toLocaleDateString('en-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })

              return (
                <div key={log.id} className="relative group">
                  {/* Connected Node */}
                  <span className="absolute -left-[29.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-neutral-900 dark:bg-neutral-100 ring-4 ring-white dark:ring-neutral-950 transition-all group-hover:scale-110" />

                  {/* Card Content */}
                  <div className="flex flex-col gap-2 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none hover:border-neutral-350 dark:hover:border-neutral-700 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 stroke-[1.5px]" />
                          {formattedDate}
                        </span>
                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-1">
                          {log.title}
                        </h4>
                      </div>
                      <DeleteLogButton id={log.id} />
                    </div>

                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                      {log.content}
                    </p>

                    {log.tags && log.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {log.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-neutral-100 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 text-[9px] px-2 py-0.5 rounded-md font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
