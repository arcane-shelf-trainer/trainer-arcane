import { describe, expect, it } from 'vitest'
import { SECTIONS } from './catalogue'
import { BOITE, PLAN, POSITIONS } from './plan'

describe('plan', () => {
  it('chaque section du catalogue a une position, et réciproquement', () => {
    const catalogue = SECTIONS.map((s) => s.section).sort()
    const plan = Object.keys(POSITIONS).sort()
    expect(plan).toEqual(catalogue)
  })
  it('toutes les boîtes tiennent dans le plan', () => {
    for (const [section, p] of Object.entries(POSITIONS)) {
      expect(p.x - BOITE.largeur / 2, section).toBeGreaterThanOrEqual(0)
      expect(p.x + BOITE.largeur / 2, section).toBeLessThanOrEqual(PLAN.largeur)
      expect(p.y - BOITE.hauteur / 2, section).toBeGreaterThanOrEqual(0)
      expect(p.y + BOITE.hauteur / 2, section).toBeLessThanOrEqual(PLAN.hauteur)
    }
  })
  it('deux boîtes ne se chevauchent jamais', () => {
    const entrees = Object.entries(POSITIONS)
    for (let i = 0; i < entrees.length; i++) {
      for (let j = i + 1; j < entrees.length; j++) {
        const [a, pa] = entrees[i]
        const [b, pb] = entrees[j]
        const separees =
          Math.abs(pa.x - pb.x) >= BOITE.largeur || Math.abs(pa.y - pb.y) >= BOITE.hauteur
        expect(separees, `${a} et ${b}`).toBe(true)
      }
    }
  })
})
