'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, StickyNote, CheckSquare, Sparkles, Command, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SearchResultItem {
  id: string
  title: string
  subtitle?: string
  href: string
  type: 'task' | 'note' | 'timeline' | 'shortcut'
}

export function OmniSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const router = useRouter()
  const supabase = createClient()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const resultsContainerRef = useRef<HTMLDivElement>(null)

  // Standard shortcuts (navigation links) that are always searchable
  const shortcuts: SearchResultItem[] = [
    { id: 'sc-home', title: 'Go to Home', subtitle: 'Dashboard overview', href: '/', type: 'shortcut' },
    { id: 'sc-tasks', title: 'Go to Tasks', subtitle: 'Action items backlog', href: '/tasks', type: 'shortcut' },
    { id: 'sc-notes', title: 'Go to Notes', subtitle: 'Knowledge base & drafts', href: '/notes', type: 'shortcut' },
    { id: 'sc-timeline', title: 'Go to Timeline', subtitle: 'Learning logs archive', href: '/timeline', type: 'shortcut' },
    { id: 'sc-inventory', title: 'Go to Inventory', subtitle: 'Logistics tracker', href: '/inventory', type: 'shortcut' },
    { id: 'sc-finance', title: 'Go to Finance', subtitle: 'Expense & cashflow analytics', href: '/finance', type: 'shortcut' },
    { id: 'sc-forum', title: 'Go to Forum', subtitle: 'Private circles chat', href: '/forum', type: 'shortcut' },
    { id: 'sc-settings', title: 'Go to Settings', subtitle: 'Preferences & personalization', href: '/settings', type: 'shortcut' }
  ]

  // Global key listener for CMD+K / CTRL+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Auto-focus search input when palette opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
      setQuery('')
      setResults(shortcuts)
      setSelectedIndex(0)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle dynamic search queries
  useEffect(() => {
    if (!isOpen) return

    if (!query.trim()) {
      setResults(shortcuts)
      setSelectedIndex(0)
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const [tasksRes, notesRes, logsRes] = await Promise.all([
          supabase.from('tasks').select('id, title, description').ilike('title', `%${query}%`).limit(4),
          supabase.from('notes').select('id, title, content').ilike('title', `%${query}%`).limit(4),
          supabase.from('learning_logs').select('id, title, content').ilike('title', `%${query}%`).limit(4),
        ])

        const dbResults: SearchResultItem[] = []

        if (tasksRes.data) {
          tasksRes.data.forEach(task => {
            dbResults.push({
              id: task.id,
              title: task.title,
              subtitle: task.description || 'Task action item',
              href: '/tasks',
              type: 'task'
            })
          })
        }

        if (notesRes.data) {
          notesRes.data.forEach(note => {
            dbResults.push({
              id: note.id,
              title: note.title,
              subtitle: note.content ? note.content.substring(0, 60) + '...' : 'Empty note draft',
              href: '/notes',
              type: 'note'
            })
          })
        }

        if (logsRes.data) {
          logsRes.data.forEach(log => {
            dbResults.push({
              id: log.id,
              title: log.title,
              subtitle: log.content ? log.content.substring(0, 60) + '...' : 'Timeline event log',
              href: '/timeline',
              type: 'timeline'
            })
          })
        }

        // Merge matched shortcuts
        const matchedShortcuts = shortcuts.filter(sc =>
          sc.title.toLowerCase().includes(query.toLowerCase()) ||
          sc.subtitle?.toLowerCase().includes(query.toLowerCase())
        )

        setResults([...dbResults, ...matchedShortcuts])
        setSelectedIndex(0)
      } catch (err) {
        console.error(err)
      } finally {
        setSearching(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query, isOpen])

  // Handle keyboard navigation inside search list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = results[selectedIndex]
      if (selected) {
        handleNavigate(selected.href)
      }
    }
  }

  // Scroll active item into view
  useEffect(() => {
    const activeEl = resultsContainerRef.current?.querySelector('[data-active="true"]')
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const handleNavigate = (href: string) => {
    setIsOpen(false)
    router.push(href)
  }

  return (
    <>
      {/* Floating Header Magnifier Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex fixed top-4 right-16 z-[10005] md:top-6 md:right-8 w-10 h-10 rounded-full border border-neutral-200 dark:border-neutral-850 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:scale-105 transition-all shadow-sm cursor-pointer"
        title="Search OS (Ctrl+K)"
      >
        <Search className="w-4 h-4 stroke-[1.5px]" />
      </button>

      {/* Overlay Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10030] flex items-start justify-center p-4 pt-[10vh] md:pt-[15vh]">
          {/* Modal Container */}
          <div
            className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200"
            onKeyDown={handleKeyDown}
          >
            {/* Search Bar Header */}
            <div className="flex items-center gap-3 px-4 border-b border-neutral-200 dark:border-neutral-800 h-12 flex-shrink-0">
              <Search className="w-4.5 h-4.5 text-neutral-400 dark:text-neutral-500 stroke-[1.5px]" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes, tasks, timeline, pages..."
                className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 outline-none h-full"
              />
              {searching ? (
                <div className="w-3.5 h-3.5 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-[10px] text-neutral-400 dark:text-neutral-500 font-mono font-medium">
                  <Command className="w-2.5 h-2.5" />K
                </div>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-1 rounded transition-colors"
              >
                <X className="w-4 h-4 stroke-[1.5px]" />
              </button>
            </div>

            {/* Results Body */}
            <div
              ref={resultsContainerRef}
              className="flex-1 max-h-[320px] overflow-y-auto p-2 flex flex-col gap-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
            >
              {results.length > 0 ? (
                results.map((item, index) => {
                  const isActive = index === selectedIndex
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.href)}
                      data-active={isActive}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer group ${
                        isActive
                          ? 'bg-[rgba(var(--color-primary),0.08)] text-[rgb(var(--color-primary))]'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-850 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-1.5 rounded-md ${
                          isActive 
                            ? 'bg-[rgba(var(--color-primary),0.15)] text-[rgb(var(--color-primary))]' 
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500'
                        }`}>
                          {item.type === 'task' && <CheckSquare className="w-4 h-4 stroke-[1.5px]" />}
                          {item.type === 'note' && <StickyNote className="w-4 h-4 stroke-[1.5px]" />}
                          {item.type === 'timeline' && <Sparkles className="w-4 h-4 stroke-[1.5px]" />}
                          {item.type === 'shortcut' && <Command className="w-4 h-4 stroke-[1.5px]" />}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-medium truncate ${isActive ? 'text-[rgb(var(--color-primary))] font-semibold' : 'text-neutral-900 dark:text-neutral-100'}`}>
                            {item.title}
                          </p>
                          {item.subtitle && (
                            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate mt-0.5 max-w-[280px] sm:max-w-[340px]">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                      <ArrowRight className={`w-3.5 h-3.5 transition-transform ${
                        isActive ? 'text-[rgb(var(--color-primary))] translate-x-0.5' : 'text-transparent group-hover:text-neutral-400'
                      } stroke-[1.5px]`} />
                    </button>
                  )
                })
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center gap-1.5">
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">No results found for "{query}"</p>
                  <p className="text-[10px] text-neutral-500">Try searching for tasks, notes, timeline events, or shortcuts.</p>
                </div>
              )}
            </div>

            {/* Footer Hints */}
            <div className="flex-shrink-0 px-4 py-2 border-t border-neutral-250 dark:border-neutral-800/80 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between text-[9px] text-neutral-400 dark:text-neutral-500 font-medium">
              <div className="flex items-center gap-3">
                <span>↑↓ to navigate</span>
                <span>Enter to select</span>
              </div>
              <span>Esc to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
