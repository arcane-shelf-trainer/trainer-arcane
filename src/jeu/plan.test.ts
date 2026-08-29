import { describe, expect, it } from 'vitest'
import { SECTIONS } from './catalogue'
import { ZONES } from './plan'

describe('plan', () => {
  it('chaque section du catalogue a une zone, et réciproquement', () => {
    const catalogue = SECTIONS.map((s) => s.section).sort()
    const plan = Object.keys(ZONES).sort()
    expect(plan).toEqual(catalogue)
  })
  it("toutes les zones tiennent dans l'image", () => {
    for (const [section, z] of Object.entries(ZONES)) {
      expect(z.gauche, section).toBeGreaterThanOrEqual(0)
      expect(z.haut, section).toBeGreaterThanOrEqual(0)
      expect(z.gauche + z.largeur, section).toBeLessThanOrEqual(100)
      expect(z.haut + z.hauteur, section).toBeLessThanOrEqual(100)
    }
  })
  it('deux zones ne se chevauchent jamais', () => {
    const entrees = Object.entries(ZONES)
    for (let i = 0; i < entrees.length; i++) {
      for (let j = i + 1; j < entrees.length; j++) {
        const [a, za] = entrees[i]
        const [b, zb] = entrees[j]
        const separees =
          za.gauche + za.largeur <= zb.gauche ||
          zb.gauche + zb.largeur <= za.gauche ||
          za.haut + za.hauteur <= zb.haut ||
          zb.haut + zb.hauteur <= za.haut
        expect(separees, `${a} et ${b}`).toBe(true)
      }
    }
  })
})
