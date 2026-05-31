/**
 * Triggers a short vibration (haptic feedback) on supported devices/browsers (like Chrome/Android).
 * Safely checks if navigator.vibrate is available before invoking.
 * @param ms Duration of the vibration in milliseconds (default: 50ms)
 */
export function triggerHaptic(ms = 50) {
  if (
    typeof window !== 'undefined' &&
    window.navigator &&
    typeof window.navigator.vibrate === 'function'
  ) {
    try {
      window.navigator.vibrate(ms)
    } catch (e) {
      console.warn('Failed to trigger haptic feedback:', e)
    }
  }
}
