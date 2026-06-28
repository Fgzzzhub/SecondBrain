'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// Helper to format Date object into local YYYY-MM-DD string
function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const date = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${date}`
}

// Helper to parse YYYY-MM-DD string into local Date object (no timezone shift)
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// Self-healing database insert helper for transactions schema differences
async function insertTransactionsWithFallback(supabase: any, payload: any[]) {
  let insertPayload = [...payload]
  
  while (true) {
    const { error } = await supabase
      .from('transactions')
      .insert(insertPayload)

    if (!error) {
      return { error: null }
    }

    // Check for PostgREST undefined column error (code 42703)
    if (error.code === '42703') {
      let columnRemoved = false
      insertPayload = insertPayload.map(item => {
        const newItem = { ...item }
        if (newItem.wallet_type && error.message.includes('wallet_type')) {
          delete newItem.wallet_type
          columnRemoved = true
        }
        if (newItem.wallet_name && error.message.includes('wallet_name')) {
          delete newItem.wallet_name
          columnRemoved = true
        }
        if (newItem.category && error.message.includes('category')) {
          delete newItem.category
          columnRemoved = true
        }
        return newItem
      })

      if (columnRemoved) {
        console.warn(`Retrying transaction insert after removing column: ${error.message}`)
        continue
      }
    }

    return { error }
  }
}

export function useAutoFinanceSync() {
  const hasRun = useRef(false)
  const supabase = createClient()

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const runSync = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Fetch all auto transactions rules
        const { data: rules, error: fetchErr } = await supabase
          .from('auto_transactions')
          .select('*')

        if (fetchErr || !rules || rules.length === 0) return

        const todayStr = getLocalDateString()
        const today = parseLocalDate(todayStr)

        const transactionsToInsert: any[] = []
        const rulesToUpdate: { id: string; last_processed_at: string }[] = []
        // 2. Evaluate each rule
        for (const rule of rules) {
          // Determine start date
          const startDateStr = rule.start_date || todayStr
          const startDate = parseLocalDate(startDateStr)

          // Skip if today is before the start date
          if (today < startDate) {
            continue
          }

          const triggerHour = rule.trigger_hour !== undefined && rule.trigger_hour !== null ? Number(rule.trigger_hour) : 12

          if (rule.frequency === 'daily') {
            const interval = rule.billing_day || 1 // default to 1-day interval

            // If last_processed_at is null, baseline is startDate - interval
            let lastProcessed: Date
            if (!rule.last_processed_at) {
              const temp = new Date(startDate)
              temp.setDate(temp.getDate() - interval)
              lastProcessed = temp
            } else {
              lastProcessed = parseLocalDate(rule.last_processed_at)
            }

            const diffTime = today.getTime() - lastProcessed.getTime()
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

            if (diffDays >= interval) {
              const occurrences = Math.floor(diffDays / interval)
              
              for (let i = 1; i <= occurrences; i++) {
                const missedDate = new Date(lastProcessed)
                missedDate.setDate(missedDate.getDate() + i * interval)
                
                // Align with trigger hour in user's local timezone (assume WIB / UTC+7)
                const yr = missedDate.getFullYear()
                const mo = missedDate.getMonth() + 1
                const dy = missedDate.getDate()
                const exactTime = new Date(Date.UTC(yr, mo - 1, dy, triggerHour - 7, 0, 0, 0))

                transactionsToInsert.push({
                  user_id: user.id,
                  amount: rule.amount,
                  type: rule.type,
                  description: `${rule.title} (Auto-Pilot)`,
                  wallet_name: rule.wallet_name,
                  wallet_type: rule.wallet_name === 'Cash' ? 'Cash' : 'Cashless',
                  category: rule.category,
                  created_at: exactTime.toISOString()
                })
              }

              // Update rulesProcessed to the exact calendar date of the last occurrence
              const finalProcessedDate = new Date(lastProcessed)
              finalProcessedDate.setDate(lastProcessed.getDate() + occurrences * interval)
              const finalProcessedStr = getLocalDateString(finalProcessedDate)

              rulesToUpdate.push({ id: rule.id, last_processed_at: finalProcessedStr })
            }
          } else if (rule.frequency === 'monthly') {
            const billingDay = rule.billing_day || 1

            // If last_processed_at is null, baseline is month before startDate's month
            let lastProcessed: Date
            if (!rule.last_processed_at) {
              const temp = new Date(startDate)
              temp.setMonth(temp.getMonth() - 1)
              lastProcessed = temp
            } else {
              lastProcessed = parseLocalDate(rule.last_processed_at)
            }

            const todayDay = today.getDate()
            const isOlderMonth = 
              lastProcessed.getFullYear() < today.getFullYear() || 
              (lastProcessed.getFullYear() === today.getFullYear() && lastProcessed.getMonth() < today.getMonth())

            if (todayDay >= billingDay && isOlderMonth) {
              // Align with trigger hour in user's local timezone (assume WIB / UTC+7)
              const yr = today.getFullYear()
              const mo = today.getMonth() + 1
              const dy = billingDay
              const exactTime = new Date(Date.UTC(yr, mo - 1, dy, triggerHour - 7, 0, 0, 0))

              transactionsToInsert.push({
                user_id: user.id,
                amount: rule.amount,
                type: rule.type,
                description: `${rule.title} (Auto-Pilot)`,
                wallet_name: rule.wallet_name,
                wallet_type: rule.wallet_name === 'Cash' ? 'Cash' : 'Cashless',
                category: rule.category,
                created_at: exactTime.toISOString()
              })
              rulesToUpdate.push({ id: rule.id, last_processed_at: todayStr })
            }
          }
        }
        // 3. Perform database mutations in background
        if (transactionsToInsert.length > 0) {
          console.log(`Auto-Pilot: Logging ${transactionsToInsert.length} automated transactions...`)
          
          const { error: insertErr } = await insertTransactionsWithFallback(supabase, transactionsToInsert)
          if (insertErr) {
            console.error('Auto-Pilot: Failed to insert transactions:', insertErr)
            return
          }

          // Update processed dates individually
          const updatePromises = rulesToUpdate.map(({ id, last_processed_at }) =>
            supabase
              .from('auto_transactions')
              .update({ last_processed_at })
              .eq('id', id)
          )
          
          await Promise.all(updatePromises)
          console.log('Auto-Pilot: Catch-up synchronization complete.')
        }
      } catch (err) {
        console.error('Auto-Pilot sync engine error:', err)
      }
    }

    // Run quietly in background
    runSync()
  }, [supabase])
}
