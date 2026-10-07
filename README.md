# KP Prestations · site démo

Site vitrine pour **KP Prestations** (Kévin Prieur) : isolation, plâtrerie, peinture à Saint-Lager (69220), Beaujolais.

Le site est 100 % statique (HTML, CSS, JS). Il n'y a rien à installer et aucune étape de build. Toutes les librairies et polices sont incluses dans le dossier : aucun appel à Google Fonts ni à un CDN, donc rien à déclarer côté RGPD.

## Structure

```
index.html               page principale (V2, design blanc et gris clair)
v1/                      ancienne version sombre et bleue, conservée pour comparaison (v1/index.html)
mentions-legales.html    mentions légales + RGPD (champs [à compléter] surlignés)
favicon.svg
robots.txt, sitemap.xml  SEO (robots.txt bloque l'indexation tant que c'est une démo)
_headers                 en-têtes Cloudflare Pages (sécurité, cache, noindex de démo)
assets/
  css/style.css          design system (variables en haut du fichier)
  js/main.js             animations, simulateur, formulaire
  vendor/                GSAP 3.15 (ScrollTrigger, SplitText) + Lenis
  fonts/                 Geist (auto-hébergée)
  img/                   les 8 images à générer (voir plus bas)
```

## Voir le site en local

Ouvrir `index.html` dans un navigateur fonctionne. Pour un rendu identique à la mise en ligne, lancer un petit serveur :

```bash
npx serve .
```

## Mettre en ligne (Cloudflare Pages)

1. Option rapide : dashboard Cloudflare → Workers & Pages → Create → Pages → **Upload assets**, puis glisser le dossier complet.
2. Option GitHub : connecter ce dépôt. Laisser le build vide, avec `/` comme dossier de sortie.

Tant que c'est une démo, le site est volontairement **non indexé** (balise `noindex`, `robots.txt` et en-tête `X-Robots-Tag`). Pour la vraie mise en ligne :

1. Retirer `<meta name="robots" content="noindex, nofollow">` de `index.html`.
2. Retirer la ligne `X-Robots-Tag` de `_headers`.
3. Remplacer `robots.txt` par `User-agent: *`, `Allow: /` et `Sitemap: https://www.kp-prestations.fr/sitemap.xml`.
4. Ajouter dans `index.html` `<link rel="canonical" href="https://www.kp-prestations.fr/">` et passer `og:image` en adresse absolue (`https://www.kp-prestations.fr/assets/img/og.jpg`).
5. Adapter le domaine dans `sitemap.xml` s'il change.

## Les 8 images à générer

Déposer les fichiers dans `assets/img/` **avec exactement ces noms**. Tant qu'une image manque, le site affiche à sa place une illustration de repli : rien ne casse.

| Fichier | Format à générer | Où elle apparaît | Cadrage |
|---|---|---|---|
| `hero.webp` | 16:9, 2560 px de large | Grande photo sous le titre (s'élargit au défilement) | Sujet au centre : sur mobile, la photo est recadrée en portrait 4:5. Coin bas-droit calme (le formulaire s'y pose sur ordinateur). |
| `avant.webp` | 16:9, 2000 px | Comparateur avant / après | Fenêtre au centre (recadrage 4:5 sur mobile) |
| `apres.webp` | 16:9, 2000 px | Comparateur avant / après | Cadrage identique à `avant.webp` |
| `chantier-iti.webp` | 4:3, 2000 px | Grande carte « Isolation des murs » | Sujet dans la moitié haute : la légende en verre couvre le bas |
| `combles-amenages.webp` | 3:4 portrait, 1400 px | Carte « Combles & rampants » | Sujet dans la moitié haute |
| `platrerie.webp` | 1:1, 1200 px | Carte « Plâtrerie & cloisons » | Sujet dans la moitié haute |
| `peinture.webp` | 1:1, 1200 px | Carte « Peinture intérieure » | Sujet dans la moitié haute |
| `amenagement.webp` | 1:1, 1200 px | Carte « Aménagement & menuiserie » | Sujet dans la moitié haute |

Exporter en **WebP, qualité 80** (par exemple avec squoosh.app). Viser moins de 400 Ko pour le hero, 250 Ko pour les autres.

### Direction artistique commune

Le site est blanc et gris clair : les photos doivent l'être aussi. Lumière du jour douce, intérieurs clairs, murs blancs cassés, chêne clair, lin, pierre grise. Rendu « photo argentique » discret, comme DriveCore. **Pas d'orange, pas de terre cuite, pas d'étalonnage chaud ou « teal & orange », pas de ciel bleu nuit.** Jamais de visage, jamais de texte ni de logo.

