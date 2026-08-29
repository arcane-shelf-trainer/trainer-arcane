// Zones cliquables posées sur la carte du jeu (src/assets/carte.png, 2022 x 778 :
// les deux étages composés sur une seule vue, l'escalier à gauche, le fond à droite).
// Toutes les zones ont la même taille, centrée sur le cadre d'identifiant de chaque
// étagère : des cibles régulières, plus faciles à viser. Les coordonnées sont en
// pixels de l'image et converties en pourcentages pour suivre son redimensionnement.

export interface Zone {
  gauche: number // en % de la largeur de l'image
  haut: number // en % de la hauteur
  largeur: number
  hauteur: number
}

const IMAGE = { largeur: 2022, hauteur: 778 }

// Taille commune, en pixels de l'image. Assez grande pour englober le cadre et une
// marge, assez petite pour ne jamais chevaucher une voisine.
export const TAILLE = { largeur: 140, hauteur: 90 }

// Centres des cadres d'identifiants, en pixels de l'image.
export const CENTRES: Record<string, [number, number]> = {
  // Second étage, galerie du haut
  '2A': [597, 86],
  '2C': [812, 86],
  '2E': [1018, 86],
  '2G': [1230, 86],
  '2I': [1438, 86],
  '2K': [1650, 86],
  // Premier étage, rangée du haut
  '1A': [630, 253],
  '1C': [785, 233],
  '1E': [955, 253],
  '1G': [1120, 233],
  '1I': [1285, 253],
  '1K': [1440, 225],
  // Premier étage, alcôve du fond
  '1M': [1618, 262],
  '1N': [1618, 417],
  // Premier étage, rangée du bas
  '1B': [630, 483],
  '1D': [787, 488],
  '1F': [950, 483],
  '1H': [1115, 488],
  '1J': [1280, 483],
  '1L': [1432, 513],
  // Second étage, galerie du bas
  '2B': [605, 654],
  '2D': [812, 654],
  '2F': [1015, 654],
  '2H': [1230, 654],
  '2J': [1437, 654],
  '2L': [1642, 654],
  // Second étage, mur du fond
  '2M': [1895, 122],
  '2N': [1895, 240],
  '2O': [1911, 372],
  '2P': [1895, 491],
  '2Q': [1895, 616],
}

export const ZONES: Record<string, Zone> = Object.fromEntries(
  Object.entries(CENTRES).map(([section, [cx, cy]]) => [
    section,
    {
      gauche: ((cx - TAILLE.largeur / 2) / IMAGE.largeur) * 100,
      haut: ((cy - TAILLE.hauteur / 2) / IMAGE.hauteur) * 100,
      largeur: (TAILLE.largeur / IMAGE.largeur) * 100,
      hauteur: (TAILLE.hauteur / IMAGE.hauteur) * 100,
    },
  ]),
)
