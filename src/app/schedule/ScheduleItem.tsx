'use client'

import { deleteScheduleItem } from '@/app/actions'
import { Trash2, MapPin, Clock } from 'lucide-react'

interface ScheduleItemProps {
  item: {
    id: string
    subject: string
    day: string
    start_time: string
    end_time: string
    room: string | null
  }
}

export function ScheduleItem({ item }: ScheduleItemProps) {
  const handleDelete = async () => {
    if (confirm(`Remove ${item.subject} from schedule?`)) {
      await deleteScheduleItem(item.id)
    }
  }

  return (
    <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-900/10 hover:bg-neutral-900/20 transition-all group flex items-center justify-between">
      <div className="flex flex-col gap-1.5">
        <h4 className="text-sm font-medium text-white">{item.subject}</h4>
        <div className="flex items-center gap-4 text-[11px] text-neutral-500 font-mono">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 stroke-[1.5px]" />
            <span>{item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}</span>
          </div>
          {item.room && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 stroke-[1.5px]" />
              <span>{item.room}</span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 text-neutral-600 hover:text-red-400 rounded transition-opacity"
        title="Delete class"
      >
        <Trash2 className="w-3.5 h-3.5 stroke-[1.5px]" />
      </button>
    </div>
  )
}
