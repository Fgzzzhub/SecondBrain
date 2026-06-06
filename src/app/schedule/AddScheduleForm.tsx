'use client'

import { useState } from 'react'
import { createScheduleItem } from '@/app/actions'
import { Plus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AnimatedSelect } from '@/app/components/ui/AnimatedSelect'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function AddScheduleForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [day, setDay] = useState('Monday')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await createScheduleItem(formData)
      setIsOpen(false)
      setDay('Monday')
    } catch (err) {
      alert('Failed to add class')
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
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-neutral-900 text-neutral-500 hover:text-neutral-350 hover:border-neutral-800 transition-all text-xs font-medium cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[1.5px]" />
            Add Class Schedule
          </motion.button>
        ) : (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="p-5 rounded-xl border border-neutral-900 bg-neutral-900/10"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-semibold tracking-wider text-neutral-450 uppercase">Add Class</h3>
              <button
                type="button"
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
                  name="subject"
                  required
                  placeholder="Subject name (e.g. Advanced Calculus)"
                  className="w-full bg-transparent text-sm text-white placeholder-neutral-600 outline-none border-b border-neutral-900 focus:border-neutral-700 pb-1.5 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 animate-none">
                  <label className="text-[10px] text-neutral-400 dark:text-neutral-550 uppercase font-semibold">Day</label>
                  <AnimatedSelect
                    name="day"
                    value={day}
                    onChange={(val) => setDay(val)}
                    options={DAYS.map(d => ({ value: d, label: d }))}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-neutral-550 uppercase font-medium">Room</label>
                  <input
                    type="text"
                    name="room"
                    placeholder="e.g. Room 402"
                    className="bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-lg p-2 outline-none w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-neutral-550 uppercase font-medium">Start Time</label>
                  <input
                    type="time"
                    name="start_time"
                    required
                    className="bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-lg p-2 outline-none w-full cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-neutral-550 uppercase font-medium">End Time</label>
                  <input
                    type="time"
                    name="end_time"
                    required
                    className="bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-lg p-2 outline-none w-full cursor-pointer"
                  />
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {loading ? 'Adding...' : 'Add to Timetable'}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
