import { useState } from 'react'
import { SECTIONS, type Etage } from './jeu/catalogue'
import { ZONES } from './jeu/plan'
import carte from './assets/carte.png'
import carteMuette from './assets/carte-muette.png'
import carteVierge from './assets/carte-vierge.png'

export type Filtre = 'tous' | Etage
export type ImageCarte = 'noms' | 'identifiants' | 'muette'

export interface Resultat {
  correct: boolean
  choisi: string
  attendu: string
  categorie: string
  section: string
}

const IMAGES: Record<ImageCarte, string> = {
  noms: carte, // la carte du jeu telle quelle
  identifiants: carteMuette, // noms des catégories effacés
  muette: carteVierge, // identifiants effacés aussi : mémoire spatiale pure
}

export function Plan({
  filtre,
  image,
  saisie,
  resultat,
  surligne = null,
  surChoix,
  libelleZoom,
}: {
  filtre: Filtre
  image: ImageCarte
  saisie: string
  resultat: Resultat | null
  surligne?: string | null // une étagère à montrer, sans question posée sur la carte
  surChoix: (section: string) => void
  libelleZoom: string // texte du bouton d'agrandissement (petits écrans)
}) {
  // Sur petit écran, la carte peut s'agrandir au double et se faire défiler.
  const [zoom, setZoom] = useState(false)
  return (
    <div className={`carte-plan${zoom ? ' carte-zoom' : ''}`} role="group" aria-label="Carte de la bibliothèque">
      <button className="carte-bouton-zoom" onClick={() => setZoom(!zoom)} aria-pressed={zoom}>
        {libelleZoom}
      </button>
      <div className="carte-defilante">
        <div className="carte-contenu">
          <img
            className="carte-image"
            src={IMAGES[image]}
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
            if (surligne === s.section) classe += ' zone-surlignee'
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
                title={image === 'noms' ? s.categorie : undefined}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
