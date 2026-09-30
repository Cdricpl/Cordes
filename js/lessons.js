/* Parcours : une méthode par instrument.
 *  - Guitare électrique : médiator, power chords, riffs, rythmique rock, puis le solo
 *    (pentatonique, bends) et le funk.
 *  - Guitare classique : posture, pouce et doigts (p i m a), mélodies, arpèges, basses
 *    et mélodie ensemble, liaisons, répertoire.
 *  - Basse : doigts alternés, fondamentales avec la batterie, quinte, octave, notes du
 *    manche, arpèges, boogie, walking, reggae, notes étouffées, slap.
 *  - Ukulélé : accords à un ou deux doigts, strums (island, chuck, reggae), picking,
 *    mélodies.
 *
 * Une leçon joue soit une grille d'accords (sections[].mesures, l'appli accompagne),
 * soit une tablature (sections[].tab, l'appli joue l'exercice pour que tu l'entendes,
 * avec batterie, basse ou accords derrière). couches : ce que l'appli fait entendre au départ. */

/* aides d'écriture des tablatures (4/4 en croches : 8 pas par mesure) */
const rep = (s, n) => Array(n).fill(s).join(' ');
const noires = (...n) => n.map(x => x + ' -').join(' ');          // 4 noires = 8 pas
const croches = s => rep(s, 8);
const mesures = (...m) => m.join(' | ');

const L = (id, niveau, titre, objectif, texte, jeu = {}, conseils = []) => ({ id, niveau, titre, objectif, texte, conseils, ...jeu });

/* ======================================================================
 *  GUITARE ÉLECTRIQUE
 * ====================================================================== */
