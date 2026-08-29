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

- Six modes : Plan (catégorie vers étagère), Situer (un identifiant, cliquer son
  emplacement de mémoire sur la carte vierge, sans clavier), Livres (titre vers étagère, avec la
  taille de la série affichée), Étagère (une étagère, quatre livres dont un seul y est
  rangé, touches 1 à 4, intrus tirés de préférence sur le même étage, étagère surlignée
  sur le plan), Tomes (titre vers nombre de tomes de la série : 3, 5 ou 10, touches 3,
  5 ou 1), Chrono (vingt titres contre la montre, trois secondes de
  pénalité par faute, record par filtre d'étage et de série). Le filtre « Séries »
  (3, 5, 10) restreint Livres, Tomes et Chrono : en speedrun, les séries de 3 tomes
  donnent les points de compétence le plus vite.
- Répétition espacée (`src/jeu/leitner.ts`, pur et testé) : boîtes de Leitner pour le
  poids de tirage et la maîtrise, plus un échéancier dans le temps (10 min, 1, 3, 7, 21,
  45, 90 jours ; une faute rappelle dans la minute). La « session du jour » ne propose
  que les livres dus et dix nouveaux par jour (dans l'ordre du catalogue, étagère par
  étagère) ; quand elle est vide, l'écran de fin propose dix nouveaux de plus ou
  l'entraînement libre. Réglages (`src/jeu/stockage.ts`) : entraînement, affichage
  (livre et titre, couverture seule, tranche seule), quota de nouveaux, longueur du
  chrono (20, 50, 400).
- À la faute : la scène en jeu du livre, les mots-clés et une note de la catégorie
  (`src/donnees/mots-cles.json`, d'après librariangame.com, notes traduites). Les
  confusions (paires attendu > choisi) sont comptées et proposent un entraînement ciblé
  sur les deux étagères.
- Export et import de la progression en JSON (pied de page).
- Application installable et utilisable hors-ligne : `public/manifest.webmanifest`,
  `public/sw.js` (page et code réseau d'abord avec repli cache, images et polices cache
  d'abord et mises en cache à la demande), enregistré par `src/main.tsx` sur le site
  construit seulement. Icônes dans `public/icones`. Sur petit écran, un bouton agrandit
  la carte au double avec défilement horizontal.
- Réponse au clavier (1 ou 2 puis la lettre ; & et é acceptés pour l'AZERTY ; sur un seul
  étage, la lettre suffit) ou au clic sur le plan des étagères. Entrée ou Espace pour
  continuer après une faute.
- La carte (`src/Plan.tsx`) est l'image du jeu, les deux étages composés sur une seule
  vue (`src/assets/carte.png`, 2022 x 778, tirée du guide Steam « Complete Guide (Map,
  All Floors, Shelves & Book Lists) ») : escalier à gauche, premier étage au centre en
  deux rangées (A, C, E... en haut, B, D, F... en bas) puis 1M et 1N dans l'alcôve du
  fond ; galerie du second étage le long des murs (2A à 2K en haut, 2B à 2L en bas, 2M à
  2Q au fond). Les zones cliquables (`src/jeu/plan.ts`, en pixels de l'image) épousent
  les cadres d'identifiants et restent invisibles hors survol et réponse. Trois images
  au choix (réglage « Carte ») : `carte.png` avec les noms, `carte-muette.png` sans les
  noms de catégories, `carte-vierge.png` sans les identifiants non plus (mémoire
  spatiale pure, forcée en mode Situer) ; `python scripts/effacer-noms.py` régénère les
  deux dernières (Pillow). Un test vérifie que
  chaque section a une zone et qu'aucune zone n'en chevauche une autre.
- Progression et records en localStorage.

- Les visuels des livres (`src/assets/livres`, 1 200 WebP : `NNN-couverture`,
  `NNN-tranche`, `NNN-scene`, NNN étant le rang du livre dans le catalogue à partir
  de 1 ; `src/donnees/visuels.json` donne le rang de chaque titre) sont les vraies
  images du jeu, tirées des images de cellules de la feuille Google (colonnes Image,
  Back, Binding, Cover : scène en jeu, quatrième de couverture, tranche, couverture).
  Ces images n'apparaissent dans aucun export : elles ont été récupérées en ouvrant la
  feuille dans un navigateur piloté, en lisant les identifiants `cosmoId` du modèle de
  la page (page initiale pour les 99 premières lignes, réponse `streamrows` pour les
  suivantes), en les résolvant par l'appel `renderdata` de Google Sheets en adresses
  signées, puis en téléchargeant et réduisant les fichiers (WebP, 360 px de haut).
  Couverture et tranche s'affichent à côté du titre dans les modes Livres et Chrono.

- Interface bilingue : tous les textes vivent dans `src/textes.ts` (français et anglais),
  la langue suit le navigateur puis le choix mémorisé. Titres, catégories et
  identifiants restent en anglais dans les deux langues.
- Publication : `.github/workflows/pages.yml` construit et publie `dist/` sur GitHub
  Pages à chaque poussée (activer une fois Settings > Pages > Source : GitHub Actions).
  Le site est statique, `base: './'`, et fonctionne sur n'importe quel hébergeur.

## Règles techniques

- Vite + React + TypeScript, aucune librairie supplémentaire. La logique pure vit dans
  `src/jeu/`, React n'est que l'affichage dans `src/App.tsx`.
- `npm test` (vitest) sur la logique, `npm run build` avant chaque commit.
- Les zones de la carte ont toutes la même taille (`TAILLE` dans `src/jeu/plan.ts`),
  centrée sur le cadre d'identifiant de chaque étagère (`CENTRES`, pixels de l'image).
  Après toute retouche de la carte ou des zones : serveur lancé sur le port 5180, puis
  `npm run test:carte` (Chrome headless via playwright-core) clique au centre de chaque
  cadre à trois largeurs d'écran et exige 31/31 étagères reconnues.
- Français, accents corrects, zéro emoji. Les titres et catégories restent en anglais :
  ce sont ceux du jeu.
