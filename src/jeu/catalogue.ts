import donnees from '../donnees/livres.json'

export interface Livre {
  titre: string
  categorie: string
  section: string
  volumes: number
}

export type Etage = '1' | '2'

export interface Section {
  section: string
  categorie: string
  etage: Etage
}

export const LIVRES: Livre[] = donnees as Livre[]

const parSection = new Map<string, Section>()
for (const livre of LIVRES) {
  if (!parSection.has(livre.section)) {
    parSection.set(livre.section, {
      section: livre.section,
      categorie: livre.categorie,
      etage: livre.section[0] as Etage,
    })
  }
}

export const SECTIONS: Section[] = [...parSection.values()].sort((a, b) =>
  a.section.localeCompare(b.section),
)

export function categorieDe(section: string): string {
  return parSection.get(section)?.categorie ?? ''
}
