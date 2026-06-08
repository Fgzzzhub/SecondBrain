'use client'

import { useState } from 'react'
import { Flame, Plus, ChevronDown, ChevronUp, History, PackageOpen, Edit2, Users, Trash2 } from 'lucide-react'
import { smokeOneStick, restockCigarettePack, logCigaretteManually, shareCigarette, deleteCigaretteLog } from '@/app/actions'
import { AnimatedSelect } from '@/app/components/ui/AnimatedSelect'
import { groupByDate } from '@/lib/dateUtils'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { triggerHaptic } from '@/lib/haptic'

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
  gapMinutes?: number | null
  gapText?: string
  log_type?: 'self' | 'shared'
}

interface CigaretteManagerProps {
  initialActivePacks: CigarettePack[]
  initialTodayLogs: CigaretteLog[]
}

function generateTempId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString()
}

export function CigaretteManager({ initialActivePacks, initialTodayLogs }: CigaretteManagerProps) {
  const [activePacks, setActivePacks] = useState<CigarettePack[]>(initialActivePacks || [])
  const [todayLogs, setTodayLogs] = useState<CigaretteLog[]>(initialTodayLogs)
  const [showRestock, setShowRestock] = useState(false)
  const [loadingSmoke, setLoadingSmoke] = useState<string | null>(null)
  const [loadingShare, setLoadingShare] = useState<string | null>(null)
  const [loadingRestock, setLoadingRestock] = useState(false)

  // Manual Log States
  const [showManualLog, setShowManualLog] = useState(false)
  const [selectedPackId, setSelectedPackId] = useState<string>('')
  const [customTimestamp, setCustomTimestamp] = useState<string>('')
  const [loadingManual, setLoadingManual] = useState(false)

  // Expanded dates state for history accordion
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null)

  const toggleDate = (dateStr: string) => {
    triggerHaptic(10)
    setExpandedDates((prev) => {
      const next = new Set(prev)
      if (next.has(dateStr)) {
        next.delete(dateStr)
      } else {
        next.add(dateStr)
      }
      return next
    })
  }

  // Handle undo/delete of a cigarette log and restore stock
  const handleDeleteLog = async (logId: string, packId: string) => {
    triggerHaptic(10)
    // Save previous state for rollback
    const prevPacks = [...activePacks]
    const prevLogs = [...todayLogs]

    // Optimistically update logs and active pack remaining sticks
    const updatedLogs = todayLogs.filter(log => log.id !== logId)
    const updatedPacks = activePacks.map(p => {
      if (p.id === packId) {
        return {
          ...p,
          remaining_sticks: p.remaining_sticks + 1,
          is_active: true
        }
      }
      return p
    })

    setTodayLogs(updatedLogs)
    setActivePacks(updatedPacks)
    setOpenSwipeId(null)

    try {
      await deleteCigaretteLog(logId, packId)
      // Perform a page reload to ensure server state is fully in sync
      window.location.reload()
    } catch {
      alert('Failed to delete log. Reverting...')
      setTodayLogs(prevLogs)
      setActivePacks(prevPacks)
    }
  }

  // Helper to format local date for datetime-local input
  const getLocalDatetimeString = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16)
  }

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
      id: generateTempId(),
      pack_id: packId,
      smoked_at: new Date().toISOString(),
      log_type: 'self',
      cigarette_packs: { brand: packToUpdate.brand }
    }

    setActivePacks(updatedPacks)
    setTodayLogs([newLog, ...todayLogs])

    try {
      await smokeOneStick(packId)
    } catch {
      alert('Failed to log smoke. Reverting...')
      // Rollback
      setActivePacks(prevPacks)
      setTodayLogs(prevLogs)
    } finally {
      setLoadingSmoke(null)
    }
  }

  // Handle sharing 1 stick with a friend
  const handleShare = async (packId: string) => {
    const packToUpdate = activePacks.find(p => p.id === packId)
    if (!packToUpdate) return
    setLoadingShare(packId)

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
      id: generateTempId(),
      pack_id: packId,
      smoked_at: new Date().toISOString(),
      log_type: 'shared',
      cigarette_packs: { brand: packToUpdate.brand }
    }

    setActivePacks(updatedPacks)
    setTodayLogs([newLog, ...todayLogs])

    try {
      await shareCigarette(packId)
    } catch {
      alert('Failed to share cigarette. Reverting...')
      // Rollback
      setActivePacks(prevPacks)
      setTodayLogs(prevLogs)
    } finally {
      setLoadingShare(null)
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
    } catch {
      alert('Failed to restock pack')
    } finally {
      setLoadingRestock(false)
    }
  }

  // Handle manual log form submit
  const handleManualLogSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedPackId || !customTimestamp) return
    setLoadingManual(true)

    try {
      const localDate = new Date(customTimestamp)
      if (isNaN(localDate.getTime())) {
        throw new Error('Invalid date')
      }
      await logCigaretteManually(selectedPackId, localDate.toISOString())
      setShowManualLog(false)
      // Refresh state from page reload
      window.location.reload()
    } catch {
      alert('Failed to log cigarette manually')
    } finally {
      setLoadingManual(false)
    }
  }

  // Helper to format gap in minutes to readable string
  const formatGap = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMins = minutes % 60
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`
  }

  // 1. Sort chronologically (oldest first) to calculate timeGap
  const chronologicalLogs = [...todayLogs].sort(
    (a, b) => new Date(a.smoked_at).getTime() - new Date(b.smoked_at).getTime()
  )

  // 2. Add gap properties
  const logsWithGaps: CigaretteLog[] = chronologicalLogs.map((log, index) => {
    // Shared logs do not get a time gap calculation.
    if (log.log_type === 'shared') {
      return { ...log, gapMinutes: null, gapText: undefined }
    }

    // Find previous self log
    let prevSelfLog: CigaretteLog | null = null
    for (let i = index - 1; i >= 0; i--) {
      if (chronologicalLogs[i].log_type !== 'shared') {
        prevSelfLog = chronologicalLogs[i]
        break
      }
    }

    if (!prevSelfLog) {
      return { ...log, gapMinutes: null, gapText: 'First stick' }
    }

    const currentLocalTime = new Date(log.smoked_at)
    const prevLocalTime = new Date(prevSelfLog.smoked_at)
    
    // Check if it's a different day in local time
    const currentLocalDateStr = format(currentLocalTime, 'yyyy-MM-dd')
    const prevLocalDateStr = format(prevLocalTime, 'yyyy-MM-dd')
    
    if (currentLocalDateStr !== prevLocalDateStr) {
      return { ...log, gapMinutes: null, gapText: 'First stick' }
    }
    
    const diffMs = currentLocalTime.getTime() - prevLocalTime.getTime()
    const diffMins = Math.max(0, Math.floor(diffMs / 60000))
    
    return {
      ...log,
      gapMinutes: diffMins,
      gapText: formatGap(diffMins)
    }
  })

  // 3. Sort back to descending (newest first)
  const descendingLogs = [...logsWithGaps].sort(
    (a, b) => new Date(b.smoked_at).getTime() - new Date(a.smoked_at).getTime()
  )

  // 4. Group by Date
  const groupedLogs = groupByDate(descendingLogs, (log) => log.smoked_at)

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
          onClick={() => {
            setShowRestock(!showRestock)
            setShowManualLog(false)
          }}
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

      {/* Manual Log Form (Collapsible) with Framer Motion */}
      <AnimatePresence>
        {showManualLog && (
          <motion.form
            onSubmit={handleManualLogSubmit}
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200 dark:border-neutral-900 flex flex-col gap-3 z-10 overflow-hidden"
          >
            <h4 className="text-[10px] text-neutral-550 dark:text-neutral-400 uppercase font-bold tracking-wider">Catat Rokok Manual</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-neutral-500 dark:text-neutral-400 uppercase font-medium">Select Pack</label>
                <AnimatedSelect
                  value={selectedPackId}
                  onChange={setSelectedPackId}
                  options={activePacks.map(p => ({
                    value: p.id,
                    label: `${p.brand} (${p.remaining_sticks} sticks left)`
                  }))}
                  placeholder="Select pack..."
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-neutral-500 dark:text-neutral-400 uppercase font-medium">Custom Timestamp</label>
                <input
                  type="datetime-local"
                  value={customTimestamp}
                  onChange={(e) => setCustomTimestamp(e.target.value)}
                  required
                  className="bg-neutral-900 border border-neutral-700 text-white rounded-xl p-2 text-xs outline-none w-full"
                />
              </div>
            </div>
            <motion.button
              type="submit"
              whileTap={{ scale: 0.95 }}
              disabled={loadingManual || !selectedPackId}
              className="w-full py-1.5 rounded bg-amber-550 hover:bg-amber-600 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loadingManual ? 'Logging...' : 'Catat Rokok'}
            </motion.button>
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

                  <div className="mt-1 flex flex-col gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSmoke(pack.id)}
                      disabled={loadingSmoke !== null || loadingShare !== null}
                      className="w-full py-2 px-3 rounded-lg border border-transparent bg-amber-550 hover:bg-amber-600 text-white shadow-sm hover:shadow text-xs font-semibold tracking-tight transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Flame className={`w-3.5 h-3.5 ${loadingSmoke === pack.id ? 'animate-pulse' : ''}`} />
                      <span>Bakar 1 Batang</span>
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleShare(pack.id)}
                      disabled={loadingSmoke !== null || loadingShare !== null}
                      className="w-full py-2 px-3 rounded-lg border border-neutral-250 dark:border-neutral-850 bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-900/50 text-neutral-750 dark:text-neutral-300 text-xs font-semibold tracking-tight transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Users className={`w-3.5 h-3.5 ${loadingShare === pack.id ? 'animate-pulse' : ''}`} />
                      <span>Bagi Teman</span>
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedPackId(pack.id)
                        if (!showManualLog) {
                          setCustomTimestamp(getLocalDatetimeString(new Date()))
                        }
                        setShowManualLog(!showManualLog)
                        setShowRestock(false)
                      }}
                      className="w-full py-2 px-3 rounded-lg border border-neutral-250 dark:border-neutral-800 bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-900/50 text-neutral-755 dark:text-neutral-355 text-xs font-semibold tracking-tight transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 stroke-[1.5px]" />
                      <span>Catat Manual</span>
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
              Click &quot;Restock&quot; above to log a new pack.
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
          <div className="flex flex-col rounded-2xl border border-neutral-250 dark:border-neutral-850 overflow-hidden bg-neutral-50/20 dark:bg-neutral-950/10 divide-y divide-neutral-250 dark:divide-neutral-850">
            {Object.entries(groupedLogs).map(([dateStr, group]) => {
              const isExpanded = expandedDates.has(dateStr)
              const totalSticks = group.length
              const formattedDate = format(new Date(dateStr), 'eeee, d MMMM yyyy')

              return (
                <div key={dateStr} className="flex flex-col">
                  {/* Interactive Date Header */}
                  <button
                    onClick={() => toggleDate(dateStr)}
                    className="w-full flex items-center justify-between py-3 px-4 bg-neutral-900/60 hover:bg-neutral-800/60 active:bg-neutral-800/80 transition-colors text-left cursor-pointer border-b border-neutral-250 dark:border-neutral-900/40"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ChevronDown
                        className={`w-4 h-4 text-neutral-450 transition-transform duration-300 shrink-0 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                      <span className="text-xs sm:text-sm font-medium text-neutral-355 capitalize truncate">
                        {formattedDate}
                      </span>
                    </div>

                    <span className="text-xs font-mono font-semibold shrink-0 text-amber-500">
                      Total: {totalSticks} Batang
                    </span>
                  </button>

                  {/* Collapsible Rows Container with Framer Motion */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'spring', duration: 0.4, bounce: 0.08 }}
                        className="overflow-hidden"
                      >
                        <motion.div
                          variants={{
                            hidden: { opacity: 0 },
                            visible: {
                              opacity: 1,
                              transition: {
                                staggerChildren: 0.05
                              }
                            }
                          }}
                          initial="hidden"
                          animate="visible"
                          className="divide-y divide-neutral-200/50 dark:divide-neutral-900/40 bg-neutral-50/10 dark:bg-neutral-950/10"
                        >
                          {group.map((log) => {
                            const isShared = log.log_type === 'shared'

                            // Dot color logic: Red < 1h (<60 mins), Orange < 3h (<180 mins), Green >= 3h (>= 180 mins)
                            let dotColor = 'bg-neutral-500/50' // default / First stick
                            if (log.gapMinutes !== undefined && log.gapMinutes !== null) {
                              if (log.gapMinutes < 60) {
                                dotColor = 'bg-red-500/80'
                              } else if (log.gapMinutes < 180) {
                                dotColor = 'bg-orange-500/80'
                              } else {
                                dotColor = 'bg-emerald-500/80'
                              }
                            }

                            return (
                              <motion.div
                                key={log.id}
                                layout
                                variants={{
                                  hidden: { opacity: 0, y: 10 },
                                  visible: { opacity: 1, y: 0 }
                                }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                                className="relative overflow-hidden w-full bg-neutral-50 dark:bg-neutral-950/20 border-b border-neutral-200/50 dark:border-neutral-900/40 last:border-b-0"
                              >
                                {/* Red background container under the draggable item */}
                                <div className="absolute inset-0 bg-red-600 dark:bg-red-850 flex items-center justify-end">
                                  <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleDeleteLog(log.id, log.pack_id)}
                                    className="h-full w-[70px] flex items-center justify-center text-white cursor-pointer active:bg-red-700 dark:active:bg-red-900 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </motion.button>
                                </div>

                                {/* Draggable list item */}
                                <motion.div
                                  drag="x"
                                  dragConstraints={{ left: -70, right: 0 }}
                                  dragElastic={{ left: 0.1, right: 0.02 }}
                                  dragDirectionLock
                                  onDragEnd={(event, info) => {
                                    if (info.offset.x < -30 || info.velocity.x < -300) {
                                      setOpenSwipeId(log.id)
                                    } else {
                                      setOpenSwipeId(null)
                                    }
                                  }}
                                  animate={{ x: openSwipeId === log.id ? -70 : 0 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                  className="relative z-10 py-2.5 px-4 flex items-center justify-between bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-colors gap-4 cursor-grab active:cursor-grabbing"
                                >
                                  {isShared ? (
                                    /* Shared Row: distinct and muted */
                                    <div className="flex items-center gap-3 min-w-0 opacity-60">
                                      <span className="text-xs font-mono font-medium text-neutral-400 dark:text-neutral-500 shrink-0">
                                        {new Date(log.smoked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                      {log.cigarette_packs?.brand && (
                                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 truncate">
                                          {log.cigarette_packs.brand}
                                        </span>
                                      )}
                                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium flex items-center gap-1 shrink-0">
                                        ↳ Dibagi ke teman
                                      </span>
                                    </div>
                                  ) : (
                                    /* Self-Smoked Row */
                                    <>
                                      <div className="flex items-center gap-3 min-w-0">
                                        <span className="text-xs font-mono font-medium text-neutral-400 dark:text-neutral-500 shrink-0">
                                          {new Date(log.smoked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {log.cigarette_packs?.brand && (
                                          <span className="text-xs font-semibold text-neutral-850 dark:text-neutral-200 truncate">
                                            {log.cigarette_packs.brand}
                                          </span>
                                        )}
                                      </div>

                                      {/* Right side (Gap Indicator): Minimalist text approach */}
                                      <div className="shrink-0 flex items-center gap-2 text-xs text-neutral-550 dark:text-neutral-450 font-mono">
                                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                                        {log.gapText === 'First stick' ? 'First stick' : `+${log.gapText}`}
                                      </div>
                                    </>
                                  )}
                                </motion.div>
                              </motion.div>
                            )
                          })}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
