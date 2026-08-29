# Nettoie les couvertures SVG du wiki (src/assets/couvertures) : retire les textes qui
# donnent la reponse (section et volumes) et le pied de page du wiki, garde le titre
# et le dessin. Idempotent : peut se relancer apres un nouveau telechargement.
# Usage : python scripts/nettoyer-couvertures.py
import re
from pathlib import Path

DOSSIER = Path(__file__).resolve().parent.parent / "src" / "assets" / "couvertures"
TEXTE = re.compile(r"<text[^>]*>(.*?)</text>", re.S)
INTERDITS = re.compile(r"(VOLUMES|COVER REFERENCE|GAME DB|\b[12][A-Q]\b)", re.I)

nettoyes = 0
retires = 0
for fichier in sorted(DOSSIER.glob("*.svg")):
    contenu = fichier.read_text(encoding="utf-8")
    def filtre(m):
        global retires
        if INTERDITS.search(m.group(1)):
            retires += 1
            return ""
        return m.group(0)
    nouveau = TEXTE.sub(filtre, contenu)
    # Une ligne decorative peut rester au-dessus du pied de page : sans consequence.
    if nouveau != contenu:
        fichier.write_text(nouveau, encoding="utf-8")
        nettoyes += 1
print("fichiers modifies :", nettoyes, "; textes retires :", retires)
reste = 0
for fichier in DOSSIER.glob("*.svg"):
    for m in TEXTE.finditer(fichier.read_text(encoding="utf-8")):
        if INTERDITS.search(m.group(1)):
            reste += 1
print("textes revelateurs restants :", reste)
