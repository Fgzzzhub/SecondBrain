'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, RotateCcw, Check, Luggage, FolderPlus } from 'lucide-react'
import {
  createTripTemplate,
  deleteTripTemplate,
  addTemplateItem,
  toggleTemplateItem,
  deleteTemplateItem,
  resetTemplateItems
} from '@/app/actions'
import { triggerHaptic } from '@/lib/haptic'
import { useSettings } from '@/app/components/SettingsContext'

interface TemplateItem {
  id: string
  template_id: string
  name: string
  is_checked: boolean
}

interface TripTemplate {
  id: string
  title: string
  created_at: string
  template_items: TemplateItem[]
}

interface TripManagerProps {
  initialTemplates: any[]
}

export function TripManager({ initialTemplates }: TripManagerProps) {
  const { accentColor } = useSettings()
  const [templates, setTemplates] = useState<TripTemplate[]>(initialTemplates)
  const [newTemplateTitle, setNewTemplateTitle] = useState('')
  const [loadingCreate, setLoadingCreate] = useState(false)
  const [newItemInputs, setNewItemInputs] = useState<Record<string, string>>({})

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTemplateTitle.trim()) return

    setLoadingCreate(true)
    triggerHaptic(20)

    try {
      await createTripTemplate(newTemplateTitle)
      setNewTemplateTitle('')
      // Reload page state to get fresh database IDs
      window.location.reload()
    } catch (e) {
      console.error(e)
      alert('Gagal membuat template.')
    } finally {
      setLoadingCreate(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string, title: string) => {
    if (!confirm(`Hapus template "${title}" beserta seluruh isinya?`)) return
    triggerHaptic(25)

    const prevTemplates = [...templates]
    setTemplates(prev => prev.filter(t => t.id !== templateId))

    try {
      await deleteTripTemplate(templateId)
    } catch (e) {
      console.error(e)
      setTemplates(prevTemplates)
      alert('Gagal menghapus template.')
    }
  }

  const handleAddItemSubmit = async (e: React.FormEvent, templateId: string) => {
    e.preventDefault()
    const name = newItemInputs[templateId] || ''
    if (!name.trim()) return

    triggerHaptic(10)

    // Generate a temporary item ID for the optimistic state
    const tempId = Math.random().toString()
    const newItem: TemplateItem = {
      id: tempId,
      template_id: templateId,
      name,
      is_checked: false
    }

    const prevTemplates = [...templates]

    // Clear input field immediately
    setNewItemInputs(prev => ({ ...prev, [templateId]: '' }))

    // Optimistically update state
    setTemplates(prev => prev.map(t => {
      if (t.id === templateId) {
        return {
          ...t,
          template_items: [...t.template_items, newItem]
        }
      }
      return t
    }))

    try {
      await addTemplateItem(templateId, name)
      // Reload page state to fetch the true ID from Supabase
      window.location.reload()
    } catch (e) {
      console.error(e)
      setTemplates(prevTemplates)
      alert('Gagal menambahkan barang.')
    }
  }

  const handleToggleItem = async (itemId: string, isChecked: boolean) => {
    triggerHaptic(10)
    const prevTemplates = [...templates]

    // Optimistic update
    setTemplates(prev => prev.map(t => ({
      ...t,
      template_items: t.template_items.map(item => {
        if (item.id === itemId) {
          return { ...item, is_checked: isChecked }
        }
        return item
      })
    })))

    try {
      await toggleTemplateItem(itemId, isChecked)
    } catch (e) {
      console.error(e)
      setTemplates(prevTemplates)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    triggerHaptic(10)
    const prevTemplates = [...templates]

    // Optimistic update
    setTemplates(prev => prev.map(t => ({
      ...t,
      template_items: t.template_items.filter(item => item.id !== itemId)
    })))

    try {
      await deleteTemplateItem(itemId)
    } catch (e) {
      console.error(e)
      setTemplates(prevTemplates)
    }
  }

  const handleResetChecklist = async (templateId: string) => {
    triggerHaptic(15)
    const prevTemplates = [...templates]

    // Optimistic update
    setTemplates(prev => prev.map(t => {
      if (t.id === templateId) {
        return {
          ...t,
          template_items: t.template_items.map(item => ({ ...item, is_checked: false }))
        }
      }
      return t
    }))

    try {
      await resetTemplateItems(templateId)
    } catch (e) {
      console.error(e)
      setTemplates(prevTemplates)
      alert('Gagal me-reset checklist.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Create New Template Section */}
      <form onSubmit={handleCreateTemplate} className="max-w-md w-full">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              required
              value={newTemplateTitle}
              onChange={(e) => setNewTemplateTitle(e.target.value)}
              placeholder="Nama Template (e.g., Camping, Pantai...)"
              className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/80 rounded-xl px-4 py-2 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 outline-none focus-visible:border-[rgb(var(--color-primary))]/50 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loadingCreate}
            className="px-4 py-2 rounded-xl bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary))]/90 active:bg-[rgb(var(--color-primary))]/80 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span>{loadingCreate ? 'Membuat...' : 'Buat Template'}</span>
          </button>
        </div>
      </form>

      {/* Grid of templates */}
      {templates.length > 0 ? (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {templates.map((template) => {
              const checkedCount = template.template_items.filter(i => i.is_checked).length
              const totalCount = template.template_items.length
              const progressPercentage = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0
              const isAllChecked = totalCount > 0 && checkedCount === totalCount

              return (
                <motion.div
                  key={template.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/10 hover:border-[rgb(var(--color-primary))]/20 dark:hover:border-[rgb(var(--color-primary))]/10 flex flex-col justify-between gap-5 relative group overflow-hidden transition-all duration-300 min-h-[320px] shadow-sm"
                >
                  {/* Subtle neutral hover wash (no colored glow) */}
                  <div className="absolute inset-0 bg-neutral-500/5 dark:bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  <div className="flex flex-col gap-4 z-10">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Luggage className="w-4.5 h-4.5 text-[rgb(var(--color-primary))] shrink-0 stroke-[1.5px]" />
                        <h3 className="font-semibold text-sm tracking-tight text-neutral-900 dark:text-white truncate">
                          {template.title}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(template.id, template.title)}
                        className="text-neutral-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer shrink-0"
                        title="Hapus Template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Progress Indicator */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[10px] font-semibold text-neutral-450 dark:text-neutral-500 font-mono">
                        <span>PROGRESS PACKING</span>
                        <span className={isAllChecked ? 'text-[rgb(var(--color-primary))]' : ''}>
                          {checkedCount} of {totalCount} Items
                        </span>
                      </div>
                      <div className="w-full bg-neutral-100 dark:bg-neutral-950 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[rgb(var(--color-primary))] h-full transition-all duration-350"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Add Item Inline Input */}
                    <form onSubmit={(e) => handleAddItemSubmit(e, template.id)} className="relative mt-1">
                      <input
                        type="text"
                        required
                        placeholder="Tambah barang (e.g., Jaket, Charger)..."
                        value={newItemInputs[template.id] || ''}
                        onChange={(e) => setNewItemInputs(prev => ({ ...prev, [template.id]: e.target.value }))}
                        className="w-full bg-white dark:bg-neutral-950 border border-neutral-250 dark:border-neutral-800/80 rounded-lg pl-3 pr-9 py-2 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 outline-none focus-visible:border-[rgb(var(--color-primary))]/50 transition-colors"
                      />
                      <button
                        type="submit"
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-[rgb(var(--color-primary))] transition-colors cursor-pointer"
                        title="Tambah Barang"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </form>

                    {/* Checklist List */}
                    <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-neutral-250 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-800 [&::-webkit-scrollbar-thumb]:rounded-full pr-1.5">
                      <AnimatePresence initial={false}>
                        {template.template_items.length > 0 ? (
                          template.template_items.map((item) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              transition={{ duration: 0.2 }}
                              className="flex items-center justify-between group/item gap-2"
                            >
                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleToggleItem(item.id, !item.is_checked)}
                                className="flex items-center gap-2.5 flex-1 text-left py-1 select-none cursor-pointer"
                              >
                                <div
                                  className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                                    item.is_checked
                                      ? 'bg-[rgb(var(--color-primary))] border-[rgb(var(--color-primary))] text-white'
                                      : 'border-neutral-350 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-transparent'
                                  }`}
                                >
                                  <Check className="w-2.5 h-2.5 stroke-[3.5px]" />
                                </div>
                                <span
                                  className={`text-xs transition-all truncate pr-1 ${
                                    item.is_checked
                                      ? 'line-through text-neutral-450 dark:text-neutral-500 opacity-60'
                                      : 'text-neutral-800 dark:text-neutral-200'
                                  }`}
                                >
                                  {item.name}
                                </span>
                              </motion.button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                className="opacity-0 group-hover/item:opacity-100 focus:opacity-100 text-neutral-400 hover:text-red-500 p-1 transition-opacity cursor-pointer shrink-0"
                                title="Hapus Barang"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </motion.div>
                          ))
                        ) : (
                          <span className="text-[11px] text-neutral-450 dark:text-neutral-500 italic py-1 pl-0.5">
                            Belum ada barang.
                          </span>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Reset Action */}
                  <div className="mt-4 pt-3 border-t border-neutral-200/50 dark:border-neutral-800/40 z-10">
                    <button
                      type="button"
                      onClick={() => handleResetChecklist(template.id)}
                      disabled={totalCount === 0}
                      className="w-full py-2 rounded-xl bg-[rgba(var(--color-primary),0.06)] hover:bg-[rgba(var(--color-primary),0.12)] active:bg-[rgba(var(--color-primary),0.18)] text-[rgb(var(--color-primary))] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <RotateCcw className="w-3.5 h-3.5 stroke-[2px]" />
                      <span>Reset Checklist</span>
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="flex flex-col py-12 items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/10 dark:bg-neutral-900/5">
          <Luggage className="w-8 h-8 text-neutral-400 stroke-[1.2px] mb-3" />
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-450 italic">
            Belum ada template trip
          </span>
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
            Gunakan form di atas untuk membuat template baru.
          </span>
        </div>
      )}
    </div>
  )
}
