'use client'

import { useState, useTransition } from 'react'
import { updateNote, deleteNote } from '@/app/actions'
import { Trash2, Edit3, Check, X } from 'lucide-react'

interface NoteCardProps {
  note: {
    id: string
    title: string
    content: string
    created_at: string
  }
}

export function NoteCard({ note }: NoteCardProps) {
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)

  // Edit fields state
  const [editTitle, setEditTitle] = useState(note.title)
  const [editContent, setEditContent] = useState(note.content)

  const handleDelete = async () => {
    if (confirm(`Delete note: "${note.title}"?`)) {
      startTransition(async () => {
        try {
          await deleteNote(note.id)
        } catch {
          alert('Failed to delete note')
        }
      })
    }
  }

  const handleSave = () => {
    if (!editTitle.trim()) {
      alert('Note title is required')
      return
    }
    startTransition(async () => {
      try {
        await updateNote(note.id, editTitle, editContent)
        setIsEditing(false)
      } catch {
        alert('Failed to update note')
      }
    })
  }

  const handleCancel = () => {
    setEditTitle(note.title)
    setEditContent(note.content)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="p-5 rounded-2xl border border-neutral-350 dark:border-neutral-700 bg-white dark:bg-neutral-950/40 backdrop-blur-sm flex flex-col gap-3 shadow-md">
        <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Edit Note</h4>
        
        {/* Title Input */}
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Note title"
          className="w-full bg-transparent text-sm font-semibold text-neutral-900 dark:text-white outline-none border-b border-neutral-200 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 pb-1"
        />

        {/* Content Textarea */}
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          placeholder="Note content..."
          rows={4}
          className="w-full bg-transparent text-xs text-neutral-700 dark:text-neutral-300 outline-none border-b border-neutral-200 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 pb-1 resize-none leading-relaxed"
        />

        {/* Action Buttons */}
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
    )
  }

  return (
    <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-900 bg-white dark:bg-neutral-950/20 backdrop-blur-sm hover:border-neutral-300 dark:hover:border-neutral-800 transition-all group flex flex-col justify-between gap-4 shadow-sm">
      <div>
        <div className="flex justify-between items-start gap-4">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-white truncate">{note.title}</h3>
          
          {/* Edit/Delete options */}
          <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center gap-1 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-neutral-400 hover:text-neutral-700 dark:text-neutral-600 dark:hover:text-neutral-305 rounded cursor-pointer"
              title="Edit note"
            >
              <Edit3 className="w-3.5 h-3.5 stroke-[1.5px]" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="p-1 text-neutral-400 hover:text-rose-500 dark:text-neutral-600 dark:hover:text-rose-400 rounded cursor-pointer"
              title="Delete note"
            >
              <Trash2 className="w-3.5 h-3.5 stroke-[1.5px]" />
            </button>
          </div>
        </div>
        <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-2.5 whitespace-pre-wrap leading-relaxed">
          {note.content}
        </p>
      </div>

      <div className="text-[10px] text-neutral-450 font-mono">
        {new Date(note.created_at).toLocaleDateString()}
      </div>
    </div>
  )
}
