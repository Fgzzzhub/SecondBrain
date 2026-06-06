'use client'

import { useState } from 'react'
import { createNote } from '@/app/actions'
import { Plus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.button
            key="add-button"
            onClick={() => setIsOpen(true)}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-neutral-900 text-neutral-500 hover:text-neutral-300 hover:border-neutral-800 transition-all text-xs font-medium cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[1.5px]" />
            Take a Note
          </motion.button>
        ) : (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="p-5 rounded-xl border border-neutral-900 bg-neutral-900/10 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-semibold tracking-wider text-neutral-450 uppercase">New Note</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
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
                  className="w-full bg-transparent text-xs text-white placeholder-neutral-650 outline-none border-b border-neutral-900 focus:border-neutral-700 pb-1.5 transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-2 rounded-lg bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Saving...' : 'Save Note'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
