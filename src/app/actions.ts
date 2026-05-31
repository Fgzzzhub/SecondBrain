'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
  
  const { error } = await supabase
    .from('tasks')
    .update({ is_completed })
    .eq('id', taskId)

  if (error) throw new Error(error.message)
  revalidatePath('/tasks')
  revalidatePath('/')
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) throw new Error(error.message)
  revalidatePath('/tasks')
  revalidatePath('/')
}

export async function updateTask(taskId: string, title: string, description: string | null, due_date: string | null) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .update({
      title,
      description: description || null,
      due_date: due_date ? new Date(due_date).toISOString() : null,
    })
    .eq('id', taskId)

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

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)

  if (error) throw new Error(error.message)
  revalidatePath('/notes')
  revalidatePath('/')
}

export async function updateNote(noteId: string, title: string, content: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notes')
    .update({ title, content })
    .eq('id', noteId)

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

  const { error } = await supabase
    .from('schedule')
    .delete()
    .eq('id', itemId)

  if (error) throw new Error(error.message)
  revalidatePath('/schedule')
  revalidatePath('/')
}

// Finance Actions
export async function createTransaction(formData: FormData) {
  const supabase = await createClient()
  const amount = parseFloat(formData.get('amount') as string)
  const type = formData.get('type') as 'income' | 'expense'
  const description = formData.get('description') as string

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('transactions')
    .insert({ amount, type, description, user_id: user.id })

  if (error) throw new Error(error.message)
  revalidatePath('/finance')
  revalidatePath('/')
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)

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

  const { error } = await supabase
    .from('inventories')
    .update({ status })
    .eq('id', itemId)

  if (error) throw new Error(error.message)
  revalidatePath('/inventory')
  revalidatePath('/')
}

export async function updateInventoryItem(itemId: string, item_name: string, quantity: number, location: string | null, status: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('inventories')
    .update({
      item_name,
      quantity,
      location: location || null,
      status
    })
    .eq('id', itemId)

  if (error) throw new Error(error.message)
  revalidatePath('/inventory')
  revalidatePath('/')
}

export async function deleteInventoryItem(itemId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('inventories')
    .delete()
    .eq('id', itemId)

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


