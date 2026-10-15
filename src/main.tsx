import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import './index.css'
import App from './App.tsx'
import PasswordGate from './components/PasswordGate.tsx'

// The service worker's asset caching races with the WebViewAssetLoader's local
// asset reads inside the Capacitor shell (observed as broken images/icons in
// release builds only). All assets are already bundled natively, so skip it there.
if (!Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  const base = import.meta.env.BASE_URL
  window.addEventListener('load', () => navigator.serviceWorker.register(`${base}sw.js`, { scope: base }))
}

const app = Capacitor.isNativePlatform() ? (
  <App />
) : (
  <PasswordGate>
    <App />
  </PasswordGate>
)

createRoot(document.getElementById('root')!).render(<StrictMode>{app}</StrictMode>)
