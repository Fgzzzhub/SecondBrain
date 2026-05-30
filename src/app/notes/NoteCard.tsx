'use client'

import { deleteNote } from '@/app/actions'
import { Trash2 } from 'lucide-react'

interface NoteCardProps {
  note: {
    id: string
    title: string
    content: string
    created_at: string
  }
}

export function NoteCard({ note }: NoteCardProps) {
  const handleDelete = async () => {
    if (confirm(`Delete note: "${note.title}"?`)) {
      await deleteNote(note.id)
    }
  }

  return (
    <div className="p-5 rounded-xl border border-neutral-900 bg-neutral-900/10 hover:bg-neutral-900/20 transition-all group flex flex-col justify-between gap-4">
      <div>
        <div className="flex justify-between items-start gap-4">
          <h3 className="text-sm font-semibold text-white truncate">{note.title}</h3>
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-neutral-600 hover:text-red-400 rounded transition-opacity"
            title="Delete note"
          >
            <Trash2 className="w-3.5 h-3.5 stroke-[1.5px]" />
          </button>
        </div>
        <p className="text-xs text-neutral-400 mt-2 whitespace-pre-wrap leading-relaxed">
          {note.content}
        </p>
      </div>

      <div className="text-[10px] text-neutral-600 font-mono">
        {new Date(note.created_at).toLocaleDateString()}
      </div>
    </div>
  )
}
