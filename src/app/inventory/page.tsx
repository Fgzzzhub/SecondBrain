import { createClient } from '@/lib/supabase/server'
import { AddInventoryForm } from './AddInventoryForm'
import { InventoryItemCard } from './InventoryItemCard'
import { Package, CheckCircle, AlertTriangle } from 'lucide-react'

export default async function InventoryPage() {
  const supabase = await createClient()

  // Fetch inventories joined with courses
  const { data: inventories } = await supabase
    .from('inventories')
    .select('*, courses(name)')
    .order('created_at', { ascending: false })

  // Fetch courses for the creation dropdown
  const { data: courses } = await supabase
    .from('courses')
    .select('id, name')
    .order('name', { ascending: true })

  const typedInventories = (inventories || []) as any[]
  const typedCourses = (courses || []) as any[]

  // Stats
  const totalItems = typedInventories.length
  const availableItems = typedInventories.filter(i => i.status === 'Available').length
  const brokenItems = typedInventories.filter(i => i.status === 'Broken').length
  const borrowedItems = typedInventories.filter(i => i.status === 'Borrowed').length

  return (
    <div className="flex flex-col gap-8 h-full">
      <header>
        <h1 className="text-2xl font-medium tracking-tight text-white mb-1.5">Lab Inventory</h1>
        <p className="text-neutral-500 text-xs sm:text-sm">Track electronics, breadboards, development kits, and sensors.</p>
      </header>

      {/* Grid Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Items */}
        <div className="p-5 rounded-2xl border border-neutral-900 bg-neutral-900/10">
          <div className="flex justify-between items-start mb-4">
            <Package className="w-4 h-4 text-neutral-400 stroke-[1.5px]" />
          </div>
          <p className="text-2xl font-semibold tracking-tight font-mono text-white">
            {totalItems}
          </p>
          <p className="text-xs text-neutral-500 mt-1">Total Components</p>
        </div>

        {/* Available */}
        <div className="p-5 rounded-2xl border border-neutral-900 bg-neutral-900/10">
          <div className="flex justify-between items-start mb-4">
            <CheckCircle className="w-4 h-4 text-green-400 stroke-[1.5px]" />
          </div>
          <p className="text-2xl font-semibold tracking-tight font-mono text-green-400">
            {availableItems}
          </p>
          <p className="text-xs text-neutral-500 mt-1">Available Now</p>
        </div>

        {/* Borrowed / Broken */}
        <div className="p-5 rounded-2xl border border-neutral-900 bg-neutral-900/10">
          <div className="flex justify-between items-start mb-4">
            <AlertTriangle className="w-4 h-4 text-yellow-500 stroke-[1.5px]" />
          </div>
          <p className="text-2xl font-semibold tracking-tight font-mono text-neutral-200">
            {borrowedItems} <span className="text-xs text-neutral-600">/</span> <span className="text-red-400">{brokenItems}</span>
          </p>
          <p className="text-xs text-neutral-500 mt-1">Borrowed / Broken</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-md">
        <AddInventoryForm courses={typedCourses} />
      </div>

      {/* List */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Inventory List</h3>
        {typedInventories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {typedInventories.map(item => (
              <InventoryItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="p-10 text-center rounded-xl border border-dashed border-neutral-900">
            <p className="text-xs text-neutral-500">Your lab inventory is empty.</p>
          </div>
        )}
      </div>
    </div>
  )
}
