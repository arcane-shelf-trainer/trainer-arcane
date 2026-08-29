import table from '../donnees/visuels.json'

// Les visuels des livres, extraits de la feuille Google du catalogue (images de
// cellules) : couverture, tranche et scène en jeu, en WebP dans src/assets/livres,
// nommés NNN-couverture.webp, NNN-tranche.webp, NNN-scene.webp (NNN = rang du
// livre dans le catalogue, à partir de 1).
const fichiers = import.meta.glob('../assets/livres/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const parNom = new Map(
  Object.entries(fichiers).map(([chemin, url]) => [chemin.split('/').pop() ?? chemin, url]),
)

const rangParTitre = table as Record<string, number>

export interface Visuels {
  couverture: string | null
  tranche: string | null
  scene: string | null
}

export function visuelsDe(titre: string): Visuels {
  const rang = rangParTitre[titre]
  if (!rang) return { couverture: null, tranche: null, scene: null }
  const nom = (genre: string) => parNom.get(`${String(rang).padStart(3, '0')}-${genre}.webp`) ?? null
  return { couverture: nom('couverture'), tranche: nom('tranche'), scene: nom('scene') }
}
