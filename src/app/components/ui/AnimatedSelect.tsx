'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface AnimatedSelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  name?: string
  className?: string
}

export function AnimatedSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  name,
  className = ''
}: AnimatedSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Hidden input for standard HTML forms */}
      {name && <input type="hidden" name={name} value={value} />}

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-neutral-950 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-800 dark:text-white rounded-lg p-2 flex items-center justify-between outline-none cursor-pointer hover:border-neutral-350 dark:hover:border-neutral-750 transition-colors"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-neutral-450 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute z-[100] left-0 right-0 mt-1.5 max-h-48 overflow-y-auto overscroll-contain bg-neutral-950 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-2xl outline-none divide-y divide-neutral-100 dark:divide-neutral-850/40 scrollbar-thin scrollbar-thumb-neutral-250 dark:scrollbar-thumb-neutral-800"
          >
            {options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800/60 cursor-pointer ${
                    option.value === value
                      ? 'text-indigo-400 font-semibold bg-neutral-50/50 dark:bg-neutral-800/40'
                      : 'text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
