'use client'

import { useState } from 'react'
import { Compass, RefreshCw, ExternalLink, BookmarkPlus, Check, Sparkles } from 'lucide-react'
import { fetchRandomKnowledge, saveRabbitHoleToTimeline } from '@/app/actions'

interface WikipediaPage {
  title: string
  extract: string
  url: string
  thumbnail: string | null
}

export function RabbitHoleWidget() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<WikipediaPage | null>(null)

  const handleDive = async () => {
    setLoading(true)
    setError(null)
    setSaved(false)
    try {
      const result = await fetchRandomKnowledge()
      setData(result)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch knowledge')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!data || saved) return
    setSaving(true)
    setError(null)
    try {
      await saveRabbitHoleToTimeline(data.title, data.extract, data.url)
      setSaved(true)
    } catch (err: any) {
      setError(err.message || 'Failed to save to timeline')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white dark:bg-neutral-900/50 border border-neutral-250 dark:border-neutral-800 rounded-xl p-5 md:p-6 transition-all shadow-sm flex flex-col gap-4 relative overflow-hidden group">
      {/* Visual background gradient glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-neutral-500/5 to-transparent dark:from-neutral-500/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-neutral-800 dark:text-neutral-200 stroke-[1.5px] animate-spin-slow" />
          <h3 className="font-semibold text-sm tracking-tight text-neutral-900 dark:text-white">The Rabbit Hole</h3>
        </div>
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/80 px-2 py-0.5 rounded text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Curiosity Feed</span>
        </div>
      </div>

      {/* Initial state */}
      {!data && !loading && (
        <div className="flex flex-col gap-4 py-3 z-10">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-md">
            Dive into Wikipedia summaries. Discover strange historical events, obscure science, and unusual human stories with no deadlines.
          </p>
          <div>
            <button
              onClick={handleDive}
              className="flex items-center gap-2 px-4 py-2 border border-neutral-300 dark:border-neutral-750 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700/80 text-neutral-900 dark:text-neutral-200 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Enter the Rabbit Hole</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton State */}
      {loading && (
        <div className="animate-pulse flex flex-col gap-3 py-2 z-10">
          <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3" />
          <div className="space-y-2">
            <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-full" />
            <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-5/6" />
            <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-2/3" />
          </div>
        </div>
      )}

      {/* Loaded State */}
      {data && !loading && (
        <div className="flex flex-col gap-4 z-10 animate-fade-in">
          <div className="flex gap-4 items-start">
            {data.thumbnail && (
              <img
                src={data.thumbnail}
                alt={data.title}
                className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg border border-neutral-200 dark:border-neutral-850 flex-shrink-0 bg-neutral-100 dark:bg-neutral-800"
              />
            )}
            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
              <h4 className="font-semibold text-neutral-900 dark:text-white text-base tracking-tight leading-tight truncate">
                {data.title}
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-3 md:line-clamp-4">
                {data.extract}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 dark:border-neutral-850/80 pt-3.5 mt-1">
            <button
              onClick={handleDive}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-55 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-md text-[11px] font-semibold tracking-tight transition-all cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 stroke-[2px]" />
              <span>Pull Another</span>
            </button>

            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-55 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-md text-[11px] font-semibold tracking-tight transition-all"
            >
              <ExternalLink className="w-3 h-3 stroke-[2px]" />
              <span>Read Full Article</span>
            </a>

            <button
              onClick={handleSave}
              disabled={saving || saved}
              className={`flex items-center gap-1.5 px-3 py-1.5 border transition-all rounded-md text-[11px] font-semibold tracking-tight cursor-pointer ml-auto ${
                saved
                  ? 'border-emerald-200 dark:border-emerald-950/40 bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400 cursor-default'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {saved ? (
                <>
                  <Check className="w-3 h-3 stroke-[2.5px]" />
                  <span>Saved to Timeline</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-3 h-3 stroke-[2px]" />
                  <span>{saving ? 'Saving...' : 'Save to Timeline'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {error && (
        <span className="text-[11px] text-red-500 font-medium z-10">{error}</span>
      )}
    </div>
  )
}
