'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Pomodoro Actions
export async function logPomodoroSession(durationMinutes: number, mode: 'work' | 'break' = 'work') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return // silent fail — pomodoro shouldn't block UI on auth issues

  await supabase
    .from('pomodoro_sessions')
    .insert({
      user_id: user.id,
      duration_minutes: durationMinutes,
      mode,
    })
}

// Tasks Actions
export async function createTask(formData: FormData) {
  const supabase = await createClient()
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const due_date = formData.get('due_date') as string

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('tasks')
    .insert({
      title,
      description: description || null,
      due_date: due_date ? new Date(due_date).toISOString() : null,
      user_id: user.id,
      is_completed: false
    })

  if (error) throw new Error(error.message)
  revalidatePath('/tasks')
  revalidatePath('/')
}

export async function toggleTaskCompletion(taskId: string, is_completed: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  
  const updateData = {
    is_completed,
    completed_at: is_completed ? new Date().toISOString() : null
  }

  const { error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', taskId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/tasks')
  revalidatePath('/')
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/tasks')
  revalidatePath('/')
}

export async function updateTask(taskId: string, title: string, description: string | null, due_date: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('tasks')
    .update({
      title,
      description: description || null,
      due_date: due_date ? new Date(due_date).toISOString() : null,
    })
    .eq('id', taskId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/tasks')
  revalidatePath('/')
}

// Notes Actions
export async function createNote(formData: FormData) {
  const supabase = await createClient()
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const course_id = formData.get('course_id') as string

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('notes')
    .insert({
      title,
      content,
      course_id: course_id || null,
      user_id: user.id
    })

  if (error) throw new Error(error.message)
  revalidatePath('/notes')
  revalidatePath('/')
}

export async function deleteNote(noteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/notes')
  revalidatePath('/')
}

export async function updateNote(noteId: string, title: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('notes')
    .update({ title, content })
    .eq('id', noteId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/notes')
  revalidatePath('/')
}

// Schedule Actions
export async function createScheduleItem(formData: FormData) {
  const supabase = await createClient()
  const subject = formData.get('subject') as string
  const day = formData.get('day') as string
  const start_time = formData.get('start_time') as string
  const end_time = formData.get('end_time') as string
  const room = formData.get('room') as string

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('schedule')
    .insert({
      subject,
      day,
      start_time,
      end_time,
      room: room || null,
      user_id: user.id
    })

  if (error) throw new Error(error.message)
  revalidatePath('/schedule')
  revalidatePath('/')
}

export async function deleteScheduleItem(itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('schedule')
    .delete()
    .eq('id', itemId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/schedule')
  revalidatePath('/')
}

// Helper to insert a transaction with self-healing fallback for schema mismatch
async function insertTransactionWithFallback(
  supabase: any,
  data: {
    amount: number
    type: 'income' | 'expense'
    description: string
    wallet_type: string
    wallet_name: string
    category: string
    user_id: string
  }
) {
  const insertPayload = { ...data }

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

      if (insertPayload.wallet_type && error.message.includes('wallet_type')) {
        delete (insertPayload as any).wallet_type
        columnRemoved = true
      } else if (insertPayload.wallet_name && error.message.includes('wallet_name')) {
        delete (insertPayload as any).wallet_name
        columnRemoved = true
      } else if (insertPayload.category && error.message.includes('category')) {
        delete (insertPayload as any).category
        columnRemoved = true
      }

      if (columnRemoved) {
        console.warn(`Retrying transaction insert after removing column: ${error.message}`)
        continue
      }
    }

    return { error }
  }
}

// Finance Actions
export async function createTransaction(formData: FormData) {
  const supabase = await createClient()
  const amount = parseFloat(formData.get('amount') as string)
  const type = formData.get('type') as 'income' | 'expense'
  const description = formData.get('description') as string
  const wallet_name = (formData.get('wallet_name') as string) || 'Cashless'
  const category = (formData.get('category') as string) || 'Lainnya'
  
  // Backwards compatibility for wallet_type
  const wallet_type = wallet_name === 'Cash' ? 'Cash' : 'Cashless'

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await insertTransactionWithFallback(supabase, {
    amount,
    type,
    description,
    wallet_type,
    wallet_name,
    category,
    user_id: user.id
  })

  if (error) throw new Error(error.message)
  revalidatePath('/finance')
  revalidatePath('/')
}

export async function getWalletBalances() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)

    if (error || !transactions) return []

    const balances: Record<string, number> = {}
    
    transactions.forEach(tx => {
      const name = tx.wallet_name || (tx.wallet_type === 'Cash' ? 'Cash' : 'Cashless')
      const amt = Number(tx.amount)
      if (!balances[name]) {
        balances[name] = 0
      }
      if (tx.type === 'income') {
        balances[name] += amt
      } else {
        balances[name] -= amt
      }
    })

    return Object.entries(balances).map(([name, balance]) => ({
      name,
      balance
    }))
  } catch (err) {
    console.error('Error calculating wallet balances:', err)
    return []
  }
}