const ELEC = [
  L('e01', 1, 'Brancher, régler, accorder', 'Préparer l\'ampli, tenir le médiator et accorder.',
    `<p>Branche la guitare, volume de la guitare à fond, et commence avec peu de <b>gain</b> (saturation) sur l'ampli : un son clair montre tout de suite les notes qui frisent.</p>
     <p>Le <b>médiator</b> se tient entre le pouce et le côté de l'index, pointe dépassant de 2 ou 3 mm. Le poignet est souple, le mouvement vient de lui, pas du bras.</p>
     <p>Les cordes, de la plus grave (6) à la plus aiguë (1) : <b>Mi La Ré Sol Si Mi</b>. Touche-les ici pour les entendre, puis accorde avec l'<b>accordeur</b>.</p>`,
    { type:'cordes' },
    ['Accorde à chaque fois : une guitare électrique se désaccorde avec la température et les bends.']),
  L('e02', 1, 'Le médiator : cordes à vide', 'Attaquer les cordes graves, d\'abord vers le bas, puis en aller-retour.',
    `<p>D'abord un coup vers le bas par temps, sur la corde 6, puis 5, puis 4. Ensuite, l'<b>aller-retour</b> : bas sur le temps, haut entre les temps. Le médiator ne doit toucher qu'une corde.</p>
     <p>La batterie joue avec toi : cale-toi sur la caisse claire (temps 2 et 4).</p>`,
    { bpm:72, mesure:'4/4', style:'rock', couches:{ batterie:true }, sections:[
      { nom:'Vers le bas', tab:mesures(noires('6.0', '6.0', '6.0', '6.0'), noires('5.0', '5.0', '5.0', '5.0'), noires('4.0', '4.0', '4.0', '4.0'), noires('5.0', '5.0', '6.0', '-')) },
      { nom:'Aller-retour', tab:mesures(croches('6.0'), croches('5.0'), croches('4.0'), '5.0 5.0 5.0 5.0 6.0 - - -') }] },
    ['Pose le bord de la main droite sur les cordes graves que tu ne joues pas : elles restent muettes.']),
  L('e03', 1, 'Un doigt par case', 'Chauffer la main gauche : index, majeur, annulaire, auriculaire.',
    `<p>Un doigt par case : l'index en case 1, le majeur en 2, l'annulaire en 3, l'auriculaire en 4. On monte corde après corde, puis on redescend.</p>
     <p>Appuie juste derrière la frette : moins de force, un son plus net.</p>`,
    { bpm:66, mesure:'4/4', style:'noires', couches:{ batterie:true }, sections:[
      { nom:'Montée', tab:mesures(noires('6.1', '6.2', '6.3', '6.4'), noires('5.1', '5.2', '5.3', '5.4'), noires('4.1', '4.2', '4.3', '4.4'), noires('3.1', '3.2', '3.3', '3.4')) },
      { nom:'Descente', tab:mesures(noires('3.4', '3.3', '3.2', '3.1'), noires('4.4', '4.3', '4.2', '4.1'), noires('5.4', '5.3', '5.2', '5.1'), noires('6.4', '6.3', '6.2', '6.1')) }] },
    ['Laisse les doigts posés près des cordes : chaque millimètre gagné, c\'est de la vitesse plus tard.']),
  L('e04', 1, 'Premier riff', 'Jouer un riff sur la corde de Mi grave.',
    `<p>Un riff, c'est une petite phrase qui tourne en boucle : le moteur d'un morceau rock. Celui-ci reste sur la corde 6. Écoute-le une fois, puis joue avec la basse et la batterie.</p>`,
    { bpm:84, mesure:'4/4', style:'rock', couches:{ batterie:true, basse:true, accords:false }, sections:[
      { nom:'Riff', mesures:'E5 | E5', tab:mesures('6.0 6.0 6.3 6.0 6.5 - 6.3 -', '6.0 6.0 6.3 6.0 6.2 - 6.0 -'), rep:2 }] },
    ['Joue tout vers le bas pour commencer : c\'est plus lourd, plus rock.']),
  L('e05', 1, 'Power chords : Mi, La, Ré', 'Deux cordes ensemble : fondamentale et quinte.',
    `<p>Le <b>power chord</b> ne garde que deux notes : la fondamentale et la quinte, deux cases plus loin sur la corde voisine. Ni majeur ni mineur : avec la saturation, c'est le son du rock.</p>
     <p>Ici, les trois premiers se jouent avec une corde à vide : un seul doigt, en case 2.</p>`,
    { bpm:80, mesure:'4/4', style:'rock', puissance:true, couches:{ batterie:true, basse:true, accords:false }, sections:[
      { nom:'Grille', mesures:'E5 | E5 | A5 | A5 | D5 | D5 | A5 | E5',
        tab:mesures(noires('6.0+5.2', '6.0+5.2', '6.0+5.2', '6.0+5.2'), noires('6.0+5.2', '6.0+5.2', '6.0+5.2', '6.0+5.2'),
          noires('5.0+4.2', '5.0+4.2', '5.0+4.2', '5.0+4.2'), noires('5.0+4.2', '5.0+4.2', '5.0+4.2', '5.0+4.2'),
          noires('4.0+3.2', '4.0+3.2', '4.0+3.2', '4.0+3.2'), noires('4.0+3.2', '4.0+3.2', '4.0+3.2', '4.0+3.2'),
          noires('5.0+4.2', '5.0+4.2', '5.0+4.2', '5.0+4.2'), noires('6.0+5.2', '6.0+5.2', '6.0+5.2', '-')) }] }),
  L('e06', 1, 'Power chords mobiles', 'Déplacer la même forme le long du manche.',
    `<p>Index sur la fondamentale, annulaire deux cases plus loin sur la corde suivante : cette forme se déplace partout. Sol en case 3 de la corde 6, Do en case 3 de la corde 5, Ré en case 5.</p>
     <p>En croches, tout vers le bas.</p>`,
    { bpm:88, mesure:'4/4', style:'rock', puissance:true, couches:{ batterie:true, basse:true, accords:false }, sections:[
      { nom:'Grille', mesures:'G5 | C5 | D5 | C5', tab:mesures(croches('6.3+5.5'), croches('5.3+4.5'), croches('5.5+4.7'), croches('5.3+4.5')), rep:2 }] },
    ['Garde la forme de la main quand tu te déplaces : on glisse, on ne reconstruit pas.']),

  L('e07', 2, 'Les accords ouverts', 'Mi mineur, Sol, Ré, Do en son clair.',
    `<p>Les accords ouverts sonnent toutes cordes libres : c'est la base de la guitare pop. En son clair, gratte en croches (bas-haut), la main droite ne s'arrête jamais.</p>`,
    { bpm:76, mesure:'4/4', style:'croches', son:'clair', couches:{ batterie:true, basse:true }, sections:[{ nom:'Grille', mesures:'Em | G | D | C', rep:2 }] }),
  L('e08', 2, 'Le palm mute', 'Étouffer les cordes avec la paume pour un son serré.',
    `<p>Pose le tranchant de la main droite sur les cordes, juste devant le chevalet, et gratte en croches vers le bas : « tchouk-tchouk ». Relâche la paume sur le 1 de chaque mesure pour l'accent.</p>`,
    { bpm:96, mesure:'4/4', style:'palmMute', puissance:true, couches:{ batterie:true, basse:true }, sections:[{ nom:'Grille', mesures:'E5 | E5 | G5 A5 | E5', rep:2 }] },
    ['Trop près du manche, les notes disparaissent ; trop près du chevalet, plus d\'effet. Cherche le point entre les deux.']),
  L('e09', 2, 'La rythmique rock', 'Tenir une grille avec la basse et la batterie.',
    `<p>Tu es le guitariste du groupe : la basse et la batterie jouent, toi tu tiens les accords. Coups appuyés sur les temps, un coup vers le haut sur le « et » de 3.</p>`,
    { bpm:104, mesure:'4/4', style:'rock', puissance:true, couches:{ batterie:true, basse:true, accords:false }, sections:[{ nom:'Grille', mesures:'A5 | A5 | D5 | E5', rep:2 }] }),
  L('e10', 2, 'Le boogie blues', 'Le riff à deux cordes du blues, en shuffle.',
    `<p>La base du blues et du rock'n'roll : la fondamentale à vide, et sur la corde voisine, on alterne les cases 2 et 4 (quinte et sixte). Rythme <b>shuffle</b> : long-court, long-court.</p>
     <p>Douze mesures : La (4), Ré (2), La (2), Mi, Ré, La, Mi.</p>`,
    { bpm:72, mesure:'12/8', style:'shuffle', couches:{ batterie:true, basse:true, accords:false }, sections:[
      { nom:'Blues', mesures:'A7 | A7 | A7 | A7 | D7 | D7 | A7 | A7 | E7 | D7 | A7 | E7',
        tab:mesures(...(() => {
          const A = '5.0+4.2 - 5.0+4.2 5.0+4.4 - 5.0+4.4 5.0+4.2 - 5.0+4.2 5.0+4.4 - 5.0+4.4';
          const D = '4.0+3.2 - 4.0+3.2 4.0+3.4 - 4.0+3.4 4.0+3.2 - 4.0+3.2 4.0+3.4 - 4.0+3.4';
          const E = '6.0+5.2 - 6.0+5.2 6.0+5.4 - 6.0+5.4 6.0+5.2 - 6.0+5.2 6.0+5.4 - 6.0+5.4';
          return [A, A, A, A, D, D, A, A, E, D, A, E];
        })()) }] },
    ['L\'annulaire va chercher la case 4, l\'index reste posé en case 2.']),
  L('e11', 2, 'Blues 12 mesures en accords', 'Suivre la grille du blues sans compter.',
    `<p>Même grille qu'à la leçon précédente, en accords de septième. Apprends-la par cœur : c'est la grille la plus jouée au monde.</p>`,
    { bpm:70, mesure:'12/8', style:'shuffle', son:'clair', couches:{ batterie:true, basse:true }, sections:[{ nom:'Blues', mesures:'A7 | D7 | A7 | A7 | D7 | D7 | A7 | A7 | E7 | D7 | A7 | E7' }] }),

  L('e12', 3, 'La pentatonique mineure', 'La gamme du solo rock et blues, en case 5.',
    `<p>Cinq notes, deux par corde : la <b>pentatonique de La mineur</b>, en case 5 et 8 (puis 7 sur les cordes 5 à 3). L'index reste en case 5, l'annulaire ou l'auriculaire va chercher l'autre case.</p>
     <p>Monte et redescends, note par note, en aller-retour de médiator.</p>`,
    { bpm:72, mesure:'4/4', style:'ballade', son:'clair', couches:{ batterie:true, basse:true, accords:false }, sections:[
      { nom:'Gamme', mesures:'Am | Am | Am | Am', tab:mesures('6.5 6.8 5.5 5.7 4.5 4.7 3.5 3.7', '2.5 2.8 1.5 1.8 1.8 1.5 2.8 2.5', '3.7 3.5 4.7 4.5 5.7 5.5 6.8 6.5', '5.5 - 6.8 - 6.5 - - -') }] },
    ['Case 8 : auriculaire. Case 7 : annulaire. Un doigt par case, toujours.']),
  L('e13', 3, 'Premières phrases', 'Faire parler la gamme : des phrases courtes.',
    `<p>Un solo, ce n'est pas une gamme : ce sont des phrases, avec des silences. Voici deux phrases dans la pentatonique, qui se terminent sur la note La (la fondamentale).</p>`,
    { bpm:76, mesure:'4/4', style:'ballade', couches:{ batterie:true, basse:true, accords:false }, sections:[
      { nom:'Phrase 1', mesures:'Am | Am', tab:mesures(noires('1.5', '1.8', '1.5', '2.8'), '2.5 - 3.7 - 3.5 - - -') },
      { nom:'Phrase 2', mesures:'Am | Am', tab:mesures('3.7 3.5 4.7 - 3.5 - 3.7 -', '4.7 4.5 5.7 - 5.5 - - -') }] }),
  L('e14', 3, 'Le bend et le vibrato', 'Faire chanter une note en tirant la corde.',
    `<p>Le <b>bend</b> (« b ») : on pousse la corde vers le haut pour monter la note d'un ton, jusqu'à entendre la note de la case deux plus loin. Pousse avec trois doigts ensemble.</p>
     <p>Le <b>vibrato</b> (« ~ ») : de petits bends rapides et réguliers sur une note tenue.</p>`,
    { bpm:66, mesure:'4/4', style:'ballade', couches:{ batterie:true, basse:true, accords:false }, sections:[
      { nom:'Bends', mesures:'Am | Am | Am | Am', tab:mesures('3.7b - - - 3.5 - - -', '2.8b - - - 2.5 - 3.7 -', '1.5 - 2.8 - 2.5 - 3.7b -', '3.5~ - - - - - - -') }] },
    ['Vérifie la justesse : joue la case 9 de la corde 3, puis bende la case 7 jusqu\'à la même note.']),
  L('e15', 3, 'Improviser sur le blues', 'Jouer tes propres phrases sur la grille.',
    `<p>L'appli joue le blues en La. Toi, tu improvises avec la pentatonique en case 5 : des phrases courtes, des silences, des bends. Une idée : pose une « question » de deux mesures, puis « réponds ».</p>`,
    { bpm:74, mesure:'12/8', style:'shuffle', son:'clair', couches:{ batterie:true, basse:true }, sections:[{ nom:'Blues', mesures:'A7 | D7 | A7 | A7 | D7 | D7 | A7 | A7 | E7 | D7 | A7 | E7', rep:2 }] }),

  L('e16', 4, 'Les accords barrés', 'Formes de Mi et de La, partout sur le manche.',
    `<p>L'index barre toutes les cordes et remplace le sillet : la forme de Mi (fondamentale corde 6) et la forme de La (fondamentale corde 5) se déplacent partout.</p>`,
    { bpm:72, mesure:'4/4', style:'croches', son:'clair', couches:{ batterie:true, basse:true }, sections:[
      { nom:'Forme de Mi', mesures:'F | F | G | G' }, { nom:'Forme de La', mesures:'Bm | Bm | C | D' }] },
    ['Pousse avec le côté de l\'index, plus dur, et tire le bras vers toi au lieu de serrer avec le pouce.']),
  L('e17', 4, 'Le funk', 'Accords courts, coups étouffés, main droite continue.',
    `<p>La main droite fait des aller-retours sans arrêt. Sur les temps 2 et 4, la main gauche relâche l'accord : le coup devient un « tchak » étouffé. En son clair, accords de neuvième.</p>`,
    { bpm:96, mesure:'4/4', style:'funk', son:'clair', couches:{ batterie:true, basse:true }, sections:[{ nom:'Groove', mesures:'E9 | E9 | A7 | E9', rep:2 }] }),
  L('e18', 4, 'Arpèges en son clair', 'Les accords, note par note, au médiator.',
    `<p>Tiens l'accord, et joue ses cordes une à une. Laisse sonner : c'est le son des ballades rock.</p>`,
    { bpm:72, mesure:'4/4', style:'arpege', mode:'arp', son:'clair', couches:{ batterie:true, basse:true }, sections:[{ nom:'Grille', mesures:'Am | C | G | D', rep:2 }] }),
  L('e19', 4, 'La gamme majeure', 'Do majeur en première position.',
    `<p>Do Ré Mi Fa Sol La Si Do, sur les cordes 5 à 1. C'est la gamme des mélodies ; la pentatonique en est un résumé.</p>`,
    { bpm:76, mesure:'4/4', style:'ballade', son:'clair', couches:{ batterie:true, basse:true, accords:false }, sections:[
      { nom:'Gamme', mesures:'C | C | C | C', tab:mesures('5.3 4.0 4.2 4.3 3.0 3.2 2.0 2.1', '2.1 2.0 3.2 3.0 4.3 4.2 4.0 5.3', noires('2.1', '2.3', '1.0', '1.1'), '1.3 - - - - - - -') }] }),
  L('e20', 4, 'Jouer avec le groupe', 'Tenir un morceau complet avec basse et batterie.',
    `<p>Couplet en palm mute, refrain en accords ouverts qui sonnent : c'est le contraste qui fait vivre un morceau. L'appli joue la basse et la batterie, toi la guitare.</p>`,
    { bpm:100, mesure:'4/4', style:'rock', puissance:true, couches:{ batterie:true, basse:true, accords:false }, sections:[
      { nom:'Couplet', mesures:'E5 | E5 | C5 | D5', rep:2 }, { nom:'Refrain', mesures:'G5 | D5 | A5 | C5', rep:2 }] })
];

