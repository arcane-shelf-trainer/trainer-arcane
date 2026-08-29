import { SECTIONS, type Etage } from './jeu/catalogue'
import { BOITE, PLAN, POSITIONS } from './jeu/plan'

export type Filtre = 'tous' | Etage

export interface Resultat {
  correct: boolean
  choisi: string
  attendu: string
  categorie: string
}

const ESCALIER = { cx: 150, cy: 192, rayons: [150, 122, 94, 66, 38] }

function arc(r: number): string {
  return `M ${ESCALIER.cx} ${ESCALIER.cy - r} A ${r} ${r} 0 0 1 ${ESCALIER.cx} ${ESCALIER.cy + r}`
}

function abrege(categorie: string): string {
  return categorie.length > 15 ? `${categorie.slice(0, 14)}.` : categorie
}

export function Plan({
  filtre,
  aide,
  saisie,
  resultat,
  surChoix,
}: {
  filtre: Filtre
  aide: boolean
  saisie: string
  resultat: Resultat | null
  surChoix: (section: string) => void
}) {
  return (
    <svg
      className="plan"
      viewBox={`0 0 ${PLAN.largeur} ${PLAN.hauteur}`}
      role="group"
      aria-label="Plan de la bibliothèque"
    >
      <rect className="plan-salle" x="14" y="12" width="972" height="361" rx="10" />
      {ESCALIER.rayons.map((r) => (
        <path key={r} className="plan-escalier" d={arc(r)} />
      ))}
      <rect className="plan-alcove" x="760" y="98" width="92" height="144" rx="14" />
      <text className="plan-legende" x="150" y="196">
        Escalier
      </text>
      <text className="plan-legende" x="514" y="187">
        Étage 1
      </text>
      <text className="plan-legende" x="514" y="24">
        Galerie de l'étage 2
      </text>
      <text className="plan-legende" x="514" y="366">
        Galerie de l'étage 2
      </text>
      <text className="plan-legende" x="938" y="24">
        Fond
      </text>

      {SECTIONS.map((s) => {
        const p = POSITIONS[s.section]
        let classe = 'plan-section'
        if (filtre !== 'tous' && s.etage !== filtre) classe += ' plan-section-inactive'
        if (resultat && s.section === resultat.attendu) classe += ' plan-section-attendu'
        if (resultat && !resultat.correct && s.section === resultat.choisi) {
          classe += ' plan-section-faute'
        }
        if (!resultat && saisie && s.section.startsWith(saisie)) classe += ' plan-section-active'
        return (
          <g
            key={s.section}
            className={classe}
            transform={`translate(${p.x - BOITE.largeur / 2}, ${p.y - BOITE.hauteur / 2})`}
            onClick={() => surChoix(s.section)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') surChoix(s.section)
            }}
            role="button"
            tabIndex={0}
            aria-label={`${s.section}, ${s.categorie}`}
          >
            <rect width={BOITE.largeur} height={BOITE.hauteur} rx="4" />
            <text className="plan-id" x={BOITE.largeur / 2} y={aide ? 15 : 22}>
              {s.section}
            </text>
            {aide && (
              <text className="plan-cat" x={BOITE.largeur / 2} y="27">
                {abrege(s.categorie)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
