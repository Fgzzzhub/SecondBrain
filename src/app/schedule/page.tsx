import { createClient } from '@/lib/supabase/server'
import { AddScheduleForm } from './AddScheduleForm'
import { ScheduleItem } from './ScheduleItem'

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default async function SchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: schedule } = await supabase
    .from('schedule')
    .select('*')
    .eq('user_id', user.id)

  // Group items by day
  const groupedSchedule = (schedule || []).reduce((acc: any, item: any) => {
    if (!acc[item.day]) acc[item.day] = []
    acc[item.day].push(item)
    return acc
  }, {})

  // Sort items within days by start_time
  Object.keys(groupedSchedule).forEach(day => {
    groupedSchedule[day].sort((a: any, b: any) => a.start_time.localeCompare(b.start_time))
  })

  return (
    <div className="flex flex-col gap-8 h-full">
      <header>
        <h1 className="text-2xl font-medium tracking-tight text-white mb-1.5">Schedule</h1>
        <p className="text-neutral-500 text-xs sm:text-sm">Your weekly academic timetable.</p>
      </header>

      {/* Schedule Item Form */}
      <div className="max-w-md">
        <AddScheduleForm />
      </div>

      {/* Schedule List */}
      <div className="flex flex-col gap-6">
        {DAYS_ORDER.map(day => {
          const dayItems = groupedSchedule[day] || []
          return (
            <div key={day} className="flex flex-col gap-3">
              <div className="border-b border-neutral-900 pb-2">
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{day}</h3>
              </div>

              <div className="flex flex-col gap-3">
                {dayItems.length > 0 ? (
                  dayItems.map((item: any) => (
                    <ScheduleItem key={item.id} item={item} />
                  ))
                ) : (
                  <p className="text-xs text-neutral-600 italic py-2 pl-1">No classes scheduled.</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
