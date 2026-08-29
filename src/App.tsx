import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LIVRES, SECTIONS } from './jeu/catalogue'
import { choisir, enregistrer, fiche, maitrise, type Progres } from './jeu/leitner'
import { Plan, type Filtre, type Resultat } from './Plan'
import { urlCouverture } from './jeu/couvertures'
import {
  chargerProgres,
  chargerRecords,
  effacerTout,
  sauvegarderProgres,
  sauvegarderRecords,
  type Records,
} from './jeu/stockage'

type Mode = 'plan' | 'livres' | 'chrono'

interface Question {
  cle: string
  invite: string
  reponse: string
  categorie: string
}

interface Chrono {
  debut: number
  faites: number
  fautes: number
  fin: number | null
}

const CHRONO_QUESTIONS = 20
const PENALITE_MS = 3000
const DELAI_CORRECT_MS = 450
const DELAI_FAUTE_CHRONO_MS = 1300

const MODES: { cle: Mode; nom: string; aide: string }[] = [
  { cle: 'plan', nom: 'Plan', aide: 'Une catégorie, quelle étagère ?' },
  { cle: 'livres', nom: 'Livres', aide: 'Un titre, quelle étagère ?' },
  { cle: 'chrono', nom: 'Chrono', aide: `${CHRONO_QUESTIONS} titres contre la montre` },
]

function questionsPour(mode: Mode, filtre: Filtre): Question[] {
  const garde = (section: string) => filtre === 'tous' || section.startsWith(filtre)
  if (mode === 'plan') {
    return SECTIONS.filter((s) => garde(s.section)).map((s) => ({
      cle: `plan:${s.section}`,
      invite: s.categorie,
      reponse: s.section,
      categorie: s.categorie,
    }))
  }
  return LIVRES.filter((l) => garde(l.section)).map((l) => ({
    cle: `livre:${l.titre}`,
    invite: l.titre,
    reponse: l.section,
    categorie: l.categorie,
  }))
}

function formatSecondes(ms: number): string {
  return `${(ms / 1000).toFixed(2).replace('.', ',')} s`
}

function pluriel(n: number, mot: string): string {
  return `${n} ${mot}${n > 1 ? 's' : ''}`
}

