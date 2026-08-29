// Test de bout en bout de la carte : clique au centre de chaque cadre d identifiant
// (coordonnees de l image, independantes des zones) et verifie que l application
// reconnait la bonne etagere, a plusieurs largeurs d ecran.
// Usage : lancer le serveur (npm run dev -- --port 5180) puis node scripts/test-carte.mjs
import { chromium } from "playwright-core"
import { readFileSync } from "node:fs"

const ADRESSE = process.env.ADRESSE || "http://localhost:5180/"
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe"
const src = readFileSync(new URL("../src/jeu/plan.ts", import.meta.url), "utf8")
const centres = [...src.matchAll(/'(\d[A-Q])': \[(\d+), (\d+)\]/g)].map((m) => [m[1], Number(m[2]), Number(m[3])])

const nav = await chromium.launch({ executablePath: CHROME, headless: true })
let echec = false
for (const largeur of [1100, 760, 1600]) {
  const page = await nav.newPage({ viewport: { width: largeur, height: 1400 } })
  // Entrainement libre : la session du jour se viderait apres dix nouveaux.
  await page.addInitScript(() => localStorage.setItem("arcane-librarian-reglages", JSON.stringify({ entrainement: "libre", affichage: "complet", quotaNouveaux: 10, longueurChrono: 20 })))
  await page.goto(ADRESSE, { waitUntil: "networkidle" })
  await page.waitForSelector(".carte-image")
  await page.waitForTimeout(400)
  let bons = 0
  const rates = []
  for (const [section, cx, cy] of centres) {
    await page.waitForFunction(() => /_$/.test(document.querySelector(".saisie").innerText.trim()), null, { timeout: 5000 })
    await page.locator(".carte-image").scrollIntoViewIfNeeded()
    const r = await page.locator(".carte-image").boundingBox()
    await page.mouse.click(r.x + (cx / 2022) * r.width, r.y + (cy / 778) * r.height)
    await page.waitForFunction(() => !/_$/.test(document.querySelector(".saisie").innerText.trim()), null, { timeout: 5000 })
    const texte = (await page.locator(".saisie").innerText()).trim()
    const m = texte.match(/(\d[A-Q])/)
    if (m && m[1] === section) bons++
    else rates.push(`${section} -> ${texte.slice(0, 50)}`)
    if (/^(Non|No,)/.test(texte)) await page.keyboard.press("Enter")
  }
  console.log(`largeur ${largeur} : ${bons}/${centres.length} reconnues`, rates.length ? rates : "")
  if (bons !== centres.length) echec = true
  await page.close()
}
await nav.close()
process.exit(echec ? 1 : 0)
