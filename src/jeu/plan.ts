// Plan de la bibliothèque, d'après les cartes affichées dans le jeu près des
// escaliers. L'entrée et l'escalier sont à gauche ; le premier étage occupe le
// centre en deux rangées (A, C, E... en haut, B, D, F... en bas) et finit dans
// l'alcôve du fond avec 1M et 1N ; la galerie du second étage court le long des
// murs : 2A à 2K en haut, 2B à 2L en bas, 2M à 2Q sur le mur du fond.

export const PLAN = { largeur: 1000, hauteur: 385 }

export const BOITE = { largeur: 60, hauteur: 34 }

export interface Position {
  x: number // centre
  y: number // centre
}

export const POSITIONS: Record<string, Position> = {
  // Premier étage, rangée du haut
  '1A': { x: 315, y: 125 },
  '1C': { x: 392, y: 118 },
  '1E': { x: 470, y: 125 },
  '1G': { x: 552, y: 118 },
  '1I': { x: 635, y: 125 },
  '1K': { x: 712, y: 110 },
  // Premier étage, rangée du bas
  '1B': { x: 315, y: 238 },
  '1D': { x: 392, y: 240 },
  '1F': { x: 470, y: 238 },
  '1H': { x: 552, y: 240 },
  '1J': { x: 635, y: 238 },
  '1L': { x: 710, y: 255 },
  // Premier étage, alcôve du fond
  '1M': { x: 806, y: 135 },
  '1N': { x: 806, y: 205 },
  // Second étage, galerie du haut
  '2A': { x: 297, y: 45 },
  '2C': { x: 400, y: 45 },
  '2E': { x: 502, y: 45 },
  '2G': { x: 607, y: 45 },
  '2I': { x: 715, y: 45 },
  '2K': { x: 815, y: 45 },
  // Second étage, galerie du bas
  '2B': { x: 300, y: 322 },
  '2D': { x: 400, y: 325 },
  '2F': { x: 502, y: 322 },
  '2H': { x: 607, y: 325 },
  '2J': { x: 710, y: 322 },
  '2L': { x: 812, y: 325 },
  // Second étage, mur du fond
  '2M': { x: 938, y: 62 },
  '2N': { x: 938, y: 121 },
  '2O': { x: 938, y: 180 },
  '2P': { x: 938, y: 239 },
  '2Q': { x: 938, y: 298 },
}