// Cigarette Inventory Actions
export async function getActiveCigarettePacks() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  try {
    const { data, error } = await supabase
      .from('cigarette_packs')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gt('remaining_sticks', 0)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching active packs:', error)
      return []
    }
    return data || []
  } catch (err) {
    console.error('Error in getActiveCigarettePacks:', err)
    return []
  }
}

export async function restockCigarettePack(formData: FormData) {
  const supabase = await createClient()
  const brand = formData.get('brand') as string
  const initial_sticks = parseInt(formData.get('initial_sticks') as string) || 16

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  try {
    const { error } = await supabase
      .from('cigarette_packs')
      .insert({
        brand,
        initial_sticks,
        remaining_sticks: initial_sticks,
        is_active: true,
        user_id: user.id
      })

    if (error) throw new Error(error.message)
    revalidatePath('/')
  } catch (err) {
    console.error('Error in restockCigarettePack:', err)
    const message = err instanceof Error ? err.message : 'Failed to restock pack'
    throw new Error(message)
  }
}

export async function smokeOneStick(packId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  try {
    const { data: pack, error: packErr } = await supabase
      .from('cigarette_packs')
      .select('remaining_sticks')
      .eq('id', packId)
      .single()

    if (packErr || !pack) throw new Error("Pack not found")
    if (pack.remaining_sticks <= 0) throw new Error("Pack is empty")

    const newRemaining = pack.remaining_sticks - 1

    const { error: updateErr } = await supabase
      .from('cigarette_packs')
      .update({
        remaining_sticks: newRemaining,
        is_active: newRemaining > 0
      })
      .eq('id', packId)

    if (updateErr) throw new Error(updateErr.message)

    const { error: logErr } = await supabase
      .from('cigarette_logs')
      .insert({
        pack_id: packId,
        user_id: user.id,
        log_type: 'self'
      })

    if (logErr) throw new Error(logErr.message)
    revalidatePath('/')
  } catch (err) {
    console.error('Error in smokeOneStick:', err)
    const message = err instanceof Error ? err.message : 'Failed to log smoke'
    throw new Error(message)
  }
}

export async function logCigaretteManually(packId: string, smokedAt: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  try {
    const { data: pack, error: packErr } = await supabase
      .from('cigarette_packs')
      .select('remaining_sticks')
      .eq('id', packId)
      .single()

    if (packErr || !pack) throw new Error("Pack not found")
    if (pack.remaining_sticks <= 0) throw new Error("Pack is empty")

    const newRemaining = pack.remaining_sticks - 1

    const { error: updateErr } = await supabase
      .from('cigarette_packs')
      .update({
        remaining_sticks: newRemaining,
        is_active: newRemaining > 0
      })
      .eq('id', packId)

    if (updateErr) throw new Error(updateErr.message)

    const { error: logErr } = await supabase
      .from('cigarette_logs')
      .insert({
        pack_id: packId,
        user_id: user.id,
        smoked_at: new Date(smokedAt).toISOString(),
        log_type: 'self'
      })

    if (logErr) throw new Error(logErr.message)
    revalidatePath('/')
  } catch (err) {
    console.error('Error in logCigaretteManually:', err)
    const message = err instanceof Error ? err.message : 'Failed to log cigarette manually'
    throw new Error(message)
  }
}

