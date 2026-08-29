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
- La carte (`src/Plan.tsx`) est l'image du jeu, les deux étages composés sur une seule
  vue (`src/assets/carte.png`, 2022 x 778, tirée du guide Steam « Complete Guide (Map,
  All Floors, Shelves & Book Lists) ») : escalier à gauche, premier étage au centre en
  deux rangées (A, C, E... en haut, B, D, F... en bas) puis 1M et 1N dans l'alcôve du
  fond ; galerie du second étage le long des murs (2A à 2K en haut, 2B à 2L en bas, 2M à
  2Q au fond). Les zones cliquables (`src/jeu/plan.ts`, en pixels de l'image) épousent
  les cadres d'identifiants et restent invisibles hors survol et réponse. Sans l'aide,
  l'application affiche `carte-muette.png`, la même carte avec les noms de catégories
  effacés ; `python scripts/effacer-noms.py` la régénère (Pillow). Un test vérifie que
  chaque section a une zone et qu'aucune zone n'en chevauche une autre.
- Progression et records en localStorage.

- Les couvertures (`src/assets/couvertures`, 400 SVG, `src/donnees/couvertures.json` pour
  la correspondance titre vers fichier) viennent du wiki librarian.gamedb.wiki :
  dessins du wiki aux familles de couleurs du jeu, pas les textures originales.
  `scripts/nettoyer-couvertures.py` en retire les textes qui donneraient la réponse
  (section, volumes, pied de page) ; à relancer après tout nouveau téléchargement.
  Elles s'affichent à côté du titre dans les modes Livres et Chrono.

## Règles techniques

- Vite + React + TypeScript, aucune librairie supplémentaire. La logique pure vit dans
  `src/jeu/`, React n'est que l'affichage dans `src/App.tsx`.
- `npm test` (vitest) sur la logique, `npm run build` avant chaque commit.
- Français, accents corrects, zéro emoji. Les titres et catégories restent en anglais :
  ce sont ceux du jeu.
