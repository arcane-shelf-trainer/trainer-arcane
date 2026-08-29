import { SECTIONS, type Etage } from './jeu/catalogue'
import { ZONES } from './jeu/plan'
import carte from './assets/carte.png'
import carteMuette from './assets/carte-muette.png'

export type Filtre = 'tous' | Etage

export interface Resultat {
  correct: boolean
  choisi: string
  attendu: string
  categorie: string
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
    <div className="carte-plan" role="group" aria-label="Carte de la bibliothèque">
      <img
        className="carte-image"
        src={aide ? carte : carteMuette}
        alt="Carte de la bibliothèque, les deux étages"
        draggable={false}
      />
      {SECTIONS.map((s) => {
        const z = ZONES[s.section]
        let classe = 'zone'
        if (filtre !== 'tous' && s.etage !== filtre) classe += ' zone-inactive'
        if (resultat && s.section === resultat.attendu) classe += ' zone-attendue'
        if (resultat && !resultat.correct && s.section === resultat.choisi) classe += ' zone-faute'
        if (!resultat && saisie && s.section.startsWith(saisie)) classe += ' zone-active'
        return (
          <button
            key={s.section}
            className={classe}
            style={{
              left: `${z.gauche}%`,
              top: `${z.haut}%`,
              width: `${z.largeur}%`,
              height: `${z.hauteur}%`,
            }}
            onClick={() => surChoix(s.section)}
            aria-label={`${s.section}, ${s.categorie}`}
            title={aide ? s.categorie : undefined}
          />
        )
      })}
    </div>
  )
}
