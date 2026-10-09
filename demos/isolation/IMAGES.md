# Images du site isolation

Les fichiers vont dans `assets/img/`, en WebP (qualité 80), avec exactement ces noms. Tant qu'une image manque, le site affiche un dessin à la place.

| Fichier | Format | Où elle apparaît | État |
|---|---|---|---|
| `hero.webp` | 16:9 | Grande photo sous le titre | déjà en place |
| `chantier-iti.webp` | 4:3 | Carte « Isolation des murs » | déjà en place |
| `combles-amenages.webp` | 3:4 | Carte « Combles & rampants » | déjà en place |
| `peinture.webp` | 1:1 | Carte « Peinture intérieure » | déjà en place |
| `platrerie.webp` | 1:1 | Carte « Plâtrerie & cloisons » | à générer |
| `amenagement.webp` | 1:1 | Carte « Aménagement » | à générer |
| `avant.webp` | 16:9 | Slider avant / après (gauche) | à générer |
| `apres.webp` | 16:9 | Slider avant / après (droite) | à générer en retouchant `avant.webp` |

## platrerie.webp (1:1)
```
35mm film photograph, shot on Kodak Portra 400, neutral white balance. Close-up of a plasterer's hands in light grey gloves applying smooth white joint compound with a wide stainless-steel taping knife over the seam between two plasterboard panels, a clean bright room, soft side daylight raking across the wall to reveal the perfectly smooth finish. Knife and hands in the upper half of the frame. Shallow depth of field, crisp texture, palette of white, light grey and steel. No face, no orange tones, no logos, no text.
```

## amenagement.webp (1:1)
```
35mm film photograph, shot on Kodak Portra 400, neutral white balance. A made-to-measure built-in wardrobe with flush white doors and pale oak shelves integrated into an alcove of a renovated old stone house, smooth white walls, pale oak floor, soft daylight, a few folded linen shirts and a wicker basket on the open shelves. Wardrobe in the upper half of the frame. Calm, precise, high-end craftsmanship, palette of white, pale oak and light grey. No people, no orange tones, no text, no logo.
```

## avant.webp (16:9)
```
35mm film photograph, shot on Kodak Portra 400, neutral cool white balance. Interior of an old house in winter, before renovation: a bare, slightly uneven interior wall in grey stone and lime mortar, light condensation around an old wooden window, cold pale daylight, an old cast-iron radiator under the window, empty room, realistic and clean, not dramatic. Straight-on frontal composition, camera at chest height, the window exactly in the centre of the frame. Muted colors, gentle film grain. No people, no text.
```

## apres.webp (16:9)
Importe `avant.webp` dans ton outil et demande une retouche avec ce prompt, pour garder exactement le même cadrage :
```
Keep the exact same room, same framing and same camera position. Show it after renovation: the stone wall is now a perfectly smooth insulated wall, freshly painted in soft off-white, with clean window reveals and new white skirting boards. Same window in the centre, now repainted. Pale oak floor, a light linen armchair, a slim floor lamp, a small olive tree in a white pot. Soft daylight, bright airy palette of white, pale oak and sage. 35mm film look, gentle grain. No people, no orange tones, no text.
```
