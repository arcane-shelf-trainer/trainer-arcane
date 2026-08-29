import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles.css'

createRoot(document.getElementById('racine')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Hors-ligne et installation sur téléphone : le service worker n'est enregistré que sur
// le site construit (en développement, il gênerait le rechargement à chaud).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Sans service worker, le site fonctionne normalement, en ligne.
    })
  })
}
