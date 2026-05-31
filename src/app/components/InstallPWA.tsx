'use client'

import { useState, useEffect } from 'react'
import { Download, X, Share } from 'lucide-react'

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [showiOSModal, setShowiOSModal] = useState(false)

  useEffect(() => {
    // Listen for the beforeinstallprompt event (Android / Desktop Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Check if app is already running in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    
    // Check if it is iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream

    if (isIOS && !isStandalone) {
      // Always show the install button for iOS users to guide them on how to add to homescreen
      setShowInstallButton(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream

    if (isIOS) {
      setShowiOSModal(true)
      return
    }

    if (!deferredPrompt) return

    // Show prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install prompt')
    } else {
      console.log('User dismissed the PWA install prompt')
    }

    setDeferredPrompt(null)
    setShowInstallButton(false)
  }

  if (!showInstallButton) return null

  return (
    <>
      <div className="mt-6 pt-6 border-t border-neutral-800 flex flex-col items-center">
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.01] cursor-pointer"
        >
          <Download className="w-4 h-4 stroke-[2px]" />
          Install Second Brain App
        </button>
        <p className="text-[10px] text-neutral-500 mt-2 text-center">
          Install the app on your device for offline access and full PWA features.
        </p>
      </div>

      {/* iOS Instructions Modal */}
      {showiOSModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-xs p-6 bg-neutral-900 dark:bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Install on iOS</span>
              <button
                onClick={() => setShowiOSModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4 stroke-[1.5px]" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs text-neutral-300">
              <p className="leading-relaxed">
                To install this application on your iPhone or iPad:
              </p>
              <ol className="list-decimal pl-4 flex flex-col gap-2">
                <li className="pl-1">
                  Tap the <strong className="text-white inline-flex items-center gap-1 font-semibold">Share icon <Share className="w-3.5 h-3.5 inline-block text-indigo-400 stroke-[1.5px]" /></strong> in Safari's bottom toolbar.
                </li>
                <li className="pl-1">
                  Scroll down and tap <strong className="text-white font-semibold">"Add to Home Screen"</strong>.
                </li>
              </ol>
            </div>

            <button
              onClick={() => setShowiOSModal(false)}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  )
}
