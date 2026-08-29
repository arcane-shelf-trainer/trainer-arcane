// Zones cliquables posées sur la carte du jeu (src/assets/carte.png, 2022 x 778 :
// les deux étages composés sur une seule vue, l'escalier à gauche, le fond à droite).
// Chaque zone épouse le cadre d'identifiant dessiné sur la carte. Les coordonnées
// sont en pixels de l'image et converties en pourcentages pour suivre son
// redimensionnement.

export interface Zone {
  gauche: number // en % de la largeur de l'image
  haut: number // en % de la hauteur
  largeur: number
  hauteur: number
}

const IMAGE = { largeur: 2022, hauteur: 778 }

function zone(x1: number, y1: number, x2: number, y2: number): Zone {
  return {
    gauche: (x1 / IMAGE.largeur) * 100,
    haut: (y1 / IMAGE.hauteur) * 100,
    largeur: ((x2 - x1) / IMAGE.largeur) * 100,
    hauteur: ((y2 - y1) / IMAGE.hauteur) * 100,
  }
}

export const ZONES: Record<string, Zone> = {
  // Second étage, galerie du haut
  '2A': zone(553, 62, 642, 110),
  '2C': zone(755, 62, 870, 110),
  '2E': zone(975, 62, 1062, 110),
  '2G': zone(1170, 62, 1290, 110),
  '2I': zone(1398, 62, 1478, 110),
  '2K': zone(1598, 62, 1702, 110),
  // Premier étage, rangée du haut
  '1A': zone(590, 226, 670, 270),
  '1C': zone(740, 212, 830, 255),
  '1E': zone(920, 226, 990, 270),
  '1G': zone(1060, 212, 1180, 255),
  '1I': zone(1250, 226, 1320, 270),
  '1K': zone(1400, 205, 1480, 245),
  // Premier étage, alcôve du fond
  '1M': zone(1575, 242, 1660, 282),
  '1N': zone(1575, 398, 1660, 436),
  // Premier étage, rangée du bas
  '1B': zone(590, 458, 670, 508),
  '1D': zone(745, 465, 830, 512),
  '1F': zone(910, 458, 990, 508),
  '1H': zone(1060, 465, 1170, 512),
  '1J': zone(1240, 458, 1320, 508),
  '1L': zone(1395, 488, 1470, 538),
  // Second étage, galerie du bas
  '2B': zone(560, 628, 650, 680),
  '2D': zone(755, 628, 870, 680),
  '2F': zone(965, 628, 1065, 680),
  '2H': zone(1170, 628, 1290, 680),
  '2J': zone(1395, 628, 1480, 680),
  '2L': zone(1585, 628, 1700, 680),
  // Second étage, mur du fond
  '2M': zone(1840, 76, 1950, 114),
  '2N': zone(1850, 202, 1950, 240),
  '2O': zone(1862, 306, 1955, 344),
  '2P': zone(1855, 446, 1950, 484),
  '2Q': zone(1845, 566, 1950, 606),
}
