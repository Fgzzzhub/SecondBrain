'use client'

import React, { useState, useTransition } from 'react'
import { toggleTaskCompletion, deleteTask, updateTask } from '@/app/actions'
import { Calendar, Trash2, CheckCircle2, Circle, Edit3, Check, X } from 'lucide-react'
import { triggerHaptic } from '@/lib/haptic'
import { motion } from 'framer-motion'

interface Task {
  id: string
  title: string
  description: string | null
  due_date: string | null
  is_completed: boolean
  created_at: string
}

export const TaskCard = React.memo(function TaskCard({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition()
  const [optimisticCompleted, setOptimisticCompleted] = useState(task.is_completed)
  const [isEditing, setIsEditing] = useState(false)
  const [draggedLeft, setDraggedLeft] = useState(false)
  const [dragDir, setDragDir] = useState<'none' | 'left' | 'right'>('none')

  // Edit fields state
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDescription, setEditDescription] = useState(task.description ?? '')
  const [editDueDate, setEditDueDate] = useState(task.due_date ? task.due_date.split('T')[0] : '')

  const handleToggle = () => {
    triggerHaptic(30)
    const nextVal = !optimisticCompleted
    setOptimisticCompleted(nextVal)
    startTransition(async () => {
      try {
        await toggleTaskCompletion(task.id, nextVal)
      } catch {
        setOptimisticCompleted(!nextVal)
        alert('Failed to update task')
      }
    })
  }

  const handleComplete = () => {
    if (optimisticCompleted) return
    triggerHaptic(30)
    setOptimisticCompleted(true)
    startTransition(async () => {
      try {
        await toggleTaskCompletion(task.id, true)
      } catch {
        setOptimisticCompleted(false)
        alert('Failed to complete task')
      }
    })
  }

  const handleDelete = async () => {
    triggerHaptic(80)
    startTransition(async () => {
      try {
        await deleteTask(task.id)
      } catch {
        alert('Failed to delete task')
      }
    })
  }

  const handleSave = () => {
    if (!editTitle.trim()) {
      alert('Task title is required')
      return
    }
    startTransition(async () => {
      try {
        await updateTask(task.id, editTitle, editDescription || null, editDueDate || null)
        setIsEditing(false)
      } catch {
        alert('Failed to update task')
      }
    })
  }

  const handleCancel = () => {
    setEditTitle(task.title)
    setEditDescription(task.description ?? '')
    setEditDueDate(task.due_date ? task.due_date.split('T')[0] : '')
    setIsEditing(false)
  }

  const getFriendlyDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(date)
    due.setHours(0, 0, 0, 0)

    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return { text: 'Today', type: 'today' }
    if (diffDays === 1) return { text: 'Tomorrow', type: 'tomorrow' }
    if (diffDays === -1) return { text: 'Yesterday', type: 'overdue' }
    if (diffDays < -1) return { text: `${Math.abs(diffDays)}d ago`, type: 'overdue' }
    if (diffDays > 1 && diffDays <= 7) return { text: due.toLocaleDateString(undefined, { weekday: 'short' }), type: 'upcoming' }

    return { text: due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), type: 'future' }
  }

  const dateInfo = task.due_date ? getFriendlyDate(task.due_date) : null

  if (isEditing) {
    return (
      <div className="p-4 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950/40 backdrop-blur-sm flex flex-col gap-3 shadow-md">
        <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Edit Action Item</h4>

        {/* Title Input */}
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Title"
          className="w-full bg-transparent text-sm font-medium text-neutral-900 dark:text-white outline-none border-b border-neutral-200 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 pb-1"
        />

        {/* Description textarea */}
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          placeholder="Notes / details..."
          rows={2}
          className="w-full bg-transparent text-xs text-neutral-700 dark:text-neutral-350 outline-none border-b border-neutral-200 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 pb-1 resize-none leading-relaxed"
        />

        {/* Due Date Input */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-neutral-400 uppercase">Due Date</label>
          <input
            type="date"
            value={editDueDate}
            onChange={(e) => setEditDueDate(e.target.value)}
            className="bg-transparent text-xs text-neutral-700 dark:text-neutral-300 outline-none border-b border-neutral-200 dark:border-neutral-800 focus:border-neutral-450 pb-1"
          />
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 mt-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleCancel}
            disabled={isPending}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-900/40 text-neutral-500 transition-colors cursor-pointer"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSave}
            disabled={isPending}
            className="p-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center"
            title="Save"
          >
            <Check className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden w-full rounded-2xl border border-neutral-250 dark:border-neutral-900 shadow-sm bg-neutral-100 dark:bg-neutral-950/40">
      {/* Bottom Layer: Dual-Sided Background Actions */}
      <div className="absolute inset-0 z-0">
        {/* Left Side: Emerald background (Complete) revealed when dragging Right */}
        <div
          className="absolute inset-0 bg-emerald-600 flex items-center justify-start pl-6 text-white transition-opacity duration-150"
          style={{ opacity: !draggedLeft && dragDir === 'right' ? 1 : 0 }}
        >
          <Check className="w-5 h-5 stroke-[2.5px]" />
        </div>

        {/* Right Side: Rose background (Delete) revealed when dragging Left */}
        <div
          className="absolute inset-0 bg-rose-600 flex items-center justify-end pr-6 text-white transition-opacity duration-150"
          style={{ opacity: draggedLeft || dragDir === 'left' ? 1 : 0 }}
        >
          <Trash2 className="w-5 h-5 stroke-[2.5px]" />
        </div>

        {/* Trash Clickable Action Button (revealed on Left swipe) */}
        {(draggedLeft || dragDir === 'left') && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              handleDelete()
            }}
            disabled={isPending}
            className="absolute right-0 top-0 bottom-0 w-20 z-20 flex items-center justify-center text-white cursor-pointer"
            title="Delete task"
          >
            {/* Click area overlays the Trash icon */}
          </motion.button>
        )}
      </div>

      {/* Top Layer: Draggable Task Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 80 }}
        dragElastic={0.1}
        dragMomentum={false}
        animate={{ x: draggedLeft ? -80 : 0 }}
        onDrag={(event, info) => {
          if (info.offset.x > 5) {
            setDragDir('right')
          } else if (info.offset.x < -5) {
            setDragDir('left')
          }
        }}
        onDragEnd={(event, info) => {
          if (info.offset.x > 60) {
            handleComplete()
            setDraggedLeft(false)
            setDragDir('none')
          } else if (info.offset.x < -60) {
            setDraggedLeft(true)
            setDragDir('left')
            triggerHaptic(20)
          } else {
            setDraggedLeft(false)
            setDragDir('none')
          }
        }}
        className={`p-4 bg-white dark:bg-neutral-900 flex items-start gap-3.5 relative z-10 w-full transition-shadow duration-300 ${
          optimisticCompleted
            ? 'opacity-45'
            : 'hover:shadow-sm'
        }`}
      >
        {/* Satisfying Checkbox */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={handleToggle}
          disabled={isPending}
          className={`mt-0.5 flex-shrink-0 transition-all rounded-full p-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer ${
            optimisticCompleted
              ? 'text-emerald-500 dark:text-emerald-400'
              : 'text-neutral-400 hover:text-neutral-600 dark:text-neutral-600 dark:hover:text-neutral-450'
          }`}
        >
          {optimisticCompleted ? (
            <CheckCircle2 className="w-5 h-5 fill-emerald-50 dark:fill-emerald-950/30 stroke-[2px]" />
          ) : (
            <Circle className="w-5 h-5 stroke-[1.5px]" />
          )}
        </motion.button>

        {/* Task Details */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <h4
            className={`text-sm font-medium leading-snug transition-all duration-300 ${
              optimisticCompleted
                ? 'line-through text-neutral-400 dark:text-neutral-550'
                : 'text-neutral-800 dark:text-neutral-200'
            }`}
          >
            {task.title}
          </h4>

          {task.description && (
            <p
              className={`text-xs leading-relaxed transition-all duration-300 line-clamp-2 ${
                optimisticCompleted
                  ? 'text-neutral-400/80 dark:text-neutral-550/80'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              {task.description}
            </p>
          )}

          {/* Due Date & Badges */}
          {dateInfo && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold font-mono tracking-wide ${
                  optimisticCompleted
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-450 dark:text-neutral-550'
                    : dateInfo.type === 'overdue'
                    ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                    : dateInfo.type === 'today'
                    ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                }`}
              >
                <Calendar className="w-3 h-3 stroke-[1.5px]" />
                {dateInfo.text}
              </span>
            </div>
          )}
        </div>

        {/* Edit Action Button */}
        <div className="flex items-center gap-1.5 flex-shrink-0 self-start">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              setIsEditing(true)
            }}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:text-neutral-600 dark:hover:text-neutral-350 rounded cursor-pointer"
            title="Edit item"
          >
            <Edit3 className="w-3.5 h-3.5 stroke-[1.5px]" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
})
