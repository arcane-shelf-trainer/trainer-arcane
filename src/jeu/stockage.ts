import type { Progres } from './leitner'
import type { Langue } from '../textes'

const CLE_PROGRES = 'arcane-librarian-progres'
const CLE_RECORDS = 'arcane-librarian-records'
const CLE_LANGUE = 'arcane-librarian-langue'
const CLE_REGLAGES = 'arcane-librarian-reglages'
const CLE_SESSION = 'arcane-librarian-session'
const CLE_CONFUSIONS = 'arcane-librarian-confusions'

export type Records = Record<string, number>
export type Confusions = Record<string, number> // clé « attendu>choisi »

export interface Reglages {
  entrainement: 'session' | 'libre'
  affichage: 'complet' | 'couverture' | 'tranche'
  carte: 'noms' | 'identifiants' | 'muette'
  quotaNouveaux: number
  longueurChrono: number
  accueilVu: boolean
}

export interface Session {
  jour: string // AAAA-MM-JJ local
  nouveaux: number // nouveaux livres commencés ce jour
}

export const REGLAGES_DEFAUT: Reglages = {
  entrainement: 'session',
  affichage: 'complet',
  carte: 'identifiants',
  quotaNouveaux: 10,
  longueurChrono: 20,
  accueilVu: false,
}

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
export const chargerConfusions = () => lire<Confusions>(CLE_CONFUSIONS, {})
export const sauvegarderConfusions = (c: Confusions) => ecrire(CLE_CONFUSIONS, c)
export const chargerReglages = (): Reglages => ({ ...REGLAGES_DEFAUT, ...lire<Partial<Reglages>>(CLE_REGLAGES, {}) })
export const sauvegarderReglages = (r: Reglages) => ecrire(CLE_REGLAGES, r)
export const chargerSession = () => lire<Session>(CLE_SESSION, { jour: '', nouveaux: 0 })
export const sauvegarderSession = (s: Session) => ecrire(CLE_SESSION, s)
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

// Tout ce qui se sauvegarde, pour l'export et l'import.
export interface Sauvegarde {
  version: 1
  progres: Progres
  records: Records
  confusions: Confusions
  session: Session
}

export function exporterTout(): Sauvegarde {
  return {
    version: 1,
    progres: chargerProgres(),
    records: chargerRecords(),
    confusions: chargerConfusions(),
    session: chargerSession(),
  }
}

export function lireSauvegarde(texte: string): Sauvegarde | null {
  try {
    const lu = JSON.parse(texte)
    if (!lu || lu.version !== 1 || typeof lu.progres !== 'object') return null
    return {
      version: 1,
      progres: lu.progres ?? {},
      records: lu.records ?? {},
      confusions: lu.confusions ?? {},
      session: lu.session ?? { jour: '', nouveaux: 0 },
    }
  } catch {
    return null
  }
}

export function effacerTout(): void {
  try {
    for (const cle of [CLE_PROGRES, CLE_RECORDS, CLE_CONFUSIONS, CLE_SESSION]) {
      localStorage.removeItem(cle)
    }
  } catch {
    // Rien à effacer.
  }
}
