'use client'

import { updateTaskStatus, deleteTask } from '@/app/actions'
import { Clock, Trash2 } from 'lucide-react'
import { startTransition, useOptimistic } from 'react'

interface Task {
  id: string
  title: string
  course_name: string | null
  status: 'todo' | 'in_progress' | 'done'
  due_date: string | null
}

export function TaskCard({ task }: { task: Task }) {
  const handleDelete = async () => {
    if (confirm('Delete this task?')) {
      await deleteTask(task.id)
    }
  }

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as 'todo' | 'in_progress' | 'done'
    await updateTaskStatus(task.id, newStatus)
  }

  return (
    <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-900/10 hover:bg-neutral-900/20 transition-all group flex flex-col justify-between min-h-[110px]">
      <div>
        <div className="flex justify-between items-start gap-2">
          {task.course_name && (
            <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">
              {task.course_name}
            </span>
          )}
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-neutral-600 hover:text-red-400 rounded transition-opacity"
            title="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5 stroke-[1.5px]" />
          </button>
        </div>
        <h4 className="text-sm font-medium text-neutral-200 mt-1 leading-snug">
          {task.title}
        </h4>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-900/40">
        <div className="flex items-center gap-1.5 text-neutral-500">
          <Clock className="w-3.5 h-3.5 stroke-[1.5px]" />
          <span className="text-[11px] font-mono">
            {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
          </span>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="inline-flex">
          <select
            value={task.status}
            onChange={handleStatusChange}
            className="bg-neutral-950 text-[11px] text-neutral-400 border border-neutral-800 hover:border-neutral-700 rounded-md px-2.5 py-1 outline-none transition-colors cursor-pointer"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </form>
      </div>
    </div>
  )
}
