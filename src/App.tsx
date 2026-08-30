import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LIVRES, SECTIONS, type Livre as LivreCatalogue } from './jeu/catalogue'
import {
  aRevoir,
  choisir,
  enregistrer,
  fiche,
  maitrise,
  nouveaux,
  type Progres,
} from './jeu/leitner'
import {
  chargerConfusions,
  chargerLangue,
  chargerProgres,
  chargerRecords,
  chargerReglages,
  chargerSession,
  effacerTout,
  exporterTout,
  lireSauvegarde,
  sauvegarderConfusions,
  sauvegarderLangue,
  sauvegarderProgres,
  sauvegarderRecords,
  sauvegarderReglages,
  sauvegarderSession,
  type Confusions,
  type Records,
  type Reglages,
  type Session,
} from './jeu/stockage'
import { Plan, type Filtre, type Resultat } from './Plan'
import { visuelsDe } from './jeu/visuels'
import { TEXTES, type Langue } from './textes'
import motsClesJson from './donnees/mots-cles.json'

const MOTS_CLES = motsClesJson as Record<string, { mots: string[]; en: string; fr: string }>

type Mode = 'plan' | 'situer' | 'livres' | 'etagere' | 'tomes' | 'chrono'
type FiltreTomes = 'tous' | 3 | 5 | 10

// Un livre proposé dans le mode Étagère : le bon ou un intrus.
interface Option {
  titre: string
  section: string
  categorie: string
}

interface Question {
  cle: string
  invite: string
  reponse: string
  categorie: string
  section: string
  volumes?: number
}

interface Chrono {
  debut: number
  faites: number
  fautes: number
  fin: number | null
}

const MODES: Mode[] = ['plan', 'situer', 'livres', 'etagere', 'tomes', 'chrono']
const IMAGES_CARTE: Reglages['carte'][] = ['noms', 'identifiants', 'muette']
const NOMBRE_OPTIONS = 4
const FILTRES: Filtre[] = ['tous', '1', '2']
const FILTRES_TOMES: FiltreTomes[] = ['tous', 3, 5, 10]
const TOMES: number[] = [3, 5, 10]
const LONGUEURS_CHRONO = [20, 50, 400]
const AFFICHAGES: Reglages['affichage'][] = ['complet', 'couverture', 'tranche']
const PENALITE_MS = 3000
const DELAI_CORRECT_MS = 900 // le temps de lire le retour et de voir la scène
const DELAI_CORRECT_CHRONO_MS = 450
const DELAI_FAUTE_CHRONO_MS = 1300
const TIC_HORLOGE_MS = 15_000

function questionsPour(mode: Mode, filtre: Filtre, tomes: FiltreTomes): Question[] {
  if (mode === 'plan' || mode === 'etagere' || mode === 'situer') {
    return SECTIONS.filter((s) => filtre === 'tous' || s.section.startsWith(filtre)).map((s) => ({
      cle: `${mode}:${s.section}`,
      invite:
        mode === 'plan' ? s.categorie : mode === 'situer' ? s.section : `${s.section} — ${s.categorie}`,
      reponse: s.section,
      categorie: s.categorie,
      section: s.section,
    }))
  }
  const garde = (l: LivreCatalogue) =>
    (filtre === 'tous' || l.section.startsWith(filtre)) && (tomes === 'tous' || l.volumes === tomes)
  return LIVRES.filter(garde).map((l) => ({
    cle: mode === 'tomes' ? `tome:${l.titre}` : `livre:${l.titre}`,
    invite: l.titre,
    reponse: mode === 'tomes' ? String(l.volumes) : l.section,
    categorie: l.categorie,
    section: l.section,
    volumes: l.volumes,
  }))
}

function formatSecondes(ms: number, langue: Langue): string {
  const s = (ms / 1000).toFixed(2)
  return `${langue === 'fr' ? s.replace('.', ',') : s} s`
}

