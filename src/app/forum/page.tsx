import { createClient } from '@/lib/supabase/server'
import { PostThreadForm } from './PostThreadForm'
import { ThreadCard } from './ThreadCard'
import { MessageSquare } from 'lucide-react'

export const revalidate = 0

export default async function ForumPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <div className="p-6 text-center text-xs text-neutral-500">
        You must be logged in to access The Forum.
      </div>
    )
  }

  // Fetch threads with likes and comments
  const { data: threads } = await supabase
    .from('threads')
    .select('*, likes(user_id), comments(*)')
    .order('created_at', { ascending: false })

  // Fetch all user preferences to map user_ids to user_names
  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('id, user_name')

  const userPreferencesMap: Record<string, string> = {}
  if (preferences) {
    preferences.forEach((pref) => {
      userPreferencesMap[pref.id] = pref.user_name
    })
  }

  const typedThreads = (threads || []) as any[]

  return (
    <div className="flex flex-col gap-8 h-full pb-12">
      <header>
        <div className="flex items-center gap-2 mb-1.5">
          <MessageSquare className="w-5 h-5 text-neutral-900 dark:text-white stroke-[1.5px]" />
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900 dark:text-white">The Forum</h1>
        </div>
        <p className="text-neutral-500 text-xs sm:text-sm">A private social feed to share ideas, post links, and chat with friends.</p>
      </header>

      {/* Posting form */}
      <div className="max-w-xl">
        <PostThreadForm />
      </div>

      {/* Feed list */}
      <div className="flex flex-col gap-4 max-w-xl">
        <h2 className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Recent Activity</h2>
        {typedThreads.length > 0 ? (
          <div className="flex flex-col gap-4">
            {typedThreads.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                currentUserId={user.id}
                userPreferencesMap={userPreferencesMap}
                currentUserMetadata={user.user_metadata}
              />
            ))}
          </div>
        ) : (
          <div className="p-10 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-900/10">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">The Forum is quiet. Share your first thought above!</p>
          </div>
        )}
      </div>
    </div>
  )
}
