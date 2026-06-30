import { NextResponse } from 'next/server'
import { resetDaily } from '@/lib/cron/resetDaily'
import { snapshotDaily } from '@/lib/cron/snapshotDaily'
import { flagOverdue } from '@/lib/cron/flagOverdue'
import { runAutomations } from '@/lib/cron/runAutomations'
import { sendMorningBriefing } from '@/lib/cron/sendBriefing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // 1. Cron auth check
  const expectedSecret = process.env.CRON_SECRET
  if (expectedSecret) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${expectedSecret}`) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }

  // 2. Determine yesterday's date in WIB (UTC + 7 hours)
  const utcNow = new Date()
  const wibTime = new Date(utcNow.getTime() + 7 * 60 * 60 * 1000)
  wibTime.setDate(wibTime.getDate() - 1)
  const yesterdayStr = wibTime.toISOString().split('T')[0] // YYYY-MM-DD

  const results: Record<string, any> = {}
  const errors: Record<string, string> = {}

  // 3. Daily Snapshot (yesterday's data)
  try {
    await snapshotDaily(yesterdayStr)
    results.snapshot = 'ok'
  } catch (e: any) {
    errors.snapshot = e.message
    console.error('[CRON daily] Snapshot error:', e)
  }

  // 4. Daily Reset
  try {
    await resetDaily()
    results.reset = 'ok'
  } catch (e: any) {
    errors.reset = e.message
    console.error('[CRON daily] Reset error:', e)
  }

  // 5. Flag overdue tasks
  try {
    await flagOverdue()
    results.overdue = 'ok'
  } catch (e: any) {
    errors.overdue = e.message
    console.error('[CRON daily] Flag overdue error:', e)
  }

  // 6. Run Finance Automations (Auto-Pilot rules catch-up)
  try {
    await runAutomations()
    results.automations = 'ok'
  } catch (e: any) {
    errors.automations = e.message
    console.error('[CRON daily] Automations error:', e)
  }

  // 7. Send Daily Briefing notifications
  try {
    const briefingResult = await sendMorningBriefing()
    results.briefing = briefingResult
  } catch (e: any) {
    errors.briefing = e.message
    console.error('[CRON daily] Briefing notification error:', e)
  }

  // 8. Weekly Recap — runs every Monday
  const isMonday = new Date().getDay() === 1
  if (isMonday && process.env.NEXT_PUBLIC_APP_URL) {
    try {
      const recapRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/recap/scheduled`, {
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` }
      })
      const recapData = await recapRes.json()
      results.scheduledRecap = recapData.success ? 'ok' : recapData.error
    } catch (e: any) {
      errors.scheduledRecap = e.message
      console.error('[CRON daily] Scheduled recap error:', e)
    }
  }

  console.log('[CRON daily] Completed daily routine:', {
    date: yesterdayStr,
    results,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  })

  return NextResponse.json({
    success: true,
    date: yesterdayStr,
    results,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  })
}

export async function POST(req: Request) {
  return GET(req)
}
