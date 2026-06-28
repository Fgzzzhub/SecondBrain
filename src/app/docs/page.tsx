import { CheckSquare, DollarSign, Package, Compass, Cpu, Flame, Bell } from 'lucide-react'

export default function DocsPage() {
  return (
    <div className="flex flex-col gap-10 max-w-2xl pb-16">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-900 pb-8">
        <h1 className="text-3xl font-medium tracking-tight text-neutral-900 dark:text-white mb-2">System Manual</h1>
        <p className="text-neutral-500 text-xs sm:text-sm">Architectural principles, automation rules, and feature operations.</p>
      </header>

      {/* Section 1: Philosophy */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-300">
          <Compass className="w-4 h-4 stroke-[1.5px]" />
          <h2 className="text-sm font-semibold tracking-wide uppercase">Philosophy</h2>
        </div>
        <div className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm leading-relaxed flex flex-col gap-3 font-normal">
          <p>
            Brain OS is structured around a natural flow philosophy. Instead of forcing rigid, artificial life schedules that trigger cognitive friction, this system acts as a flexible external container. It bends to the current of daily study, creative work, and lifestyle choices while ensuring everything is logged effortlessly.
          </p>
          <p>
            The interface is optimized to minimize input friction. Whether you are adding a task, logging a quick research note, tracking finances, or registering habits, operations require minimal keystrokes to prevent cognitive overload.
          </p>
        </div>
      </section>

      {/* Section 2: College & Tasks */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-300">
          <CheckSquare className="w-4 h-4 stroke-[1.5px]" />
          <h2 className="text-sm font-semibold tracking-wide uppercase">College & Task Matrix</h2>
        </div>
        <div className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm leading-relaxed flex flex-col gap-3">
          <p>
            The task manager adopts a Kanban design with horizontal scroll-snap columns tailored for mobile touchpoints. Instead of complex drag-and-drop actions, items are status-routed using a simple client selector.
          </p>
          <p>
            When creating tasks, you can add a <strong className="text-neutral-900 dark:text-neutral-200">detailed description</strong> directly via the creation form for extra context.
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5 text-neutral-500 dark:text-neutral-400 text-xs">
            <li>
              <strong className="text-neutral-800 dark:text-neutral-300">Schedule:</strong> Timetable items group chronologically by weekday, letting you track lecture timings and lab rooms cleanly.
            </li>
            <li>
              <strong className="text-neutral-800 dark:text-neutral-300">Notes:</strong> Markdown-ready text panels act as an inbox for quick thoughts, links, and study outlines.
            </li>
          </ul>
        </div>
      </section>

      {/* Section 3: Finance & Autopilot Ledger */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-300">
          <DollarSign className="w-4 h-4 stroke-[1.5px]" />
          <h2 className="text-sm font-semibold tracking-wide uppercase">Finance & Autopilot</h2>
        </div>
        <div className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm leading-relaxed flex flex-col gap-3">
          <p>
            Expenditure tracking operates in <strong className="text-neutral-900 dark:text-neutral-200">Indonesian Rupiah (IDR)</strong>, enforcing localized parsing formats like `Rp 10.000` instead of fractional decimals.
          </p>
          <p>
            Balances are grouped across multiple premium wallet cards (Cash, Gopay, Dana, Livin, Ovo, and Custom wallets) with solid, distinct color accents. Balance cards can be obfuscated for privacy in public spaces via settings.
          </p>
          <p>
            <strong className="text-neutral-900 dark:text-neutral-200">Auto-Pilot Rules:</strong> Automated recurring allowances, subscriptions, and salaries can be registered with:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5 text-neutral-500 dark:text-neutral-400 text-xs">
            <li><strong className="text-neutral-800 dark:text-neutral-300">Flexible Frequencies:</strong> Choose daily, monthly, or a custom interval in days (e.g., every 3 days).</li>
            <li><strong className="text-neutral-800 dark:text-neutral-300">Start Date Selection:</strong> Define exactly when the autopilot rule should trigger its first run.</li>
            <li><strong className="text-neutral-800 dark:text-neutral-300">Hour Alignment:</strong> Set the exact hour of the day (WIB) the transaction is logged to keep your financial ledger chronologically accurate.</li>
          </ul>
        </div>
      </section>

      {/* Section 4: Cigarette & Health Tracker */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-300">
          <Flame className="w-4 h-4 stroke-[1.5px]" />
          <h2 className="text-sm font-semibold tracking-wide uppercase">Cigarette & Health Tracker</h2>
        </div>
        <div className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm leading-relaxed flex flex-col gap-3">
          <p>
            Built directly into the core matrix, the cigarette tracker lets you monitor consumption and manage pack inventories. Logs can be entered instantly with customizable options for integrated wallet spending (linking habit costs to your actual ledger).
          </p>
          <p>
            Daily usage statistics are updated in real time on the dashboard to maintain continuous health awareness.
          </p>
        </div>
      </section>

      {/* Section 5: PWA Notifications & Background Sync */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-300">
          <Bell className="w-4 h-4 stroke-[1.5px]" />
          <h2 className="text-sm font-semibold tracking-wide uppercase">PWA Sync & Notifications</h2>
        </div>
        <div className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm leading-relaxed flex flex-col gap-3">
          <p>
            Brain OS runs client-side background sync routines on page load and relies on automated daily server cron jobs at <strong className="text-neutral-900 dark:text-neutral-200">07:00 WIB (00:00 UTC)</strong>.
          </p>
          <p>
            When enabled, the Web Push notification system delivers a personalized <strong className="text-neutral-900 dark:text-neutral-200">Daily Briefing</strong> containing today&apos;s schedule, pending tasks, and key financial summaries straight to your device.
          </p>
        </div>
      </section>

      {/* Section 6: Laboratory Inventory & RLS */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-300">
          <Package className="w-4 h-4 stroke-[1.5px]" />
          <h2 className="text-sm font-semibold tracking-wide uppercase">Laboratory Inventory</h2>
        </div>
        <div className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm leading-relaxed flex flex-col gap-3">
          <p>
            The inventory system tracks laboratory components, dev kits, and microcontrollers.
          </p>
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-900 bg-neutral-50 dark:bg-neutral-900/10 flex flex-col gap-2">
            <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-300">Database Trigger Rule:</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono leading-relaxed">
              WHEN status IN inventories UPDATED TO &apos;Broken&apos;<br/>
              THEN INSERT task INTO tasks VALUES (&apos;URGENT: Repair or Replace [item_name]&apos;, &apos;todo&apos;, course_id);
            </p>
          </div>
          <p>
            Whenever equipment is flagged as broken, the backend automatically registers a task in your queue to prevent project delay.
          </p>
        </div>
      </section>
    </div>
  )
}
