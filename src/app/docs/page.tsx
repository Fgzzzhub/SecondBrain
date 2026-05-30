import { CheckSquare, DollarSign, Package, Compass, Cpu } from 'lucide-react'

export default function DocsPage() {
  return (
    <div className="flex flex-col gap-10 max-w-2xl pb-16">
      {/* Header */}
      <header className="border-b border-neutral-900 pb-8">
        <h1 className="text-3xl font-medium tracking-tight text-white mb-2">System Manual</h1>
        <p className="text-neutral-500 text-xs sm:text-sm">Architectural principles, automation rules, and feature operations.</p>
      </header>

      {/* Section 1: Philosophy */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-neutral-300">
          <Compass className="w-4 h-4 stroke-[1.5px]" />
          <h2 className="text-sm font-semibold tracking-wide uppercase text-neutral-300">Philosophy</h2>
        </div>
        <div className="text-neutral-400 text-xs sm:text-sm leading-relaxed flex flex-col gap-3 font-normal">
          <p>
            Brain OS is structured around a natural flow philosophy. Instead of forcing rigid, artificial life schedules that trigger cognitive friction, this system acts as a flexible external container. It bends to the current of daily study and creative work while ensuring that tasks, materials, and finances are logged effortlessly.
          </p>
          <p>
            The interface is optimized to minimize input friction. Whether you are adding a class, logging a quick research note, or tracking a project component, operations require minimal keystrokes to prevent cognitive overload.
          </p>
        </div>
      </section>

      {/* Section 2: College & Tasks */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-neutral-300">
          <CheckSquare className="w-4 h-4 stroke-[1.5px]" />
          <h2 className="text-sm font-semibold tracking-wide uppercase text-neutral-300">College & Task Matrix</h2>
        </div>
        <div className="text-neutral-400 text-xs sm:text-sm leading-relaxed flex flex-col gap-3">
          <p>
            The task manager adopts a Kanban design with horizontal scroll-snap columns tailored for mobile touchpoints. Instead of complex drag-and-drop actions, items are status-routed using a simple client selector.
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5 text-neutral-400 text-xs">
            <li>
              <strong className="text-neutral-300">Schedule:</strong> Timetable items group chronologically by weekday, letting you track lecture timings and lab rooms cleanly.
            </li>
            <li>
              <strong className="text-neutral-300">Notes:</strong> Markdown-ready text panels act as an inbox for quick thoughts, links, and study outlines.
            </li>
          </ul>
        </div>
      </section>

      {/* Section 3: Finance Ledger */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-neutral-300">
          <DollarSign className="w-4 h-4 stroke-[1.5px]" />
          <h2 className="text-sm font-semibold tracking-wide uppercase text-neutral-300">Finance Ledger</h2>
        </div>
        <div className="text-neutral-400 text-xs sm:text-sm leading-relaxed flex flex-col gap-3">
          <p>
            Expenditure tracking operates in **Indonesian Rupiah (IDR)**, enforcing localized parsing formats like `Rp 10.000` instead of fractional decimals.
          </p>
          <p className="text-xs">
            If you need to view your records in public spaces, the balance card details can be obfuscated by toggle-activating the <strong className="text-neutral-300">Hide Financial Balance</strong> options within your account settings.
          </p>
        </div>
      </section>

      {/* Section 4: Inventory & Automations */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-neutral-300">
          <Cpu className="w-4 h-4 stroke-[1.5px]" />
          <h2 className="text-sm font-semibold tracking-wide uppercase text-neutral-300">Hardware & Automations</h2>
        </div>
        <div className="text-neutral-400 text-xs sm:text-sm leading-relaxed flex flex-col gap-3">
          <p>
            The inventory system tracks laboratory components, dev kits, and microcontrollers.
          </p>
          <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-900/10 flex flex-col gap-2">
            <h4 className="text-xs font-semibold text-neutral-300">Database Trigger Rule:</h4>
            <p className="text-xs text-neutral-500 font-mono leading-relaxed">
              WHEN status IN inventories UPDATED TO &apos;Broken&apos;<br/>
              THEN INSERT task INTO tasks VALUES (&apos;URGENT: Repair or Replace [item_name]&apos;, &apos;todo&apos;, course_id);
            </p>
          </div>
          <p>
            Whenever equipment breaks, the backend automatically flags it, preventing missed project deadlines by injecting action items directly into your dashboard queue.
          </p>
        </div>
      </section>
    </div>
  )
}
