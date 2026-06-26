/**
 * Web Push client helpers.
 * - Converts the urlBase64 VAPID public key into the Uint8Array the
 *   PushManager.subscribe API expects.
 * - subscribeToPush() asks the SW for an existing subscription, otherwise
 *   creates one and POSTs it to /api/save-subscription.
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  // Allocate a fresh ArrayBuffer (not SharedArrayBuffer) so the resulting view
  // is acceptable as a BufferSource on stricter TS lib.dom typings.
  const buffer = new ArrayBuffer(rawData.length)
  const out = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; i++) out[i] = rawData.charCodeAt(i)
  return out
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/**
 * Registers the static /sw.js service worker. Safe to call repeatedly — the
 * browser dedupes registrations by URL. Required before `serviceWorker.ready`
 * will ever resolve (previously handled by next-pwa, now done explicitly).
 */
export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null
  return navigator.serviceWorker.register('/sw.js', {
    scope: '/',
    updateViaCache: 'none',
  })
}

export async function subscribeToPush(): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!isPushSupported()) {
    return { ok: false, reason: 'Browser tidak support Web Push' }
  }
  if (!VAPID_PUBLIC_KEY) {
    return { ok: false, reason: 'VAPID public key belum di-set (NEXT_PUBLIC_VAPID_PUBLIC_KEY)' }
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { ok: false, reason: 'Izin notifikasi ditolak' }
  }

  await ensureServiceWorker()
  const reg = await navigator.serviceWorker.ready

  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  const raw = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
  if (!raw.endpoint || !raw.keys?.p256dh || !raw.keys?.auth) {
    return { ok: false, reason: 'Subscription invalid' }
  }

  const res = await fetch('/api/save-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: raw.endpoint,
      keys: { p256dh: raw.keys.p256dh, auth: raw.keys.auth },
      userAgent: navigator.userAgent,
    }),
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => 'unknown error')
    return { ok: false, reason: `Gagal simpan ke server: ${txt}` }
  }

  return { ok: true }
}
