// Tous les textes de l'interface, en français et en anglais. Les titres, catégories
// et identifiants d'étagères restent ceux du jeu (anglais) dans les deux langues.

export type Langue = 'fr' | 'en'

export const TEXTES = {
  fr: {
    titre: 'Arcane Library Shelf Trainer',
    sousTitre: 'Apprenez l’étagère de chaque livre, pour le speedrun',
    jeu: 'Librarian: Tidy Up the Arcane Library!',
    jaugePlan: 'Plan',
    jaugeLivres: 'Livres',
    modes: {
      plan: { nom: 'Plan', aide: 'Une catégorie : quelle étagère ?' },
      livres: { nom: 'Livres', aide: 'Un livre : quelle étagère ?' },
      chrono: { nom: 'Chrono', aide: 'Vingt livres contre la montre' },
    },
    filtres: { tous: 'Les deux étages', '1': 'Étage 1', '2': 'Étage 2' },
    nomsSurCarte: 'Noms des catégories sur la carte',
    categorie: 'Catégorie',
    titreLivre: 'Titre',
    exact: (attendu: string, categorie: string) => `Exact : ${attendu} — ${categorie}`,
    faute: (choisi: string, attendu: string, categorie: string) =>
      `Non, ${choisi} : c’était ${attendu} — ${categorie}`,
    entreePourContinuer: 'Entrée pour continuer',
    continuer: 'Continuer',
    record: 'Record',
    aucun: 'aucun',
    lancer: 'Lancer',
    relancer: 'Relancer',
    chronoConsigne: (n: number, penalite: number) => `${n} livres, +${penalite} s par faute`,
    chronoTitre: (i: number, n: number) => `Livre ${i}/${n}`,
    fautes: (n: number) => `${n} faute${n > 1 ? 's' : ''}`,
    termine: 'Terminé en',
    score: 'score',
    raccourcis:
      'Clavier : 1 ou 2 puis la lettre de l’étagère (sur un seul étage, la lettre suffit). Échap annule.',
    carte: 'Plan de la bibliothèque',
    maitrise: 'Maîtrise par étagère',
    planSu: 'plan su',
    effacer: 'Effacer la progression',
    confirmerEffacer: 'Effacer toute la progression et les records ?',
    credits:
      'Outil de fans, gratuit. Titres, couvertures et carte appartiennent aux auteurs du jeu ; carte d’après le guide Steam « Complete Guide (Map, All Floors, Shelves & Book Lists) ».',
    langue: 'English',
  },
  en: {
    titre: 'Arcane Library Shelf Trainer',
    sousTitre: 'Learn every book’s shelf, for speedrunning',
    jeu: 'Librarian: Tidy Up the Arcane Library!',
    jaugePlan: 'Map',
    jaugeLivres: 'Books',
    modes: {
      plan: { nom: 'Map', aide: 'A category: which shelf?' },
      livres: { nom: 'Books', aide: 'A book: which shelf?' },
      chrono: { nom: 'Timer', aide: 'Twenty books against the clock' },
    },
    filtres: { tous: 'Both floors', '1': 'Floor 1', '2': 'Floor 2' },
    nomsSurCarte: 'Category names on the map',
    categorie: 'Category',
    titreLivre: 'Title',
    exact: (attendu: string, categorie: string) => `Correct: ${attendu} — ${categorie}`,
    faute: (choisi: string, attendu: string, categorie: string) =>
      `No, ${choisi}: it was ${attendu} — ${categorie}`,
    entreePourContinuer: 'Enter to continue',
    continuer: 'Continue',
    record: 'Best',
    aucun: 'none',
    lancer: 'Start',
    relancer: 'Run again',
    chronoConsigne: (n: number, penalite: number) => `${n} books, +${penalite} s per mistake`,
    chronoTitre: (i: number, n: number) => `Book ${i}/${n}`,
    fautes: (n: number) => `${n} mistake${n > 1 ? 's' : ''}`,
    termine: 'Finished in',
    score: 'score',
    raccourcis:
      'Keyboard: 1 or 2, then the shelf letter (on a single floor, the letter alone). Esc clears.',
    carte: 'Library map',
    maitrise: 'Mastery per shelf',
    planSu: 'map known',
    effacer: 'Reset progress',
    confirmerEffacer: 'Erase all progress and records?',
    credits:
      'Free fan-made tool. Titles, covers and map belong to the game’s authors; map after the Steam guide “Complete Guide (Map, All Floors, Shelves & Book Lists)”.',
    langue: 'Français',
  },
}
