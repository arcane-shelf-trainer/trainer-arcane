# Entraîneur Arcane Librarian

Application web statique pour mémoriser, en vue du speedrun du jeu *Arcane Librarian*,
l'étagère (section 1A à 1N, 2A à 2Q) de chaque catégorie et de chacun des 400 titres.

## Données

- Source : la feuille Google « Arcane Librarian Book Catalogue », onglet gid 80450132
  (colonnes Book Title, Category, Section, Volumes ; les colonnes visuelles sont vides).
  Chaque catégorie tient sur une seule étagère.
- `node scripts/importer.mjs` retélécharge la feuille et régénère
  `src/donnees/livres.json`. C'est la seule façon de modifier les données.

## Ce que fait l'application

- Trois modes : Plan (catégorie vers étagère), Livres (titre vers étagère), Chrono
  (vingt titres contre la montre, trois secondes de pénalité par faute, record par filtre
  d'étage).
- Répétition espacée par boîtes de Leitner (`src/jeu/leitner.ts`, pur et testé) : les
  inconnus reviennent souvent, les maîtrisés rarement.
- Réponse au clavier (1 ou 2 puis la lettre ; & et é acceptés pour l'AZERTY ; sur un seul
  étage, la lettre suffit) ou au clic sur le plan des étagères. Entrée ou Espace pour
  continuer après une faute.
- Progression et records en localStorage.

## Règles techniques

- Vite + React + TypeScript, aucune librairie supplémentaire. La logique pure vit dans
  `src/jeu/`, React n'est que l'affichage dans `src/App.tsx`.
- `npm test` (vitest) sur la logique, `npm run build` avant chaque commit.
- Français, accents corrects, zéro emoji. Les titres et catégories restent en anglais :
  ce sont ceux du jeu.
