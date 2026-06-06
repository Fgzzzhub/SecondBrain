'use client'

import { useState } from 'react'
import { createInventoryItem } from '@/app/actions'
import { Plus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AnimatedSelect } from '@/app/components/ui/AnimatedSelect'

interface AddInventoryFormProps {
  courses: Array<{ id: string; name: string }>
}

export function AddInventoryForm({ courses }: AddInventoryFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('Normal')
  const [courseId, setCourseId] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await createInventoryItem(formData)
      setIsOpen(false)
      setStatus('Normal')
      setCourseId('')
    } catch {
      alert('Failed to register component')
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
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-900 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-800 transition-all text-xs font-semibold bg-neutral-50/50 dark:bg-neutral-900/5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[1.5px]" />
            Add Inventory Item
          </motion.button>
        ) : (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-900 bg-white dark:bg-neutral-950/20 backdrop-blur-md shadow-sm"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-semibold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">Add Lab Item</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[1.5px]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Item Name */}
              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  name="item_name"
                  required
                  placeholder="Item name (e.g. Raspberry Pi 4, Logic Analyzer)"
                  className="w-full bg-transparent text-sm font-medium text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 outline-none border-b border-neutral-100 dark:border-neutral-900 focus:border-neutral-300 dark:focus:border-neutral-700 pb-1.5 transition-colors"
                />
              </div>

              {/* Quantity and Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <input
                    type="number"
                    name="quantity"
                    required
                    min="1"
                    defaultValue="1"
                    placeholder="Jumlah Barang"
                    className="w-full bg-transparent text-xs text-neutral-700 dark:text-neutral-300 placeholder-neutral-400 dark:placeholder-neutral-650 outline-none border-b border-neutral-100 dark:border-neutral-900 focus:border-neutral-300 dark:focus:border-neutral-700 pb-1.5 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <input
                    type="text"
                    name="location"
                    placeholder="Tempat Barang (Optional)"
                    className="w-full bg-transparent text-xs text-neutral-700 dark:text-neutral-300 placeholder-neutral-400 dark:placeholder-neutral-650 outline-none border-b border-neutral-100 dark:border-neutral-900 focus:border-neutral-300 dark:focus:border-neutral-700 pb-1.5 transition-colors"
                  />
                </div>
              </div>

              {/* Status and Related Course */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-semibold">Status</label>
                  <AnimatedSelect
                    name="status"
                    value={status}
                    onChange={(val) => setStatus(val)}
                    options={[
                      { value: 'Normal', label: 'Normal' },
                      { value: 'Borrowed', label: 'Borrowed' },
                      { value: 'Broken', label: 'Broken' }
                    ]}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-semibold">Related Course</label>
                  <AnimatedSelect
                    name="course_id"
                    value={courseId}
                    onChange={(val) => setCourseId(val)}
                    options={[
                      { value: '', label: 'None' },
                      ...courses.map(course => ({ value: course.id, label: course.name }))
                    ]}
                  />
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={loading}
                className="mt-1 w-full py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {loading ? 'Adding...' : 'Add Component'}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
