'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Custom React Hook to sync client state with Supabase database updates in realtime.
 * Listens to Postgres changes on specified tables and triggers router.refresh() 
 * to refresh server components without reloading the browser.
 * 
 * @param tables Array of table names to listen to (e.g. ['tasks', 'notes'])
 */
export function useRealtimeSync(tables: string[]) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Subscribe to all changes (INSERT, UPDATE, DELETE) on the specified tables
    const channel = supabase.channel('schema-db-changes')

    tables.forEach((table) => {
      channel.on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: table,
        },
        () => {
          // Trigger a refresh of the current route to fetch new server component data
          router.refresh()
        }
      )
    })

    channel.subscribe()

    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [router, supabase, tables])
}
