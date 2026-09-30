/* Parcours : leçons progressives, valables pour les quatre instruments.
 * Quand un accord est trop dur sur un instrument, la leçon donne une grille adaptée
 * (clé ukulele ou guitare). Pour la basse, l'appli montre les fondamentales des accords
 * et la ligne de basse du style (fondamentale, quinte, octave). */

export const NIVEAUX = [
  { n:1, nom:'Premiers pas',   grad:['#34d399', '#059669'] },
  { n:2, nom:'Les chansons',   grad:['#38bdf8', '#2563eb'] },
  { n:3, nom:'Le groove',      grad:['#fbbf24', '#e8590c'] },
  { n:4, nom:'Aller plus loin',grad:['#f472b6', '#be185d'] }
];

const L = (id, niveau, titre, objectif, texte, jeu, conseils = []) => ({ id, niveau, titre, objectif, texte, conseils, ...jeu });

export const LECONS = [
  /* ================= 1. Premiers pas ================= */
  L('l01', 1, 'Tenir l\'instrument et l\'accorder', 'Connaître le nom des cordes et accorder avec l\'accordeur.',
    `<p>Assis, l'instrument repose sur la cuisse, le manche légèrement relevé. Le pouce de la main gauche se cale derrière le manche, jamais par-dessus.</p>
     <p>Les cordes se comptent de la plus aiguë (1) à la plus grave. Touche une corde du schéma pour entendre sa note, puis ouvre l'<b>accordeur</b> : il écoute ton instrument au micro et te dit s'il faut serrer ou desserrer.</p>`,
    { type:'cordes' },
    ['Accorde à chaque fois que tu prends l\'instrument : 30 secondes qui changent tout.', 'Monte toujours vers la note : si tu es trop haut, descends sous la note puis remonte.']),
  L('l02', 1, 'Premier accord', 'Tenir un accord et le gratter sur chaque temps.',
    `<p>Pose les doigts comme sur le schéma : le bout du doigt, juste derrière la frette, bien arrondi pour ne pas toucher la corde voisine.</p>
     <p>Gratte vers le bas sur chaque temps. Les cordes marquées d'une croix ne se jouent pas.</p>`,
    { bpm:70, mesure:'4/4', style:'noires', sections:[{ nom:'Accord', mesures:'Em | Em | Em | Em' }],
      grilles:{ ukulele:'C | C | C | C' } },
    ['Joue chaque corde une à une pour vérifier qu\'elle sonne.', 'Relâche le pouce : on ne serre pas plus que nécessaire.']),
  L('l03', 1, 'Deux accords', 'Changer d\'accord sans s\'arrêter.',
    `<p>Le secret : préparer le changement pendant le dernier temps. Les doigts bougent ensemble, comme une forme qu'on déplace.</p>`,
    { bpm:66, mesure:'4/4', style:'noires', sections:[{ nom:'Grille', mesures:'Em | Em | Am | Am', rep:2 }],
      grilles:{ ukulele:'C | C | Am | Am' } },
    ['Si ça coince, lâche l\'accord un temps plus tôt : un temps sans son vaut mieux qu\'une rupture.']),
  L('l04', 1, 'Trois accords : sol, do, ré', 'Jouer la grille la plus courante de la chanson.',
    `<p>Avec ces trois accords, on accompagne des centaines de chansons. Commence lentement, un accord par mesure.</p>`,
    { bpm:66, mesure:'4/4', style:'noires', sections:[{ nom:'Grille', mesures:'G | C | G | D', rep:2 }],
      grilles:{ ukulele:'C | F | C | G7' } },
    ['Cherche les doigts qui ne bougent pas d\'un accord à l\'autre : ce sont tes points d\'appui.']),
  L('l05', 1, 'Gratter en croches', 'Bas-haut régulier, la main ne s\'arrête jamais.',
    `<p>La main droite fait un va-et-vient continu : vers le bas sur le temps, vers le haut entre les temps. Compte « 1 et 2 et 3 et 4 et ».</p>`,
    { bpm:72, mesure:'4/4', style:'croches', sections:[{ nom:'Grille', mesures:'G | C | G | D', rep:2 }],
      grilles:{ ukulele:'C | F | C | G7' } },
    ['Le mouvement vient du poignet, pas du coude.', 'Vers le haut, on n\'attrape que les cordes aiguës : c\'est normal.']),
  L('l06', 1, 'Le grattage folk', 'Bas, bas-haut, haut-bas-haut.',
    `<p>C'est le rythme de base de la chanson. La main continue son va-et-vient, mais elle rate volontairement certaines cordes : sur le « et » de 1, puis sur le 3.</p>`,
    { bpm:76, mesure:'4/4', style:'folk', sections:[{ nom:'Grille', mesures:'C | G | Am | F', rep:2 }],
      grilles:{ guitare:'G | D | Em | C' } },
    ['Dis le rythme à voix haute : « boum, boum-tchak, tchak-boum-tchak ».']),
  L('l07', 1, 'Chanter et jouer : la comptine', 'Garder la main droite pendant qu\'on chante.',
    `<p>Choisis une chanson très simple que tu connais par cœur. D'abord, joue seulement le premier temps de chaque mesure en chantant. Quand ça tourne, reviens au grattage en noires.</p>
     <p>Astuce : dans <b>Morceaux</b>, colle les paroles de ta chanson dans « Mes paroles » : elles défilent sous les accords.</p>`,
    { bpm:84, mesure:'4/4', style:'noires', sections:[{ nom:'Comptine', mesures:'C | C G | C | G C', rep:2 }] },
    ['La main droite doit devenir automatique : c\'est elle qui tient le tempo, pas la voix.']),

  /* ================= 2. Les chansons ================= */
  L('l08', 2, 'La grille des quatre accords', 'Enchaîner I – V – vi – IV sans ralentir.',
    `<p>Do, sol, la mineur, fa : la grille la plus utilisée de la pop. Au ukulélé comme à la guitare, elle se joue en position ouverte (le fa guitare se joue en fa maj7, plus facile).</p>`,
    { bpm:80, mesure:'4/4', style:'pop', sections:[{ nom:'Grille', mesures:'C | G | Am | Fmaj7', rep:2 }],
      grilles:{ ukulele:'C | G | Am | F' } }),
  L('l09', 2, 'Les accords mineurs', 'Entendre la couleur triste du mineur.',
    `<p>Un accord mineur ne diffère du majeur que d'une note : la tierce, un demi-ton plus bas. Écoute : mi, puis mi mineur.</p>`,
    { bpm:72, mesure:'4/4', style:'croches', sections:[{ nom:'Grille', mesures:'Am | Dm | E | Am', rep:2 }] }),
  L('l10', 2, 'La valse en 3/4', 'Compter trois temps : rum-pa-pa.',
    `<p>Un temps fort et deux temps légers. La basse sur le 1, puis deux petits coups.</p>`,
    { bpm:100, mesure:'3/4', style:'valse', sections:[{ nom:'Grille', mesures:'G | G | C | G | D | D | G | G' }],
      grilles:{ ukulele:'C | C | F | C | G | G | C | C' } }),
  L('l11', 2, 'Premiers arpèges', 'Jouer les cordes une à une.',
    `<p>Le pouce joue la basse, puis les doigts i, m, a jouent les cordes aiguës. Garde l'accord bien tenu : chaque corde doit sonner jusqu'au bout.</p>`,
    { bpm:66, mesure:'4/4', style:'arpege', mode:'arp', sections:[{ nom:'Grille', mesures:'Am | C | D | F', rep:2 }],
      grilles:{ guitare:'Am | C | D | Fmaj7' } },
    ['Le pouce pour les cordes graves, les autres doigts restent chacun sur leur corde.']),
  L('l12', 2, 'Deux accords par mesure', 'Changer d\'accord au milieu de la mesure.',
    `<p>Quand deux accords partagent une mesure, chacun dure deux temps. Prépare le changement dès le temps 2.</p>`,
    { bpm:72, mesure:'4/4', style:'croches', sections:[{ nom:'Grille', mesures:'C G | Am F | C G | F C', rep:2 }],
      grilles:{ guitare:'G D | Em C | G D | C G' } }),
  L('l13', 2, 'Capodastre et transposition', 'Adapter une chanson à sa voix.',
    `<p>Si la chanson est trop grave ou trop aiguë pour ta voix, change de tonalité : dans les réglages, <b>Transposer</b> décale tous les accords. Le <b>capodastre</b>, lui, garde les mêmes formes d'accords mais fait sonner plus aigu.</p>
     <p>Essaie : joue cette grille, puis mets le capo en case 2 et écoute.</p>`,
    { bpm:84, mesure:'4/4', style:'folk', sections:[{ nom:'Grille', mesures:'G | Em | C | D', rep:2 }],
      grilles:{ ukulele:'C | Am | F | G' } }),

  /* ================= 3. Le groove ================= */
  L('l14', 3, 'Le reggae', 'Jouer seulement les contretemps, bref et sec.',
    `<p>La guitare ne joue pas sur les temps : elle claque un coup court sur le « et ». La main gauche relâche aussitôt pour étouffer l'accord.</p>`,
    { bpm:76, mesure:'4/4', style:'reggae', sections:[{ nom:'Grille', mesures:'Am | D | Am | D', rep:2 }] }),
  L('l15', 3, 'La basse alternée', 'Basse, accord, quinte, accord.',
    `<p>Le pouce alterne entre la fondamentale et une autre corde grave, les doigts grattent entre les deux. C'est le « boum-tchak » de la country et de la chanson française.</p>`,
    { bpm:84, mesure:'4/4', style:'country', sections:[{ nom:'Grille', mesures:'G | C | D | G', rep:2 }],
      grilles:{ ukulele:'C | F | G | C' } }),
  L('l16', 3, 'Le blues en 12 mesures', 'Suivre la grille du blues en shuffle.',
    `<p>Douze mesures, trois accords : I, IV, V. Le shuffle se joue « long-court », comme un cœur qui bat.</p>`,
    { bpm:66, mesure:'12/8', style:'shuffle', sections:[{ nom:'Blues', mesures:'A7 | D7 | A7 | A7 | D7 | D7 | A7 | A7 | E7 | D7 | A7 | E7' }] }),
  L('l17', 3, 'Power chords', 'Deux ou trois cordes, un gros son saturé.',
    `<p>Le power chord ne garde que la fondamentale et la quinte : ni majeur ni mineur. Avec la saturation, c'est le son du rock. Un doigt sur la fondamentale, l'annulaire deux cases plus loin sur la corde suivante.</p>`,
    { bpm:100, mesure:'4/4', style:'rock', puissance:true, sections:[{ nom:'Riff', mesures:'E5 | G5 | A5 | C5 D5', rep:2 }],
      grilles:{ ukulele:'Em | G | A | C D' } },
    ['Étouffe légèrement les cordes avec le tranchant de la main droite près du chevalet (palm mute).']),
  L('l18', 3, 'Le barré', 'Faire sonner fa et si mineur.',
    `<p>L'index couche toutes les cordes sur une case : c'est un sillet mobile. Appuie avec le côté de l'index, plus dur, et tire légèrement le bras vers toi plutôt que de serrer avec le pouce.</p>`,
    { bpm:66, mesure:'4/4', style:'croches', sections:[{ nom:'Grille', mesures:'C | F | Bm | G', rep:2 }],
      grilles:{ ukulele:'C | F | Bm | G' } },
    ['Au début, cinq minutes par jour : la force vient en deux ou trois semaines.']),
  L('l19', 3, 'Le 6/8', 'Un balancement à deux temps de trois.',
    `<p>« UN-deux-trois, QUATRE-cinq-six ». Accentue le 1 et le 4.</p>`,
    { bpm:60, mesure:'6/8', style:'six8', sections:[{ nom:'Grille', mesures:'Am | C | D | F', rep:2 }],
      grilles:{ guitare:'Am | C | D | Fmaj7' } }),

  /* ================= 4. Aller plus loin ================= */
  L('l20', 4, 'Les accords de septième', 'Donner de la couleur : 7, maj7, m7.',
    `<p>La septième de dominante (7) appelle la résolution, la septième majeure (maj7) est douce et rêveuse, la mineure septième (m7) est feutrée.</p>`,
    { bpm:84, mesure:'4/4', style:'pop', sections:[{ nom:'Grille', mesures:'Cmaj7 | Am7 | Dm7 | G7', rep:2 }] }),
  L('l21', 4, 'Le II – V – I', 'La cadence de base du jazz.',
    `<p>Ré mineur 7, sol 7, do maj7 : trois accords qui ramènent à la maison. Joue en noires, bien liées.</p>`,
    { bpm:100, mesure:'4/4', style:'noires', sections:[{ nom:'Grille', mesures:'Dm7 | G7 | Cmaj7 | Cmaj7', rep:2 }] }),
  L('l22', 4, 'Arpège classique', 'Une basse, puis les aigus en montant et descendant.',
    `<p>Le motif classique de la guitare : p i m a m i. Sur la guitare classique, le son du nylon le met en valeur.</p>`,
    { bpm:72, mesure:'4/4', style:'arpege', mode:'arp', sections:[{ nom:'Grille', mesures:'Am | Dm | G | C | F | Dm | E | Am' }],
      grilles:{ guitare:'Am | Dm | G | C | Fmaj7 | Dm | E | Am' } }),
  L('l23', 4, 'La cadence andalouse', 'Le parfum du flamenco.',
    `<p>La mineur, sol, fa, mi : une descente qui revient sans cesse. Joue-la en grattage, puis en arpège.</p>`,
    { bpm:92, mesure:'4/4', style:'croches', sections:[{ nom:'Grille', mesures:'Am | G | F | E', rep:2 }],
      grilles:{ guitare:'Am | G | Fmaj7 | E' } }),
  L('l24', 4, 'Ton propre accompagnement', 'Composer une grille et chanter dessus.',
    `<p>Ouvre l'<b>Atelier</b> : écris ta grille (ex. « C | G | Am | F »), choisis le style et le tempo, colle tes paroles. Tu as ton propre accompagnement.</p>`,
    { bpm:84, mesure:'4/4', style:'folk', sections:[{ nom:'Exemple', mesures:'C | Em | F | G', rep:2 }],
      grilles:{ guitare:'C | Em | Fmaj7 | G' } })
];

/* grille à jouer selon l'instrument (famille guitare ou ukulélé) */
export function sectionsPour(lecon, famille){
  const g = lecon.grilles && lecon.grilles[famille === 'basse' ? 'guitare' : famille];
  if (!g) return lecon.sections;
  return [{ nom:lecon.sections[0].nom, mesures:g, rep:lecon.sections[0].rep }];
}