export async function shareCigarette(packId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  try {
    const { data: pack, error: packErr } = await supabase
      .from('cigarette_packs')
      .select('remaining_sticks')
      .eq('id', packId)
      .single()

    if (packErr || !pack) throw new Error("Pack not found")
    if (pack.remaining_sticks <= 0) throw new Error("Pack is empty")

    const newRemaining = pack.remaining_sticks - 1

    const { error: updateErr } = await supabase
      .from('cigarette_packs')
      .update({
        remaining_sticks: newRemaining,
        is_active: newRemaining > 0
      })
      .eq('id', packId)

    if (updateErr) throw new Error(updateErr.message)

    const { error: logErr } = await supabase
      .from('cigarette_logs')
      .insert({
        pack_id: packId,
        user_id: user.id,
        log_type: 'shared'
      })

    if (logErr) throw new Error(logErr.message)
    revalidatePath('/')
  } catch (err) {
    console.error('Error in shareCigarette:', err)
    const message = err instanceof Error ? err.message : 'Failed to share cigarette'
    throw new Error(message)
  }
}

export async function calibrateCigarettePack(packId: string, remainingSticks: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  try {
    const { error } = await supabase
      .from('cigarette_packs')
      .update({
        remaining_sticks: remainingSticks,
        is_active: remainingSticks > 0
      })
      .eq('id', packId)
      .eq('user_id', user.id)

    if (error) throw new Error(error.message)
    revalidatePath('/')
  } catch (err) {
    console.error('Error in calibrateCigarettePack:', err)
    const message = err instanceof Error ? err.message : 'Failed to calibrate pack'
    throw new Error(message)
  }
}

export async function deleteCigarettePack(packId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  try {
    const { error } = await supabase
      .from('cigarette_packs')
      .delete()
      .eq('id', packId)
      .eq('user_id', user.id)

    if (error) throw new Error(error.message)
    revalidatePath('/')
  } catch (err) {
    console.error('Error in deleteCigarettePack:', err)
    const message = err instanceof Error ? err.message : 'Failed to delete pack'
    throw new Error(message)
  }
}

export async function getCigaretteLogs() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  try {
    const { data, error } = await supabase
      .from('cigarette_logs')
      .select('id, pack_id, smoked_at, log_type, cigarette_packs(brand)')
      .eq('user_id', user.id)
      .order('smoked_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching logs:', error)
      return []
    }
    return (data || []) as unknown as {
      id: string
      pack_id: string
      smoked_at: string
      log_type: 'self' | 'shared'
      cigarette_packs: { brand: string } | null
    }[]
  } catch (err) {
    console.error('Error in getCigaretteLogs:', err)
    return []
  }
}

export async function deleteCigaretteLog(logId: string, packId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  try {
    // 1. Get the current pack to see remaining_sticks
    const { data: pack, error: packErr } = await supabase
      .from('cigarette_packs')
      .select('remaining_sticks, initial_sticks')
      .eq('id', packId)
      .single()

    if (packErr) throw new Error("Pack not found")

    // 2. Increment the stock
    const newRemaining = pack.remaining_sticks + 1

    const { error: updateErr } = await supabase
      .from('cigarette_packs')
      .update({
        remaining_sticks: newRemaining,
        is_active: true
      })
      .eq('id', packId)

    if (updateErr) throw new Error(updateErr.message)

    // 3. Delete the log
    const { error: deleteErr } = await supabase
      .from('cigarette_logs')
      .delete()
      .eq('id', logId)

    if (deleteErr) throw new Error(deleteErr.message)

    revalidatePath('/')
  } catch (err) {
    console.error('Error in deleteCigaretteLog:', err)
    const message = err instanceof Error ? err.message : 'Failed to delete cigarette log'
    throw new Error(message)
  }
}


export async function deleteTransaction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/finance')
  revalidatePath('/')
}

// Inventory Actions
export async function createInventoryItem(formData: FormData) {
  const supabase = await createClient()
  const item_name = formData.get('item_name') as string
  const status = formData.get('status') as string
  const course_id = formData.get('course_id') as string
  const quantity = parseInt(formData.get('quantity') as string) || 1
  const location = formData.get('location') as string

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('inventories')
    .insert({
      item_name,
      status: status || 'Normal',
      course_id: course_id || null,
      quantity,
      location: location || null,
      user_id: user.id
    })

  if (error) throw new Error(error.message)
  revalidatePath('/inventory')
  revalidatePath('/')
}

