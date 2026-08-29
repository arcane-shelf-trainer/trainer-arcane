import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LIVRES, SECTIONS } from './jeu/catalogue'
import { choisir, enregistrer, fiche, maitrise, type Progres } from './jeu/leitner'
import {
  chargerLangue,
  chargerProgres,
  chargerRecords,
  effacerTout,
  sauvegarderLangue,
  sauvegarderProgres,
  sauvegarderRecords,
  type Records,
} from './jeu/stockage'
import { Plan, type Filtre, type Resultat } from './Plan'
import { visuelsDe } from './jeu/visuels'
import { TEXTES, type Langue } from './textes'

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

const MODES: Mode[] = ['plan', 'livres', 'chrono']
const FILTRES: Filtre[] = ['tous', '1', '2']
const CHRONO_QUESTIONS = 20
const PENALITE_MS = 3000
const DELAI_CORRECT_MS = 450
const DELAI_FAUTE_CHRONO_MS = 1300

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

function formatSecondes(ms: number, langue: Langue): string {
  const s = (ms / 1000).toFixed(2)
  return `${langue === 'fr' ? s.replace('.', ',') : s} s`
}

// Le livre tel qu'on le voit en jeu : couverture et tranche.
function Livre({ titre }: { titre: string }) {
  const v = visuelsDe(titre)
  if (!v.couverture) return null
  return (
    <div className="livre-visuel">
      <img className="couverture" src={v.couverture} alt="" draggable={false} />
      {v.tranche && <img className="tranche" src={v.tranche} alt="" draggable={false} />}
    </div>
  )
}

function Jauge({ libelle, valeur }: { libelle: string; valeur: number }) {
  return (
    <div className="jauge">
      <span className="jauge-libelle">{libelle}</span>
      <span className="jauge-barre">
        <span className="jauge-remplissage" style={{ width: `${valeur * 100}%` }} />
      </span>
      <span className="jauge-valeur">{Math.round(valeur * 100)} %</span>
    </div>
  )
}

function Statistiques({ progres, titre, planSu }: { progres: Progres; titre: string; planSu: string }) {
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
      <h2>{titre}</h2>
      <div className="etageres">
        {lignes.map((l) => (
          <div
            className={`etagere${l.plan >= 1 ? ' etagere-plan-su' : ''}`}
            key={l.section}
            title={`${l.categorie} : ${Math.round(l.livres * 100)} %`}
          >
            <span className="etagere-id">{l.section}</span>
            <span className="etagere-cat">{l.categorie}</span>
            <span className="etagere-barre">
              <span className="etagere-remplissage" style={{ width: `${l.livres * 100}%` }} />
            </span>
            {l.plan >= 1 && <span className="etagere-plan">{planSu}</span>}
          </div>
        ))}
      </div>
    </section>
  )
}

