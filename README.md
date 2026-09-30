# 🎸 Mes Cordes — guitare, basse et ukulélé

Application web pour apprendre la **guitare électrique**, la **guitare classique**, la
**basse** et le **ukulélé**. Même principe et même
présentation que *Ma Batterie* : des écrans en cartes colorées, pensés pour un téléphone
tenu à l'horizontale.

👉 **Aucune installation, aucun compte, aucun fichier son.** Ouvre `mes-cordes.html`
dans un navigateur récent (ou publie le dossier `site/`, voir plus bas).

---

## Ce que contient l'application

### 🎛 Quatre instruments
On choisit son instrument en haut de l'accueil (ou dans les réglages du lecteur) :
tout s'adapte — schémas d'accords, sons, accordeur, parcours.

| Instrument | Cordes | Son |
|---|---|---|
| Guitare électrique | Mi La Ré Sol Si Mi | clair ou saturé (ampli simulé), power chords |
| Guitare classique | Mi La Ré Sol Si Mi | nylon, doux et boisé |
| Basse | Mi La Ré Sol | grave et rond ; l'appli joue les accords, tu joues la basse |
| Ukulélé | Sol Do Mi La | nylon aigu et vif |

Les sons sont **calculés en direct** (cordes pincées, algorithme de Karplus-Strong) : rien
à télécharger, l'appli marche hors ligne.

### ▶️ Le lecteur
Les grilles d'accords défilent en rythme : la mesure en cours s'allume, le **schéma de
l'accord actuel et du suivant** s'affichent à droite, et la barre **main droite** montre le
grattage (↓ ↑) ou l'arpège (p i m a), pas à pas.

Réglages : rythmique (noires, croches, folk, pop, ballade, rock, reggae, country, valse,
6/8, 12/8, shuffle, arpège…), grattage ou arpège, **transposition**, **capodastre**, power
chords, son saturé, noms en solfège (Do Ré Mi), volume des accords et de la basse,
décompte, boucle, métronome. Un clic sur une section la joue seule, en boucle.

### 📚 Parcours — 24 leçons en 4 niveaux
Premiers pas (accorder, premier accord, changer d'accord, gratter), les chansons (grille
pop, mineurs, valse, arpèges, capodastre), le groove (reggae, basse alternée, blues,
power chords, barré, 6/8), aller plus loin (septièmes, II–V–I, arpège classique, cadence
andalouse, composer son accompagnement). Quand un accord est trop dur sur un instrument,
la leçon propose une grille adaptée.

### 🎼 Accords, 🥁 Rythmiques, 🎚 Accordeur, ✏️ Atelier
- **Accords** : bibliothèque de schémas à toucher pour les entendre (essentiels, majeurs,
  mineurs, septièmes, sus/add9/6, power chords). À la basse : fondamentale, tierce, quinte
  et octave sur le manche.
- **Rythmiques** : chaque façon de gratter, jouée sur une grille de démonstration.
- **Accordeur** : au micro, corde par corde, avec l'aiguille et le conseil « serre / desserre » ;
  on peut aussi écouter la note juste de chaque corde.
- **Atelier** : écris ta propre grille (`Couplet: C | G | Am | F`), choisis la mesure, la
  rythmique et le tempo, et joue par-dessus.

La **progression** (minutes par jour, jours d'affilée, leçons, éléments « à travailler » et
« acquis ») est enregistrée dans le navigateur.

---

## Pour les développeurs

```
index.html          page (version modules, pour développer)
css/styles.css      style commun avec Ma Batterie
css/cordes.css      ce qui est propre aux cordes
js/theorie.js       notes, accords, transposition
js/instruments.js   les 4 instruments (accordage, couleurs)
js/accords.js       doigtés : formes ouvertes, barrés, solveur
js/audio.js         synthèse des cordes, ampli, métronome
js/rythmes.js       rythmiques et compilation des grilles
js/player.js        lecteur (planification audio précise)
js/hauteur.js       détection de hauteur (accordeur)
js/lessons.js       parcours
js/diagrammes.js    schémas SVG  js/app.js       interface
```

- `node build.js` → `mes-cordes.html`, un fichier unique autonome.
- `node build.js --site` → `site/`, installable sur téléphone (manifest, service worker,
  icônes). Netlify l'exécute tout seul (`netlify.toml`).
- `node outils/verifier.mjs` → vérifie que chaque accord des leçons et des rythmiques a un
  doigté sur chaque instrument dans les 12 tonalités, que les rythmiques ont la bonne
  longueur et que l'accordeur retrouve les bonnes notes.
- À chaque livraison, augmenter `js/version.js`.
