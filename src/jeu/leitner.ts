// Répétition espacée. Deux mécanismes : les boîtes de Leitner (poids de tirage dans
// une session, et mesure de maîtrise) et un échéancier dans le temps (à la manière
// d'Anki : une bonne réponse repousse le prochain passage de dix minutes, puis un jour,
// trois, sept, vingt et un, quarante-cinq, quatre-vingt-dix). Tout est pur : le hasard
// et l'heure sont passés en paramètres.

export interface Fiche {
  boite: number // 0 (inconnu) à 4 (maîtrisé), pour le poids de tirage et la maîtrise
  vues: number
  erreurs: number
  serie: number // bonnes réponses consécutives, pour l'échéancier
  echeance: number // horodatage (ms) du prochain passage ; 0 = tout de suite
}

export type Progres = Record<string, Fiche>

export const BOITE_MAX = 4

// Poids de tirage par boîte : les inconnus reviennent souvent, les maîtrisés rarement.
export const POIDS = [8, 5, 3, 2, 1]

const MINUTE = 60_000
const JOUR = 24 * 60 * MINUTE

// Délai avant le prochain passage selon la série de bonnes réponses (0 = après une faute).
export const INTERVALLES = [
  MINUTE,
  10 * MINUTE,
  JOUR,
  3 * JOUR,
  7 * JOUR,
  21 * JOUR,
  45 * JOUR,
  90 * JOUR,
]

export function fiche(progres: Progres, cle: string): Fiche {
  const f = progres[cle]
  if (!f) return { boite: 0, vues: 0, erreurs: 0, serie: 0, echeance: 0 }
  // Anciennes fiches (avant l'échéancier) : la série vaut la boîte, échéance immédiate.
  const ancienne = f as Partial<Fiche> & Pick<Fiche, 'boite' | 'vues' | 'erreurs'>
  return {
    boite: ancienne.boite,
    vues: ancienne.vues,
    erreurs: ancienne.erreurs,
    serie: ancienne.serie ?? ancienne.boite,
    echeance: ancienne.echeance ?? 0,
  }
}

export function enregistrer(
  progres: Progres,
  cle: string,
  correct: boolean,
  maintenant = 0,
): Progres {
  const f = fiche(progres, cle)
  const serie = correct ? f.serie + 1 : 0
  const delai = INTERVALLES[Math.min(serie, INTERVALLES.length - 1)]
  return {
    ...progres,
    [cle]: {
      boite: correct ? Math.min(f.boite + 1, BOITE_MAX) : 0,
      vues: f.vues + 1,
      erreurs: f.erreurs + (correct ? 0 : 1),
      serie,
      echeance: maintenant + delai,
    },
  }
}

// Les clés déjà vues dont l'échéance est passée, les plus anciennes d'abord.
export function aRevoir(progres: Progres, cles: string[], maintenant: number): string[] {
  return cles
    .filter((c) => {
      const f = fiche(progres, c)
      return f.vues > 0 && f.echeance <= maintenant
    })
    .sort((a, b) => fiche(progres, a).echeance - fiche(progres, b).echeance)
}

// Les clés jamais vues, dans l'ordre donné (celui du catalogue : étagère par étagère).
export function nouveaux(progres: Progres, cles: string[]): string[] {
  return cles.filter((c) => fiche(progres, c).vues === 0)
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