### Prompt 1 : `hero.webp`

```
35mm film photograph, shot on Kodak Portra 400, neutral white balance. A bright, freshly renovated living room inside an old Beaujolais stone farmhouse on a frosty winter morning. Smooth off-white insulated walls with clean window reveals, one section of original grey granite stone wall kept as a feature, pale oak floorboards, a linen sofa in light grey, a wool throw, a low oak table with a ceramic mug. A tall window in the centre of the frame looks out onto frosted vineyard rows and soft misty hills. Calm, airy, quietly warm interior against the cold outside. Soft diffused daylight, gentle film grain, muted natural palette of white, stone grey, pale oak and sage. Main subject centred, simple uncluttered edges, calm lower right corner. No people, no orange tones, no text, no logo. --ar 16:9 --style raw
```

### Prompt 2 : `avant.webp`

```
35mm film photograph, shot on Kodak Portra 400, neutral cool white balance. Interior of an old Beaujolais stone house in winter, before renovation: a bare, uneven interior wall in rough grey granite stone and lime mortar, damp patches and light condensation around an old wooden window, cold pale daylight, worn grey stone floor, an old cast-iron radiator under the window, empty room, a bit of dust. Straight-on frontal composition, camera at chest height, the window exactly in the centre of the frame, the wall filling the frame. Muted, slightly desaturated colors, gentle film grain. No people, no text. --ar 16:9 --style raw
```

### Prompt 3 : `apres.webp`

```
35mm film photograph, shot on Kodak Portra 400, neutral white balance. The exact same room, same framing and same camera position as the previous image, after renovation: the stone wall is now a perfectly smooth insulated wall, freshly painted in soft off-white, with clean window reveals and new white skirting boards. Same old wooden window in the centre, now repainted. Pale oak floor, a light linen armchair, a slim floor lamp, a small olive tree in a white pot. Soft daylight, calm and cosy, bright airy palette of white, pale oak and sage. Straight-on frontal composition identical to the "before" photo. Gentle film grain. No people, no orange tones, no text. --ar 16:9 --style raw
```

> Astuce : pour que l'avant et l'après soient parfaitement alignés, génère d'abord `avant.webp`, puis utilise la fonction **édition / inpainting** de ton outil sur cette image avec le prompt 3. Le slider est beaucoup plus impressionnant quand le cadrage est identique.

### Prompt 4 : `chantier-iti.webp`

```
35mm film photograph, shot on Kodak Portra 400, neutral white balance. A French craftsman insulating an old stone wall from the inside: galvanised metal studs fixed in front of a rough grey stone wall, thick light-grey mineral wool panels pressed between the studs, a translucent vapour barrier membrane partly installed, a cordless screwdriver in hand. The craftsman is seen from behind at three-quarter angle, face not visible, wearing clean charcoal work clothes and light grey gloves. Bright, clean, organised worksite, white protective sheets on the floor, soft daylight from a side window. Subject in the upper half of the frame, simple lower part. Shallow depth of field, crisp textures, palette of white, stone grey and charcoal. No yellow or orange tones, no logos, no text. --ar 4:3 --style raw
```

### Prompt 5 : `combles-amenages.webp`

```
35mm film photograph, shot on Kodak Portra 400, neutral white balance. A finished attic bedroom under sloping ceilings in a renovated Beaujolais stone house: smooth white ceiling following the roof slope, one exposed old oak beam, a roof window framing pale green vineyard hills, soft morning light, pale oak floor, minimal furniture, white and light grey linen bedding, a wool throw. Calm, bright and high-end. Roof window and bed in the upper half of the frame. Gentle film grain, muted natural palette. No people, no orange tones, no text. --ar 3:4 --style raw
```

### Prompt 6 : `platrerie.webp`

```
35mm film photograph, shot on Kodak Portra 400, neutral white balance. Close-up of a plasterer's hands in light grey gloves applying smooth white joint compound with a wide stainless-steel taping knife over the seam between two plasterboard panels, a clean bright room, soft side daylight raking across the wall to reveal the perfectly smooth finish. Knife and hands in the upper half of the frame. Shallow depth of field, crisp texture, palette of white, light grey and steel. No face, no orange tones, no logos, no text. --ar 1:1 --style raw
```

### Prompt 7 : `peinture.webp`