/* ======================================================================
 *  GUITARE CLASSIQUE
 * ====================================================================== */
const CLASSIQUE = [
  L('c01', 1, 'Posture et accordage', 'S\'asseoir comme un guitariste classique et accorder.',
    `<p>Assis au bord de la chaise, le pied gauche sur un repose-pied : la guitare repose sur la cuisse gauche, la tête du manche à hauteur d'épaule. L'avant-bras droit se pose sur le bord de la caisse, la main tombe au-dessus de la rosace.</p>
     <p>Les doigts de la main droite ont chacun un nom : <b>p</b> (pouce), <b>i</b> (index), <b>m</b> (majeur), <b>a</b> (annulaire).</p>
     <p>Les cordes, de la plus grave (6) à la plus aiguë (1) : <b>Mi La Ré Sol Si Mi</b>. Accorde avec l'accordeur.</p>`,
    { type:'cordes' },
    ['Les ongles de la main droite, courts et limés, donnent un son plus clair ; ceux de la main gauche doivent être très courts.']),
  L('c02', 1, 'Le pouce sur les basses', 'Jouer les cordes graves avec le pouce, régulièrement.',
    `<p>Le pouce (p) joue les cordes 6, 5 et 4, en poussant vers le bas, le bras immobile. Les autres doigts se posent sur les cordes aiguës pour stabiliser la main.</p>`,
    { bpm:66, mesure:'4/4', style:'noires', couches:{ clic:true }, sections:[
      { nom:'Basses', tab:mesures(noires('6.0', '6.0', '6.0', '6.0'), noires('5.0', '5.0', '5.0', '5.0'), noires('4.0', '4.0', '4.0', '4.0'), noires('6.0', '5.0', '4.0', '-')), rep:2 }] },
    ['Le son doit être rond : attaque avec la partie charnue du pouce et le bord de l\'ongle.']),
  L('c03', 1, 'Index et majeur : i-m', 'Alterner deux doigts sur les cordes aiguës.',
    `<p>Sur une corde à vide, alterne index et majeur : i, m, i, m. Jamais deux fois le même doigt. En <b>butée</b> (apoyando), le doigt joue la corde et vient se reposer sur la corde voisine : son plein, idéal pour les mélodies.</p>`,
    { bpm:72, mesure:'4/4', style:'noires', couches:{ clic:true }, sections:[
      { nom:'Alternance', tab:mesures(croches('1.0'), croches('2.0'), croches('3.0'), noires('1.0', '2.0', '3.0', '-')) }] },
    ['Les doigts bougent depuis la base (la jointure), la main ne bouge pas.']),
  L('c04', 1, 'Premières notes : Mi, Fa, Sol', 'Poser les doigts de la main gauche sur la corde 1.',
    `<p>Mi : corde 1 à vide. Fa : case 1, avec l'<b>index</b>. Sol : case 3, avec l'<b>annulaire</b>. Le pouce gauche se place derrière le manche, au milieu, jamais par-dessus.</p>`,
    { bpm:72, mesure:'4/4', style:'arpPim', couches:{ clic:true, accords:false }, sections:[
      { nom:'Mélodie', mesures:'C | C | C | C', tab:mesures(noires('1.0', '1.1', '1.3', '1.1'), '1.0 - - - 1.3 - - -', noires('1.3', '1.1', '1.0', '1.1'), '1.0 - - - - - - -'), rep:2 }] }),
  L('c05', 1, 'Au clair de la lune', 'Ta première mélodie, sur les cordes 1 et 2.',
    `<p>Do (corde 2, case 1, index), Ré (corde 2, case 3, annulaire), Mi (corde 1 à vide). Alterne i et m à la main droite. L'appli joue un arpège doux dessous : écoute d'abord, puis coupe l'exercice et joue-le.</p>`,
    { bpm:84, mesure:'4/4', style:'arpPim', couches:{ accords:true }, sections:[
      { nom:'Mélodie', mesures:'C | C G | C G | C', tab:mesures(noires('2.1', '2.1', '2.1', '2.3'), '1.0 - - - 2.3 - - -', noires('2.1', '1.0', '2.3', '2.3'), '2.1 - - - - - - -'), rep:2 }] }),
  L('c06', 1, 'L\'Ode à la joie', 'La mélodie de Beethoven, sur trois cordes.',
    `<p>Mi, Fa, Sol sur la corde 1 ; Do et Ré sur la corde 2. Les rythmes : noires, et à la fin de chaque phrase, une noire pointée, une croche et une blanche.</p>`,
    { bpm:88, mesure:'4/4', style:'arpPim', couches:{ accords:true }, sections:[
      { nom:'Mélodie', mesures:'C | G | C | G | C | G | C | G C', tab:mesures(
        noires('1.0', '1.0', '1.1', '1.3'), noires('1.3', '1.1', '1.0', '2.3'), noires('2.1', '2.1', '2.3', '1.0'), '1.0 - - 2.3 2.3 - - -',
        noires('1.0', '1.0', '1.1', '1.3'), noires('1.3', '1.1', '1.0', '2.3'), noires('2.1', '2.1', '2.3', '1.0'), '2.3 - - 2.1 2.1 - - -') }] }),

  L('c07', 2, 'Arpège p-i-m-i', 'Le premier arpège : la main droite en place.',
    `<p>Chaque doigt a sa corde : le pouce la basse, l'index la corde 3, le majeur la corde 2. Sur La mineur puis Mi majeur, joue p-i-m-i en croches. La main gauche tient l'accord pendant toute la mesure.</p>`,
    { bpm:72, mesure:'4/4', style:'arpPim', couches:{ accords:false }, sections:[
      { nom:'Arpège', mesures:'Am | Am | E | E', tab:mesures(rep('5.0 3.2 2.1 3.2', 2), rep('5.0 3.2 2.1 3.2', 2), rep('6.0 3.1 2.0 3.1', 2), rep('6.0 3.1 2.0 3.1', 2)), rep:2 }] },
    ['Le pouce joue en avant des doigts : la main forme un petit « x » avec les doigts.']),
  L('c08', 2, 'Arpège p-i-m-a en valse', 'Quatre doigts, trois temps.',
    `<p>p-i-m-a-m-i sur Do puis Sol7, en 3/4 : le pouce sur le 1, l'annulaire au sommet de l'arpège.</p>`,
    { bpm:84, mesure:'3/4', style:'arpege', couches:{ accords:false }, sections:[
      { nom:'Valse', mesures:'C | G7 | G7 | C', tab:mesures('5.3 3.0 2.1 1.0 2.1 3.0', '6.3 3.0 2.0 1.1 2.0 3.0', '6.3 3.0 2.0 1.1 2.0 3.0', '5.3 3.0 2.1 1.0 2.1 3.0'), rep:2 }] }),
  L('c09', 2, 'L\'arpège sur une grille', 'Enchaîner les accords sans casser l\'arpège.',
    `<p>L'appli joue l'arpège p-i-m-a sur la grille : écoute, puis coupe les accords et joue-le. Change d'accord sur la dernière note de la mesure, pas avant.</p>`,
    { bpm:70, mesure:'4/4', style:'arpege', mode:'arp', sections:[{ nom:'Grille', mesures:'Am | Dm | E | Am', rep:2 }, { nom:'En Do', mesures:'C | Am | Dm | G7', rep:2 }] }),
  L('c10', 2, 'Romance (début)', 'L\'arpège en triolets de la célèbre Romance anonyme.',
    `<p>La mélodie à l'annulaire (a) sur la corde 1, puis index et majeur sur les cordes 3 et 2 à vide (en commençant par la corde 2), et le pouce sur la basse de Mi au début de chaque mesure. Trois notes par temps.</p>`,
    { bpm:56, mesure:'9/8', style:'arpTriolets', couches:{ accords:false }, sections:[
      { nom:'Début', mesures:'Em | Em | Em | Em', tab:mesures(
        '1.7+6.0 2.0 3.0 1.7 2.0 3.0 1.7 2.0 3.0', '1.7+6.0 2.0 3.0 1.5 2.0 3.0 1.3 2.0 3.0',
        '1.3+6.0 2.0 3.0 1.2 2.0 3.0 1.0 2.0 3.0', '1.0+6.0 2.0 3.0 1.3 2.0 3.0 1.7 2.0 3.0'), rep:2 }] },
    ['Fais ressortir la mélodie : l\'annulaire joue un peu plus fort que i et m.']),
  L('c11', 2, 'Arpège en 6/8', 'Un balancement doux, deux temps de trois croches.',
    `<p>La cadence la mineur – sol – fa – mi en arpège, en 6/8. Laisse sonner les basses.</p>`,
    { bpm:60, mesure:'6/8', style:'arpTriolets', mode:'arp', sections:[{ nom:'Grille', mesures:'Am | G | F | E', rep:2 }] }),

  L('c12', 3, 'La gamme de Do', 'Toutes les notes de la première position.',
    `<p>Do Ré Mi Fa Sol La Si Do, des cordes 5 à 2 : un doigt par case (case 1 = index, 2 = majeur, 3 = annulaire). Alterne i et m à la main droite.</p>`,
    { bpm:72, mesure:'4/4', style:'noires', couches:{ clic:true }, sections:[
      { nom:'Montée', tab:mesures(noires('5.3', '4.0', '4.2', '4.3'), noires('3.0', '3.2', '2.0', '2.1')) },
      { nom:'Descente', tab:mesures(noires('2.1', '2.0', '3.2', '3.0'), noires('4.3', '4.2', '4.0', '5.3')) }] }),
  L('c13', 3, 'Les liaisons', 'Faire sonner une note avec la seule main gauche.',
    `<p><b>Liaison ascendante</b> (« h ») : on joue une note, puis un doigt de la main gauche tombe comme un marteau sur la case suivante. <b>Liaison descendante</b> (« p ») : le doigt quitte la case en accrochant la corde, la note inférieure sonne.</p>`,
    { bpm:66, mesure:'4/4', style:'noires', couches:{ clic:true }, sections:[
      { nom:'Liaisons', tab:mesures('3.0 3.2h 3.0 3.2h 2.0 2.1h 2.0 2.1h', '3.2 3.0p 3.2 3.0p 2.1 2.0p 2.1 2.0p', '1.0 1.1h 1.0 1.3h 1.0 1.1h 1.0 -', '1.3 1.1p 1.0 - 2.1 2.0p 3.2 -') }] }),
  L('c14', 3, 'Mélodie et basse ensemble', 'Le pouce sur les basses, les doigts sur la mélodie.',
    `<p>Au clair de la lune, avec sa basse : le pouce joue Do (corde 5, case 3) ou Sol (corde 6, case 3) en même temps que la mélodie. Deux voix, une seule guitare.</p>`,
    { bpm:76, mesure:'4/4', style:'arpPim', couches:{ accords:false }, sections:[
      { nom:'Deux voix', mesures:'C | C G | C G | C', tab:mesures('2.1+5.3 - 2.1 - 2.1+5.3 - 2.3 -', '1.0+5.3 - - - 2.3+6.3 - - -', '2.1+5.3 - 1.0 - 2.3+6.3 - 2.3 -', '2.1+5.3 - - - - - - -'), rep:2 }] },
    ['Le pouce reste plus doux que la mélodie : on doit entendre le chant par-dessus.']),
  L('c15', 3, 'Arpège en triolets', 'Trois notes par temps sur une grille mineure.',
    `<p>p-i-m sans arrêt, trois notes par temps. L'appli montre l'arpège sur la grille : écoute, puis joue-le seul.</p>`,
    { bpm:60, mesure:'9/8', style:'arpTriolets', mode:'arp', sections:[{ nom:'Grille', mesures:'Am | Dm | E | Am', rep:2 }] }),
  L('c16', 3, 'Le barré', 'Fa et si bémol sur la guitare classique.',
    `<p>Sur une classique, le manche est large : place l'index bien droit, juste derrière la frette, et appuie avec le poids du bras. Joue en arpège pour vérifier que chaque corde sonne.</p>`,
    { bpm:66, mesure:'4/4', style:'arpege', mode:'arp', sections:[{ nom:'Grille', mesures:'Am | Dm | F | E', rep:2 }, { nom:'Si bémol', mesures:'F | Bb | C | F' }] }),

  L('c17', 4, 'Le picking alterné', 'Le pouce alterne deux basses, les doigts pincent entre.',
    `<p>Le pouce joue une basse sur chaque temps, en alternant deux cordes ; l'index et le majeur jouent entre les temps. Au début, le pouce seul, puis on ajoute les doigts.</p>`,
    { bpm:72, mesure:'4/4', style:'travis', mode:'arp', sections:[{ nom:'Grille', mesures:'C | Am | Dm | G7', rep:2 }] }),
  L('c18', 4, 'La cadence andalouse', 'Le parfum espagnol : la mineur, sol, fa, mi.',
    `<p>La cadence du flamenco, en arpège de triolets. Pour le « rasgueado », les doigts se déplient l'un après l'autre sur les cordes, du petit doigt à l'index.</p>`,
    { bpm:66, mesure:'9/8', style:'arpTriolets', mode:'arp', sections:[{ nom:'Grille', mesures:'Am | G | F | E', rep:2 }] }),
  L('c19', 4, 'Accords de septième aux doigts', 'Des couleurs douces : m7, 7, maj7.',
    `<p>La mineur 7, ré mineur 7, sol 7, do maj7 : la couleur de la bossa-nova et du jazz. Arpège p-i-m-a, laisse tout sonner.</p>`,
    { bpm:72, mesure:'4/4', style:'arpege', mode:'arp', sections:[{ nom:'Grille', mesures:'Am7 | Dm7 | G7 | Cmaj7', rep:2 }] })
];

