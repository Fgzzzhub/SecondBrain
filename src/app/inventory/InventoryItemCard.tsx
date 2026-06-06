'use client'

import { useState, useTransition } from 'react'
import { updateInventoryItem, deleteInventoryItem } from '@/app/actions'
import { Trash2, Package, MapPin, Edit3, Check, X, Layers } from 'lucide-react'
import { triggerHaptic } from '@/lib/haptic'
import { motion } from 'framer-motion'
import { AnimatedSelect } from '@/app/components/ui/AnimatedSelect'

interface InventoryItem {
  id: string
  item_name: string
  status: string
  quantity?: number
  location?: string | null
  course_id: string | null
  courses?: { name: string } | null
}

interface InventoryItemCardProps {
  item: InventoryItem
}

export function InventoryItemCard({ item }: InventoryItemCardProps) {
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)

  // Edit fields state
  const [editName, setEditName] = useState(item.item_name)
  const [editQuantity, setEditQuantity] = useState(item.quantity ?? 1)
  const [editLocation, setEditLocation] = useState(item.location ?? '')
  const [editStatus, setEditStatus] = useState(item.status)

  const handleDelete = async () => {
    triggerHaptic(40)
    if (confirm(`Remove "${item.item_name}" from inventory?`)) {
      triggerHaptic(80)
      startTransition(async () => {
        try {
          await deleteInventoryItem(item.id)
        } catch {
          alert('Failed to delete item')
        }
      })
    }
  }

  const handleSave = () => {
    if (!editName.trim()) {
      alert('Item name is required')
      return
    }
    startTransition(async () => {
      try {
        await updateInventoryItem(item.id, editName, editQuantity, editLocation || null, editStatus)
        setIsEditing(false)
      } catch {
        alert('Failed to update inventory item')
      }
    })
  }

  const handleCancel = () => {
    setEditName(item.item_name)
    setEditQuantity(item.quantity ?? 1)
    setEditLocation(item.location ?? '')
    setEditStatus(item.status)
    setIsEditing(false)
  }

  // Determine indicator color based on status
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'Normal':
      case 'Available':
        return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/20 dark:border-green-900/30'
      case 'Borrowed':
        return 'text-yellow-600 bg-yellow-50 border-yellow-250 dark:text-yellow-450 dark:bg-yellow-950/20 dark:border-yellow-900/30'
      case 'Broken':
        return 'text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/20 dark:border-rose-900/30'
      default:
        return 'text-neutral-500 bg-neutral-55 border-neutral-200 dark:text-neutral-400 dark:bg-neutral-900/40 dark:border-neutral-800'
    }
  }

  if (isEditing) {
    return (
      <div className="p-4 rounded-2xl border border-neutral-350 dark:border-neutral-700 bg-white dark:bg-neutral-950/40 backdrop-blur-sm flex flex-col gap-3.5 shadow-md">
        <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Edit Item</h4>
        
        {/* Name input */}
        <div className="flex flex-col gap-1">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-neutral-900 dark:text-white outline-none border-b border-neutral-200 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 pb-1"
            placeholder="Item name"
          />
        </div>

        {/* Quantity and Location */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-neutral-400 uppercase">Qty</label>
            <input
              type="number"
              value={editQuantity}
              onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
              min="1"
              className="w-full bg-transparent text-xs text-neutral-700 dark:text-neutral-350 outline-none border-b border-neutral-200 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 pb-1"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-neutral-400 uppercase">Location</label>
            <input
              type="text"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              className="w-full bg-transparent text-xs text-neutral-700 dark:text-neutral-350 outline-none border-b border-neutral-200 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 pb-1"
              placeholder="e.g. Shelf A"
            />
          </div>
        </div>

        {/* Status Dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-neutral-400 uppercase">Status</label>
          <AnimatedSelect
            value={editStatus}
            onChange={(val) => setEditStatus(val)}
            options={[
              { value: 'Normal', label: 'Normal' },
              { value: 'Borrowed', label: 'Borrowed' },
              { value: 'Broken', label: 'Broken' }
            ]}
          />
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 mt-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleCancel}
            disabled={isPending}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-900/40 text-neutral-500 transition-colors cursor-pointer"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSave}
            disabled={isPending}
            className="p-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 hover:opacity-90 transition-opacity cursor-pointer"
            title="Save"
          >
            <Check className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4.5 rounded-2xl border border-neutral-200 dark:border-neutral-900 bg-white dark:bg-neutral-950/20 backdrop-blur-sm hover:border-neutral-300 dark:hover:border-neutral-800 transition-all group flex flex-col justify-between min-h-[140px] shadow-sm">
      <div>
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500">
            <Package className="w-3.5 h-3.5 stroke-[1.5px]" />
            {item.courses?.name ? (
              <span className="text-[10px] font-medium font-mono truncate max-w-[110px]">
                {item.courses.name}
              </span>
            ) : (
              <span className="text-[10px] font-medium font-mono">General</span>
            )}
          </div>

          {/* Edit / Delete actions */}
          <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 flex items-center gap-1 transition-opacity">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                setIsEditing(true)
              }}
              className="p-1 text-neutral-400 hover:text-neutral-700 dark:text-neutral-600 dark:hover:text-neutral-350 rounded cursor-pointer"
              title="Edit item"
            >
              <Edit3 className="w-3.5 h-3.5 stroke-[1.5px]" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                handleDelete()
              }}
              disabled={isPending}
              className="p-1 text-neutral-400 hover:text-rose-500 dark:text-neutral-600 dark:hover:text-rose-450 rounded cursor-pointer"
              title="Delete item"
            >
              <Trash2 className="w-3.5 h-3.5 stroke-[1.5px]" />
            </motion.button>
          </div>
        </div>

        <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-205 mt-2.5 leading-snug">
          {item.item_name}
        </h4>

        {/* Location & Quantity metadata */}
        <div className="flex flex-col gap-1 mt-2.5 text-[11px] text-neutral-500 dark:text-neutral-450 font-mono">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3 h-3 stroke-[1.5px] text-neutral-400 dark:text-neutral-500" />
            <span>Quantity: {item.quantity ?? 1}</span>
          </div>
          {item.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 stroke-[1.5px] text-neutral-400 dark:text-neutral-500" />
              <span className="truncate">{item.location}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4.5 pt-3 border-t border-neutral-100 dark:border-neutral-900/60">
        <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${getStatusColorClass(item.status)}`}>
          {item.status}
        </span>
      </div>
    </div>
  )
}
