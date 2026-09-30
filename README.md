# 🎸 Mes Cordes — guitare, basse et ukulélé

Application web pour apprendre la **guitare électrique**, la **guitare classique**, la
**basse** et le **ukulélé**. Même principe et même
présentation que *Ma Batterie* : des écrans en cartes colorées, pensés pour un téléphone
tenu à l'horizontale.

👉 **Aucune installation, aucun compte, aucun fichier son.** Ouvre `mes-cordes.html`
dans un navigateur récent (ou publie le dossier `site/`, voir plus bas).

---

## Ce que contient l'application

### 🎛 Quatre instruments, quatre méthodes
On choisit son instrument en haut de l'accueil : chaque instrument a **son propre parcours**,
pensé pour lui, et tout s'adapte (schémas, sons, rythmiques, accordeur).

| Instrument | Méthode (4 niveaux) |
|---|---|
| **Guitare électrique** — 20 leçons | médiator et cordes à vide, un doigt par case, premier riff, power chords fixes puis mobiles · accords ouverts, palm mute, rythmique rock, boogie blues en shuffle, blues 12 mesures · pentatonique mineure, phrases, bends et vibrato, improvisation · barrés, funk, arpèges en son clair, gamme majeure, jouer avec le groupe |
| **Guitare classique** — 19 leçons | posture, pouce sur les basses, alternance i-m, premières notes, *Au clair de la lune*, *Ode à la joie* · arpèges p-i-m-i et p-i-m-a, valse, début de la *Romance anonyme*, 6/8 · gamme de Do, liaisons (hammer-on / pull-off), mélodie et basse ensemble, triolets, barré · picking alterné, cadence andalouse, septièmes |
| **Basse** — 19 leçons | doigts alternés, cordes à vide, un doigt par case, fondamentales avec la batterie · quinte, octave (disco), grille pop, country, syncopes · notes du manche, gamme majeure, arpèges, boogie blues · walking bass, reggae, notes étouffées (funk), slap |
| **Ukulélé** — 18 leçons | accordage Sol-Do-Mi-La, Do à un doigt, La mineur, Fa, Sol 7, bas-haut · island strum, chuck, valse, Ré et Mi mineur, reggae · mélodies (*Au clair de la lune*, *Ode à la joie*), picking p-i-m-a, arpège en valse · blues en shuffle, barré de si bémol, jouer avec le groupe |

### 🎼 Tablatures qui défilent
Les exercices (riffs, gammes, arpèges, lignes de basse, mélodies) sont écrits en
**tablature** : une ligne par corde, le numéro de la case à jouer. Pendant la lecture, la
note jouée s'allume dans la tablature **et sur un manche dessiné à côté**, qui montre où poser
les doigts. L'appli joue l'exercice avec le vrai son de l'instrument : on écoute, puis on coupe
l'exercice (bouton « note ») pour le jouer seul, avec la basse et la batterie derrière.
Toucher une mesure la fait entendre.

### 🔊 De vrais sons
- Guitare classique, guitare électrique (claire ou saturée), basse, ukulélé : **notes
  enregistrées** (banque *FluidR3 GM*, licence CC BY 3.0), égalisées note par note.
- **Batterie** d'accompagnement : les enregistrements de Ma Batterie (*Virtuosity Drums*, CC0),
  avec un rythme propre à chaque style (rock, disco, reggae one drop, shuffle…).
- Tout est intégré au fichier : l'appli marche hors ligne.

### ▶️ Le lecteur
Grille d'accords qui défile, schéma de l'accord actuel et du suivant, barre **main droite**
qui s'allume à chaque coup (↓ ↑, palm mute, coups étouffés, arpège p-i-m-a). À la basse,
cette barre montre la **ligne de basse** (fondamentale, quinte, octave…) avec le nom des notes
pour l'accord en cours. Boutons : métronome, accords, exercice, batterie, basse. Réglages :
rythmique, grattage ou arpège, transposition, capodastre, power chords, son saturé, solfège,
volumes. Un clic sur une section la joue seule, en boucle.

### 🥁 Rythmiques, 🎸 Accords, 🎚 Accordeur, ✏️ Atelier
- **Rythmiques** (guitare, ukulélé), **Main droite** (classique), **Grooves** (basse) : les
  styles adaptés à l'instrument choisi, avec batterie.
- **Accords** : schémas à toucher pour les entendre ; à la basse, **Arpèges** (fondamentale,
  tierce, quinte, octave sur le manche).
- **Accordeur** au micro, corde par corde ; on peut aussi écouter chaque corde juste.
- **Atelier** : écris ta propre grille (`Couplet: C | G | Am | F`), choisis la mesure, la
  rythmique et le tempo, et joue par-dessus.

La **progression** (minutes par jour, jours d'affilée, leçons de chaque instrument, éléments
« à travailler » et « acquis ») est enregistrée dans le navigateur.

---

## Pour les développeurs

```
index.html          page (version modules, pour développer)
css/styles.css      style commun avec Ma Batterie
css/cordes.css      ce qui est propre aux cordes
js/theorie.js       notes, accords, transposition
js/instruments.js   les 4 instruments (accordage, couleurs)
js/accords.js       doigtés : formes ouvertes, barrés, solveur
js/sons.js          notes enregistrées (généré par outils/preparer_sons.mjs)
js/audio.js         lecture des enregistrements, batterie, métronome
js/rythmes.js       rythmiques (grattage, arpège, basse, batterie), tablatures, grilles
js/player.js        lecteur (planification audio précise)
js/hauteur.js       détection de hauteur (accordeur)
js/lessons.js       les quatre parcours
js/diagrammes.js    schémas SVG  js/app.js       interface
```

- `node build.js` → `mes-cordes.html`, un fichier unique autonome.
- `node build.js --site` → `site/`, installable sur téléphone (manifest, service worker,
  icônes). Netlify l'exécute tout seul (`netlify.toml`).
- `node outils/preparer_sons.mjs <js/sons.js de Ma Batterie>` → régénère `js/sons.js`
  (télécharge la banque FluidR3, garde une note tous les 3 demi-tons).
- `node outils/verifier.mjs` → vérifie chaque tablature (nombre de pas, cordes, cases), que
  chaque accord des leçons a un doigté sur chaque instrument dans les 12 tonalités, que les rythmiques ont la bonne
  longueur et que l'accordeur retrouve les bonnes notes.
- À chaque livraison, augmenter `js/version.js`.
