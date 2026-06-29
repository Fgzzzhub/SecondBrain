'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
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
  label?: string
  disabled?: boolean
}

export function AnimatedSelect({
  value,
  onChange,
  options,
  placeholder = 'Pilih...',
  name,
  className = '',
  label,
  disabled = false,
}: AnimatedSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  // Mount check — diperlukan untuk createPortal di Next.js
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Hitung posisi dropdown berdasarkan posisi trigger button
  const calculateDropdownPosition = useCallback(() => {
    if (!triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const dropdownHeight = Math.min(options.length * 40 + 8, 220) // max height based on padding/size
    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top
    
    // Buka ke atas jika space bawah tidak cukup
    const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow

    setDropdownStyle({
      position: 'fixed',
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      zIndex: 99999, // di body langsung
      ...(openUpward
        ? { bottom: `${viewportHeight - rect.top + 4}px` }
        : { top: `${rect.bottom + 4}px` }
      ),
    })
  }, [options.length])

  // Recalculate saat open
  useEffect(() => {
    if (isOpen) {
      calculateDropdownPosition()
      // Recalculate saat scroll atau resize
      window.addEventListener('scroll', calculateDropdownPosition, true)
      window.addEventListener('resize', calculateDropdownPosition)
    }
    return () => {
      window.removeEventListener('scroll', calculateDropdownPosition, true)
      window.removeEventListener('resize', calculateDropdownPosition)
    }
  }, [isOpen, calculateDropdownPosition])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handle = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node
      if (
        !triggerRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    document.addEventListener('touchstart', handle, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('touchstart', handle)
    }
  }, [isOpen])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  // Dropdown content — di-portal ke body
  const dropdownContent = (
    <div
      ref={dropdownRef}
      style={{
        ...dropdownStyle,
        animation: 'selectDropdownIn 0.22s cubic-bezier(0.34,1.4,0.64,1)',
      }}
      className="rounded-xl bg-[var(--bg-base)] border border-[var(--border-strong)] shadow-lg overflow-hidden flex flex-col"
    >
      <div 
        className="max-h-52 overflow-y-auto overscroll-contain p-1 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {options.map((option, index) => {
          const active = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => handleSelect(option.value)}
              className={`w-full text-left pl-3 pr-2 py-2 rounded-lg text-sm flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                active
                  ? 'bg-[rgba(var(--color-primary),0.12)] text-[rgb(var(--color-primary))] font-semibold'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'
              }`}
              style={{
                borderBottom: index < options.length - 1
                  ? '0.5px solid var(--border)'
                  : 'none',
              }}
            >
              <span className="truncate">{option.label}</span>
              {active && <Check className="w-3.5 h-3.5 flex-shrink-0 stroke-[2.5px]" />}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div style={{ position: 'relative' }} className={className}>
      {/* Hidden input so the value works inside native HTML forms */}
      {name && <input type="hidden" name={name} value={value} />}

      {/* Label */}
      {label && (
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
          {label}
        </p>
      )}

      {/* Trigger button */}
      <motion.button
        ref={triggerRef}
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={() => !disabled && setIsOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
        className={`w-full px-3 py-2.5 rounded-xl bg-[var(--bg-surface)] border text-sm text-[var(--text-primary)] flex items-center justify-between gap-2 outline-none transition-colors ${
          isOpen
            ? 'border-[rgba(var(--color-primary),0.5)] bg-[rgba(var(--color-primary),0.04)]'
            : 'border-[var(--border)] hover:border-[var(--border-strong)]'
        }`}
      >
        <span className={`truncate ${selectedOption ? '' : 'text-[var(--text-muted)]'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--text-muted)] flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[rgb(var(--color-primary))]' : ''
          }`}
        />
      </motion.button>

      {/* ✅ PORTAL — render dropdown langsung ke document.body */}
      {mounted && isOpen && createPortal(dropdownContent, document.body)}

      {/* CSS animation */}
      <style>{`
        @keyframes selectDropdownIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(-4px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        /* Hide scrollbar di dalam dropdown */
        div[style*="maxHeight: 220px"]::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
