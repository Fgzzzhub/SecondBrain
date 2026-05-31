'use client'

import { useState, useTransition, useOptimistic } from 'react'
import { toggleLike, deleteThread, createComment, deleteComment } from '@/app/actions'
import { Heart, MessageCircle, Trash2, Calendar, CornerDownRight, Send } from 'lucide-react'
import { triggerHaptic } from '@/lib/haptic'

interface Comment {
  id: string
  thread_id: string
  user_id: string
  content: string
  created_at: string
}

interface Thread {
  id: string
  user_id: string
  content: string
  created_at: string
  likes: Array<{ user_id: string }>
  comments: Comment[]
}

interface ThreadCardProps {
  thread: Thread
  currentUserId: string
  userPreferencesMap: Record<string, string> // maps user_id -> user_name
}

export function ThreadCard({ thread, currentUserId, userPreferencesMap }: ThreadCardProps) {
  const [isPending, startTransition] = useTransition()
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')

  // Author details
  const authorName = userPreferencesMap[thread.user_id] || `Friend (${thread.user_id.slice(0, 5)})`

  // Optimistic UI for likes
  const isLikedByMe = thread.likes.some((like) => like.user_id === currentUserId)
  const [optimisticLikeState, setOptimisticLikeState] = useOptimistic(
    { count: thread.likes.length, liked: isLikedByMe },
    (state, action: { type: 'TOGGLE' }) => {
      if (action.type === 'TOGGLE') {
        return {
          count: state.liked ? state.count - 1 : state.count + 1,
          liked: !state.liked,
        }
      }
      return state
    }
  )

  const handleLike = () => {
    triggerHaptic(20)
    startTransition(async () => {
      // Optimistic update
      setOptimisticLikeState({ type: 'TOGGLE' })
      try {
        await toggleLike(thread.id, optimisticLikeState.liked)
      } catch {
        alert('Failed to update like')
      }
    })
  }

  const handleDeleteThread = () => {
    triggerHaptic(40)
    if (confirm('Are you sure you want to delete this thread?')) {
      triggerHaptic(80)
      startTransition(async () => {
        try {
          await deleteThread(thread.id)
        } catch {
          alert('Failed to delete thread')
        }
      })
    }
  }

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    startTransition(async () => {
      try {
        await createComment(thread.id, newComment)
        setNewComment('')
      } catch {
        alert('Failed to add comment')
      }
    })
  }

  const handleDeleteComment = (commentId: string) => {
    triggerHaptic(40)
    if (confirm('Delete this comment?')) {
      triggerHaptic(80)
      startTransition(async () => {
        try {
          await deleteComment(commentId)
        } catch {
          alert('Failed to delete comment')
        }
      })
    }
  }

  const formattedDate = new Date(thread.created_at).toLocaleDateString('en-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-900 bg-white dark:bg-neutral-950/20 backdrop-blur-sm flex flex-col gap-4 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-800 transition-all group">
      <div>
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-neutral-850 dark:text-neutral-200">
              {authorName}
            </span>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5 font-mono">
              <Calendar className="w-3 h-3 stroke-[1.5px]" />
              {formattedDate}
            </span>
          </div>

          {/* Delete Thread Button */}
          {thread.user_id === currentUserId && (
            <button
              onClick={handleDeleteThread}
              disabled={isPending}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 text-neutral-450 hover:text-rose-500 rounded transition-opacity cursor-pointer"
              title="Delete thread"
            >
              <Trash2 className="w-3.5 h-3.5 stroke-[1.5px]" />
            </button>
          )}
        </div>

        <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-3.5 leading-relaxed whitespace-pre-wrap">
          {thread.content}
        </p>
      </div>

      {/* Like and Comment Actions */}
      <div className="flex items-center gap-6 pt-3 border-t border-neutral-100 dark:border-neutral-900/60 text-xs">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
            optimisticLikeState.liked
              ? 'text-rose-500 font-semibold'
              : 'text-neutral-500 hover:text-rose-500'
          }`}
        >
          <Heart
            className={`w-4 h-4 stroke-[1.5px] ${
              optimisticLikeState.liked ? 'fill-rose-500 stroke-rose-500' : ''
            }`}
          />
          <span>{optimisticLikeState.count}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
            showComments
              ? 'text-neutral-800 dark:text-white font-semibold'
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
          }`}
        >
          <MessageCircle className="w-4 h-4 stroke-[1.5px]" />
          <span>{thread.comments.length}</span>
        </button>
      </div>

      {/* Expanded Comments Section */}
      {showComments && (
        <div className="flex flex-col gap-4 mt-2.5 pl-3 border-l-2 border-neutral-100 dark:border-neutral-900">
          {/* Comments List */}
          {thread.comments.length > 0 ? (
            <div className="flex flex-col gap-3">
              {[...thread.comments]
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                .map((comment) => {
                const commentAuthor = userPreferencesMap[comment.user_id] || `Friend (${comment.user_id.slice(0, 5)})`
                return (
                  <div key={comment.id} className="flex gap-2.5 items-start text-xs group/comment">
                    <CornerDownRight className="w-3.5 h-3.5 text-neutral-450 dark:text-neutral-600 mt-1 flex-shrink-0" />
                    <div className="flex-1 bg-neutral-50/50 dark:bg-neutral-900/10 border border-neutral-100 dark:border-neutral-900 p-2.5 rounded-xl">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                          {commentAuthor}
                        </span>
                        {comment.user_id === currentUserId && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={isPending}
                            className="opacity-0 group-hover/comment:opacity-100 p-1 text-neutral-400 hover:text-rose-500 rounded cursor-pointer transition-opacity"
                          >
                            <Trash2 className="w-3 h-3 stroke-[1.5px]" />
                          </button>
                        )}
                      </div>
                      <p className="text-neutral-600 dark:text-neutral-350 leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 italic pl-6">
              No comments yet. Be the first to reply!
            </p>
          )}

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="flex gap-2 mt-2 pl-6">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a reply..."
              disabled={isPending}
              className="flex-1 bg-transparent text-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-600 outline-none border-b border-neutral-100 dark:border-neutral-900 focus:border-neutral-300 dark:focus:border-neutral-700 pb-1"
            />
            <button
              type="submit"
              disabled={isPending || !newComment.trim()}
              className="p-1.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