```
35mm film photograph, shot on Kodak Portra 400, neutral white balance. A paint roller with a long handle rolling soft off-white paint onto a smooth, freshly plastered wall, a fresh wet stripe catching the light, a neat paint tray on a white drop cloth below, bright room with large window light. Roller in the upper half of the frame. Minimal, clean, airy composition, palette of white, warm grey and pale sage. No people visible except possibly a gloved hand, no orange tones, no logos, no text. --ar 1:1 --style raw
```

### Prompt 8 : `amenagement.webp`

```
35mm film photograph, shot on Kodak Portra 400, neutral white balance. A made-to-measure built-in wardrobe with flush white doors and pale oak shelves integrated into an alcove of a renovated old stone house, smooth white walls, pale oak floor, soft daylight, a few folded linen shirts and a wicker basket on the open shelves. Wardrobe in the upper half of the frame. Calm, precise, high-end craftsmanship, palette of white, pale oak and light grey. No people, no orange tones, no text, no logo. --ar 1:1 --style raw
```

Les paramètres `--ar` et `--style raw` sont pour Midjourney. Sur un autre outil (ChatGPT, Gemini, Flux…), retire-les et indique simplement le format voulu (paysage 16:9, 4:3, portrait 3:4 ou carré 1:1).

## À valider avec Kévin avant la mise en ligne

Ces points sont plausibles mais **n'ont pas pu être vérifiés** publiquement :

- [ ] **Qualification RGE Qualibat** : numéro, domaines couverts et date de validité. Il l'affiche sur son site et sur PagesJaunes, mais l'annuaire officiel n'a pas pu être consulté.
- [ ] **Assurance décennale** : assureur, numéro de contrat, zone couverte (`mentions-legales.html`).
- [ ] **Médiateur de la consommation** (`mentions-legales.html`).
- [ ] **Prestations exactes** : isolation des combles et rampants, caves et garages, rafraîchissement de façade. Son site parle d'« isolation des combles et des caves ».
- [ ] **Visite et devis gratuits** (repris dans le hero, les engagements et la FAQ).
- [ ] **Durées de chantier** citées dans la FAQ (« quelques jours par pièce »).
- [ ] **Rayon de 25 km** et liste des communes.
- [ ] Les prix du simulateur et de la FAQ sont des **moyennes de marché 2026**, présentées comme indicatives. Kévin peut les ajuster dans `assets/js/main.js` (bloc `SIM`).
- [ ] **« Prime CEE déduite du devis »** : seulement s'il travaille avec un obligé ou un délégataire CEE. Sinon, remplacer par « Prime CEE : on monte le dossier ».
- [ ] **Travaille seul** (le site dit « un seul interlocuteur ») : à confirmer.
- [ ] **contact@kp-prestations.fr** : vérifier que l'adresse existe et reçoit bien les e-mails.
- [ ] **Aides locales** : nom exact des programmes de la Communauté d'agglomération Villefranche Beaujolais Saône et de la Communauté de communes Saône-Beaujolais.
- [ ] **Hébergeur** dans `mentions-legales.html`, selon l'hébergement choisi.
- [ ] Remplacer les images IA de l'avant / après par de **vraies photos de chantier** dès que possible, et retirer alors la mention « images d'illustration ».

Volontairement **absents** du site, faute de source : avis clients et notes, nombre de chantiers, années d'expérience, réseaux sociaux, matériaux et marques.

## Formulaire de devis

En démo, le formulaire valide les champs puis propose d'envoyer la demande par e-mail (`mailto:` pré-rempli vers contact@kp-prestations.fr). Pour une réception automatique, brancher un service comme Web3Forms ou Formspree (gratuit, sans serveur) dans le gestionnaire `submit` de `assets/js/main.js`.

## Conformité intégrée

- Mention **France Rénov'** obligatoire depuis le 1er octobre 2026, au mot près, avec lien (section Aides et pied de page).
- Aides présentées selon les règles **en vigueur depuis le 1er septembre 2026** : MaPrimeRénov' ne finance plus l'isolation « par geste ».
- Consentement explicite dans le formulaire (démarchage interdit dans la rénovation énergétique).
- Aucune promesse « isolation à 1 € » ou « reste à charge zéro ».
- Aucun cookie et aucun service tiers.

## Licences

- GSAP 3 : licence « Standard No Charge » (usage commercial gratuit), gsap.com/standard-license
- Lenis : MIT
- Geist : SIL Open Font License
