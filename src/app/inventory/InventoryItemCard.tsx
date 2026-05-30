'use client'

import { updateInventoryItemStatus, deleteInventoryItem } from '@/app/actions'
import { Trash2, Package } from 'lucide-react'

interface InventoryItem {
  id: string
  item_name: string
  status: string
  course_id: string | null
  courses?: { name: string } | null
}

interface InventoryItemCardProps {
  item: InventoryItem
}

export function InventoryItemCard({ item }: InventoryItemCardProps) {
  const handleDelete = async () => {
    if (confirm(`Remove "${item.item_name}" from inventory?`)) {
      await deleteInventoryItem(item.id)
    }
  }

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    await updateInventoryItemStatus(item.id, e.target.value)
  }

  // Determine indicator color based on status
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'Available':
        return 'text-green-400 bg-green-950/20 border-green-900/30'
      case 'Borrowed':
        return 'text-yellow-400 bg-yellow-950/20 border-yellow-900/30'
      case 'Broken':
        return 'text-red-400 bg-red-950/20 border-red-900/30'
      default:
        return 'text-neutral-400 bg-neutral-900/40 border-neutral-800'
    }
  }

  return (
    <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-900/10 hover:bg-neutral-900/20 transition-all group flex flex-col justify-between min-h-[120px]">
      <div>
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-2">
            <Package className="w-3.5 h-3.5 text-neutral-500 stroke-[1.5px]" />
            {item.courses?.name && (
              <span className="text-[10px] text-neutral-500 font-mono truncate max-w-[120px]">
                {item.courses.name}
              </span>
            )}
          </div>
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-neutral-600 hover:text-red-400 rounded transition-opacity"
            title="Delete component"
          >
            <Trash2 className="w-3.5 h-3.5 stroke-[1.5px]" />
          </button>
        </div>
        <h4 className="text-sm font-medium text-neutral-200 mt-2.5 leading-snug">
          {item.item_name}
        </h4>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-900/40">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getStatusColorClass(item.status)}`}>
          {item.status}
        </span>

        <select
          value={item.status}
          onChange={handleStatusChange}
          className="bg-neutral-950 text-[11px] text-neutral-400 border border-neutral-800 hover:border-neutral-700 rounded-md px-2.5 py-1 outline-none transition-colors cursor-pointer"
        >
          <option value="Available">Available</option>
          <option value="Borrowed">Borrowed</option>
          <option value="Broken">Broken</option>
        </select>
      </div>
    </div>
  )
}
