'use client'

import { useState } from 'react'
import { createNote } from '@/app/actions'
import { Plus, X } from 'lucide-react'

export function AddNoteForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await createNote(formData)
      setIsOpen(false)
    } catch (err) {
      alert('Failed to save note')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-neutral-900 text-neutral-500 hover:text-neutral-300 hover:border-neutral-800 transition-all text-xs font-medium"
      >
        <Plus className="w-4 h-4 stroke-[1.5px]" />
        Take a Note
      </button>
    )
  }

  return (
    <div className="p-5 rounded-xl border border-neutral-900 bg-neutral-900/10">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">New Note</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          <X className="w-4 h-4 stroke-[1.5px]" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1">
          <input
            type="text"
            name="title"
            required
            placeholder="Note title"
            className="w-full bg-transparent text-sm text-white placeholder-neutral-600 outline-none border-b border-neutral-900 focus:border-neutral-700 pb-1.5 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1">
          <textarea
            name="content"
            required
            rows={4}
            placeholder="Write your thoughts..."
            className="w-full bg-transparent text-xs text-white placeholder-neutral-600 outline-none border-b border-neutral-900 focus:border-neutral-700 pb-1.5 transition-colors resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full py-2 rounded-lg bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Note'}
        </button>
      </form>
    </div>
  )
}
