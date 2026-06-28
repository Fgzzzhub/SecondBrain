import { createAdminClient } from '@/lib/supabase/admin'

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const date = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${date}`
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

async function insertTransactionsWithFallback(admin: any, payload: any[]) {
  let insertPayload = [...payload]
  
  while (true) {
    const { error } = await admin
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
        console.warn(`[runAutomations] Retrying insert after removing column: ${error.message}`)
        continue
      }
    }

    return { error }
  }
}

export async function runAutomations() {
  const admin = createAdminClient()

  // Fetch all active rules across all users
  const { data: rules, error: fetchErr } = await admin
    .from('auto_transactions')
    .select('*')

  if (fetchErr) throw fetchErr
  if (!rules || rules.length === 0) {
    console.log('[runAutomations] No automation rules to run.')
    return
  }

  const todayStr = getLocalDateString()
  const today = parseLocalDate(todayStr)

  const transactionsToInsert: any[] = []
  const rulesToUpdate: { id: string; last_processed_at: string }[] = []

  for (const rule of rules) {
    // If last_processed_at is null, default to today so it runs from today onwards
    const lastProcessedStr = rule.last_processed_at || todayStr
    const lastProcessed = parseLocalDate(lastProcessedStr)

    if (rule.frequency === 'daily') {
      const interval = rule.billing_day || 1
      const diffTime = today.getTime() - lastProcessed.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays >= interval) {
        const occurrences = Math.floor(diffDays / interval)
        
        for (let i = 1; i <= occurrences; i++) {
          const missedDate = new Date(lastProcessed)
          missedDate.setDate(missedDate.getDate() + i * interval)
          missedDate.setHours(12, 0, 0, 0) // Midday to avoid boundary shifts

          transactionsToInsert.push({
            user_id: rule.user_id,
            amount: rule.amount,
            type: rule.type,
            description: `${rule.title} (Auto-Pilot)`,
            wallet_name: rule.wallet_name || 'Cashless',
            wallet_type: rule.wallet_name === 'Cash' ? 'Cash' : 'Cashless',
            category: rule.category || 'Lainnya',
            created_at: missedDate.toISOString()
          })
        }

        const finalProcessedDate = new Date(lastProcessed)
        finalProcessedDate.setDate(lastProcessed.getDate() + occurrences * interval)
        const finalProcessedStr = getLocalDateString(finalProcessedDate)

        rulesToUpdate.push({ id: rule.id, last_processed_at: finalProcessedStr })
      }
    } else if (rule.frequency === 'monthly') {
      const todayDay = today.getDate()
      const isOlderMonth = 
        lastProcessed.getFullYear() < today.getFullYear() || 
        (lastProcessed.getFullYear() === today.getFullYear() && lastProcessed.getMonth() < today.getMonth())

      if (todayDay >= (rule.billing_day || 1) && isOlderMonth) {
        const billingDate = new Date(today.getFullYear(), today.getMonth(), rule.billing_day || 1, 12, 0, 0, 0)
        
        transactionsToInsert.push({
          user_id: rule.user_id,
          amount: rule.amount,
          type: rule.type,
          description: `${rule.title} (Auto-Pilot)`,
          wallet_name: rule.wallet_name || 'Cashless',
          wallet_type: rule.wallet_name === 'Cash' ? 'Cash' : 'Cashless',
          category: rule.category || 'Lainnya',
          created_at: billingDate.toISOString()
        })
        rulesToUpdate.push({ id: rule.id, last_processed_at: todayStr })
      }
    }
  }

  if (transactionsToInsert.length > 0) {
    console.log(`[runAutomations] Processing ${transactionsToInsert.length} automated transactions...`)
    
    const { error: insertErr } = await insertTransactionsWithFallback(admin, transactionsToInsert)
    if (insertErr) {
      console.error('[runAutomations] Failed to insert transactions:', insertErr)
      throw insertErr
    }

    // Update rules in DB
    const updatePromises = rulesToUpdate.map(({ id, last_processed_at }) =>
      admin
        .from('auto_transactions')
        .update({ last_processed_at })
        .eq('id', id)
    )
    
    await Promise.all(updatePromises)
    console.log('[runAutomations] All automated rules processed and synchronized.')
  } else {
    console.log('[runAutomations] No automated transactions scheduled for today.')
  }
}
