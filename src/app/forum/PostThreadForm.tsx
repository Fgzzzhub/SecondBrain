'use client'

import { useState, useTransition } from 'react'
import { createThread } from '@/app/actions'
import { MessageSquare, Send } from 'lucide-react'

export function PostThreadForm() {
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    startTransition(async () => {
      try {
        await createThread(content)
        setContent('')
      } catch (err) {
        alert('Failed to post thread. Try again.')
      }
    })
  }

  const charLimit = 280
  const charsRemaining = charLimit - content.length

  return (
    <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-900 bg-white dark:bg-neutral-950/20 backdrop-blur-sm shadow-sm mb-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex gap-3 items-start">
          <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center flex-shrink-0 border border-neutral-200 dark:border-neutral-800">
            <MessageSquare className="w-4 h-4 text-neutral-500 dark:text-neutral-400 stroke-[1.5px]" />
          </div>
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, charLimit))}
              placeholder="Post an idea or message to the group..."
              rows={3}
              disabled={isPending}
              className="w-full bg-transparent text-sm text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-600 outline-none resize-none leading-relaxed"
            />
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-neutral-100 dark:border-neutral-900/60 pt-3 mt-1">
          <span className={`text-[10px] font-mono ${charsRemaining < 20 ? 'text-rose-500 font-bold' : 'text-neutral-400 dark:text-neutral-500'}`}>
            {charsRemaining} / {charLimit}
          </span>
          <button
            type="submit"
            disabled={isPending || !content.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold dark:hover:bg-neutral-200 transition-all disabled:opacity-40 cursor-pointer shadow-sm"
          >
            {isPending ? 'Posting...' : 'Post'}
            <Send className="w-3 h-3" />
          </button>
        </div>
      </form>
    </div>
  )
}
