'use client'

import { useState } from 'react'
import {
  Wallet, Cigarette, CheckSquare, FileText, Clock,
  Calendar, Package, CreditCard, BarChart2, Loader2,
  Sparkles,
} from 'lucide-react'
import { RecapExportModal } from './RecapExportModal'

const CATEGORIES = [
  { id: 'finance',       label: 'Finance',       icon: Wallet,      desc: 'Transaksi & dompet' },
  { id: 'cigarettes',    label: 'Cigarettes',    icon: Cigarette,   desc: 'Log & rata-rata' },
  { id: 'tasks',         label: 'Tasks',         icon: CheckSquare, desc: 'Progress & overdue' },
  { id: 'notes',         label: 'Notes',         icon: FileText,    desc: 'Catatan terbaru' },
  { id: 'pomodoro',      label: 'Focus Time',    icon: Clock,       desc: 'Sesi & durasi' },
  { id: 'schedule',      label: 'Schedule',      icon: Calendar,    desc: 'Jadwal kuliah' },
  { id: 'inventory',     label: 'Inventory',     icon: Package,     desc: 'Status barang' },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard,  desc: 'Biaya bulanan' },
  { id: 'snapshots',     label: 'Daily Trends',  icon: BarChart2,   desc: 'Snapshot harian' },
]

const PERIOD_PRESETS = [
  { id: '7d',    label: '7 Hari',  days: 7 },
  { id: '14d',   label: '14 Hari', days: 14 },
  { id: '30d',   label: '30 Hari', days: 30 },
  { id: '90d',   label: '90 Hari', days: 90 },
  { id: 'custom', label: 'Custom', days: null },
]

