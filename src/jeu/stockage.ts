import type { Progres } from './leitner'
import type { Langue } from '../textes'

const CLE_PROGRES = 'arcane-librarian-progres'
const CLE_RECORDS = 'arcane-librarian-records'
const CLE_LANGUE = 'arcane-librarian-langue'

export type Records = Record<string, number>

function lire<T>(cle: string, defaut: T): T {
  try {
    const brut = localStorage.getItem(cle)
    return brut ? (JSON.parse(brut) as T) : defaut
  } catch {
    return defaut
  }
}

function ecrire(cle: string, valeur: unknown): void {
  try {
    localStorage.setItem(cle, JSON.stringify(valeur))
  } catch {
    // Stockage indisponible : on continue sans mémoire.
  }
}

export const chargerProgres = () => lire<Progres>(CLE_PROGRES, {})
export const sauvegarderProgres = (p: Progres) => ecrire(CLE_PROGRES, p)
export const chargerRecords = () => lire<Records>(CLE_RECORDS, {})
export const sauvegarderRecords = (r: Records) => ecrire(CLE_RECORDS, r)
export const sauvegarderLangue = (l: Langue) => ecrire(CLE_LANGUE, l)

// Langue mémorisée, sinon celle du navigateur (français si francophone, anglais sinon).
export function chargerLangue(): Langue {
  const memorisee = lire<Langue | null>(CLE_LANGUE, null)
  if (memorisee === 'fr' || memorisee === 'en') return memorisee
  try {
    return navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en'
  } catch {
    return 'en'
  }
}

export function effacerTout(): void {
  try {
    localStorage.removeItem(CLE_PROGRES)
    localStorage.removeItem(CLE_RECORDS)
  } catch {
    // Rien à effacer.
  }
}
