/**
 * Service worker for Web Push.
 * Served statically from /public (no build step), which keeps it compatible
 * with the Turbopack dev server. `push` renders a notification;
 * `notificationclick` opens the target URL (or focuses an existing client).
 */

self.addEventListener('push', (event) => {
  let payload = {}

  if (event.data) {
    try {
      payload = event.data.json()
    } catch {
      payload = { title: 'Brain OS', body: event.data.text() }
    }
  }

  const title = payload.title ?? 'Brain OS'
  const options = {
    body: payload.body ?? '',
    icon: payload.icon ?? '/icon.svg',
    badge: payload.badge ?? '/icon.svg',
    tag: payload.tag ?? 'brain-os',
    renotify: false,
    data: { url: payload.url ?? '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        // If an existing tab is already on the target, focus it.
        const url = new URL(client.url)
        if (url.pathname === target && 'focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(target)
    }),
  )
})
