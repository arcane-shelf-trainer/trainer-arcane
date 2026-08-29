// Zones cliquables posées sur la carte du jeu (src/assets/carte.png, 2022 x 778 :
// les deux étages composés sur une seule vue, l'escalier à gauche, le fond à droite).
// Chaque zone couvre le pictogramme complet de l'étagère : le cadre d'identifiant et
// ses flèches (galeries et premier étage), ou le cadre entier (mur du fond). Les
// coordonnées sont en pixels de l'image et converties en pourcentages pour suivre
// son redimensionnement.

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
  // Second étage, galerie du haut : cadre et flèches vers le bas
  '2A': zone(518, 56, 682, 170),
  '2C': zone(742, 56, 884, 120),
  '2E': zone(938, 56, 1100, 170),
  '2G': zone(1156, 56, 1304, 120),
  '2I': zone(1358, 56, 1524, 170),
  '2K': zone(1572, 56, 1732, 120),
  // Premier étage, rangée du haut : cadre et flèches vers le bas
  '1A': zone(570, 206, 690, 302),
  '1C': zone(732, 203, 838, 262),
  '1E': zone(902, 206, 1008, 302),
  '1G': zone(1052, 203, 1188, 262),
  '1I': zone(1232, 206, 1338, 302),
  '1K': zone(1392, 196, 1488, 252),
  // Premier étage, alcôve du fond
  '1M': zone(1568, 234, 1668, 290),
  '1N': zone(1568, 390, 1668, 446),
  // Premier étage, rangée du bas : flèches vers le haut et cadre
  '1B': zone(570, 416, 690, 514),
  '1D': zone(736, 423, 838, 518),
  '1F': zone(892, 416, 1008, 514),
  '1H': zone(1052, 423, 1178, 518),
  '1J': zone(1222, 416, 1338, 514),
  '1L': zone(1388, 448, 1478, 544),
  // Second étage, galerie du bas : flèches vers le haut et cadre
  '2B': zone(542, 564, 668, 686),
  '2D': zone(738, 564, 888, 686),
  '2F': zone(946, 564, 1084, 686),
  '2H': zone(1152, 564, 1308, 686),
  '2J': zone(1376, 564, 1498, 686),
  '2L': zone(1566, 564, 1718, 686),
  // Second étage, mur du fond : cadres entiers
  '2M': zone(1833, 70, 1957, 174),
  '2N': zone(1833, 188, 1957, 292),
  '2O': zone(1863, 303, 1959, 442),
  '2P': zone(1833, 445, 1957, 537),
  '2Q': zone(1833, 565, 1957, 667),
}
