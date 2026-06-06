'use client'

import { useState } from 'react'
import { TaskCard } from './TaskCard'
import { CheckSquare, Archive } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { motion, AnimatePresence } from 'framer-motion'

interface Task {
  id: string
  title: string
  description: string | null
  due_date: string | null
  is_completed: boolean
  created_at: string
}

export function TaskList({ tasks = [] }: { tasks: Task[] }) {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')

  const activeTasks = tasks.filter(t => !t.is_completed)
  const completedTasks = tasks.filter(t => t.is_completed)

  const displayedTasks = activeTab === 'active' ? activeTasks : completedTasks

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Bar */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-900 pb-px">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-2 pb-3 px-1 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
            activeTab === 'active'
              ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
              : 'border-transparent text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300'
          }`}
        >
          <CheckSquare className="w-4 h-4 stroke-[1.5px]" />
          Backlog
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400">
            {activeTasks.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex items-center gap-2 pb-3 px-1 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all ml-6 cursor-pointer ${
            activeTab === 'completed'
              ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
              : 'border-transparent text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300'
          }`}
        >
          <Archive className="w-4 h-4 stroke-[1.5px]" />
          Completed
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400">
            {completedTasks.length}
          </span>
        </button>
      </div>

      {/* Task List Container with Staggered Entrance */}
      {displayedTasks.length > 0 ? (
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.04
              }
            }
          }}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-3 min-h-[200px]"
        >
          <AnimatePresence mode="popLayout">
            {displayedTasks.map(task => (
              <motion.div
                key={task.id}
                layout
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: { opacity: 1, y: 0 }
                }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              >
                <TaskCard task={task} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : activeTab === 'active' ? (
        <EmptyState
          message="Semua udah beres. Waktunya istirahat atau nongkrong dulu."
          icon={CheckSquare}
        />
      ) : (
        <EmptyState
          message="Belum ada yang selesai. Semangat, satu-satu diselesaikan!"
          icon={Archive}
        />
      )}
    </div>
  )
}
