# Produit src/assets/carte-muette.png : la carte du jeu (2022 x 778) sans les noms de
# catégories. Chaque rectangle de texte est recouvert d'un pavage de parchemin (ou du
# fond sombre de l'alcôve) prélevé sur l'image, recoloré selon le voisinage immédiat du
# rectangle pour suivre le vignettage, avec des bords fondus.
# Usage : python scripts/effacer-noms.py   (nécessite Pillow : pip install pillow)
from pathlib import Path
import random

from PIL import Image, ImageFilter, ImageStat

RACINE = Path(__file__).resolve().parent.parent
SOURCE = RACINE / "src" / "assets" / "carte.png"
CIBLE = RACINE / "src" / "assets" / "carte-muette.png"

# Rectangles (x1, y1, x2, y2, nature) en pixels de l'original, mesurés sur des zooms.
RUSTINES = [
    # Second étage, galerie du haut (sous le cadre, entre ou sur les flèches)
    (560, 112, 640, 143, "parchemin"),  # 2A Warrior
    (748, 112, 880, 143, "parchemin"),  # 2C Daily Magic
    (996, 112, 1040, 143, "parchemin"),  # 2E Art
    (1163, 112, 1297, 143, "parchemin"),  # 2G Economics
    (1394, 112, 1495, 144, "parchemin"),  # 2I Psychology
    (1578, 112, 1727, 143, "parchemin"),  # 2K Jurisprudence
    # Premier étage, rangée du haut
    (570, 297, 710, 336, "parchemin"),  # 1A Monsterology
    (732, 258, 852, 322, "parchemin"),  # 1C Curses and Dispels
    (886, 297, 1014, 336, "parchemin"),  # 1E Necromancy
    (1036, 258, 1208, 322, "parchemin"),  # 1G Magical Artifacts and Enchanting
    (1218, 297, 1364, 336, "parchemin"),  # 1I Illusion Magic
    (1379, 248, 1500, 340, "parchemin"),  # 1K Healer and Healing Magic
    # Alcôve
    (1558, 272, 1677, 328, "sombre"),  # 1M Destruction Magic
    (1573, 424, 1667, 526, "sombre"),  # 1N Alchemy and Potion-Making
    # Premier étage, rangée du bas
    (564, 511, 711, 572, "parchemin"),  # 1B Astrology and Divination
    (749, 515, 846, 572, "parchemin"),  # 1D Bard and Music
    (886, 511, 1034, 546, "parchemin"),  # 1F Transfiguration
    (1079, 515, 1158, 546, "parchemin"),  # 1H Stealth
    (1224, 511, 1341, 572, "parchemin"),  # 1J Summoning Magic
    (1402, 528, 1476, 592, "parchemin"),  # 1L Holy Magic
    # Second étage, galerie du bas
    (561, 682, 652, 720, "parchemin"),  # 2B Archery
    (743, 682, 882, 720, "parchemin"),  # 2D Mathematics
    (948, 682, 1089, 720, "parchemin"),  # 2F Management
    (1175, 682, 1287, 720, "parchemin"),  # 2H Sociology
    (1373, 682, 1499, 720, "parchemin"),  # 2J Philosophy
    (1555, 682, 1729, 720, "parchemin"),  # 2L Romance Novels
    # Second étage, mur du fond (à l'intérieur des cadres)
    (1843, 113, 1932, 168, "parchemin"),  # 2M Mystery Novels
    (1858, 235, 1942, 268, "parchemin"),  # 2N History
    (1872, 346, 1950, 428, "parchemin"),  # 2O The Travels of Otherworld
    (1850, 482, 1950, 520, "parchemin"),  # 2P Dungeons
    (1843, 607, 1942, 646, "parchemin"),  # 2Q Language
]

# Tuiles de texture : parchemin vide sous la galerie haute, fond sombre entre 1M et 1N.
ECHANTILLONS = {
    "parchemin": (1000, 168, 1090, 198),
    "sombre": (1575, 338, 1650, 388),
}

