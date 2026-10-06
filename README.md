# KP Prestations · site démo

Site vitrine pour **KP Prestations** (Kévin Prieur) : isolation, plâtrerie, peinture à Saint-Lager (69220), Beaujolais.

Le site est 100 % statique (HTML, CSS, JS). Il n'y a rien à installer et aucune étape de build. Toutes les librairies et polices sont incluses dans le dossier : aucun appel à Google Fonts ni à un CDN, donc rien à déclarer côté RGPD.

## Structure

```
index.html               page principale
mentions-legales.html    mentions légales + RGPD (champs [à compléter] surlignés)
favicon.svg
robots.txt, sitemap.xml  SEO
_headers                 en-têtes Cloudflare Pages (sécurité + cache)
assets/
  css/style.css          design system (variables en haut du fichier)
  js/main.js             animations, simulateur, formulaire
  vendor/                GSAP 3.15 (ScrollTrigger, SplitText) + Lenis
  fonts/                 Geist + Instrument Serif (auto-hébergées)
  img/                   les 5 images à générer (voir plus bas)
```

## Voir le site en local

Ouvrir `index.html` dans un navigateur fonctionne. Pour un rendu identique à la mise en ligne, lancer un petit serveur :

```bash
npx serve .
```

## Mettre en ligne (Cloudflare Pages)

1. Option rapide : dashboard Cloudflare → Workers & Pages → Create → Pages → **Upload assets**, puis glisser le dossier complet.
2. Option GitHub : connecter ce dépôt. Laisser le build vide, avec `/` comme dossier de sortie.

Avant la vraie mise en ligne, remplacer `https://www.kp-prestations.fr/` dans `index.html`, `robots.txt` et `sitemap.xml` si le domaine change.

## Les 5 images à générer

Déposer les fichiers dans `assets/img/` **avec exactement ces noms**. Tant qu'une image manque, le site affiche à sa place une illustration de repli : rien ne casse.

| Fichier | Format | Où elle apparaît |
|---|---|---|
| `hero.webp` | 16:9, 2400 px de large | Plein écran, en haut de page |
| `avant.webp` | 16:9, 2000 px | Comparateur avant / après (gauche) |
| `apres.webp` | 16:9, 2000 px | Comparateur avant / après (droite) |
| `chantier-iti.webp` | 4:3, 1600 px | Grande carte « Isolation des murs » |
| `combles-amenages.webp` | 3:4 (portrait), 1200 px | Carte « Combles & rampants » |

Exporter en **WebP, qualité 80** (par exemple avec squoosh.app). Viser moins de 400 Ko par image.

### Direction artistique commune

Photo éditoriale, lumière naturelle, couleurs fidèles et sobres : pierre, blanc chaud, ardoise, bleu nuit. Pas de teinte orange, pas d'étalonnage « teal & orange ». Le Beaujolais réel : pierre granitique gris-bleu, vignes, mont Brouilly. Jamais de visage, jamais de texte ni de logo.

### Prompt 1 : `hero.webp`

```
Blue hour exterior of a traditional Beaujolais winegrower's stone house (maison vigneronne) at the foot of Mont Brouilly, France. Two-storey house in rough grey-blue granite stone with lime mortar, terracotta tile hip roof, an exterior stone staircase leading to a covered wooden gallery, closed wooden shutters on one side. Soft warm-white interior light glowing through three windows (warm white, not orange). Rows of bare winter vines in the foreground with light frost on the ground, rolling vineyard hills and the silhouette of Mont Brouilly with its small chapel on top in the background, deep navy twilight sky with a few stars. The house sits on the right third of the frame; the left half is calm dark sky and vineyard, left empty for a headline. Editorial architectural photography, shot on Sony A7R V, 35mm lens, f/8, long exposure, natural colors, deep navy and slate tones, crisp detail, subtle film grain. No people, no text, no logo. --ar 16:9 --style raw
```

### Prompt 2 : `avant.webp`

```
Interior of an old Beaujolais stone house in winter, before renovation: a bare, uneven interior wall in rough granite stone and lime mortar, damp patches and light condensation around an old wooden window, cold bluish daylight, worn terracotta floor tiles, an old cast-iron radiator under the window, empty room, a bit of dust. Straight-on frontal composition, camera at chest height, the window slightly left of centre, the wall filling the frame. Realistic interior photography, 24mm lens, f/5.6, cold natural light, muted desaturated colors. No people, no text. --ar 16:9 --style raw
```

### Prompt 3 : `apres.webp`

```
The exact same room, same framing and same camera position as the previous image, after renovation: the stone wall is now a perfectly smooth insulated wall, freshly painted in warm off-white, with clean window reveals and new white skirting boards. Same old wooden window, same terracotta floor, now clean. A linen armchair, a floor lamp switched on, a small olive tree in a pot. Soft warm late-afternoon light, cosy and calm. Straight-on frontal composition identical to the "before" photo, camera at chest height. Realistic interior design photography, 24mm lens, f/5.6, true-to-life colors. No people, no text. --ar 16:9 --style raw
```

> Astuce : pour que l'avant et l'après soient parfaitement alignés, génère d'abord `avant.webp`, puis utilise la fonction **édition / inpainting** de ton outil sur cette image avec le prompt 3. Le slider est beaucoup plus impressionnant quand le cadrage est identique.

### Prompt 4 : `chantier-iti.webp`

```
A professional French craftsman insulating an old stone wall from the inside: galvanised metal studs fixed in front of a rough grey stone wall, thick light-grey mineral wool panels pressed between the studs, a translucent vapour barrier membrane partly installed, a cordless screwdriver in hand, a green laser level line across the wall. The craftsman is seen from behind at three-quarter angle, face not visible, wearing clean dark navy work clothes and grey gloves. Bright, clean, organised worksite, protective sheets on the floor, natural daylight from a side window. Editorial documentary photography, 35mm lens, f/4, shallow depth of field, crisp textures, neutral palette (stone grey, white, navy). No yellow or orange tones, no logos, no text. --ar 4:3 --style raw
```

### Prompt 5 : `combles-amenages.webp`

```
A finished attic bedroom under sloping ceilings in a renovated Beaujolais stone house: smooth white plaster ceiling following the roof slope, one exposed old oak beam, a roof window framing green vineyard hills, soft morning light, light oak floor, minimal French-Scandinavian furniture, linen bedding in white and slate blue, a wool throw. Calm, warm and high-end. Interior design magazine photography, 24mm lens, f/8, natural colors. No people, no text. --ar 3:4 --style raw
```

Les paramètres `--ar` et `--style raw` sont pour Midjourney. Sur un autre outil (ChatGPT, Gemini, Flux…), retire-les et indique simplement le format voulu (paysage 16:9, 4:3 ou portrait 3:4).

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
- Geist, Instrument Serif : SIL Open Font License
