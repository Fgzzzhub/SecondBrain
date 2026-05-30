import { createClient } from '@/lib/supabase/server'
import { TaskCard } from './TaskCard'
import { AddTaskForm } from './AddTaskForm'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })

  const columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'done', title: 'Done' }
  ] as const

  return (
    <div className="flex flex-col h-full gap-8">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-white mb-1.5">Tasks</h1>
          <p className="text-neutral-500 text-xs sm:text-sm">Manage your academic workload.</p>
        </div>
      </header>

      {/* Task Creation Form */}
      <div className="max-w-md">
        <AddTaskForm />
      </div>

      {/* Horizontal Snap Scroll for Mobile */}
      <div className="flex-1 flex gap-5 overflow-x-auto snap-x snap-mandatory pb-6 -mx-6 px-6 md:mx-0 md:px-0 scrollbar-none">
        {columns.map(col => {
          const colTasks = tasks?.filter(t => t.status === col.id) || []
          return (
            <div
              key={col.id}
              className="min-w-[85vw] md:min-w-0 md:flex-1 flex-shrink-0 snap-center flex flex-col gap-3"
            >
              <div className="flex items-center justify-between border-b border-neutral-900 pb-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    col.id === 'todo' ? 'bg-neutral-500' :
                    col.id === 'in_progress' ? 'bg-orange-500' : 'bg-green-500'
                  }`} />
                  <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">{col.title}</h3>
                </div>
                <span className="text-xs text-neutral-600 font-medium font-mono">
                  {colTasks.length}
                </span>
              </div>
              
              <div className="flex flex-col gap-3">
                {colTasks.length > 0 ? (
                  colTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))
                ) : (
                  <div className="p-8 text-center rounded-xl border border-dashed border-neutral-900 bg-neutral-950">
                    <p className="text-[11px] text-neutral-600">No tasks in this stage</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