# Luminances retenues pour mesurer la couleur du voisinage (on écarte texte et traits).
LUMINANCE = {"parchemin": (120, 256), "sombre": (15, 95)}

DEBORD = 2  # la rustine opaque déborde d'autant du rectangle mesuré
FONDU = 5  # largeur du dégradé au-delà
ANNEAU = 6  # épaisseur du voisinage mesuré autour de chaque rustine


def luminance(p):
    return 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]


def moyenne_filtree(image, zone, nature):
    bas, haut = LUMINANCE[nature]
    if zone[2] <= zone[0] or zone[3] <= zone[1]:
        return None
    retenus = [p for p in image.crop(zone).getdata() if bas <= luminance(p) < haut]
    if len(retenus) < 20:
        return None
    n = len(retenus)
    return tuple(sum(p[i] for p in retenus) / n for i in range(3))


def voisinage(image, rect, nature):
    x1, y1, x2, y2 = rect
    l, h = image.size
    anneaux = [
        (max(0, x1 - ANNEAU), max(0, y1 - ANNEAU), min(l, x2 + ANNEAU), y1),
        (max(0, x1 - ANNEAU), y2, min(l, x2 + ANNEAU), min(h, y2 + ANNEAU)),
        (max(0, x1 - ANNEAU), y1, x1, y2),
        (x2, y1, min(l, x2 + ANNEAU), y2),
    ]
    sommes = [0.0, 0.0, 0.0]
    poids = 0
    for z in anneaux:
        m = moyenne_filtree(image, z, nature)
        if m is None:
            continue
        aire = (z[2] - z[0]) * (z[3] - z[1])
        for i in range(3):
            sommes[i] += m[i] * aire
        poids += aire
    return None if poids == 0 else tuple(s / poids for s in sommes)


def pavage(image, nature, l, h):
    # Filtre médian : ôte les taches ponctuelles de la tuile (sinon elles se répètent
    # dans chaque rustine) tout en gardant le grain du parchemin.
    tuile = image.crop(ECHANTILLONS[nature]).filter(ImageFilter.MedianFilter(7))
    tl, th = tuile.size
    sortie = Image.new("RGB", (l, h))
    y = -random.randint(0, th // 2)
    while y < h:
        x = -random.randint(0, tl // 2)
        while x < l:
            t = tuile.transpose(Image.FLIP_LEFT_RIGHT) if random.random() < 0.5 else tuile
            if random.random() < 0.5:
                t = t.transpose(Image.FLIP_TOP_BOTTOM)
            sortie.paste(t, (x, y))
            x += tl
        y += th
    return sortie


def recolorer(patch, cible):
    if cible is None:
        return patch
    moyenne = ImageStat.Stat(patch).mean
    bandes = patch.split()
    ajustees = []
    for i in range(3):
        facteur = cible[i] / max(1.0, moyenne[i])
        ajustees.append(bandes[i].point(lambda v, f=facteur: max(0, min(255, round(v * f)))))
    return Image.merge("RGB", ajustees)


def main():
    random.seed(7)
    image = Image.open(SOURCE).convert("RGB")
    largeur, hauteur = image.size
    for x1, y1, x2, y2, nature in RUSTINES:
        couleur = voisinage(image, (x1, y1, x2, y2), nature)
        marge = DEBORD + FONDU
        boite = (max(0, x1 - marge), max(0, y1 - marge), min(largeur, x2 + marge), min(hauteur, y2 + marge))
        l, h = boite[2] - boite[0], boite[3] - boite[1]
        patch = recolorer(pavage(image, nature, l, h), couleur)
        masque = Image.new("L", (l, h), 0)
        masque.paste(255, (FONDU, FONDU, l - FONDU, h - FONDU))
        masque = masque.filter(ImageFilter.GaussianBlur(FONDU / 2))
        image.paste(patch, boite, masque)
    image.quantize(256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG).save(
        CIBLE, optimize=True
    )
    print("écrit", CIBLE, image.size)


if __name__ == "__main__":
    main()
