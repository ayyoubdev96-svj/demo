# Carte du Qadar

Un site interactif pour comprendre le destin (al-qadar) selon le Coran et la Sunna : ce qu’Allah a décrété, ce qui dépend de toi, et quelle attitude avoir à chaque moment (t’efforcer, demander et te confier, accueillir le décret, te repentir).

Site 100 % statique : ouvrir `index.html`, ou lancer `npx serve .` depuis ce dossier. Seules les polices viennent de Google Fonts.

## Les 15 schémas

| # | Schéma | Ce qu’on manipule |
|---|---|---|
| 1 | La carte | Trois cercles (décret d’Allah, causes, ta responsabilité) ; mode jeu pour classer 27 éléments |
| 2 | Avant, au moment d’agir, après | 8 situations de vie et un curseur du temps |
| 3 | Que dois-je faire ? | Arbre de décision qui aboutit à une attitude et ses preuves |
| 4 | Les quatre degrés | Science, écriture, volonté, création, en cercles emboîtés |
| 5 | Deux livres | Frise : le décret écrit par Allah, et le registre de tes actes |
| 6 | Les deux volontés | Tableau 2 × 2 à remplir (volonté cosmique / religieuse) |
| 7 | Le juste milieu | Balance entre Jabriyya, Ahl as-Sunna et Qadariyya |
| 8 | Effort et confiance | Point à déplacer sur un plan moyens × confiance |
| 9 | L’invocation | Les trois issues de toute invocation, règles, invocations liées au destin |
| 10 | Face à l’épreuve | Échelle révolte, patience, contentement, gratitude |
| 11 | L’excuse du destin | Quiz de 10 phrases |
| 12 | Les prophètes | 9 modèles filtrables par attitude |
| 13 | Questions difficiles | 13 réponses avec preuves |
| 14 | Mon carnet | Tri personnel, enregistré dans le navigateur (localStorage) |
| 15 | Bibliothèque des preuves | Recherche en français ou en arabe, filtres par type et par thème |

## Fichiers

```
index.html        la page
css/qadar.css     styles (variables de couleur en haut, thèmes clair et sombre)
js/data.js        preuves : 153 passages du Coran, 61 hadiths, 6 paroles savantes (généré)
js/contenu.js     contenu pédagogique des schémas, relié aux preuves par identifiant
js/app.js         logique des schémas
```

Dans `contenu.js`, une preuve se cite par son identifiant : `q57-22-23` pour Coran 57:22-23, `h-fort` pour un hadith, `s-regle` pour une parole savante.

## Sources

- **Coran** : texte othmanien (The Noble Qur’an Encyclopedia) et traduction de Muhammad Hamidullah, tirés du paquet npm `quran-json` 3.1.2. Les textes de `data.js` sont copiés automatiquement, jamais retapés.
- **Hadiths** : texte arabe extrait de la base de sunnah.com (paquet npm `hadith` 1.3.0), numérotation de sunnah.com, grades indiqués pour chaque hadith. Seuls des hadiths sahîh ou hasan sont retenus ; Tirmidhî 2139 est signalé comme « discuté ». Les traductions françaises des hadiths sont des traductions de travail à vérifier avant citation.
- **Compréhension** : at-Tahâwî, Ibn Taymiyya, Ibn al-Qayyim, Ibn ‘Uthaymîn. Les paroles savantes sont distinguées des textes révélés.

Ce site est un support de compréhension, pas une fatwa.
