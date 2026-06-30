'use client'

import { useState } from 'react'
import { Copy, Check, Download, X, FileText, Braces } from 'lucide-react'

interface Props {
  content: string
  format: 'markdown' | 'json'
  onClose: () => void
}

export function RecapExportModal({ content, format, onClose }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleDownload = () => {
    const ext = format === 'json' ? 'json' : 'md'
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recap-${new Date().toISOString().split('T')[0]}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const charCount = content.length
  const lineCount = content.split('\n').length

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'flex-end',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxHeight: '88vh',
          background: 'rgba(13,14,21,0.99)',
          borderRadius: '24px 24px 0 0',
          border: '0.5px solid rgba(255,255,255,0.10)',
          display: 'flex', flexDirection: 'column',
          padding: '20px 20px 32px',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
          animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{
          width: '36px', height: '4px', borderRadius: '2px',
          background: 'rgba(255,255,255,0.15)',
          margin: '-4px auto 16px',
        }} />

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'rgba(99,102,241,0.15)',
              border: '0.5px solid rgba(99,102,241,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {format === 'json'
                ? <Braces size={14} color="#818CF8" />
                : <FileText size={14} color="#818CF8" />
              }
            </div>
            <div>
              <h2 style={{
                fontSize: '16px', fontWeight: 700,
                color: 'rgba(255,255,255,0.92)', margin: 0, lineHeight: 1.2,
              }}>
                Recap Ready
              </h2>
              <p style={{
                fontSize: '11px', color: 'rgba(255,255,255,0.35)',
                margin: '2px 0 0', letterSpacing: '0.01em',
              }}>
                {lineCount} lines · {charCount.toLocaleString()} chars ·{' '}
                {format === 'json' ? 'JSON' : 'Markdown'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              border: '0.5px solid rgba(255,255,255,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
              WebkitTapHighlightColor: 'transparent',
            }}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content preview */}
        <div style={{
          flex: 1, overflowY: 'auto',
          background: 'rgba(0,0,0,0.35)',
          borderRadius: '14px',
          padding: '14px',
          border: '0.5px solid rgba(255,255,255,0.07)',
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: '11.5px',
          lineHeight: 1.7,
          color: 'rgba(255,255,255,0.65)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          marginBottom: '16px',
          maxHeight: '45vh',
        }}>
          {content}
        </div>

        {/* Info tip */}
        <p style={{
          fontSize: '11px', color: 'rgba(255,255,255,0.25)',
          textAlign: 'center', marginBottom: '12px',
          lineHeight: 1.5,
        }}>
          Copy lalu paste ke ChatGPT, Claude, atau Gemini untuk analisis mendalam.
        </p>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleCopy}
            style={{
              flex: 1, padding: '14px',
              borderRadius: '14px',
              background: copied
                ? 'rgba(16,185,129,0.15)'
                : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              border: copied
                ? '0.5px solid rgba(16,185,129,0.4)'
                : 'none',
              color: 'white',
              fontSize: '14px', fontWeight: 600,
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '7px',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.25s ease',
              boxShadow: copied ? 'none' : '0 4px 16px rgba(99,102,241,0.3)',
            }}
          >
            {copied
              ? <><Check size={15} strokeWidth={2.5} /><span style={{ color: '#34D399' }}>Copied!</span></>
              : <><Copy size={15} strokeWidth={2} />Copy to Clipboard</>
            }
          </button>

          <button
            onClick={handleDownload}
            title={`Download .${format === 'json' ? 'json' : 'md'}`}
            style={{
              padding: '14px 16px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.06)',
              border: '0.5px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              WebkitTapHighlightColor: 'transparent',
              transition: 'background 0.15s',
            }}
          >
            <Download size={16} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </div>
  )
}
