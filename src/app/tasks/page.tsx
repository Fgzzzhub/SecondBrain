import { createClient } from '@/lib/supabase/server'
import { AddTaskForm } from './AddTaskForm'
import { TaskList } from './TaskList'
import { TasksPomodoro } from './TasksPomodoro'

export const revalidate = 0

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="flex flex-col h-full gap-8 max-w-2xl mx-auto">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white mb-1">
            Life Backlog
          </h1>
          <p className="text-neutral-500 dark:text-neutral-450 text-xs sm:text-sm leading-relaxed">
            Capture, clarify, and execute your actions items.
          </p>
        </div>
        <TasksPomodoro />
      </header>

      {/* Task Creation Form */}
      <div>
        <AddTaskForm />
      </div>

      {/* Task Tabs & List */}
      <div className="flex-1">
        <TaskList tasks={tasks || []} />
      </div>
    </div>
  )
}
