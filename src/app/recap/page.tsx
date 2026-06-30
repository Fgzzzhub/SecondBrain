import { RecapBuilder } from './RecapBuilder'

export const metadata = {
  title: 'Data Recap — Second Brain',
  description: 'Export data terstruktur untuk analisis AI. Pilih kategori, periode, dan format output.',
}

export default function RecapPage() {
  return (
    <div style={{ padding: '0 16px' }}>
      <div style={{ padding: '20px 0 24px' }}>
        <p style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '4px',
          margin: '0 0 4px',
        }}>
          Export & Analysis
        </p>
        <h1 style={{
          fontSize: '26px',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.92)',
          letterSpacing: '-0.02em',
          margin: '0 0 6px',
        }}>
          Data Recap
        </h1>
        <p style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.38)',
          margin: 0,
          lineHeight: 1.5,
        }}>
          Pilih data dan periode, lalu export ke AI manapun untuk analisis mendalam.
        </p>
      </div>

      <RecapBuilder />
    </div>
  )
}
