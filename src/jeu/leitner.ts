// Répétition espacée par boîtes de Leitner. Tout est pur : le hasard est passé en
// paramètre pour que la logique reste testable.

export interface Fiche {
  boite: number // 0 (inconnu) à 4 (maîtrisé)
  vues: number
  erreurs: number
}

export type Progres = Record<string, Fiche>

export const BOITE_MAX = 4

// Poids de tirage par boîte : les inconnus reviennent souvent, les maîtrisés rarement.
export const POIDS = [8, 5, 3, 2, 1]

export function fiche(progres: Progres, cle: string): Fiche {
  return progres[cle] ?? { boite: 0, vues: 0, erreurs: 0 }
}

export function enregistrer(progres: Progres, cle: string, correct: boolean): Progres {
  const f = fiche(progres, cle)
  return {
    ...progres,
    [cle]: {
      boite: correct ? Math.min(f.boite + 1, BOITE_MAX) : 0,
      vues: f.vues + 1,
      erreurs: f.erreurs + (correct ? 0 : 1),
    },
  }
}

// Tire une clé au hasard, pondérée par la boîte, en évitant la précédente.
export function choisir(progres: Progres, cles: string[], alea: number, exclure?: string): string {
  const candidats = exclure && cles.length > 1 ? cles.filter((c) => c !== exclure) : cles
  const poids = candidats.map((c) => POIDS[fiche(progres, c).boite])
  const total = poids.reduce((a, b) => a + b, 0)
  let r = alea * total
  for (let i = 0; i < candidats.length; i++) {
    r -= poids[i]
    if (r < 0) return candidats[i]
  }
  return candidats[candidats.length - 1]
}

// Maîtrise moyenne de 0 à 1.
export function maitrise(progres: Progres, cles: string[]): number {
  if (cles.length === 0) return 0
  return cles.reduce((s, c) => s + fiche(progres, c).boite, 0) / (BOITE_MAX * cles.length)
}
