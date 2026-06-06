import { getActiveCigarettePacks, getCigaretteLogs } from '@/app/actions'
import { CigaretteManager } from '../components/CigaretteManager'

export default async function CigarettesPage() {
  // Parallel server-side fetching of cigarette state
  const [activePacks, todayLogs] = await Promise.all([
    getActiveCigarettePacks(),
    getCigaretteLogs()
  ])

  return (
    <div className="flex flex-col gap-8 h-full">
      <header>
        <h1 className="text-2xl font-medium tracking-tight text-white mb-1.5">Cigarette & Pack Tracker</h1>
        <p className="text-neutral-500 text-xs sm:text-sm">Monitor active pack inventory, smoke counts, and daily log timelines.</p>
      </header>

      <div className="max-w-4xl">
        <CigaretteManager initialActivePacks={activePacks} initialTodayLogs={todayLogs} />
      </div>
    </div>
  )
}