// Quatre livres pour une étagère : un des siens et trois intrus d'autres étagères,
// de préférence du même étage, mélangés.
function optionsPour(section: string, alea: () => number): Option[] {
  const tirer = <T,>(liste: T[]) => liste[Math.floor(alea() * liste.length)]
  const bons = LIVRES.filter((l) => l.section === section)
  const memeEtage = LIVRES.filter((l) => l.section !== section && l.section[0] === section[0])
  const autres = LIVRES.filter((l) => l.section !== section)
  const choisis: Option[] = [tirer(bons)].map((l) => ({ titre: l.titre, section: l.section, categorie: l.categorie }))
  while (choisis.length < NOMBRE_OPTIONS) {
    const source = alea() < 0.7 && memeEtage.length > 0 ? memeEtage : autres
    const l = tirer(source)
    if (!choisis.some((c) => c.titre === l.titre || c.section === l.section)) {
      choisis.push({ titre: l.titre, section: l.section, categorie: l.categorie })
    }
  }
  for (let i = choisis.length - 1; i > 0; i--) {
    const j = Math.floor(alea() * (i + 1))
    ;[choisis[i], choisis[j]] = [choisis[j], choisis[i]]
  }
  return choisis
}

function jourLocal(d = new Date()): string {
  const deux = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`
}

// Le livre tel qu'on le voit en jeu. Selon l'affichage : couverture et tranche,
// couverture seule, ou tranche seule. À la réponse, le livre reste à sa place et la
// scène en jeu s'ajoute en dessous, en petit, pour ancrer le lieu.
function Livre({
  titre,
  affichage,
  revele,
  legendeScene,
}: {
  titre: string
  affichage: Reglages['affichage']
  revele: boolean
  legendeScene: string
}) {
  const v = visuelsDe(titre)
  if (!v.couverture) return null
  const montrerCouverture = affichage !== 'tranche' || revele
  const montrerTranche = (affichage !== 'couverture' || revele) && v.tranche
  return (
    <div className="livre-visuel">
      <div className="livre-images">
        {montrerCouverture && (
          <img className="couverture" src={v.couverture} alt="" draggable={false} />
        )}
        {montrerTranche && (
          <img
            className={`tranche${affichage === 'tranche' && !revele ? ' tranche-seule' : ''}`}
            src={v.tranche ?? undefined}
            alt=""
            draggable={false}
          />
        )}
      </div>
      {revele && v.scene && (
        <figure className="scene-bloc">
          <img className="scene" src={v.scene} alt="" draggable={false} />
          <figcaption>{legendeScene}</figcaption>
        </figure>
      )}
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

// Composition d'une étagère en séries : « 4 × 10 · 8 × 3 ».
function composition(section: string): string {
  const comptes = new Map<number, number>()
  for (const l of LIVRES) {
    if (l.section === section) comptes.set(l.volumes, (comptes.get(l.volumes) ?? 0) + 1)
  }
  return [...comptes.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([volumes, n]) => `${n} × ${volumes}`)
    .join(' · ')
}

function categorieDe(section: string): string {
  return SECTIONS.find((s) => s.section === section)?.categorie ?? ''
}

function Statistiques({ progres, titre, planSu }: { progres: Progres; titre: string; planSu: string }) {
  const lignes = SECTIONS.map((s) => {
    const cles = LIVRES.filter((l) => l.section === s.section).map((l) => `livre:${l.titre}`)
    return {
      ...s,
      livres: maitrise(progres, cles),
      plan: fiche(progres, `plan:${s.section}`).boite / 4,
      series: composition(s.section),
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
            <span className="etagere-series">{l.series}</span>
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
  const [tomes, setTomes] = useState<FiltreTomes>('tous')
  const [reglages, setReglages] = useState<Reglages>(chargerReglages)
  const [progres, setProgres] = useState<Progres>(chargerProgres)
  const [records, setRecords] = useState<Records>(chargerRecords)
  const [confusions, setConfusions] = useState<Confusions>(chargerConfusions)
  const [session, setSession] = useState<Session>(() => {
    const s = chargerSession()
    return s.jour === jourLocal() ? s : { jour: jourLocal(), nouveaux: 0 }
  })
  const [cible, setCible] = useState<string[] | null>(null)
  const [question, setQuestion] = useState<Question | null>(null)
  const [options, setOptions] = useState<Option[]>([])
  const [choixTitre, setChoixTitre] = useState<string | null>(null)
  const [saisie, setSaisie] = useState('')
  const [resultat, setResultat] = useState<Resultat | null>(null)
  const [chrono, setChrono] = useState<Chrono | null>(null)
  const [maintenant, setMaintenant] = useState(0)
  const [horloge, setHorloge] = useState(() => Date.now())
  const [message, setMessage] = useState<string | null>(null)

  const t = TEXTES[langue]

  const progresRef = useRef(progres)
  progresRef.current = progres
  const questionRef = useRef(question)
  questionRef.current = question
  const minuterie = useRef<number | null>(null)
  const fichierImport = useRef<HTMLInputElement | null>(null)

  const questions = useMemo(() => questionsPour(mode, filtre, tomes), [mode, filtre, tomes])
  const parCle = useMemo(() => new Map(questions.map((q) => [q.cle, q])), [questions])
  const clesBase = useMemo(
    () =>
      questions
        .filter((q) => !cible || cible.includes(q.section))
        .map((q) => q.cle),
    [questions, cible],
  )
  const enSession = mode !== 'chrono' && reglages.entrainement === 'session' && !cible
  const modeLivre = mode === 'livres' || mode === 'tomes' || mode === 'chrono'

  useEffect(() => sauvegarderProgres(progres), [progres])
  useEffect(() => sauvegarderRecords(records), [records])
  useEffect(() => sauvegarderConfusions(confusions), [confusions])
  useEffect(() => sauvegarderReglages(reglages), [reglages])
  useEffect(() => sauvegarderSession(session), [session])
  useEffect(() => {
    sauvegarderLangue(langue)
    document.documentElement.lang = langue
  }, [langue])

  // L'horloge de la session avance toutes les quinze secondes : des livres redeviennent dus.
  useEffect(() => {
    if (!enSession) return
    const id = window.setInterval(() => setHorloge(Date.now()), TIC_HORLOGE_MS)
    return () => window.clearInterval(id)
  }, [enSession])

  // Le quota de nouveaux par jour ne concerne que les livres : les 31 étagères des
  // modes Plan, Situer et Étagère se découvrent d'un coup.
  const quotaRestant = modeLivre ? Math.max(0, reglages.quotaNouveaux - session.nouveaux) : Infinity

  // Le paquet du moment : tout, ou seulement les dus et les nouveaux du jour.
  const deck = useMemo(() => {
    if (!enSession) return clesBase
    const dus = aRevoir(progres, clesBase, horloge)
    const neufs = nouveaux(progres, clesBase).slice(0, quotaRestant)
    return [...dus, ...neufs]
  }, [enSession, clesBase, progres, horloge, quotaRestant])
  const deckRef = useRef(deck)
  deckRef.current = deck
  // La question suivante est tirée à l'avance pour précharger ses images.
  const prochaineRef = useRef<string | null>(null)

  const suivant = useCallback(() => {
    if (minuterie.current) window.clearTimeout(minuterie.current)
    minuterie.current = null
    setResultat(null)
    setSaisie('')
    setHorloge(Date.now())
    const candidats = deckRef.current
    if (candidats.length === 0) {
      setQuestion(null)
      return
    }
    const courante = questionRef.current?.cle
    const preparee = prochaineRef.current
    const cle =
      preparee && preparee !== courante && candidats.includes(preparee)
        ? preparee
        : choisir(progresRef.current, candidats, Math.random(), courante)
    const q = parCle.get(cle) ?? null
    setQuestion(q)
    setChoixTitre(null)
    setOptions(q && cle.startsWith('etagere:') ? optionsPour(q.section, Math.random) : [])
    const suivante = candidats.length > 1 ? choisir(progresRef.current, candidats, Math.random(), cle) : null
    prochaineRef.current = suivante
    const qs = suivante ? parCle.get(suivante) : null
    if (suivante && qs && !suivante.startsWith('plan:') && !suivante.startsWith('situer:')) {
      const v = visuelsDe(qs.invite)
      for (const src of [v.couverture, v.tranche, v.scene]) if (src) new Image().src = src
    }
  }, [parCle])

  // Nouveau mode, filtre ou réglage : on repart sur une question fraîche (hors chrono).
  useEffect(() => {
    if (mode === 'chrono') {
      setChrono(null)
      setQuestion(null)
      setResultat(null)
      setSaisie('')
      return
    }
    suivant()
  }, [mode, filtre, tomes, reglages.entrainement, cible, suivant])

  // Si la session s'est vidée, la question disparaît ; si des livres redeviennent dus, elle revient.
  useEffect(() => {
    if (!enSession || resultat) return
    if (question === null && deck.length > 0) suivant()
  }, [enSession, deck, question, resultat, suivant])

  // Horloge du chrono.
  useEffect(() => {
    if (!chrono || chrono.fin !== null) return
    const id = window.setInterval(() => setMaintenant(performance.now()), 100)
    return () => window.clearInterval(id)
  }, [chrono])

  const cleRecord = `chrono:${filtre}:${tomes}:${reglages.longueurChrono}`

  const repondre = useCallback(
    (reponse: string) => {
      const q = questionRef.current
      if (!q || resultat) return
      const correct = reponse === q.reponse
      const premiereFois = fiche(progresRef.current, q.cle).vues === 0
      setProgres((p) => enregistrer(p, q.cle, correct, Date.now()))
      if (premiereFois && (mode === 'livres' || mode === 'tomes')) {
        setSession((s) => ({ ...s, nouveaux: s.nouveaux + 1 }))
      }
      if (!correct && mode !== 'tomes') {
        const paire = `${q.reponse}>${reponse}`
        setConfusions((c) => ({ ...c, [paire]: (c[paire] ?? 0) + 1 }))
      }
      setResultat({
        correct,
        choisi: reponse,
        attendu: q.reponse,
        categorie: q.categorie,
        section: q.section,
      })
      setSaisie('')

      if (mode === 'chrono' && chrono) {
        const faites = chrono.faites + 1
        const fautes = chrono.fautes + (correct ? 0 : 1)
        if (faites >= reglages.longueurChrono) {
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
          correct ? DELAI_CORRECT_CHRONO_MS : DELAI_FAUTE_CHRONO_MS,
        )
        return
      }
      if (correct) minuterie.current = window.setTimeout(suivant, DELAI_CORRECT_MS)
    },
    [resultat, mode, chrono, cleRecord, suivant, reglages.longueurChrono],
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
    setConfusions({})
    setSession({ jour: jourLocal(), nouveaux: 0 })
  }

  function exporter() {
    const contenu = JSON.stringify(exporterTout(), null, 1)
    const url = URL.createObjectURL(new Blob([contenu], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `arcane-librarian-${jourLocal()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importer(fichier: File | undefined) {
    if (!fichier) return
    const lu = lireSauvegarde(await fichier.text())
    if (!lu) {
      setMessage(t.importRate)
      return
    }
    setProgres(lu.progres)
    setRecords(lu.records)
    setConfusions(lu.confusions)
    setSession(lu.session.jour === jourLocal() ? lu.session : { jour: jourLocal(), nouveaux: 0 })
    setMessage(t.importe)
  }

  useEffect(() => {
    if (!message) return
    const id = window.setTimeout(() => setMessage(null), 4000)
    return () => window.clearTimeout(id)
  }, [message])

  // Clavier. Étagères : 1 ou 2 (ou & et é en AZERTY) puis la lettre. Tomes : 3, 5, ou 1
  // pour 10 (avec leurs équivalents AZERTY non décalés). Entrée ou Espace pour continuer.
  useEffect(() => {
    function surTouche(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const k = e.key
      if (resultat) {
        // Entrée ou Espace passe à la suite, faute ou non (le chrono enchaîne seul).
        if ((k === 'Enter' || k === ' ') && mode !== 'chrono') {
          e.preventDefault()
          suivant()
        }
        return
      }
      if (!question) return
      if (mode === 'situer') return // la réponse se donne à la souris, de mémoire
      if (mode === 'etagere') {
        const touches: Record<string, number> = { '1': 0, '&': 0, '2': 1, 'é': 1, '3': 2, '"': 2, '4': 3, "'": 3 }
        const i = touches[k]
        if (i !== undefined && options[i]) {
          setChoixTitre(options[i].titre)
          repondre(options[i].section)
        }
        return
      }
      if (mode === 'tomes') {
        if (k === '3' || k === '"') return repondre('3')
        if (k === '5' || k === '(') return repondre('5')
        if (k === '1' || k === '&' || k === '0' || k === 'à') return repondre('10')
        return
      }
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
  }, [resultat, question, saisie, filtre, mode, options, repondre, suivant])

  const maitrisePlan = maitrise(progres, [
    ...SECTIONS.map((s) => `plan:${s.section}`),
    ...SECTIONS.map((s) => `situer:${s.section}`),
  ])
  const maitriseLivres = maitrise(
    progres,
    LIVRES.map((l) => `livre:${l.titre}`),
  )
  const maitriseTomes = maitrise(
    progres,
    LIVRES.map((l) => `tome:${l.titre}`),
  )
  const maitriseEtageres = maitrise(
    progres,
    SECTIONS.map((s) => `etagere:${s.section}`),
  )
  const chronoEnCours = mode === 'chrono' && chrono !== null && chrono.fin === null
  const chronoFini = mode === 'chrono' && chrono !== null && chrono.fin !== null
  const classeFiche = `fiche${modeLivre ? ' fiche-livre' : ''}${resultat ? (resultat.correct ? ' fiche-ok' : ' fiche-faute') : ''}`

  // Précharge la scène en jeu du livre affiché : à la réponse, elle apparaît sans délai.
  useEffect(() => {
    if (!question || !modeLivre) return
    const v = visuelsDe(question.invite)
    if (v.scene) new Image().src = v.scene
    if (v.tranche) new Image().src = v.tranche
  }, [question, modeLivre])
  const avecCarte = mode !== 'tomes' && (mode !== 'chrono' || chronoEnCours)
  const nomFiltreRecord = [
    t.filtres[filtre],
    tomes === 'tous' ? '' : t.tomesPastille(tomes),
    `${reglages.longueurChrono}`,
  ]
    .filter(Boolean)
    .join(', ')
    .toLowerCase()
  const dus = enSession ? aRevoir(progres, clesBase, horloge).length : 0
  const neufsDisponibles = enSession ? Math.min(nouveaux(progres, clesBase).length, quotaRestant) : 0
  const sessionVide = enSession && question === null && !resultat
  const prochaineEcheance = useMemo(() => {
    if (!sessionVide) return null
    let min = Infinity
    for (const c of clesBase) {
      const f = fiche(progres, c)
      if (f.vues > 0 && f.echeance > horloge && f.echeance < min) min = f.echeance
    }
    return min === Infinity ? null : Math.ceil((min - horloge) / 60_000)
  }, [sessionVide, clesBase, progres, horloge])
  const pairesConfusion = useMemo(
    () =>
      Object.entries(confusions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([paire, n]) => {
          const [attendu, choisi] = paire.split('>')
          return { attendu, choisi, n }
        }),
    [confusions],
  )

  function retour(r: Resultat): string {
    if (mode === 'tomes') return r.correct ? t.exactTomes(r.attendu) : t.fauteTomes(r.choisi, r.attendu)
    if (mode === 'etagere') {
      const bon = options.find((o) => o.section === r.attendu)
      const choisi = options.find((o) => o.titre === choixTitre)
      if (r.correct) return t.exactEtagere(bon?.titre ?? '')
      return t.fauteEtagere(choisi?.titre ?? '', r.choisi, choisi?.categorie ?? '', bon?.titre ?? '')
    }
    return r.correct ? t.exact(r.attendu, r.categorie) : t.faute(r.choisi, r.attendu, r.categorie)
  }

  const montrerTitre =
    mode === 'plan' ||
    mode === 'etagere' ||
    mode === 'situer' ||
    reglages.affichage === 'complet' ||
    resultat !== null
  const modeCarteSeule = mode === 'plan' || mode === 'etagere' || mode === 'situer'

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
          <Jauge libelle={t.jaugeTomes} valeur={maitriseTomes} />
          <Jauge libelle={t.jaugeEtageres} valeur={maitriseEtageres} />
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
          {mode !== 'chrono' && (
            <span className="groupe-filtres groupe-premier">
              {(['session', 'libre'] as const).map((e) => (
                <button
                  key={e}
                  className={`filtre${reglages.entrainement === e ? ' filtre-actif' : ''}`}
                  onClick={() => setReglages({ ...reglages, entrainement: e })}
                  disabled={cible !== null}
                >
                  {t.entrainement[e]}
                </button>
              ))}
            </span>
          )}
          <span className="groupe-filtres">
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
          </span>
          {!modeCarteSeule && (
            <span className="groupe-filtres">
              <span className="groupe-libelle">{t.filtreTomes}</span>
              {FILTRES_TOMES.map((f) => (
                <button
                  key={f}
                  className={`filtre${tomes === f ? ' filtre-actif' : ''}`}
                  onClick={() => setTomes(f)}
                  disabled={chronoEnCours}
                >
                  {f === 'tous' ? t.tousLesTomes : f}
                </button>
              ))}
            </span>
          )}
          {!modeCarteSeule && (
            <span className="groupe-filtres">
              <span className="groupe-libelle">{t.affichageLibelle}</span>
              {AFFICHAGES.map((a) => (
                <button
                  key={a}
                  className={`filtre${reglages.affichage === a ? ' filtre-actif' : ''}`}
                  onClick={() => setReglages({ ...reglages, affichage: a })}
                >
                  {t.affichage[a]}
                </button>
              ))}
            </span>
          )}
          {mode === 'chrono' && (
            <span className="groupe-filtres">
              <span className="groupe-libelle">{t.longueur}</span>
              {LONGUEURS_CHRONO.map((n) => (
                <button
                  key={n}
                  className={`filtre${reglages.longueurChrono === n ? ' filtre-actif' : ''}`}
                  onClick={() => setReglages({ ...reglages, longueurChrono: n })}
                  disabled={chronoEnCours}
                >
                  {n}
                </button>
              ))}
            </span>
          )}
          {mode !== 'tomes' && mode !== 'situer' && (
            <span className="groupe-filtres">
              <span className="groupe-libelle">{t.carteLibelle}</span>
              {IMAGES_CARTE.map((c) => (
                <button
                  key={c}
                  className={`filtre${reglages.carte === c ? ' filtre-actif' : ''}`}
                  onClick={() => setReglages({ ...reglages, carte: c })}
                >
                  {t.carteOptions[c]}
                </button>
              ))}
            </span>
          )}
        </div>
      </nav>

      {!reglages.accueilVu && (
        <section className="accueil">
          <h2>{t.accueilTitre}</h2>
          <ol className="accueil-etapes">
            {t.accueilEtapes.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ol>
          <button className="filtre filtre-actif" onClick={() => setReglages({ ...reglages, accueilVu: true })}>
            {t.accueilBouton}
          </button>
        </section>
      )}

      <main className={classeFiche}>
        <p className="mode-aide">
          {t.modes[mode].aide}
          {enSession && (
            <span className="session-compte">
              {' '}
              · {t.aRevoir(dus)} · {t.nouveauxRestants(neufsDisponibles)}
            </span>
          )}
        </p>
        {cible && (
          <p className="cible">
            {t.cible(cible)}{' '}
            <button className="lien" onClick={() => setCible(null)}>
              {t.quitterCible}
            </button>
          </p>
        )}

        {mode === 'chrono' && !chronoEnCours && (
          <div className="chrono-accueil">
            {chronoFini && chrono && chrono.fin !== null && (
              <p className="chrono-bilan">
                {t.termine} <strong>{formatSecondes(chrono.fin - chrono.debut, langue)}</strong>,{' '}
                {t.fautes(chrono.fautes)}
                {chrono.fautes > 0 && ` (+${(chrono.fautes * PENALITE_MS) / 1000} s)`}
                {t.sep}
                {t.score}{' '}
                <strong>
                  {formatSecondes(chrono.fin - chrono.debut + chrono.fautes * PENALITE_MS, langue)}
                </strong>
              </p>
            )}
            <p className="record">
              {t.record} ({nomFiltreRecord}){t.sep}
              <strong>
                {records[cleRecord] !== undefined ? formatSecondes(records[cleRecord], langue) : t.aucun}
              </strong>
            </p>
            <button className="lancer" onClick={lancerChrono}>
              {chronoFini ? t.relancer : t.lancer}
              {t.sep}
              {t.chronoConsigne(reglages.longueurChrono, PENALITE_MS / 1000)}
            </button>
          </div>
        )}

        {sessionVide && (
          <div className="session-fin">
            <p className="session-fin-titre">{t.sessionTerminee}</p>
            {prochaineEcheance !== null && <p>{t.prochainRetour(prochaineEcheance)}</p>}
            <div className="session-fin-actions">
              {nouveaux(progres, clesBase).length > 0 && (
                <button
                  className="lancer"
                  onClick={() => setReglages({ ...reglages, quotaNouveaux: reglages.quotaNouveaux + 10 })}
                >
                  {t.plusDeNouveaux(10)}
                </button>
              )}
              <button
                className="continuer"
                onClick={() => setReglages({ ...reglages, entrainement: 'libre' })}
              >
                {t.passerEnLibre}
              </button>
            </div>
          </div>
        )}

        {question && (mode !== 'chrono' || chronoEnCours) && (
          <div
            key={question.cle}
            className={`question${modeCarteSeule ? ' question-plan' : ''}${!montrerTitre ? ' question-compact' : ''}`}
          >
            {!modeCarteSeule && (
              <Livre
                titre={question.invite}
                affichage={reglages.affichage}
                revele={resultat !== null}
                legendeScene={t.enJeu}
              />
            )}
            <div className="question-texte">
              {chronoEnCours && chrono && (
                <p className="chrono-hud">
                  {t.chronoTitre(chrono.faites + 1, reglages.longueurChrono)} —{' '}
                  {formatSecondes(maintenant - chrono.debut, langue)} — {t.fautes(chrono.fautes)}
                </p>
              )}
              {montrerTitre && (
                <>
                  <p className="invite-libelle">
                    {mode === 'plan'
                      ? t.categorie
                      : mode === 'etagere'
                        ? t.etagere
                        : mode === 'situer'
                          ? t.identifiant
                          : t.titreLivre}
                  </p>
                  <p className={`invite${modeCarteSeule ? ' invite-plan' : ''}`}>{question.invite}</p>
                </>
              )}
              {mode === 'etagere' && (
                <div className="options">
                  {options.map((o, i) => {
                    let classe = 'option'
                    if (resultat && o.section === resultat.attendu) classe += ' option-attendue'
                    if (resultat && !resultat.correct && o.titre === choixTitre) classe += ' option-faute'
                    return (
                      <button
                        key={o.titre}
                        className={classe}
                        disabled={resultat !== null}
                        onClick={() => {
                          setChoixTitre(o.titre)
                          repondre(o.section)
                        }}
                      >
                        <span className="option-numero">{i + 1}</span>
                        {visuelsDe(o.titre).couverture && (
                          <img className="option-couverture" src={visuelsDe(o.titre).couverture ?? undefined} alt="" draggable={false} />
                        )}
                        <span className="option-titre">{o.titre}</span>
                        {resultat && <span className="option-section">{o.section}</span>}
                      </button>
                    )
                  })}
                </div>
              )}
              {mode !== 'plan' && mode !== 'tomes' && question.volumes !== undefined && (
                <p className="serie">{t.serieDe(question.volumes)}</p>
              )}
              {mode === 'tomes' && !resultat && (
                <div className="tomes-choix">
                  {TOMES.map((n) => (
                    <button key={n} className="tome" onClick={() => repondre(String(n))}>
                      {n}
                    </button>
                  ))}
                </div>
              )}
              <p className="saisie">
                {resultat ? (
                  <span className={resultat.correct ? 'ok' : 'faute'}>
                    {retour(resultat)}
                    {mode === 'tomes' && (
                      <span className="saisie-detail">
                        {' '}
                        — {resultat.section} {resultat.categorie}
                      </span>
                    )}
                    {!resultat.correct && mode !== 'chrono' && <em> ({t.entreePourContinuer})</em>}
                  </span>
                ) : mode === 'tomes' ? (
                  <span className="raccourcis-inline">{t.raccourcisTomes}</span>
                ) : mode === 'etagere' ? (
                  <span className="raccourcis-inline">{t.raccourcisEtagere}</span>
                ) : mode === 'situer' ? (
                  <span className="raccourcis-inline">{t.cliquezCarte}</span>
                ) : saisie || filtre !== 'tous' ? (
                  <span className="curseur">
                    {saisie || filtre}
                    <span className="curseur-lettre">_</span>
                  </span>
                ) : (
                  <span className="indice">{t.indiceSaisie}</span>
                )}
              </p>
              {resultat && !resultat.correct && mode !== 'tomes' && MOTS_CLES[resultat.attendu] && (
                <p className="mots-cles">
                  <span className="mots-cles-libelle">{t.motsCles}</span>{' '}
                  {MOTS_CLES[resultat.attendu].mots.join(', ')}
                  <br />
                  <em>{MOTS_CLES[resultat.attendu][langue]}</em>
                </p>
              )}
              {resultat && !resultat.correct && mode !== 'chrono' && (
                <button className="continuer" onClick={suivant}>
                  {t.continuer}
                </button>
              )}
            </div>
          </div>
        )}
        {mode === 'tomes' && <p className="conseil">{t.conseilTomes}</p>}
      </main>

      {avecCarte && (
        <section className="carte-bloc">
          <h2>{t.carte}</h2>
          <Plan
            filtre={filtre}
            image={mode === 'situer' ? 'muette' : reglages.carte}
            saisie={saisie}
            resultat={resultat}
            surligne={mode === 'etagere' ? question?.section ?? null : null}
            surChoix={mode === 'etagere' ? () => undefined : repondre}
            libelleZoom={t.zoomCarte}
          />
          <p className="raccourcis">{mode === 'situer' ? t.cliquezCarte : t.raccourcis}</p>
        </section>
      )}

      <Statistiques progres={progres} titre={t.maitrise} planSu={t.planSu} />

      <section className="stats">
        <h2>{t.confusions}</h2>
        {pairesConfusion.length === 0 ? (
          <p className="stats-vide">{t.confusionsVide}</p>
        ) : (
          <div className="confusions">
            {pairesConfusion.map((p) => (
              <div className="confusion" key={`${p.attendu}>${p.choisi}`}>
                <span className="confusion-paire">
                  <strong>{p.attendu}</strong> {categorieDe(p.attendu)} → <strong>{p.choisi}</strong>{' '}
                  {categorieDe(p.choisi)}
                </span>
                <span className="confusion-nombre">{t.fois(p.n)}</span>
                <button
                  className="filtre"
                  onClick={() => {
                    setCible([p.attendu, p.choisi])
                    if (mode === 'chrono' || mode === 'tomes') setMode('livres')
                  }}
                >
                  {t.sEntrainer}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer>
        <section className="sources">
          <h2>{t.sourcesTitre}</h2>
          <p className="sources-intro">{t.sourcesIntro}</p>
          <ul className="sources-liste">
            {t.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.libelle}
                </a>{' '}
                <span className="sources-detail">— {s.detail}</span>
              </li>
            ))}
          </ul>
        </section>
        <p className="credits">{t.credits}</p>
        <div className="pied-actions">
          <a
            className="lien"
            href="https://github.com/arcane-shelf-trainer/trainer-arcane/issues"
            target="_blank"
            rel="noreferrer"
          >
            {t.suggestions}
          </a>
          <button className="lien" onClick={exporter}>
            {t.exporter}
          </button>
          <button className="lien" onClick={() => fichierImport.current?.click()}>
            {t.importer}
          </button>
          <input
            ref={fichierImport}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              void importer(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          <button className="lien" onClick={toutEffacer}>
            {t.effacer}
          </button>
        </div>
        {message && <p className="message">{message}</p>}
      </footer>
    </div>
  )
}
