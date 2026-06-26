'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'

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

const panelUpVariants: Variants = {
  hidden: { opacity: 0, y: 6, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 320, damping: 26, staggerChildren: 0.022, delayChildren: 0.03 },
  },
  exit: { opacity: 0, y: 6, scale: 0.97, transition: { duration: 0.12 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0 },
}

export function AnimatedSelect({
  value,
  onChange,
  options,
  placeholder = 'Pilih...',
  name,
  className = '',
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
    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [])

  return (
    <div ref={containerRef} className={`relative w-full ${isOpen ? 'z-[100]' : 'z-10'} ${className}`}>
      {/* Hidden input so the value works inside native HTML forms */}
      {name && <input type="hidden" name={name} value={value} />}

      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full px-3 py-2.5 rounded-xl bg-[var(--bg-surface)] border text-sm text-[var(--text-primary)] flex items-center justify-between gap-2 outline-none cursor-pointer transition-colors ${
          isOpen
            ? 'border-[rgba(var(--color-primary),0.5)]'
            : 'border-[var(--border)] hover:border-[var(--border-strong)]'
        }`}
      >
        <span className={`truncate ${selectedOption ? '' : 'text-[var(--text-muted)]'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--text-muted)] flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            role="listbox"
            variants={panelUpVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute z-[9999] left-0 right-0 bottom-full mb-1.5 max-h-52 overflow-y-auto overscroll-contain p-1 rounded-xl bg-[var(--bg-base)] border border-[var(--border-strong)] shadow-lg [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none' }}
          >
            {options.map((option) => {
              const active = option.value === value
              return (
                <motion.li key={option.value} variants={itemVariants}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(option.value)
                      setIsOpen(false)
                    }}
                    className={`w-full text-left pl-3 pr-2 py-2 rounded-lg text-sm flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      active
                        ? 'bg-[rgba(var(--color-primary),0.12)] text-[rgb(var(--color-primary))] font-semibold'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {active && <Check className="w-3.5 h-3.5 flex-shrink-0 stroke-[2.5px]" />}
                  </button>
                </motion.li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
