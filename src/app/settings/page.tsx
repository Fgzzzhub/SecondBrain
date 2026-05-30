import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from './SettingsForm'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <div className="p-6 text-center text-xs text-neutral-500">
        You must be logged in to access settings.
      </div>
    )
  }

  // Fetch preferences for the logged in user
  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex flex-col gap-8 h-full">
      <header>
        <h1 className="text-2xl font-medium tracking-tight text-neutral-900 dark:text-white mb-1.5">Settings</h1>
        <p className="text-neutral-500 text-xs sm:text-sm">Customize Pomodoro timers, visibility filters, and profile details.</p>
      </header>

      <SettingsForm initialPrefs={preferences} />
    </div>
  )
}
