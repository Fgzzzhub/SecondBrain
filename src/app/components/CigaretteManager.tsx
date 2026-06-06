'use client'

import { useState } from 'react'
import { Flame, Plus, ChevronDown, ChevronUp, History, PackageOpen } from 'lucide-react'
import { smokeOneStick, restockCigarettePack } from '@/app/actions'
import { groupByDate } from '@/lib/dateUtils'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

interface CigarettePack {
  id: string
  brand: string
  initial_sticks: number
  remaining_sticks: number
  is_active: boolean
}

interface CigaretteLog {
  id: string
  pack_id: string
  smoked_at: string
  cigarette_packs?: {
    brand: string
  } | null
}

interface CigaretteManagerProps {
  initialActivePacks: CigarettePack[]
  initialTodayLogs: CigaretteLog[]
}

export function CigaretteManager({ initialActivePacks, initialTodayLogs }: CigaretteManagerProps) {
  const [activePacks, setActivePacks] = useState<CigarettePack[]>(initialActivePacks || [])
  const [todayLogs, setTodayLogs] = useState<CigaretteLog[]>(initialTodayLogs)
  const [showRestock, setShowRestock] = useState(false)
  const [loadingSmoke, setLoadingSmoke] = useState<string | null>(null)
  const [loadingRestock, setLoadingRestock] = useState(false)

  // Handle smoking 1 stick from a specific pack
  const handleSmoke = async (packId: string) => {
    const packToUpdate = activePacks.find(p => p.id === packId)
    if (!packToUpdate) return
    setLoadingSmoke(packId)

    // Save previous state for rollback
    const prevPacks = [...activePacks]
    const prevLogs = [...todayLogs]

    // Optimistic UI updates
    const updatedPacks = activePacks
      .map(p => {
        if (p.id === packId) {
          return {
            ...p,
            remaining_sticks: p.remaining_sticks - 1,
            is_active: p.remaining_sticks - 1 > 0
          }
        }
        return p
      })
      .filter(p => p.remaining_sticks > 0)

    const newLog: CigaretteLog = {
      id: Math.random().toString(),
      pack_id: packId,
      smoked_at: new Date().toISOString(),
      cigarette_packs: { brand: packToUpdate.brand }
    }

    setActivePacks(updatedPacks)
    setTodayLogs([newLog, ...todayLogs])

    try {
      await smokeOneStick(packId)
    } catch (err) {
      alert('Failed to log smoke. Reverting...')
      // Rollback
      setActivePacks(prevPacks)
      setTodayLogs(prevLogs)
    } finally {
      setLoadingSmoke(null)
    }
  }

  // Handle restock form submit
  const handleRestockSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoadingRestock(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      await restockCigarettePack(formData)
      setShowRestock(false)
      // Refresh state from page reload (Server action triggers revalidation)
      window.location.reload()
    } catch (err) {
      alert('Failed to restock pack')
    } finally {
      setLoadingRestock(false)
    }
  }

  // Group logs by date for historical view
  const groupedLogs = groupByDate(todayLogs, (log) => log.smoked_at)

  return (
    <div className="bg-white dark:bg-neutral-900/50 border border-neutral-250 dark:border-neutral-800 rounded-xl p-5 md:p-6 transition-all shadow-sm flex flex-col gap-5 relative overflow-hidden group">
      {/* Soft gradient glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 to-transparent dark:from-amber-500/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <PackageOpen className="w-4 h-4 text-amber-500 stroke-[1.5px]" />
          <h3 className="font-semibold text-sm tracking-tight text-neutral-900 dark:text-white">Cigarette & Pack Tracker</h3>
        </div>

        <button
          onClick={() => setShowRestock(!showRestock)}
          className="flex items-center gap-1 text-[11px] font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 transition-colors"
        >
          {showRestock ? (
            <>
              <span>Cancel</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Restock</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Restock Form (Collapsible) with Framer Motion */}
      <AnimatePresence>
        {showRestock && (
          <motion.form
            onSubmit={handleRestockSubmit}
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200 dark:border-neutral-900 flex flex-col gap-3 z-10 overflow-hidden"
          >
            <h4 className="text-[10px] text-neutral-550 dark:text-neutral-400 uppercase font-bold tracking-wider">Restock New Pack</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-neutral-500 dark:text-neutral-400 uppercase font-medium">Brand Name</label>
                <input
                  type="text"
                  name="brand"
                  required
                  placeholder="Marlboro, Sampoerna, etc."
                  className="bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 rounded p-1.5 outline-none w-full"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-neutral-500 dark:text-neutral-400 uppercase font-medium">Sticks Count</label>
                <input
                  type="number"
                  name="initial_sticks"
                  required
                  defaultValue={16}
                  min={1}
                  className="bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 rounded p-1.5 outline-none w-full"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loadingRestock}
              className="w-full py-1.5 rounded bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 text-xs font-semibold hover:bg-neutral-850 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loadingRestock ? 'Restocking...' : 'Restock Pack'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Active Packs Inventory Grid */}
      <div className="flex flex-col gap-2.5 z-10">
        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-semibold font-mono">
          Active Pack Inventory ({activePacks.length})
        </span>
        {activePacks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {activePacks.map((pack) => (
                <motion.div
                  key={pack.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex flex-col justify-between gap-4 relative group/card overflow-hidden"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-col">
                      <span className="text-base font-bold text-neutral-900 dark:text-white tracking-tight">
                        {pack.brand}
                      </span>
                      <span className="text-xs text-neutral-550 dark:text-neutral-400 font-mono mt-0.5">
                        {pack.remaining_sticks} of {pack.initial_sticks} sticks left
                      </span>
                      {/* Progress Bar */}
                      <div className="w-full bg-neutral-100 dark:bg-neutral-900 h-1.5 rounded-full mt-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-amber-600 h-full transition-all duration-300"
                          style={{ width: `${(pack.remaining_sticks / pack.initial_sticks) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-1">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSmoke(pack.id)}
                      disabled={loadingSmoke !== null}
                      className="w-full py-2 px-3 rounded-lg border border-transparent bg-amber-550 hover:bg-amber-600 text-white shadow-sm hover:shadow text-xs font-semibold tracking-tight transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Flame className={`w-3.5 h-3.5 ${loadingSmoke === pack.id ? 'animate-pulse' : ''}`} />
                      <span>Bakar 1 Batang</span>
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col py-6 items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-850 rounded-xl bg-neutral-50/20 dark:bg-neutral-900/5">
            <span className="text-xs font-semibold text-neutral-550 dark:text-neutral-400 italic">
              No active packs
            </span>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
              Click "Restock" above to log a new pack.
            </span>
          </div>
        )}
      </div>

      {/* Smoking History */}
      <div className="flex flex-col gap-2.5 z-10 border-t border-neutral-100 dark:border-neutral-850/80 pt-4">
        <div className="flex items-center gap-1.5 text-neutral-550 dark:text-neutral-450 mb-1">
          <History className="w-3.5 h-3.5 stroke-[1.5px]" />
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-semibold font-mono">
            Smoking History (Last {todayLogs.length} logs)
          </span>
        </div>

        {Object.keys(groupedLogs).length > 0 ? (
          <div className="flex flex-col max-h-[300px] overflow-y-auto scrollbar-thin rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/20 dark:bg-neutral-950/10 divide-y divide-neutral-150 dark:divide-neutral-850">
            {Object.entries(groupedLogs).map(([dateStr, group]) => {
              const formattedDate = format(new Date(dateStr), 'MMMM d, yyyy')
              const totalSticks = group.length
              return (
                <div key={dateStr} className="flex flex-col">
                  {/* Sticky Date Header */}
                  <div className="sticky top-0 z-20 bg-neutral-100/95 dark:bg-neutral-950/90 backdrop-blur-md py-2 px-3 text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-850 flex justify-between items-center">
                    <span>{formattedDate}</span>
                    <span className="font-mono text-amber-600 dark:text-amber-450 normal-case font-semibold">
                      Total: {totalSticks} {totalSticks === 1 ? 'Stick' : 'Sticks'}
                    </span>
                  </div>

                  {/* Logs inside group */}
                  <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-900 bg-white/20 dark:bg-neutral-950/5">
                    {group.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between px-3 py-2.5 text-[10px] font-mono text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/10 transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>
                            {new Date(log.smoked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {log.cigarette_packs?.brand && (
                          <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-medium">
                            {log.cigarette_packs.brand}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-[10px] text-neutral-550 dark:text-neutral-450 italic mt-1 pl-1">No cigarettes logged yet. Keep it up!</p>
        )}
      </div>
    </div>
  )
}