/* ======================================================================
 *  BASSE (corde 4 = Mi grave, corde 1 = Sol)
 * ====================================================================== */
const BASSE = [
  L('b01', 1, 'Tenir la basse et accorder', 'Position, pouce d\'appui, accordage.',
    `<p>Debout ou assis, la basse à la même hauteur. Le pouce droit se pose sur le micro (ou sur la corde de Mi quand tu joues les autres) : il sert d'appui et étouffe les cordes graves.</p>
     <p>Les cordes, de la plus grave (4) à la plus aiguë (1) : <b>Mi La Ré Sol</b>, une octave sous les quatre cordes graves d'une guitare.</p>`,
    { type:'cordes' }),
  L('b02', 1, 'Index, majeur : alterner', 'Jouer en croches régulières avec deux doigts.',
    `<p>La main droite joue avec l'<b>index</b> et le <b>majeur</b>, en alternance : i, m, i, m… Le doigt tire la corde vers toi et vient se poser sur la corde suivante. Cale-toi sur la grosse caisse.</p>`,
    { bpm:76, mesure:'4/4', style:'croches', couches:{ batterie:true }, sections:[
      { nom:'Mi et La', tab:mesures(croches('4.0'), croches('4.0'), croches('3.0'), '3.0 3.0 3.0 3.0 4.0 - - -'), rep:2 }] },
    ['Les deux doigts doivent sonner pareil : écoute bien, le majeur est souvent plus fort.']),
  L('b03', 1, 'Les quatre cordes à vide', 'Changer de corde en gardant le son régulier.',
    `<p>Mi, La, Ré, Sol : quatre notes par corde, puis on traverse. Quand tu joues une corde aiguë, la main gauche ou le pouce droit étouffe les cordes graves qui résonnent.</p>`,
    { bpm:80, mesure:'4/4', style:'noires', couches:{ batterie:true }, sections:[
      { nom:'Une par une', tab:mesures(noires('4.0', '4.0', '4.0', '4.0'), noires('3.0', '3.0', '3.0', '3.0'), noires('2.0', '2.0', '2.0', '2.0'), noires('1.0', '1.0', '1.0', '1.0')) },
      { nom:'Traverser', tab:mesures(noires('4.0', '3.0', '2.0', '1.0'), noires('1.0', '2.0', '3.0', '4.0')), rep:2 }] }),
  L('b04', 1, 'Main gauche : un doigt par case', 'Index, majeur, annulaire, auriculaire.',
    `<p>Un doigt par case, sur les cordes de Mi et de La. Sur la basse, les cases sont larges : garde la main ouverte, le pouce derrière le manche.</p>`,
    { bpm:66, mesure:'4/4', style:'noires', couches:{ batterie:true }, sections:[
      { nom:'Chromatique', tab:mesures(noires('4.1', '4.2', '4.3', '4.4'), noires('3.1', '3.2', '3.3', '3.4'), noires('3.4', '3.3', '3.2', '3.1'), noires('4.4', '4.3', '4.2', '4.1')) }] }),
  L('b05', 1, 'Les fondamentales', 'Jouer la note qui donne son nom à l\'accord.',
    `<p>Le premier rôle du bassiste : jouer la <b>fondamentale</b> de chaque accord. Mi, La, Ré : ce sont les cordes à vide. La guitare et la batterie jouent avec toi.</p>`,
    { bpm:84, mesure:'4/4', style:'noires', couches:{ batterie:true, accords:true }, sections:[
      { nom:'Grille', mesures:'E | E | A | A | D | D | A | E', tab:mesures(noires('4.0', '4.0', '4.0', '4.0'), noires('4.0', '4.0', '4.0', '4.0'), noires('3.0', '3.0', '3.0', '3.0'), noires('3.0', '3.0', '3.0', '3.0'), noires('2.0', '2.0', '2.0', '2.0'), noires('2.0', '2.0', '2.0', '2.0'), noires('3.0', '3.0', '3.0', '3.0'), noires('4.0', '4.0', '4.0', '-')) }] }),
  L('b06', 1, 'Fondamentales en croches', 'La basse rock : des croches régulières sous les accords.',
    `<p>Huit croches par mesure, sur la fondamentale. C'est simple, mais c'est tout le moteur d'un morceau rock : la régularité compte plus que tout.</p>`,
    { bpm:96, mesure:'4/4', style:'rock', couches:{ batterie:true, accords:true }, sections:[
      { nom:'Grille', mesures:'A | A | D | E', tab:mesures(croches('3.0'), croches('3.0'), croches('2.0'), croches('4.0')), rep:2 }] }),

  L('b07', 2, 'La quinte', 'Fondamentale et quinte : la note juste à côté.',
    `<p>La <b>quinte</b> se trouve toujours au même endroit : une corde plus haut, deux cases plus loin. Pour La (corde 3 à vide), la quinte est Mi (corde 2, case 2).</p>`,
    { bpm:84, mesure:'4/4', style:'pop', couches:{ batterie:true, accords:true }, sections:[
      { nom:'Grille', mesures:'A | A | D | E', tab:mesures(noires('3.0', '3.0', '2.2', '3.0'), noires('3.0', '3.0', '2.2', '3.0'), noires('2.0', '2.0', '1.2', '2.0'), noires('4.0', '4.0', '3.2', '4.0')), rep:2 }] }),
  L('b08', 2, 'L\'octave (disco)', 'Sauter à l\'octave sur chaque croche.',
    `<p>L'<b>octave</b> : deux cordes plus haut, deux cases plus loin. Index sur la fondamentale, auriculaire (ou annulaire) sur l'octave. Fondamentale, octave, fondamentale, octave : le son du disco et de la funk.</p>`,
    { bpm:108, mesure:'4/4', style:'disco', couches:{ batterie:true, accords:true }, sections:[
      { nom:'Grille', mesures:'A | A | D | E', tab:mesures(rep('3.0 1.2', 4), rep('3.0 1.2', 4), rep('3.5 1.7', 4), rep('4.0 2.2', 4)), rep:2 }] }),
  L('b09', 2, 'La grille pop', 'Do, Sol, La mineur, Fa en fondamentales.',
    `<p>La grille la plus jouée de la pop. Cherche des fondamentales proches les unes des autres : Do (corde 3, case 3), Sol (corde 4, case 3), La (corde 3 à vide), Fa (corde 4, case 1).</p>`,
    { bpm:88, mesure:'4/4', style:'pop', couches:{ batterie:true, accords:true }, sections:[
      { nom:'Grille', mesures:'C | G | Am | F', tab:mesures(croches('3.3'), croches('4.3'), croches('3.0'), croches('4.1')), rep:2 }] }),
  L('b10', 2, 'Fondamentale et quinte (country)', 'Deux notes par mesure qui trottent.',
    `<p>Fondamentale sur le 1, quinte sur le 3, souvent en dessous : c'est la basse de la country et de la chanson.</p>`,
    { bpm:100, mesure:'4/4', style:'country', couches:{ batterie:true, accords:true }, sections:[
      { nom:'Grille', mesures:'G | C | D | G', tab:mesures('4.3 - - - 2.0 - - -', '3.3 - - - 4.3 - - -', '2.0 - - - 3.0 - - -', '4.3 - - - 2.0 - - -'), rep:2 }] }),
  L('b11', 2, 'Les syncopes', 'Jouer entre les temps : 1, « et » de 2, 4.',
    `<p>Trois notes par mesure : sur le 1, sur le « et » du 2, et sur le 4. Compte à voix haute : c'est le rythme de mille morceaux pop.</p>`,
    { bpm:92, mesure:'4/4', style:'pop', couches:{ batterie:true, accords:true }, sections:[
      { nom:'Grille', mesures:'Am | Am | F | G', tab:mesures('3.0 - - 3.0 - - 3.0 -', '3.0 - - 3.0 - - 3.0 -', '4.1 - - 4.1 - - 4.1 -', '4.3 - - 4.3 - - 4.3 -'), rep:2 }] }),

  L('b12', 3, 'Les notes sur la corde de Mi', 'Connaître le manche : Mi, Fa, Sol, La, Si, Do, Ré, Mi.',
    `<p>Sur la corde de Mi : Fa en case 1, Sol en 3, La en 5, Si en 7, Do en 8, Ré en 10, Mi en 12. Les repères du manche (3, 5, 7, 12) aident à s'y retrouver. Dis le nom de chaque note en la jouant.</p>`,
    { bpm:72, mesure:'4/4', style:'noires', couches:{ batterie:true }, sections:[
      { nom:'Montée', tab:mesures(noires('4.0', '4.1', '4.3', '4.5'), noires('4.7', '4.8', '4.10', '4.12')) },
      { nom:'Descente', tab:mesures(noires('4.12', '4.10', '4.8', '4.7'), noires('4.5', '4.3', '4.1', '4.0')) }] }),
  L('b13', 3, 'La gamme majeure', 'Do majeur sur deux octaves de cordes.',
    `<p>Do Ré Mi Fa Sol La Si Do, en position : l'index en case 2, un doigt par case. La même forme se déplace pour toutes les tonalités.</p>`,
    { bpm:76, mesure:'4/4', style:'noires', couches:{ batterie:true, accords:true }, sections:[
      { nom:'Gamme', mesures:'C | C | C | C', tab:mesures(noires('3.3', '3.5', '2.2', '2.3'), noires('2.5', '1.2', '1.4', '1.5'), noires('1.5', '1.4', '1.2', '2.5'), noires('2.3', '2.2', '3.5', '3.3')) }] }),
  L('b14', 3, 'Les arpèges', 'Fondamentale, tierce, quinte, octave.',
    `<p>Les notes de l'accord, une à une : la ligne de basse « dessine » l'accord. Majeur (Do, Fa, Sol) et mineur (La mineur) n'ont pas la même tierce : écoute la différence.</p>`,
    { bpm:84, mesure:'4/4', style:'pop', couches:{ batterie:true, accords:true }, sections:[
      { nom:'Grille', mesures:'C | Am | F | G', tab:mesures(noires('3.3', '2.2', '2.5', '1.5'), noires('3.0', '3.3', '2.2', '1.2'), noires('4.1', '3.0', '3.3', '2.3'), noires('4.3', '3.2', '2.0', '1.0')), rep:2 }] }),
  L('b15', 3, 'Le boogie blues', 'La ligne de basse du blues, en shuffle.',
    `<p>Fondamentale, tierce, quinte, sixte, septième, et on redescend : la ligne de basse du boogie. Rythme <b>shuffle</b> (long-court). Douze mesures : La, Ré, La, Mi.</p>`,
    { bpm:76, mesure:'12/8', style:'shuffle', couches:{ batterie:true, accords:true }, sections:[
      { nom:'Blues', mesures:'A7 | A7 | A7 | A7 | D7 | D7 | A7 | A7 | E7 | D7 | A7 | E7',
        tab:mesures(...(() => {
          const A = '3.0 - 3.4 2.2 - 2.4 2.5 - 2.4 2.2 - 3.4';
          const D = '2.0 - 2.4 1.2 - 1.4 1.5 - 1.4 1.2 - 2.4';
          const E = '4.0 - 4.4 3.2 - 3.4 3.5 - 3.4 3.2 - 4.4';
          return [A, A, A, A, D, D, A, A, E, D, A, E];
        })()) }] }),

  L('b16', 4, 'La walking bass', 'Une note par temps qui « marche » d\'un accord à l\'autre.',
    `<p>Sur le 1, la fondamentale ; sur le 4, une note qui mène à l'accord suivant, souvent un demi-ton au-dessus ou en dessous. Ici sur la cadence du jazz : ré mineur 7, sol 7, do maj7.</p>`,
    { bpm:100, mesure:'4/4', style:'noires', couches:{ batterie:true, accords:true }, sections:[
      { nom:'II – V – I', mesures:'Dm7 | G7 | Cmaj7 | Cmaj7', tab:mesures(noires('3.5', '2.3', '1.2', '2.4'), noires('2.5', '1.4', '1.7', '1.6'), noires('1.5', '1.4', '1.2', '2.5'), noires('2.3', '2.2', '3.5', '3.4')), rep:2 }] }),
  L('b17', 4, 'Le reggae', 'Une basse ronde et grave, avec des silences.',
    `<p>En reggae, la basse chante : notes graves, bien tenues, et des silences qui laissent respirer. Joue près du manche, avec la pulpe des doigts, pour un son rond.</p>`,
    { bpm:76, mesure:'4/4', style:'reggae', couches:{ batterie:true, accords:true }, sections:[
      { nom:'Grille', mesures:'Am | Am | Dm | Em', tab:mesures('3.0 - - 3.0 3.3 - 2.2 -', '3.0 - - 3.0 3.3 - 2.2 -', '2.0 - - 2.0 2.3 - 1.2 -', '4.0 - - 4.0 4.3 - 3.2 -'), rep:2 }] }),
  L('b18', 4, 'Les notes étouffées (funk)', 'Des notes sans hauteur qui font le groove.',
    `<p>Une note étouffée (« x ») : la main gauche touche la corde sans appuyer, le doigt droit la joue. On entend un « tok » percussif : c'est ce qui fait sautiller une ligne funk.</p>`,
    { bpm:92, mesure:'4/4', style:'funk', couches:{ batterie:true, accords:true }, sections:[
      { nom:'Groove', mesures:'E9 | E9 | E9 | E9', tab:mesures('4.0 - 4.0x 4.0 - 2.2 4.0x 4.3', '4.0 - 4.0x 4.0 3.0 - 3.2 4.3', '4.0 - 4.0x 4.0 - 2.2 4.0x 4.3', '4.0 - 4.0x 4.0 3.0 - 3.2 4.3') }] }),
  L('b19', 4, 'Le slap', 'Frapper avec le pouce, tirer avec l\'index.',
    `<p>Le <b>pouce</b> frappe la corde grave avec l'os, comme un marteau, et rebondit. L'<b>index</b> accroche une corde aiguë et la tire pour qu'elle claque contre les frettes. Ici : pouce sur la fondamentale, index sur l'octave.</p>`,
    { bpm:84, mesure:'4/4', style:'disco', couches:{ batterie:true, accords:true }, sections:[
      { nom:'Octaves', mesures:'E | E | A | A', tab:mesures('4.0 - 2.2 - 4.0 4.0 2.2 -', '4.0 - 2.2 - 4.0 4.0 2.2 -', '3.0 - 1.2 - 3.0 3.0 1.2 -', '3.0 - 1.2 - 3.0 3.0 1.2 -'), rep:2 }] },
    ['Le son vient du rebond : le pouce ne s\'écrase pas sur la corde, il la frappe et repart.'])
];

