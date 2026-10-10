# Images à générer : pompe à chaleur

Déposer les fichiers dans `assets/img/` avec exactement ces noms. Tant qu’un fichier manque, le site affiche une illustration au trait à sa place.

| Fichier | Format | Emplacement |
| --- | --- | --- |
| `hero.webp` | 16:9 | Grande image du haut de page (recadrée en 21:9 sur grand écran, en 4:5 sur mobile : sujet bien centré) |
| `pac-air-eau.webp` | 4:3 | Expertise, grande carte « Pompe à chaleur air/eau » |
| `pac-air-air.webp` | 3:4 | Expertise, carte haute « Pompe à chaleur air/air » |
| `chauffe-eau-thermodynamique.webp` | 1:1 | Expertise, carte « Chauffe-eau thermodynamique » |
| `entretien-pac.webp` | 1:1 | Expertise, carte « Entretien & dépannage » |
| `etude-dimensionnement.webp` | 1:1 | Expertise, carte « Étude de dimensionnement » |
| `avant.webp` | 16:9 | Comparateur avant / après, côté gauche (recadré en 4:5 sur mobile) |
| `apres.webp` | 16:9 | Comparateur avant / après, côté droit (recadré en 4:5 sur mobile) |

Cartes d’expertise : un bandeau en verre dépoli couvre le bas de l’image, le sujet doit donc se trouver dans la moitié haute.

Avant / après : générer d’abord `avant.webp`, puis obtenir `apres.webp` en éditant l’image « avant » (même cadrage, même lumière, même pièce), pour que le curseur compare vraiment le même lieu.

## Prompts

### hero.webp (16:9)

```
35mm film photograph, shot on Kodak Portra 400, neutral white balance. A modest detached family house with pale render walls and a simple grey roof, seen from the garden on a clear winter morning. A white air-to-water heat pump outdoor unit stands on low supports against the side wall, neatly connected, with a light frost on the lawn. House and unit centred in the frame with generous empty sky above, so the image can be cropped to a tall portrait format. Soft daylight, gentle film grain, muted natural palette of white, stone grey, pale oak and sage. Calm, clean, understated. No faces, no orange tones, no text, no logo.
```

### pac-air-eau.webp (4:3)

```
35mm film photograph, shot on Kodak Portra 400, neutral white balance. Close three-quarter view of a white air-to-water heat pump outdoor unit mounted on anti-vibration feet against a light stone wall, with tidy insulated refrigerant pipes running into the wall through a neat cover. The unit sits in the upper half of the frame, a strip of gravel and a little frosted grass below. Soft daylight, gentle film grain, muted natural palette of white, stone grey, pale oak and sage. No faces, no orange tones, no text, no logo, no brand markings on the unit.
```

### pac-air-air.webp (3:4)

```
35mm film photograph, shot on Kodak Portra 400, neutral white balance. Bright, sparsely furnished living room with white walls and a pale oak floor. A slim white wall-mounted air-to-air heat pump indoor unit is fixed high on the wall above a doorway, its louvre slightly open. The indoor unit sits in the upper third of the frame, a linen armchair and a plant visible lower down. Soft daylight from a side window, gentle film grain, muted natural palette of white, stone grey, pale oak and sage. No faces, no orange tones, no text, no logo, no brand markings.
```

### chauffe-eau-thermodynamique.webp (1:1)

```
35mm film photograph, shot on Kodak Portra 400, neutral white balance. A white heat pump water heater, a tall cylinder with its compact heat pump head on top, installed in a clean utility room with light grey tiled walls and neatly insulated copper pipes. The top of the appliance and its connections fill the upper half of the frame. Soft daylight, gentle film grain, muted natural palette of white, stone grey, pale oak and sage. No faces, no orange tones, no text, no logo, no brand markings.
```

### entretien-pac.webp (1:1)

```
35mm film photograph, shot on Kodak Portra 400, neutral white balance. Maintenance check on a white heat pump outdoor unit: a refrigeration manifold with two round pressure gauges and blue and grey hoses connected to the service valves, a technician's gloved hands just entering the frame. Gauges and valves in the upper half of the frame, sharp focus, shallow depth of field. Soft daylight, gentle film grain, muted natural palette of white, stone grey, pale oak and sage. No faces, no orange tones, no text, no logo, no brand markings.
```

### etude-dimensionnement.webp (1:1)

```
35mm film photograph, shot on Kodak Portra 400, neutral white balance. Top-down view of a pale oak table with a printed floor plan of a house, a few handwritten room measurements, a pencil, a folded tape measure and a small infrared thermometer. The plan occupies the upper half of the frame, the table surface continues below. Soft daylight, gentle film grain, muted natural palette of white, stone grey, pale oak and sage. No faces, no orange tones, no legible text, no logo.
```

### avant.webp (16:9)

```
35mm film photograph, shot on Kodak Portra 400, neutral white balance. Front view of an old floor-standing oil boiler in a modest basement boiler room: cream-coloured casing with age marks, a black flue pipe rising to the wall, a dusty oil tank to the left, bare concrete floor and plain light walls. Boiler centred in the frame, wide enough to be cropped to a portrait format. Soft daylight from a small window, gentle film grain, muted natural palette of white, stone grey, pale oak and sage. No faces, no orange tones, no text, no logo, no brand markings.
```

### apres.webp (16:9)

```
Edit of the "avant" image, same framing, same room, same light. The old oil boiler, its flue pipe and the oil tank are gone. In their place stands a clean white floor-standing heat pump indoor unit with integrated hot water cylinder, centred where the boiler was, with neat insulated pipes rising to the ceiling. Walls freshly painted off-white, floor clean, a simple shelf on the right. 35mm film photograph, shot on Kodak Portra 400, neutral white balance, soft daylight, gentle film grain, muted natural palette of white, stone grey, pale oak and sage. No faces, no orange tones, no text, no logo, no brand markings.
```
