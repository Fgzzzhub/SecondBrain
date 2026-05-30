'use client'

import { useState } from 'react'
import { createInventoryItem } from '@/app/actions'
import { Plus, X } from 'lucide-react'

interface AddInventoryFormProps {
  courses: Array<{ id: string; name: string }>
}

export function AddInventoryForm({ courses }: AddInventoryFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await createInventoryItem(formData)
      setIsOpen(false)
    } catch (err) {
      alert('Failed to register component')
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
        Add Inventory Item
      </button>
    )
  }

  return (
    <div className="p-5 rounded-xl border border-neutral-900 bg-neutral-900/10">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Add Lab Item</h3>
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
            name="item_name"
            required
            placeholder="Item name (e.g. Raspberry Pi 4, Logic Analyzer)"
            className="w-full bg-transparent text-sm text-white placeholder-neutral-600 outline-none border-b border-neutral-900 focus:border-neutral-700 pb-1.5 transition-colors relative z-[100] pointer-events-auto touch-auto"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-neutral-500 uppercase font-medium">Status</label>
            <select
              name="status"
              className="bg-neutral-950 text-xs text-white border border-neutral-900 rounded p-1.5 outline-none relative z-[100] pointer-events-auto touch-auto"
            >
              <option value="Available">Available</option>
              <option value="Borrowed">Borrowed</option>
              <option value="Broken">Broken</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-neutral-500 uppercase font-medium">Related Course</label>
            <select
              name="course_id"
              className="bg-neutral-950 text-xs text-white border border-neutral-900 rounded p-1.5 outline-none relative z-[100] pointer-events-auto touch-auto"
            >
              <option value="">None</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full py-2 rounded-lg bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Component'}
        </button>
      </form>
    </div>
  )
}
