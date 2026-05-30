import { createClient } from '@/lib/supabase/client'

/**
 * Invokes the 'notify-telegram' Supabase Edge Function to send a message.
 * 
 * @param message The text message to send
 * @param chatId Optional target Telegram Chat ID (falls back to Edge Function env variable if omitted)
 */
export async function sendTelegramNotification(message: string, chatId?: string) {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.functions.invoke('notify-telegram', {
      body: { message, chatId },
    })

    if (error) {
      console.error('Edge function invocation error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (err: any) {
    console.error('Failed to invoke notification helper:', err)
    return { success: false, error: err.message }
  }
}
