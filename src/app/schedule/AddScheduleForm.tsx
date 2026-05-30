'use client'

import { useState } from 'react'
import { createScheduleItem } from '@/app/actions'
import { Plus, X } from 'lucide-react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function AddScheduleForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await createScheduleItem(formData)
      setIsOpen(false)
    } catch (err) {
      alert('Failed to add class')
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
        Add Class Schedule
      </button>
    )
  }

  return (
    <div className="p-5 rounded-xl border border-neutral-900 bg-neutral-900/10">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Add Class</h3>
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
            name="subject"
            required
            placeholder="Subject name (e.g. Advanced Calculus)"
            className="w-full bg-transparent text-sm text-white placeholder-neutral-600 outline-none border-b border-neutral-900 focus:border-neutral-700 pb-1.5 transition-colors relative z-[100] pointer-events-auto touch-auto"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-neutral-500 uppercase font-medium">Day</label>
            <select
              name="day"
              required
              className="bg-neutral-955 text-xs text-white border border-neutral-900 rounded p-1.5 outline-none relative z-[100] pointer-events-auto touch-auto"
            >
              {DAYS.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-neutral-500 uppercase font-medium">Room</label>
            <input
              type="text"
              name="room"
              placeholder="e.g. Room 402"
              className="bg-neutral-950 text-xs text-white border border-neutral-900 rounded p-1.5 outline-none relative z-[100] pointer-events-auto touch-auto"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-neutral-500 uppercase font-medium">Start Time</label>
            <input
              type="time"
              name="start_time"
              required
              className="bg-neutral-950 text-xs text-white border border-neutral-900 rounded p-1.5 outline-none relative z-[100] pointer-events-auto touch-auto"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-neutral-500 uppercase font-medium">End Time</label>
            <input
              type="time"
              name="end_time"
              required
              className="bg-neutral-950 text-xs text-white border border-neutral-900 rounded p-1.5 outline-none relative z-[100] pointer-events-auto touch-auto"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full py-2 rounded-lg bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add to Timetable'}
        </button>
      </form>
    </div>
  )
}
