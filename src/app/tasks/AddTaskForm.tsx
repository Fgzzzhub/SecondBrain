'use client'

import { useState } from 'react'
import { createTask } from '@/app/actions'
import { Plus, X, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function AddTaskForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await createTask(formData)
      setIsOpen(false)
      setShowDatePicker(false)
    } catch {
      alert('Failed to create task')
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
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-900 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-355 dark:hover:border-neutral-800 hover:border-neutral-355 transition-all text-xs font-semibold bg-neutral-50/50 dark:bg-neutral-900/5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[1.5px]" />
            Add New Item
          </motion.button>
        ) : (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-900 bg-white dark:bg-neutral-950 shadow-sm overflow-hidden"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-semibold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">New Action Item</h3>
              <button
                onClick={() => {
                  setIsOpen(false)
                  setShowDatePicker(false)
                }}
                className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[1.5px]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="What needs to be done?"
                  className="w-full bg-transparent text-sm font-medium text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 outline-none border-b border-neutral-100 dark:border-neutral-900 focus:border-neutral-300 dark:focus:border-neutral-700 pb-1.5 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1">
                <textarea
                  name="description"
                  placeholder="Add notes, details, or steps... (optional)"
                  rows={3}
                  className="w-full bg-transparent text-xs text-neutral-700 dark:text-neutral-300 placeholder-neutral-400 dark:placeholder-neutral-650 outline-none border-b border-neutral-100 dark:border-neutral-900 focus:border-neutral-300 dark:focus:border-neutral-700 pb-1.5 transition-colors resize-none leading-relaxed"
                />
              </div>

              <div className="flex flex-col items-start gap-2">
                {!showDatePicker ? (
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/10 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-805 transition-all text-[11px] font-medium cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 stroke-[1.5px]" />
                    Add Date (Optional)
                  </button>
                ) : (
                  <div className="flex items-center gap-3 w-full">
                    <div className="relative flex-1">
                      <input
                        type="date"
                        name="due_date"
                        className="w-full bg-transparent text-xs text-neutral-700 dark:text-neutral-300 outline-none border-b border-neutral-200 dark:border-neutral-900 focus:border-neutral-300 dark:focus:border-neutral-700 pb-1.5 transition-colors cursor-pointer"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDatePicker(false)}
                      className="text-[10px] text-neutral-450 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      Remove Date
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {loading ? 'Adding...' : 'Add to Backlog'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