export function RecapBuilder() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['finance', 'cigarettes', 'tasks'])
  const [periodPreset, setPeriodPreset] = useState('30d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [format, setFormat] = useState<'markdown' | 'json'>('markdown')
  const [isGenerating, setIsGenerating] = useState(false)
  const [exportResult, setExportResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selectedCategories.length === CATEGORIES.length) {
      setSelectedCategories([])
    } else {
      setSelectedCategories(CATEGORIES.map(c => c.id))
    }
  }

  const getDateRange = () => {
    if (periodPreset === 'custom') {
      return { start: customStart, end: customEnd }
    }
    const preset = PERIOD_PRESETS.find(p => p.id === periodPreset)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - (preset?.days ?? 30))
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    }
  }

  const getPeriodLabel = () => {
    if (periodPreset === 'custom') {
      return `${customStart} — ${customEnd}`
    }
    return PERIOD_PRESETS.find(p => p.id === periodPreset)?.label ?? '30 Hari'
  }

  const handleGenerate = async () => {
    if (selectedCategories.length === 0) return
    if (periodPreset === 'custom' && (!customStart || !customEnd)) {
      setError('Pilih tanggal mulai dan akhir untuk periode custom.')
      return
    }

    setIsGenerating(true)
    setError(null)

    const range = getDateRange()

    try {
      const res = await fetch('/api/recap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: selectedCategories,
          periodStart: range.start,
          periodEnd: range.end,
          periodLabel: getPeriodLabel(),
          format,
          saveToHistory: true,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal generate recap')
      }
      setExportResult(data.content)
    } catch (err: any) {
      console.error('Generate recap failed:', err)
      setError(err.message || 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setIsGenerating(false)
    }
  }

  const allSelected = selectedCategories.length === CATEGORIES.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '48px' }}>

      {/* Category Selection */}
      <section>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '12px',
        }}>
          <p style={{
            fontSize: '11px', fontWeight: 600,
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0,
          }}>
            Pilih Data ({selectedCategories.length}/{CATEGORIES.length})
          </p>
          <button
            onClick={toggleAll}
            style={{
              fontSize: '11px', fontWeight: 500,
              color: allSelected ? '#F87171' : '#A5B4FC',
              background: 'none', border: 'none',
              cursor: 'pointer', padding: '2px 0',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
        }}>
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategories.includes(cat.id)
            const Icon = cat.icon
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                style={{
                  padding: '14px 8px 12px',
                  borderRadius: '14px',
                  background: isSelected
                    ? 'rgba(99,102,241,0.12)'
                    : 'rgba(255,255,255,0.03)',
                  border: isSelected
                    ? '0.5px solid rgba(99,102,241,0.35)'
                    : '0.5px solid rgba(255,255,255,0.07)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: '5px',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isSelected && (
                  <div style={{
                    position: 'absolute', top: '7px', right: '7px',
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: '#818CF8',
                  }} />
                )}
                <Icon
                  size={18}
                  color={isSelected ? '#818CF8' : 'rgba(255,255,255,0.4)'}
                  strokeWidth={1.8}
                />
                <span style={{
                  fontSize: '11px', fontWeight: 600,
                  color: isSelected ? '#A5B4FC' : 'rgba(255,255,255,0.5)',
                  lineHeight: 1.2, textAlign: 'center',
                }}>
                  {cat.label}
                </span>
                <span style={{
                  fontSize: '9px',
                  color: isSelected ? 'rgba(165,180,252,0.5)' : 'rgba(255,255,255,0.2)',
                  lineHeight: 1.2, textAlign: 'center',
                }}>
                  {cat.desc}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Period Selection */}
      <section>
        <p style={{
          fontSize: '11px', fontWeight: 600,
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.07em', textTransform: 'uppercase',
          marginBottom: '12px', margin: '0 0 12px',
        }}>
          Periode
        </p>
        <div style={{
          display: 'flex', gap: '8px',
          overflowX: 'auto', paddingBottom: '4px',
          scrollbarWidth: 'none',
        }}>
          {PERIOD_PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriodPreset(p.id)}
              style={{
                padding: '8px 18px', borderRadius: '20px', flexShrink: 0,
                background: periodPreset === p.id
                  ? 'rgba(99,102,241,0.18)'
                  : 'rgba(255,255,255,0.04)',
                border: periodPreset === p.id
                  ? '0.5px solid rgba(99,102,241,0.4)'
                  : '0.5px solid rgba(255,255,255,0.08)',
                color: periodPreset === p.id
                  ? '#A5B4FC'
                  : 'rgba(255,255,255,0.5)',
                fontSize: '13px', fontWeight: 500,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {periodPreset === 'custom' && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)',
                border: '0.5px solid rgba(255,255,255,0.10)',
                color: 'rgba(255,255,255,0.85)', fontSize: '13px',
                outline: 'none',
              }}
            />
            <span style={{
              display: 'flex', alignItems: 'center',
              color: 'rgba(255,255,255,0.3)', fontSize: '12px',
            }}>—</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)',
                border: '0.5px solid rgba(255,255,255,0.10)',
                color: 'rgba(255,255,255,0.85)', fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>
        )}
      </section>

      {/* Format Selection */}
      <section>
        <p style={{
          fontSize: '11px', fontWeight: 600,
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.07em', textTransform: 'uppercase',
          margin: '0 0 12px',
        }}>
          Format Output
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['markdown', 'json'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              style={{
                flex: 1, padding: '12px 10px',
                borderRadius: '12px',
                background: format === f
                  ? 'rgba(99,102,241,0.12)'
                  : 'rgba(255,255,255,0.03)',
                border: format === f
                  ? '0.5px solid rgba(99,102,241,0.35)'
                  : '0.5px solid rgba(255,255,255,0.07)',
                color: format === f
                  ? '#A5B4FC'
                  : 'rgba(255,255,255,0.5)',
                fontSize: '13px', fontWeight: 500,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              {f === 'markdown' ? '📝 Markdown' : '{ } JSON'}
            </button>
          ))}
        </div>
        <p style={{
          fontSize: '11px', color: 'rgba(255,255,255,0.25)',
          marginTop: '8px', lineHeight: 1.5,
        }}>
          {format === 'markdown'
            ? 'Markdown lebih mudah dibaca AI dan manusia.'
            : 'JSON cocok untuk parsing programatik atau analisis struktural.'}
        </p>
      </section>

      {/* Error state */}
      {error && (
        <div style={{
          padding: '12px 14px', borderRadius: '12px',
          background: 'rgba(239,68,68,0.10)',
          border: '0.5px solid rgba(239,68,68,0.3)',
          color: '#FCA5A5', fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={selectedCategories.length === 0 || isGenerating ||
          (periodPreset === 'custom' && (!customStart || !customEnd))}
        style={{
          padding: '16px', borderRadius: '16px',
          background: selectedCategories.length === 0
            ? 'rgba(255,255,255,0.05)'
            : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
          border: 'none', color: 'white',
          fontSize: '15px', fontWeight: 600,
          cursor: selectedCategories.length === 0 || isGenerating ? 'not-allowed' : 'pointer',
          opacity: (isGenerating || (periodPreset === 'custom' && (!customStart || !customEnd))) ? 0.6 : 1,
          WebkitTapHighlightColor: 'transparent',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '8px',
          boxShadow: selectedCategories.length > 0
            ? '0 4px 20px rgba(99,102,241,0.35)'
            : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {isGenerating ? (
          <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />Generating...</>
        ) : (
          <><Sparkles size={16} />Generate Recap ({selectedCategories.length} kategori)</>
        )}
      </button>

      {/* Export Result Modal */}
      {exportResult && (
        <RecapExportModal
          content={exportResult}
          format={format}
          onClose={() => setExportResult(null)}
        />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
