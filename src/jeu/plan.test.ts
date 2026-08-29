import { describe, expect, it } from 'vitest'
import { SECTIONS } from './catalogue'
import { CENTRES, TAILLE, ZONES } from './plan'

describe('plan', () => {
  it('chaque section du catalogue a une zone, et réciproquement', () => {
    const catalogue = SECTIONS.map((s) => s.section).sort()
    const plan = Object.keys(ZONES).sort()
    expect(plan).toEqual(catalogue)
  })
  it('toutes les zones ont la même taille', () => {
    const tailles = new Set(Object.values(ZONES).map((z) => `${z.largeur}x${z.hauteur}`))
    expect(tailles.size).toBe(1)
  })
  it("toutes les zones tiennent dans l'image", () => {
    for (const [section, z] of Object.entries(ZONES)) {
      expect(z.gauche, section).toBeGreaterThanOrEqual(0)
      expect(z.haut, section).toBeGreaterThanOrEqual(0)
      expect(z.gauche + z.largeur, section).toBeLessThanOrEqual(100)
      expect(z.haut + z.hauteur, section).toBeLessThanOrEqual(100)
    }
  })
  it('deux zones ne se chevauchent jamais, avec une marge de sécurité', () => {
    const marge = 8 // pixels de l'image
    const entrees = Object.entries(CENTRES)
    for (let i = 0; i < entrees.length; i++) {
      for (let j = i + 1; j < entrees.length; j++) {
        const [a, [ax, ay]] = entrees[i]
        const [b, [bx, by]] = entrees[j]
        const separees =
          Math.abs(ax - bx) >= TAILLE.largeur + marge || Math.abs(ay - by) >= TAILLE.hauteur + marge
        expect(separees, `${a} et ${b}`).toBe(true)
      }
    }
  })
})
