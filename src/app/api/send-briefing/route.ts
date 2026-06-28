import { NextResponse } from 'next/server'
import { sendMorningBriefing } from '@/lib/cron/sendBriefing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // ---- 1. Cron auth check ----
  const expected = process.env.CRON_SECRET
  if (expected) {
    const got = req.headers.get('authorization')
    if (got !== `Bearer ${expected}`) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }

  try {
    const result = await sendMorningBriefing()
    return NextResponse.json({ ok: true, ...result })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  return GET(req)
}