/* ======================================================================
 *  UKULÉLÉ (corde 4 = Sol aigu, 3 = Do, 2 = Mi, 1 = La)
 * ====================================================================== */
const UKULELE = [
  L('u01', 1, 'Tenir le ukulélé et l\'accorder', 'Le tenir contre soi, connaître Sol Do Mi La.',
    `<p>Le ukulélé se tient contre la poitrine, l'avant-bras droit le serre doucement. On gratte avec l'<b>index</b> (vers le bas avec l'ongle, vers le haut avec la pulpe), au-dessus de la fin du manche.</p>
     <p>Les cordes : <b>Sol Do Mi La</b>. Particularité : la corde de Sol est plus aiguë que celle de Do. C'est ce qui donne au ukulélé son son pétillant.</p>`,
    { type:'cordes' }),
  L('u02', 1, 'Premier accord : Do', 'Un seul doigt, et c\'est déjà de la musique.',
    `<p>Do : l'annulaire en case 3 sur la corde de La (la plus proche du sol). Gratte vers le bas avec l'index, un coup par temps.</p>`,
    { bpm:72, mesure:'4/4', style:'noires', sections:[{ nom:'Do', mesures:'C | C | C | C', rep:2 }] }),
  L('u03', 1, 'La mineur et Do', 'Changer d\'accord sans s\'arrêter.',
    `<p>La mineur : le majeur en case 2 sur la corde de Sol. Pour passer à Do, un seul doigt à changer.</p>`,
    { bpm:72, mesure:'4/4', style:'noires', sections:[{ nom:'Grille', mesures:'Am | Am | C | C', rep:2 }] }),
  L('u04', 1, 'Fa : deux doigts', 'Ajouter Fa, l\'accord le plus utile après Do.',
    `<p>Fa : l'index en case 1 sur la corde de Mi, le majeur en case 2 sur la corde de Sol. Remarque : de La mineur à Fa, le majeur ne bouge pas.</p>`,
    { bpm:72, mesure:'4/4', style:'noires', sections:[{ nom:'Grille', mesures:'C | C | F | F', rep:2 }, { nom:'Avec La mineur', mesures:'Am | F | C | C', rep:2 }] }),
  L('u05', 1, 'Sol 7 et la cadence', 'Do, Fa, Sol 7 : trois accords pour des dizaines de chansons.',
    `<p>Sol 7 : trois doigts en triangle (case 2 sur les cordes Do et La, case 1 sur la corde de Mi). Il « appelle » le retour à Do.</p>`,
    { bpm:76, mesure:'4/4', style:'noires', sections:[{ nom:'Grille', mesures:'C | F | G7 | C', rep:2 }] }),
  L('u06', 1, 'Bas-haut en croches', 'Le va-et-vient régulier de l\'index.',
    `<p>L'index descend sur le temps (ongle) et remonte entre les temps (pulpe). Le mouvement vient du poignet, comme pour secouer de l'eau de la main.</p>`,
    { bpm:76, mesure:'4/4', style:'croches', sections:[{ nom:'Grille', mesures:'C | Am | F | G7', rep:2 }] }),

  L('u07', 2, 'L\'island strum', 'Le rythme emblématique du ukulélé.',
    `<p>Bas, bas-haut, <b>haut</b>-bas-haut : la main continue son va-et-vient, mais rate volontairement les cordes sur le 3. Dis-le : « boum, boum-tchi, tchi-boum-tchi ».</p>
     <p>Nouvel accord : Sol (0232), trois doigts en triangle.</p>`,
    { bpm:84, mesure:'4/4', style:'folk', sections:[{ nom:'Grille', mesures:'C | G | Am | F', rep:2 }] }),
  L('u08', 2, 'Le chuck', 'Le coup étouffé qui remplace la caisse claire.',
    `<p>Sur les temps 2 et 4, le côté de la main droite tombe sur les cordes en même temps qu'elle gratte : « tchak ». Le ukulélé devient aussi une batterie.</p>`,
    { bpm:88, mesure:'4/4', style:'chuck', sections:[{ nom:'Grille', mesures:'C | Am | F | G', rep:2 }] }),
  L('u09', 2, 'La valse', 'Trois temps : un fort, deux légers.',
    `<p>Un coup plus appuyé sur le 1, deux coups légers sur 2 et 3.</p>`,
    { bpm:108, mesure:'3/4', style:'valse', sections:[{ nom:'Grille', mesures:'C | C | G7 | G7 | G7 | G7 | C | C' }] }),
  L('u10', 2, 'Nouveaux accords : Ré, Mi mineur', 'Jouer en Sol majeur.',
    `<p>Ré : trois doigts côte à côte en case 2. Mi mineur : trois doigts en escalier (0432). Avec Sol et Do, on joue en Sol majeur.</p>`,
    { bpm:80, mesure:'4/4', style:'croches', sections:[{ nom:'Grille', mesures:'G | Em | C | D', rep:2 }] }),
  L('u11', 2, 'Le reggae', 'Des coups brefs sur 2 et 4.',
    `<p>Le coup sur 2 et 4, aussitôt étouffé par la main gauche qui relâche la pression. La batterie t'aide à placer les contretemps.</p>`,
    { bpm:76, mesure:'4/4', style:'reggae', couches:{ batterie:true, basse:true }, sections:[{ nom:'Grille', mesures:'Am | Dm | G | C', rep:2 }] }),

  L('u12', 3, 'Première mélodie', 'Au clair de la lune, note par note.',
    `<p>Do : corde 3 à vide. Ré : corde 3, case 2. Mi : corde 2 à vide. Joue avec le pouce ou l'index. Écoute d'abord, puis coupe l'exercice et joue-le.</p>`,
    { bpm:84, mesure:'4/4', style:'arpPim', couches:{ accords:false }, sections:[
      { nom:'Mélodie', mesures:'C | C G | C G | C', tab:mesures(noires('3.0', '3.0', '3.0', '3.2'), '2.0 - - - 3.2 - - -', noires('3.0', '2.0', '3.2', '3.2'), '3.0 - - - - - - -'), rep:2 }] }),
  L('u13', 3, 'L\'Ode à la joie', 'Une mélodie sur les cordes 2 et 3.',
    `<p>Mi (corde 2 à vide), Fa (corde 2, case 1), Sol (corde 2, case 3), Ré (corde 3, case 2), Do (corde 3 à vide).</p>`,
    { bpm:88, mesure:'4/4', style:'arpPim', couches:{ accords:true }, sections:[
      { nom:'Mélodie', mesures:'C | G | C | G | C | G | C | G C', tab:mesures(
        noires('2.0', '2.0', '2.1', '2.3'), noires('2.3', '2.1', '2.0', '3.2'), noires('3.0', '3.0', '3.2', '2.0'), '2.0 - - 3.2 3.2 - - -',
        noires('2.0', '2.0', '2.1', '2.3'), noires('2.3', '2.1', '2.0', '3.2'), noires('3.0', '3.0', '3.2', '2.0'), '3.2 - - 3.0 3.0 - - -') }] }),
  L('u14', 3, 'Le picking', 'Pouce, index, majeur, annulaire : un doigt par corde.',
    `<p>Le pouce joue la corde 4 (Sol), l'index la 3, le majeur la 2, l'annulaire la 1. On monte et on redescend, en tenant l'accord.</p>`,
    { bpm:76, mesure:'4/4', style:'arpege', couches:{ accords:false }, sections:[
      { nom:'Arpège', mesures:'C | Am | F | G7', tab:mesures('4.0 3.0 2.0 1.3 2.0 3.0 2.0 1.3', '4.2 3.0 2.0 1.0 2.0 3.0 2.0 1.0', '4.2 3.0 2.1 1.0 2.1 3.0 2.1 1.0', '4.0 3.2 2.1 1.2 2.1 3.2 2.1 1.2'), rep:2 }] }),
  L('u15', 3, 'Arpège en valse', 'Le picking en trois temps.',
    `<p>L'appli joue l'arpège sur la grille : écoute, puis coupe les accords et joue-le.</p>`,
    { bpm:92, mesure:'3/4', style:'arpege', mode:'arp', sections:[{ nom:'Grille', mesures:'C | Am | Dm | G7', rep:2 }] }),

  L('u16', 4, 'Le blues au ukulélé', 'Accords de septième et shuffle.',
    `<p>Do 7 (0001), Fa 7 (2313), Sol 7 (0212) : la grille du blues en Do, en shuffle long-court.</p>`,
    { bpm:76, mesure:'12/8', style:'shuffle', couches:{ batterie:true, basse:true }, sections:[{ nom:'Blues', mesures:'C7 | F7 | C7 | C7 | F7 | F7 | C7 | C7 | G7 | F7 | C7 | G7' }] }),
  L('u17', 4, 'Le barré : si bémol', 'L\'index couche deux cordes.',
    `<p>Si bémol (3211) : l'index barre les cordes 1 et 2 en case 1, le majeur en case 2, l'annulaire en case 3. C'est la porte d'entrée vers toutes les tonalités.</p>`,
    { bpm:80, mesure:'4/4', style:'folk', sections:[{ nom:'Grille', mesures:'F | Bb | C | F', rep:2 }] }),
  L('u18', 4, 'Jouer avec le groupe', 'Le ukulélé avec basse et batterie.',
    `<p>L'island strum, cette fois avec une basse et une batterie : garde le tempo, ce sont elles qui te suivent… ou l'inverse !</p>`,
    { bpm:92, mesure:'4/4', style:'folk', couches:{ batterie:true, basse:true }, sections:[{ nom:'Couplet', mesures:'C | G | Am | F', rep:2 }, { nom:'Refrain', mesures:'F | G | C | Am | F | G | C | C' }] })
];

/* ======================================================================
 *  les parcours, par instrument
 * ====================================================================== */
export const PARCOURS = {
  guitare_elec:{ lecons:ELEC, niveaux:['Premiers pas', 'La rythmique', 'Le solo', 'Aller plus loin'] },
  guitare_classique:{ lecons:CLASSIQUE, niveaux:['Posture et premiers sons', 'Les arpèges', 'Mélodie et technique', 'Répertoire et couleurs'] },
  basse:{ lecons:BASSE, niveaux:['Premiers pas', 'Le groove', 'Le manche', 'Les styles'] },
  ukulele:{ lecons:UKULELE, niveaux:['Premiers pas', 'Les strums', 'Picking et mélodie', 'Aller plus loin'] }
};
export const TOUTES_LECONS = Object.values(PARCOURS).flatMap(p => p.lecons);
const GRAD = [['#34d399', '#059669'], ['#38bdf8', '#2563eb'], ['#fbbf24', '#e8590c'], ['#f472b6', '#be185d']];
export const niveauxDe = instId => PARCOURS[instId].niveaux.map((nom, i) => ({ n:i + 1, nom, grad:GRAD[i] }));
export const leconsDe = instId => PARCOURS[instId].lecons;