function Statistiques({ progres }: { progres: Progres }) {
  const lignes = SECTIONS.map((s) => {
    const cles = LIVRES.filter((l) => l.section === s.section).map((l) => `livre:${l.titre}`)
    return {
      ...s,
      livres: maitrise(progres, cles),
      plan: fiche(progres, `plan:${s.section}`).boite / 4,
    }
  })
  return (
    <section className="stats">
      <h2>Maîtrise par étagère</h2>
      <div className="stats-grille">
        {lignes.map((l) => (
          <div
            className="stat"
            key={l.section}
            title={`${l.categorie} : livres ${Math.round(l.livres * 100)} %, plan ${Math.round(l.plan * 100)} %`}
          >
            <span className="stat-id">{l.section}</span>
            <span className="stat-cat">{l.categorie}</span>
            <span className="stat-barre">
              <span className="stat-barre-livres" style={{ width: `${l.livres * 100}%` }} />
            </span>
            <span className="stat-plan">{l.plan >= 1 ? 'plan su' : ''}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export function App() {
  const [mode, setMode] = useState<Mode>('plan')
  const [filtre, setFiltre] = useState<Filtre>('tous')
  const [aide, setAide] = useState(false)
  const [progres, setProgres] = useState<Progres>(chargerProgres)
  const [records, setRecords] = useState<Records>(chargerRecords)
  const [question, setQuestion] = useState<Question | null>(null)
  const [saisie, setSaisie] = useState('')
  const [resultat, setResultat] = useState<Resultat | null>(null)
  const [chrono, setChrono] = useState<Chrono | null>(null)
  const [maintenant, setMaintenant] = useState(0)

  const progresRef = useRef(progres)
  progresRef.current = progres
  const questionRef = useRef(question)
  questionRef.current = question
  const minuterie = useRef<number | null>(null)

  const questions = useMemo(() => questionsPour(mode, filtre), [mode, filtre])
  const parCle = useMemo(() => new Map(questions.map((q) => [q.cle, q])), [questions])
  const cles = useMemo(() => questions.map((q) => q.cle), [questions])

  useEffect(() => sauvegarderProgres(progres), [progres])
  useEffect(() => sauvegarderRecords(records), [records])

  const suivant = useCallback(() => {
    if (minuterie.current) window.clearTimeout(minuterie.current)
    minuterie.current = null
    setResultat(null)
    setSaisie('')
    const cle = choisir(progresRef.current, cles, Math.random(), questionRef.current?.cle)
    setQuestion(parCle.get(cle) ?? null)
  }, [cles, parCle])

  // Nouveau mode ou nouveau filtre : on repart sur une question fraîche (hors chrono).
  useEffect(() => {
    if (mode === 'chrono') {
      setChrono(null)
      setQuestion(null)
      setResultat(null)
      setSaisie('')
      return
    }
    suivant()
  }, [mode, filtre, suivant])

  // Horloge du chrono.
  useEffect(() => {
    if (!chrono || chrono.fin !== null) return
    const id = window.setInterval(() => setMaintenant(performance.now()), 100)
    return () => window.clearInterval(id)
  }, [chrono])

  const cleRecord = `chrono:${filtre}`

  const repondre = useCallback(
    (section: string) => {
      const q = questionRef.current
      if (!q || resultat) return
      const correct = section === q.reponse
      setProgres((p) => enregistrer(p, q.cle, correct))
      setResultat({ correct, choisi: section, attendu: q.reponse, categorie: q.categorie })
      setSaisie('')

      if (mode === 'chrono' && chrono) {
        const faites = chrono.faites + 1
        const fautes = chrono.fautes + (correct ? 0 : 1)
        if (faites >= CHRONO_QUESTIONS) {
          const fin = performance.now()
          setChrono({ ...chrono, faites, fautes, fin })
          const temps = fin - chrono.debut + fautes * PENALITE_MS
          setRecords((r) =>
            r[cleRecord] === undefined || temps < r[cleRecord] ? { ...r, [cleRecord]: temps } : r,
          )
          return
        }
        setChrono({ ...chrono, faites, fautes })
        minuterie.current = window.setTimeout(
          suivant,
          correct ? DELAI_CORRECT_MS : DELAI_FAUTE_CHRONO_MS,
        )
        return
      }
      if (correct) minuterie.current = window.setTimeout(suivant, DELAI_CORRECT_MS)
    },
    [resultat, mode, chrono, cleRecord, suivant],
  )

  function lancerChrono() {
    setChrono({ debut: performance.now(), faites: 0, fautes: 0, fin: null })
    setMaintenant(performance.now())
    suivant()
  }

  function toutEffacer() {
    if (!window.confirm('Effacer toute la progression et les records ?')) return
    effacerTout()
    setProgres({})
    setRecords({})
  }

  // Clavier : 1 ou 2 (ou & et é en AZERTY) puis la lettre ; Entrée ou Espace pour continuer.
  useEffect(() => {
    function surTouche(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const k = e.key
      if (resultat) {
        if (!resultat.correct && (k === 'Enter' || k === ' ') && mode !== 'chrono') {
          e.preventDefault()
          suivant()
        }
        return
      }
      if (!question) return
      if (k === '1' || k === '&') return setSaisie('1')
      if (k === '2' || k === 'é') return setSaisie('2')
      if (k === 'Escape') return setSaisie('')
      if (/^[a-qA-Q]$/.test(k)) {
        const chiffre = saisie || (filtre !== 'tous' ? filtre : '')
        if (!chiffre) return
        e.preventDefault()
        repondre(chiffre + k.toUpperCase())
      }
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [resultat, question, saisie, filtre, mode, repondre, suivant])

  const maitrisePlan = maitrise(
    progres,
    SECTIONS.map((s) => `plan:${s.section}`),
  )
  const maitriseLivres = maitrise(
    progres,
    LIVRES.map((l) => `livre:${l.titre}`),
  )
  const modeCourant = MODES.find((m) => m.cle === mode)!
  const chronoEnCours = mode === 'chrono' && chrono !== null && chrono.fin === null
  const chronoFini = mode === 'chrono' && chrono !== null && chrono.fin !== null
  const nomFiltre = filtre === 'tous' ? 'les deux étages' : `étage ${filtre}`

  return (
    <div className="app">
      <header>
        <div>
          <h1>Arcane Librarian</h1>
          <p className="sous-titre">Entraîneur d'étagères pour le speedrun</p>
        </div>
        <div className="jauges">
          <span>
            Plan : <strong>{Math.round(maitrisePlan * 100)} %</strong>
          </span>
          <span>
            Livres : <strong>{Math.round(maitriseLivres * 100)} %</strong>
          </span>
        </div>
      </header>

      <nav className="barre">
        <div className="onglets">
          {MODES.map((m) => (
            <button
              key={m.cle}
              className={`onglet${mode === m.cle ? ' onglet-actif' : ''}`}
              onClick={() => setMode(m.cle)}
            >
              {m.nom}
            </button>
          ))}
        </div>
        <div className="filtres">
          {(['tous', '1', '2'] as Filtre[]).map((f) => (
            <button
              key={f}
              className={`filtre${filtre === f ? ' filtre-actif' : ''}`}
              onClick={() => setFiltre(f)}
              disabled={chronoEnCours}
            >
              {f === 'tous' ? 'Les deux étages' : `Étage ${f}`}
            </button>
          ))}
          <label className="aide">
            <input type="checkbox" checked={aide} onChange={(e) => setAide(e.target.checked)} />{' '}
            noms des catégories sur la carte
          </label>
        </div>
      </nav>

      <main className="carte">
        <p className="mode-aide">{modeCourant.aide}</p>

        {mode === 'chrono' && !chronoEnCours && (
          <div className="chrono-accueil">
            {chronoFini && chrono && chrono.fin !== null && (
              <p className="chrono-bilan">
                Terminé en <strong>{formatSecondes(chrono.fin - chrono.debut)}</strong>,{' '}
                {pluriel(chrono.fautes, 'faute')}
                {chrono.fautes > 0 && ` (+${(chrono.fautes * PENALITE_MS) / 1000} s)`} : score{' '}
                <strong>{formatSecondes(chrono.fin - chrono.debut + chrono.fautes * PENALITE_MS)}</strong>
              </p>
            )}
            <p className="record">
              Record ({nomFiltre}) :{' '}
              <strong>
                {records[cleRecord] !== undefined ? formatSecondes(records[cleRecord]) : 'aucun'}
              </strong>
            </p>
            <button className="lancer" onClick={lancerChrono}>
              {chronoFini ? 'Relancer' : 'Lancer'} : {CHRONO_QUESTIONS} titres, +{PENALITE_MS / 1000} s
              par faute
            </button>
          </div>
        )}

        {question && (mode !== 'chrono' || chronoEnCours) && (
          <>
            {chronoEnCours && chrono && (
              <p className="chrono-hud">
                Titre {chrono.faites + 1}/{CHRONO_QUESTIONS} — {formatSecondes(maintenant - chrono.debut)}{' '}
                — {pluriel(chrono.fautes, 'faute')}
              </p>
            )}
            <p className="invite-libelle">{mode === 'plan' ? 'Catégorie' : 'Titre'}</p>
            {mode === 'plan' ? (
              <p className="invite invite-plan">{question.invite}</p>
            ) : (
              <div className="livre">
                {urlCouverture(question.invite) && (
                  <img
                    className="couverture"
                    src={urlCouverture(question.invite) ?? undefined}
                    alt=""
                    draggable={false}
                  />
                )}
                <p className="invite">{question.invite}</p>
              </div>
            )}
            <p className="saisie">
              {resultat ? (
                resultat.correct ? (
                  <span className="ok">
                    Exact : {resultat.attendu} — {resultat.categorie}
                  </span>
                ) : (
                  <span className="faute">
                    Non, {resultat.choisi} : c'était <strong>{resultat.attendu}</strong> —{' '}
                    {resultat.categorie}
                    {mode !== 'chrono' && <em> (Entrée pour continuer)</em>}
                  </span>
                )
              ) : (
                <span className="curseur">
                  {saisie || (filtre !== 'tous' ? filtre : '_')}
                  <span className="curseur-lettre">_</span>
                </span>
              )}
            </p>
            {resultat && !resultat.correct && mode !== 'chrono' && (
              <button className="continuer" onClick={suivant}>
                Continuer
              </button>
            )}
          </>
        )}
      </main>

      {(mode !== 'chrono' || chronoEnCours) && (
        <Plan filtre={filtre} aide={aide} saisie={saisie} resultat={resultat} surChoix={repondre} />
      )}

      <p className="raccourcis">
        Clavier : 1 ou 2 puis la lettre de l'étagère (sur un seul étage, la lettre suffit). Échap
        annule.
      </p>

      <Statistiques progres={progres} />

      <footer>
        <button className="effacer" onClick={toutEffacer}>
          Effacer la progression
        </button>
      </footer>
    </div>
  )
}
