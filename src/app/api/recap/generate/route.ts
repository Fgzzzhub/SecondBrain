import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { fetchRecapData, type RecapCategory } from '@/lib/recap/dataFetchers'
import { formatAsMarkdown, formatAsJSON } from '@/lib/recap/formatters'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { categories, periodStart, periodEnd, format, periodLabel, saveToHistory } = await req.json()

    if (!categories || categories.length === 0) {
      return NextResponse.json({ error: 'No categories selected' }, { status: 400 })
    }

    if (!periodStart || !periodEnd) {
      return NextResponse.json({ error: 'Period dates are required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await fetchRecapData(categories as RecapCategory[], {
      start: periodStart,
      end: periodEnd,
    })

    const formatOpts = {
      data,
      categories: categories as RecapCategory[],
      periodLabel: periodLabel ?? `${periodStart} to ${periodEnd}`,
      periodStart,
      periodEnd,
    }

    const content = format === 'json'
      ? formatAsJSON(formatOpts)
      : formatAsMarkdown(formatOpts)

    if (saveToHistory) {
      const { error: insertErr } = await supabase.from('recap_history').insert({
        user_id: user.id,
        title: formatOpts.periodLabel,
        period_start: periodStart,
        period_end: periodEnd,
        categories,
        format: format ?? 'markdown',
        content,
        trigger_type: 'manual',
      })

      if (insertErr) {
        console.error('[recap/generate] Failed to save to history:', insertErr)
        // Non-fatal — still return content even if history save fails
      }
    }

    return NextResponse.json({ success: true, content, format: format ?? 'markdown' })
  } catch (err: any) {
    console.error('[recap/generate] Error:', err)
    return NextResponse.json({ error: err.message || 'Failed to generate recap' }, { status: 500 })
  }
}
