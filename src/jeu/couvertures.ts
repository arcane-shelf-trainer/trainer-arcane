import table from '../donnees/couvertures.json'

// Les 400 couvertures SVG (src/assets/couvertures), servies comme fichiers séparés.
const fichiers = import.meta.glob('../assets/couvertures/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const parNom = new Map(
  Object.entries(fichiers).map(([chemin, url]) => [chemin.split('/').pop() ?? chemin, url]),
)

const parTitre = table as Record<string, string>

export function urlCouverture(titre: string): string | null {
  const nom = parTitre[titre]
  if (!nom) return null
  return parNom.get(nom) ?? null
}
