# Arcane Library Shelf Trainer

A free, fan-made trainer for *Librarian: Tidy Up the Arcane Library!* Learn which shelf
(1A to 1N, 2A to 2Q) every one of the 400 books belongs to, for speedrunning or just to
stop reading the wall maps.

- **Map** mode: a category, which shelf?
- **Books** mode: a book (real cover and spine), which shelf? The series size (3, 5 or
  10 volumes) is shown under the title, and a filter restricts the deck to one size —
  3-volume series earn skill points fastest in a speedrun.
- **Shelf** mode: a shelf, which of four books belongs there? Keys 1 to 4. The shelf is
  highlighted on the map.
- **Volumes** mode: a book, how many volumes in its series? Keys 3, 5 or 1 (for 10).
- **Today's session**: spaced repetition over days (10 min, 1, 3, 7, 21, 45, 90 days),
  ten new books a day shelf by shelf, then free practice. Wrong answers show the book
  in the game, the category's keywords and a note. Your confusions are tracked and can
  be drilled. Progress can be exported and imported as JSON.
- **Timer** mode: twenty books against the clock, three seconds per mistake, best time kept.
- Spaced repetition: what you miss comes back often, what you know comes back rarely.
- Answer with the keyboard (`1` or `2`, then the shelf letter) or by clicking the real
  library map. Category names on the map can be hidden.
- French and English interface. Progress stays in your browser.

## Running it locally

```
npm install
npm run dev
```

`npm test` runs the unit tests, `npm run build` produces the static site in `dist/`.

## Data

Titles and shelves come from the community spreadsheet « Arcane Librarian Book
Catalogue »; `node scripts/importer.mjs` refreshes them. Covers, spines and in-game
scenes are the game's own images, gathered from the same spreadsheet. The map is the
game's wall maps as composed in the Steam guide « Complete Guide (Map, All Floors,
Shelves & Book Lists) ». All of it belongs to the game's authors and to the guide
authors; this tool only helps players learn.
