import { describe, expect, it } from 'vitest'
import { BOITE_MAX, choisir, enregistrer, fiche, maitrise } from './leitner'

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
    expect(fiche(p, 'a')).toEqual({ boite: 0, vues: 3, erreurs: 1 })
  })
})

describe('choisir', () => {
  it('favorise les inconnus', () => {
    const p = { b: { boite: 4, vues: 4, erreurs: 0 } }
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
    const p = { a: { boite: 4, vues: 1, erreurs: 0 }, b: { boite: 4, vues: 1, erreurs: 0 } }
    expect(maitrise(p, ['a', 'b'])).toBe(1)
    expect(maitrise(p, [])).toBe(0)
  })
})
