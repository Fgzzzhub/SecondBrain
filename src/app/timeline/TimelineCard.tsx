'use client'

import { useState, useTransition } from 'react'
import { deleteLearningLog, updateLearningLog } from '@/app/actions'
import { Calendar, Trash2, Edit3, Check, X } from 'lucide-react'
import { triggerHaptic } from '@/lib/haptic'

interface LearningLog {
  id: string
  title: string
  content: string
  tags: string[]
  created_at: string
}

export function TimelineCard({ log }: { log: LearningLog }) {
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)

  // Edit fields state
  const [editTitle, setEditTitle] = useState(log.title)
  const [editContent, setEditContent] = useState(log.content)
  const [editTags, setEditTags] = useState(log.tags ? log.tags.join(', ') : '')

  const handleDelete = async () => {
    triggerHaptic(40)
    if (confirm('Are you sure you want to delete this learning log?')) {
      triggerHaptic(80)
      startTransition(async () => {
        try {
          await deleteLearningLog(log.id)
        } catch {
          alert('Failed to delete learning log')
        }
      })
    }
  }

  const handleSave = () => {
    if (!editTitle.trim()) {
      alert('Title is required')
      return
    }
    startTransition(async () => {
      try {
        await updateLearningLog(log.id, editTitle, editContent, editTags)
        setIsEditing(false)
      } catch {
        alert('Failed to update learning log')
      }
    })
  }

  const handleCancel = () => {
    setEditTitle(log.title)
    setEditContent(log.content)
    setEditTags(log.tags ? log.tags.join(', ') : '')
    setIsEditing(false)
  }

  const formattedDate = new Date(log.created_at).toLocaleDateString('en-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  if (isEditing) {
    return (
      <div className="relative group">
        <span className="absolute -left-[29.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-neutral-900 dark:bg-neutral-100 ring-4 ring-white dark:ring-neutral-950 transition-all scale-110" />

        <div className="flex flex-col gap-3.5 p-4 rounded-xl border border-neutral-350 dark:border-neutral-700 bg-white dark:bg-neutral-950/40 backdrop-blur-sm shadow-md">
          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Edit Log</h4>

          {/* Title Input */}
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-neutral-900 dark:text-white outline-none border-b border-neutral-200 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 pb-1"
            placeholder="Title"
          />

          {/* Content Textarea */}
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            className="w-full bg-transparent text-xs text-neutral-700 dark:text-neutral-300 outline-none border-b border-neutral-200 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 pb-1 resize-none leading-relaxed"
            placeholder="What did you learn today?"
          />

          {/* Tags Input */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-neutral-400 uppercase">Tags (comma separated)</label>
            <input
              type="text"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              className="w-full bg-transparent text-xs text-neutral-700 dark:text-neutral-300 outline-none border-b border-neutral-200 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-650 pb-1"
              placeholder="e.g. RaspberryPi, Python, CS"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-900/40 text-neutral-500 transition-colors cursor-pointer"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="p-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 hover:opacity-90 transition-opacity cursor-pointer"
              title="Save"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative group">
      {/* Connected Node */}
      <span className="absolute -left-[29.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-neutral-900 dark:bg-neutral-100 ring-4 ring-white dark:ring-neutral-950 transition-all group-hover:scale-110" />

      {/* Card Content */}
      <div className="flex flex-col gap-2.5 p-4 rounded-xl border border-neutral-250 dark:border-neutral-850 bg-white dark:bg-neutral-900/10 backdrop-blur-sm shadow-none hover:border-neutral-350 dark:hover:border-neutral-800 transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-medium text-neutral-450 dark:text-neutral-500 flex items-center gap-1.5">
              <Calendar className="w-3 h-3 stroke-[1.5px]" />
              {formattedDate}
            </span>
            <h4 className="text-sm font-bold text-neutral-905 dark:text-neutral-100 mt-1 leading-snug">
              {log.title}
            </h4>
          </div>

          {/* Edit / Delete actions */}
          <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 flex items-center gap-1 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                setIsEditing(true)
              }}
              className="p-1 text-neutral-400 hover:text-neutral-700 dark:text-neutral-600 dark:hover:text-neutral-350 rounded cursor-pointer"
              title="Edit log"
            >
              <Edit3 className="w-3.5 h-3.5 stroke-[1.5px]" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                handleDelete()
              }}
              disabled={isPending}
              className="p-1 text-neutral-400 hover:text-rose-500 dark:text-neutral-600 dark:hover:text-rose-450 rounded cursor-pointer"
              title="Delete log"
            >
              <Trash2 className="w-3.5 h-3.5 stroke-[1.5px]" />
            </button>
          </div>
        </div>

        <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
          {log.content}
        </p>

        {log.tags && log.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {log.tags.map((tag) => (
              <span
                key={tag}
                className="bg-neutral-100 dark:bg-neutral-950 text-neutral-550 dark:text-neutral-400 text-[9px] px-2 py-0.5 rounded-md font-semibold font-mono"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