export function App() {
  const [langue, setLangue] = useState<Langue>(chargerLangue)
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

  const t = TEXTES[langue]

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
  useEffect(() => {
    sauvegarderLangue(langue)
    document.documentElement.lang = langue
  }, [langue])

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
    if (!window.confirm(t.confirmerEffacer)) return
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
  const chronoEnCours = mode === 'chrono' && chrono !== null && chrono.fin === null
  const chronoFini = mode === 'chrono' && chrono !== null && chrono.fin !== null
  const classeFiche = `fiche${resultat ? (resultat.correct ? ' fiche-ok' : ' fiche-faute') : ''}`

  return (
    <div className="app">
      <header className="entete">
        <div className="marque">
          <h1>{t.titre}</h1>
          <p className="sous-titre">{t.sousTitre}</p>
        </div>
        <div className="entete-droite">
          <Jauge libelle={t.jaugePlan} valeur={maitrisePlan} />
          <Jauge libelle={t.jaugeLivres} valeur={maitriseLivres} />
          <button className="langue" onClick={() => setLangue(langue === 'fr' ? 'en' : 'fr')}>
            {t.langue}
          </button>
        </div>
      </header>

      <nav className="barre">
        <div className="onglets" role="tablist">
          {MODES.map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              className={`onglet${mode === m ? ' onglet-actif' : ''}`}
              onClick={() => setMode(m)}
            >
              {t.modes[m].nom}
            </button>
          ))}
        </div>
        <div className="filtres">
          {FILTRES.map((f) => (
            <button
              key={f}
              className={`filtre${filtre === f ? ' filtre-actif' : ''}`}
              onClick={() => setFiltre(f)}
              disabled={chronoEnCours}
            >
              {t.filtres[f]}
            </button>
          ))}
          <label className="interrupteur">
            <input type="checkbox" checked={aide} onChange={(e) => setAide(e.target.checked)} />
            <span className="interrupteur-piste" aria-hidden="true" />
            <span>{t.nomsSurCarte}</span>
          </label>
        </div>
      </nav>

      <main className={classeFiche}>
        <p className="mode-aide">{t.modes[mode].aide}</p>

        {mode === 'chrono' && !chronoEnCours && (
          <div className="chrono-accueil">
            {chronoFini && chrono && chrono.fin !== null && (
              <p className="chrono-bilan">
                {t.termine} <strong>{formatSecondes(chrono.fin - chrono.debut, langue)}</strong>,{' '}
                {t.fautes(chrono.fautes)}
                {chrono.fautes > 0 && ` (+${(chrono.fautes * PENALITE_MS) / 1000} s)`} : {t.score}{' '}
                <strong>
                  {formatSecondes(chrono.fin - chrono.debut + chrono.fautes * PENALITE_MS, langue)}
                </strong>
              </p>
            )}
            <p className="record">
              {t.record} ({t.filtres[filtre].toLowerCase()}) :{' '}
              <strong>
                {records[cleRecord] !== undefined ? formatSecondes(records[cleRecord], langue) : t.aucun}
              </strong>
            </p>
            <button className="lancer" onClick={lancerChrono}>
              {chronoFini ? t.relancer : t.lancer} : {t.chronoConsigne(CHRONO_QUESTIONS, PENALITE_MS / 1000)}
            </button>
          </div>
        )}

        {question && (mode !== 'chrono' || chronoEnCours) && (
          <div className={`question${mode === 'plan' ? ' question-plan' : ''}`}>
            {mode !== 'plan' && <Livre titre={question.invite} />}
            <div className="question-texte">
              {chronoEnCours && chrono && (
                <p className="chrono-hud">
                  {t.chronoTitre(chrono.faites + 1, CHRONO_QUESTIONS)} —{' '}
                  {formatSecondes(maintenant - chrono.debut, langue)} — {t.fautes(chrono.fautes)}
                </p>
              )}
              <p className="invite-libelle">{mode === 'plan' ? t.categorie : t.titreLivre}</p>
              <p className={`invite${mode === 'plan' ? ' invite-plan' : ''}`}>{question.invite}</p>
              <p className="saisie">
                {resultat ? (
                  resultat.correct ? (
                    <span className="ok">{t.exact(resultat.attendu, resultat.categorie)}</span>
                  ) : (
                    <span className="faute">
                      {t.faute(resultat.choisi, resultat.attendu, resultat.categorie)}
                      {mode !== 'chrono' && <em> ({t.entreePourContinuer})</em>}
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
                  {t.continuer}
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {(mode !== 'chrono' || chronoEnCours) && (
        <section className="carte-bloc">
          <h2>{t.carte}</h2>
          <Plan filtre={filtre} aide={aide} saisie={saisie} resultat={resultat} surChoix={repondre} />
          <p className="raccourcis">{t.raccourcis}</p>
        </section>
      )}

      <Statistiques progres={progres} titre={t.maitrise} planSu={t.planSu} />

      <footer>
        <p className="credits">
          {t.credits}{' '}
          <a href="https://store.steampowered.com/search/?term=Librarian%20Tidy%20Up%20the%20Arcane%20Library" target="_blank" rel="noreferrer">
            {t.jeu}
          </a>
        </p>
        <button className="effacer" onClick={toutEffacer}>
          {t.effacer}
        </button>
      </footer>
    </div>
  )
}
