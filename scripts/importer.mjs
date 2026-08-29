// Régénère src/donnees/livres.json depuis la feuille Google du catalogue.
// Usage : node scripts/importer.mjs
import { writeFileSync } from "node:fs"

const FEUILLE = "1sJ6mWVzr3gadsEi66Oa0qrx_7OBQ0E1pZpunuGbHlD0"
const ONGLET = "80450132"
const ADRESSE = `https://docs.google.com/spreadsheets/d/${FEUILLE}/export?format=csv&gid=${ONGLET}`

function lireCsv(texte) {
  const lignes = []
  let champ = ""
  let ligne = []
  let entreGuillemets = false
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i]
    if (entreGuillemets) {
      if (c === '"') {
        if (texte[i + 1] === '"') {
          champ += '"'
          i++
        } else {
          entreGuillemets = false
        }
      } else {
        champ += c
      }
    } else if (c === '"') {
      entreGuillemets = true
    } else if (c === ",") {
      ligne.push(champ)
      champ = ""
    } else if (c === "\n") {
      ligne.push(champ)
      lignes.push(ligne)
      ligne = []
      champ = ""
    } else if (c !== "\r") {
      champ += c
    }
  }
  if (champ || ligne.length) {
    ligne.push(champ)
    lignes.push(ligne)
  }
  return lignes
}

const reponse = await fetch(ADRESSE)
if (!reponse.ok) throw new Error(`Téléchargement impossible : ${reponse.status}`)
const [entete, ...corps] = lireCsv(await reponse.text())
const colonne = (nom) => entete.indexOf(nom)
const iTitre = colonne("Book Title")
const iCategorie = colonne("Category")
const iSection = colonne("Section")
const iVolumes = colonne("Volumes")
if ([iTitre, iCategorie, iSection, iVolumes].includes(-1)) {
  throw new Error(`Colonnes inattendues : ${entete.join(", ")}`)
}

const livres = corps
  .filter((r) => r[iTitre] && r[iTitre].trim())
  .map((r) => ({
    titre: r[iTitre].trim(),
    categorie: r[iCategorie].trim(),
    section: r[iSection].trim(),
    volumes: Number(r[iVolumes]),
  }))

writeFileSync(new URL("../src/donnees/livres.json", import.meta.url), JSON.stringify(livres, null, 2) + "\n")
console.log(`${livres.length} livres écrits dans src/donnees/livres.json`)
