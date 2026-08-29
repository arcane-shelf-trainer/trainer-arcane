import { describe, expect, it } from 'vitest'
import {
  BOITE_MAX,
  INTERVALLES,
  aRevoir,
  choisir,
  enregistrer,
  fiche,
  maitrise,
  nouveaux,
} from './leitner'

const MINUTE = 60_000
const JOUR = 24 * 60 * MINUTE

describe('enregistrer', () => {
  it("une bonne réponse monte d'une boîte, plafonnée", () => {
    let p = enregistrer({}, 'a', true)
    expect(fiche(p, 'a').boite).toBe(1)
    for (let i = 0; i < 10; i++) p = enregistrer(p, 'a', true)
    expect(fiche(p, 'a').boite).toBe(BOITE_MAX)
    expect(fiche(p, 'a').vues).toBe(11)
  })
  it('une erreur ramène en boîte 0 et se compte', () => {
    let p = enregistrer({}, 'a', true)
    p = enregistrer(p, 'a', true)
    p = enregistrer(p, 'a', false)
    expect(fiche(p, 'a')).toEqual({ boite: 0, vues: 3, erreurs: 1, serie: 0, echeance: MINUTE })
  })
  it("l'échéancier s'allonge avec la série : dix minutes, un jour, trois jours...", () => {
    const t = 1_000_000
    let p = enregistrer({}, 'a', true, t)
    expect(fiche(p, 'a').echeance).toBe(t + 10 * MINUTE)
    p = enregistrer(p, 'a', true, t)
    expect(fiche(p, 'a').echeance).toBe(t + JOUR)
    p = enregistrer(p, 'a', true, t)
    expect(fiche(p, 'a').echeance).toBe(t + 3 * JOUR)
    for (let i = 0; i < 10; i++) p = enregistrer(p, 'a', true, t)
    expect(fiche(p, 'a').echeance).toBe(t + INTERVALLES[INTERVALLES.length - 1])
  })
  it('une erreur remet la série à zéro et rappelle vite', () => {
    const t = 5_000_000
    let p = enregistrer({}, 'a', true, t)
    p = enregistrer(p, 'a', true, t)
    p = enregistrer(p, 'a', false, t)
    expect(fiche(p, 'a').serie).toBe(0)
    expect(fiche(p, 'a').echeance).toBe(t + MINUTE)
  })
  it('une ancienne fiche sans échéancier est due tout de suite', () => {
    const p = { a: { boite: 3, vues: 5, erreurs: 1 } } as never
    expect(fiche(p, 'a').serie).toBe(3)
    expect(fiche(p, 'a').echeance).toBe(0)
  })
})

describe('aRevoir et nouveaux', () => {
  it('sépare les dus, les à venir et les jamais vus', () => {
    const t = 1_000_000_000
    let p = enregistrer({}, 'due', true, t - 2 * JOUR) // échéance dépassée
    p = enregistrer(p, 'plusTard', true, t) // échéance dans dix minutes
    expect(aRevoir(p, ['due', 'plusTard', 'jamais'], t)).toEqual(['due'])
    expect(nouveaux(p, ['due', 'plusTard', 'jamais'])).toEqual(['jamais'])
  })
  it('classe les dus par échéance, les plus anciens en premier', () => {
    const t = 9_000_000_000
    let p = enregistrer({}, 'b', true, t - 3 * JOUR)
    p = enregistrer(p, 'a', true, t - 5 * JOUR)
    expect(aRevoir(p, ['b', 'a'], t)).toEqual(['a', 'b'])
  })
})

describe('choisir', () => {
  it('favorise les inconnus', () => {
    const p = { b: { boite: 4, vues: 4, erreurs: 0, serie: 4, echeance: 0 } }
    // Poids : a = 8, b = 1. Tout tirage sous 8/9 donne a.
    expect(choisir(p, ['a', 'b'], 0.5)).toBe('a')
    expect(choisir(p, ['a', 'b'], 0.95)).toBe('b')
  })
  it('évite la clé précédente', () => {
    expect(choisir({}, ['a', 'b'], 0.0, 'a')).toBe('b')
  })
  it('accepte une seule clé même exclue', () => {
    expect(choisir({}, ['a'], 0.3, 'a')).toBe('a')
  })
})

describe('maitrise', () => {
  it('vaut 0 sans progrès et 1 quand tout est en boîte max', () => {
    expect(maitrise({}, ['a', 'b'])).toBe(0)
    const f = { boite: 4, vues: 1, erreurs: 0, serie: 4, echeance: 0 }
    expect(maitrise({ a: f, b: f }, ['a', 'b'])).toBe(1)
    expect(maitrise({ a: f }, [])).toBe(0)
  })
})