export async function updateInventoryItemStatus(itemId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('inventories')
    .update({ status })
    .eq('id', itemId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/inventory')
  revalidatePath('/')
}

export async function updateInventoryItem(itemId: string, item_name: string, quantity: number, location: string | null, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('inventories')
    .update({
      item_name,
      quantity,
      location: location || null,
      status
    })
    .eq('id', itemId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/inventory')
  revalidatePath('/')
}

export async function deleteInventoryItem(itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('inventories')
    .delete()
    .eq('id', itemId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/inventory')
  revalidatePath('/')
}

// Settings Actions
export async function saveUserPreferences(formData: FormData) {
  const supabase = await createClient()
  const user_name = formData.get('user_name') as string
  const pomodoro_focus_time = parseInt(formData.get('pomodoro_focus_time') as string) || 25
  const pomodoro_break_time = parseInt(formData.get('pomodoro_break_time') as string) || 5
  const hide_financial_balance = formData.get('hide_financial_balance') === 'true'

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('user_preferences')
    .upsert({
      id: user.id,
      user_name,
      pomodoro_focus_time,
      pomodoro_break_time,
      hide_financial_balance
    })

  if (error) throw new Error(error.message)
  revalidatePath('/settings')
  revalidatePath('/')
}

// Learning Log Actions
export async function createLearningLog(formData: FormData) {
  const supabase = await createClient()
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const tagsRaw = formData.get('tags') as string
  
  const tags = tagsRaw
    ? tagsRaw.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    : []

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('learning_logs')
    .insert({
      user_id: user.id,
      title,
      content,
      tags
    })

  if (error) throw new Error(error.message)
  revalidatePath('/timeline')
}

export async function deleteLearningLog(logId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('learning_logs')
    .delete()
    .eq('id', logId)

  if (error) throw new Error(error.message)
  revalidatePath('/timeline')
}

export async function updateLearningLog(logId: string, title: string, content: string, tagsRaw: string) {
  const supabase = await createClient()
  const tags = tagsRaw
    ? tagsRaw.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    : []

  const { error } = await supabase
    .from('learning_logs')
    .update({ title, content, tags })
    .eq('id', logId)

  if (error) throw new Error(error.message)
  revalidatePath('/timeline')
}

// Rabbit Hole Actions
export async function fetchRandomKnowledge() {
  try {
    const res = await fetch('https://en.wikipedia.org/api/rest_v1/page/random/summary', {
      cache: 'no-store'
    })
    if (!res.ok) throw new Error('Wikipedia API failed')
    const json = await res.json()
    return {
      title: json.title as string,
      extract: json.extract as string,
      url: (json.content_urls?.desktop?.page as string) || `https://en.wikipedia.org/wiki/${encodeURIComponent(json.title)}`,
      thumbnail: (json.thumbnail?.source as string) || null
    }
  } catch (err) {
    console.error(err)
    throw new Error('Failed to dive into the rabbit hole')
  }
}

export async function saveRabbitHoleToTimeline(title: string, extract: string, url: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('learning_logs')
    .insert({
      user_id: user.id,
      title: `TIL: ${title}`,
      content: `${extract}\n\nRead more: ${url}`,
      tags: ['Rabbit Hole']
    })

  if (error) throw new Error(error.message)
  revalidatePath('/timeline')
}

// Auth Actions
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/')
}

// Forum Actions
export async function createThread(content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('threads')
    .insert({
      user_id: user.id,
      content
    })

  if (error) throw new Error(error.message)
  revalidatePath('/forum')
}

export async function deleteThread(threadId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('threads')
    .delete()
    .eq('id', threadId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/forum')
}

export async function toggleLike(threadId: string, currentlyLiked: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  if (currentlyLiked) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('thread_id', threadId)
      .eq('user_id', user.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('likes')
      .insert({
        thread_id: threadId,
        user_id: user.id
      })
    if (error) throw new Error(error.message)
  }
  revalidatePath('/forum')
}

export async function createComment(threadId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('comments')
    .insert({
      thread_id: threadId,
      user_id: user.id,
      content
    })

  if (error) throw new Error(error.message)
  revalidatePath('/forum')
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/forum')
}

export async function calibrateWallet(walletName: string, targetBalance: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Fetch all transactions for this specific wallet
  const { data: transactions, error: fetchErr } = await supabase
    .from('transactions')
    .select('amount, type')
    .eq('user_id', user.id)
    .eq('wallet_name', walletName)

  if (fetchErr) throw new Error(fetchErr.message)

  // Calculate current balance
  let currentBalance = 0
  transactions?.forEach(tx => {
    const amt = Number(tx.amount)
    if (tx.type === 'income') {
      currentBalance += amt
    } else {
      currentBalance -= amt
    }
  })

  const difference = targetBalance - currentBalance

  if (difference === 0) return // Already calibrated

  const type = difference > 0 ? 'income' : 'expense'
  const amount = Math.abs(difference)
  const wallet_type = walletName === 'Cash' ? 'Cash' : 'Cashless'

  const { error: insertErr } = await insertTransactionWithFallback(supabase, {
    amount,
    type,
    description: 'SYSTEM_CALIBRATION',
    wallet_type,
    wallet_name: walletName,
    category: 'Lainnya',
    user_id: user.id
  })

  if (insertErr) throw new Error(insertErr.message)
 
  revalidatePath('/finance')
  revalidatePath('/')
}

// Trip Template & Checklist Actions
export async function createTripTemplate(title: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('trip_templates')
    .insert({
      title,
      user_id: user.id
    })

  if (error) throw new Error(error.message)
  revalidatePath('/trips')
}

export async function deleteTripTemplate(templateId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('trip_templates')
    .delete()
    .eq('id', templateId)

  if (error) throw new Error(error.message)
  revalidatePath('/trips')
}

export async function addTemplateItem(templateId: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('template_items')
    .insert({
      template_id: templateId,
      name,
      is_checked: false
    })

  if (error) throw new Error(error.message)
  revalidatePath('/trips')
}

export async function toggleTemplateItem(itemId: string, isChecked: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('template_items')
    .update({ is_checked: isChecked })
    .eq('id', itemId)

  if (error) throw new Error(error.message)
  revalidatePath('/trips')
}

export async function deleteTemplateItem(itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('template_items')
    .delete()
    .eq('id', itemId)

  if (error) throw new Error(error.message)
  revalidatePath('/trips')
}

export async function resetTemplateItems(templateId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('template_items')
    .update({ is_checked: false })
    .eq('template_id', templateId)

  if (error) throw new Error(error.message)
  revalidatePath('/trips')
}

// Subscription & Digital Guard Actions
export async function createSubscription(name: string, amount: number, billingDay: number, walletName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('subscriptions')
    .insert({
      name,
      amount,
      billing_day: billingDay,
      wallet_name: walletName
    })

  if (error) throw new Error(error.message)
  revalidatePath('/subscriptions')
  revalidatePath('/')
}

export async function deleteSubscription(subId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('subscriptions')
    .delete()
    .eq('id', subId)

  if (error) throw new Error(error.message)
  revalidatePath('/subscriptions')
  revalidatePath('/')
}

export async function paySubscription(subId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: sub, error: fetchErr } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subId)
    .single()

  if (fetchErr || !sub) throw new Error("Subscription not found")

  const { error: insertErr } = await insertTransactionWithFallback(supabase, {
    amount: sub.amount,
    type: 'expense',
    description: `Pembayaran Rutin ${sub.name}`,
    wallet_type: sub.wallet_name === 'Cash' ? 'Cash' : 'Cashless',
    wallet_name: sub.wallet_name,
    category: 'Internet / Digital',
    user_id: user.id
  })

  if (insertErr) throw new Error(insertErr.message)

  revalidatePath('/finance')
  revalidatePath('/subscriptions')
  revalidatePath('/')
}

// Auto-Pilot Finance Actions
export async function createAutoTransaction(
  title: string,
  type: 'income' | 'expense',
  amount: number,
  category: string,
  walletName: string,
  frequency: 'daily' | 'monthly',
  billingDay: number | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Set the initial processed date to today's date in local time YYYY-MM-DD
  const todayLocal = new Date()
  const year = todayLocal.getFullYear()
  const month = String(todayLocal.getMonth() + 1).padStart(2, '0')
  const date = String(todayLocal.getDate()).padStart(2, '0')
  const lastProcessedStr = `${year}-${month}-${date}`

  const { error } = await supabase
    .from('auto_transactions')
    .insert({
      title,
      type,
      amount,
      category,
      wallet_name: walletName,
      frequency,
      billing_day: frequency === 'monthly' ? billingDay : null,
      last_processed_at: lastProcessedStr
    })

  if (error) throw new Error(error.message)
  revalidatePath('/finance/auto')
  revalidatePath('/finance')
  revalidatePath('/')
}

export async function deleteAutoTransaction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('auto_transactions')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/finance/auto')
  revalidatePath('/finance')
  revalidatePath('/')
}




