import { useEffect } from 'react'
import { ScreenOrientation } from '@capacitor/screen-orientation'

const LANDSCAPE_SCREENS = new Set(['general', 'end', 'historyDetail'])

/** Locks the device orientation to match the current screen — landscape for the
 * wide multi-table views (general table, game end, history detail), portrait
 * for everything else. No-ops silently outside the native app. */
export function useOrientationLock(screenName: string) {
  useEffect(() => {
    const orientation = LANDSCAPE_SCREENS.has(screenName) ? 'landscape' : 'portrait'
    ScreenOrientation.lock({ orientation }).catch(() => {
      // not running in the native app (e.g. plain browser/dev server) — ignore
    })
  }, [screenName])
}
