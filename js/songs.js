/* Morceaux d'accompagnement : grilles d'accords pour chanter en jouant.
 * Aucune parole n'est fournie ici : chacun colle les siennes (écran « Mes paroles »),
 * elles restent enregistrées dans le navigateur. Les grilles sont simplifiées,
 * transposables, et le tempo est indicatif.
 * sections : [{ nom, mesures:'C | G Am | F', rep }]  — une barre = une mesure. */

export const GENRES = [
  { id:'trad',   nom:'Chansons traditionnelles', court:'Trad.',  grad:['#38bdf8', '#1d4ed8'], desc:'Comptines et chansons populaires : trois accords, idéal pour débuter.' },
  { id:'pop',    nom:'Pop & folk',               court:'Pop',    grad:['#f472b6', '#be185d'], desc:'Les grands classiques à chanter autour du feu.' },
  { id:'rock',   nom:'Rock & blues',             court:'Rock',   grad:['#fb923c', '#e11d48'], desc:'Power chords, shuffle, grilles de blues.' },
  { id:'reggae', nom:'Reggae & soul',            court:'Soul',   grad:['#34d399', '#0f766e'], desc:'Contretemps, grooves posés.' },
  { id:'grilles',nom:'Grilles types',            court:'Grilles',grad:['#a78bfa', '#6d28d9'], desc:'Les enchaînements qu\'on retrouve dans des milliers de chansons.' }
];

const m = (id, titre, origine, genre, niveau, bpm, mesure, style, sections, extra = {}) =>
  ({ id, titre, origine, genre, niveau, bpm, mesure, style, sections, ...extra });

export const MORCEAUX = [
  /* --- traditionnelles (domaine public) --- */
  m('clair-lune', 'Au clair de la lune', 'Chanson traditionnelle française', 'trad', 1, 90, '4/4', 'noires', [
    { nom:'Couplet', mesures:'C | C G | C | G C | C | C G | C | G C', rep:2 }]),
  m('frere-jacques', 'Frère Jacques', 'Canon traditionnel', 'trad', 1, 100, '4/4', 'noires', [
    { nom:'Canon', mesures:'C | C | C | C | C | C | C G | C', rep:2 }]),
  m('pont-avignon', 'Sur le pont d\'Avignon', 'Chanson traditionnelle française', 'trad', 1, 110, '2/4', 'folk', [
    { nom:'Refrain', mesures:'C | G | C | G | C | G | G | C' },
    { nom:'Couplet', mesures:'C | G | C | G C' }]),
  m('alouette', 'Alouette', 'Chanson traditionnelle', 'trad', 1, 112, '4/4', 'croches', [
    { nom:'Refrain', mesures:'C | G7 C | C | G7 C' },
    { nom:'Couplet', mesures:'C | C | G7 | C', rep:2 }]),
  m('claire-fontaine', 'À la claire fontaine', 'Chanson traditionnelle française', 'trad', 2, 76, '4/4', 'ballade', [
    { nom:'Couplet', mesures:'C | G | C | G | C | F | G | C' },
    { nom:'Refrain', mesures:'F | C | G | C' }]),
  m('ma-blonde', 'Auprès de ma blonde', 'Chanson traditionnelle française', 'trad', 2, 104, '4/4', 'folk', [
    { nom:'Couplet', mesures:'G | D | G | D G | G | D | G | D G' },
    { nom:'Refrain', mesures:'C | G | D | G | C | G | D | G' }]),
  m('petit-navire', 'Il était un petit navire', 'Chanson traditionnelle française', 'trad', 1, 96, '4/4', 'folk', [
    { nom:'Couplet', mesures:'G | G | D | G | G | C | D | G', rep:2 }]),
  m('cadet-rousselle', 'Cadet Rousselle', 'Chanson traditionnelle française', 'trad', 2, 120, '2/4', 'folk', [
    { nom:'Couplet', mesures:'D | A | D | A D | D | A | D | A D' },
    { nom:'Refrain', mesures:'G | D | A | D' }]),
  m('mon-beau-sapin', 'Mon beau sapin', 'Chant traditionnel', 'trad', 2, 84, '3/4', 'valse', [
    { nom:'Couplet', mesures:'G | G | D | G | G | G | D | G | D | G | D | G | G | C | D | G' }]),
  m('dagobert', 'Le bon roi Dagobert', 'Chanson traditionnelle française', 'trad', 1, 116, '4/4', 'croches', [
    { nom:'Couplet', mesures:'C | G | C | G C | C | F | G | C' }]),
  m('amazing-grace', 'Amazing Grace', 'Hymne traditionnel (1779)', 'trad', 2, 80, '3/4', 'valse', [
    { nom:'Couplet', mesures:'G | G | C | G | G | G | D | D | G | G7 | C | G | G | D | G | G' }]),
  m('saints', 'When the Saints Go Marching In', 'Traditionnel américain', 'trad', 2, 120, '4/4', 'folk', [
    { nom:'Couplet', mesures:'C | C | C | G | C | C7 | F | F | C | G | C | C' }]),
  m('oh-susanna', 'Oh! Susanna', 'Stephen Foster (1848)', 'trad', 2, 116, '2/4', 'country', [
    { nom:'Couplet', mesures:'C | C | C | G | C | C | G | C', rep:2 },
    { nom:'Refrain', mesures:'F | F | C | G | C | C | G | C' }]),
  m('rising-sun', 'The House of the Rising Sun', 'Ballade traditionnelle américaine', 'trad', 3, 76, '6/8', 'six8', [
    { nom:'Couplet', mesures:'Am | C | D | F | Am | C | E | E | Am | C | D | F | Am | E | Am | E' }], { mode:'arp' }),
  m('greensleeves', 'Greensleeves', 'Air anglais du XVIᵉ siècle', 'trad', 3, 66, '6/8', 'six8', [
    { nom:'Couplet', mesures:'Am | G | Am | E | Am | G | Am E | Am' },
    { nom:'Refrain', mesures:'C | G | Am | E | C | G | Am E | Am' }], { mode:'arp' }),
  m('scarborough', 'Scarborough Fair', 'Ballade traditionnelle anglaise', 'trad', 3, 72, '3/4', 'valse', [
    { nom:'Couplet', mesures:'Am | Am | G | Am | C | Am D | Am | Am | C | C | G | G | Am | G | Am | Am' }], { mode:'arp' }),
  m('joyeux-anniv', 'Joyeux anniversaire', 'Air traditionnel', 'trad', 1, 96, '3/4', 'valse', [
    { nom:'Chanson', mesures:'C | G | G | C | C | F | C G | C' }]),

  /* --- grilles de morceaux connus (sans paroles : on chante par-dessus) --- */
  m('let-it-be', 'Let It Be', 'The Beatles', 'pop', 1, 72, '4/4', 'pop', [
    { nom:'Couplet', mesures:'C | G | Am | F | C | G | F C', rep:2 },
    { nom:'Refrain', mesures:'Am | G | F | C | C | G | F C' }]),
  m('stand-by-me', 'Stand By Me', 'Ben E. King', 'pop', 1, 118, '4/4', 'pop', [
    { nom:'Couplet', mesures:'G | G | Em | Em | C | D | G | G', rep:2 }]),
  m('knockin', 'Knockin\' on Heaven\'s Door', 'Bob Dylan', 'pop', 1, 68, '4/4', 'folk', [
    { nom:'Couplet', mesures:'G | D | Am | Am | G | D | C | C', rep:2 }]),
  m('country-roads', 'Take Me Home, Country Roads', 'John Denver', 'pop', 2, 82, '4/4', 'folk', [
    { nom:'Couplet', mesures:'G | Em | D | C | G | Em | D | G' },
    { nom:'Refrain', mesures:'G | D | Em | C | G | D | C | G' }]),
  m('im-yours', 'I\'m Yours', 'Jason Mraz', 'pop', 2, 76, '4/4', 'reggae', [
    { nom:'Couplet', mesures:'C | G | Am | F', rep:2 }]),
  m('hey-jude', 'Hey Jude', 'The Beatles', 'pop', 2, 74, '4/4', 'pop', [
    { nom:'Couplet', mesures:'F | C | C7 | F | Bb | F | C | F' },
    { nom:'Final', mesures:'F | Eb | Bb | F', rep:2 }]),
  m('wonderwall', 'Wonderwall', 'Oasis', 'pop', 3, 87, '4/4', 'croches', [
    { nom:'Couplet', mesures:'Em7 | G | Dsus4 | A7sus4', rep:2 },
    { nom:'Refrain', mesures:'C | D | Em | Em' }], { capo:2 }),
  m('hallelujah', 'Hallelujah', 'Leonard Cohen', 'pop', 2, 58, '6/8', 'six8', [
    { nom:'Couplet', mesures:'C | Am | C | Am | F | G | C | G' },
    { nom:'Refrain', mesures:'F | Am | F | C G C' }], { mode:'arp' }),
  m('riptide', 'Riptide', 'Vance Joy', 'pop', 2, 100, '4/4', 'croches', [
    { nom:'Grille', mesures:'Am | G | C | C', rep:2 }]),
  m('brown-eyed', 'Brown Eyed Girl', 'Van Morrison', 'rock', 2, 148, '4/4', 'rock', [
    { nom:'Couplet', mesures:'G | C | G | D', rep:2 },
    { nom:'Refrain', mesures:'C | D | G | Em | C | D | G | D' }]),
  m('alabama', 'Sweet Home Alabama', 'Lynyrd Skynyrd', 'rock', 2, 98, '4/4', 'rock', [
    { nom:'Grille', mesures:'D | C G | D | C G', rep:2 }]),
  m('twist-shout', 'Twist and Shout', 'The Isley Brothers', 'rock', 1, 126, '4/4', 'rock', [
    { nom:'Grille', mesures:'D G | A G', rep:4 }]),
  m('la-bamba', 'La Bamba', 'Traditionnel mexicain', 'rock', 1, 150, '4/4', 'rock', [
    { nom:'Grille', mesures:'C F | G F', rep:4 }]),
  m('zombie', 'Zombie', 'The Cranberries', 'rock', 2, 84, '4/4', 'rock', [
    { nom:'Grille', mesures:'Em | C | G | D', rep:2 }], { puissance:true }),
  m('hit-road', 'Hit the Road Jack', 'Ray Charles', 'rock', 2, 88, '4/4', 'croches', [
    { nom:'Grille', mesures:'Am G | F E7', rep:4 }]),
  m('hotel-cal', 'Hotel California', 'Eagles', 'rock', 3, 75, '4/4', 'arpege', [
    { nom:'Couplet', mesures:'Bm | F# | A | E | G | D | Em | F#' }], { mode:'arp' }),
  m('johnny-b', 'Johnny B. Goode', 'Chuck Berry', 'rock', 3, 168, '4/4', 'rock', [
    { nom:'Blues', mesures:'A | A | A | A | D | D | A | A | E | E | A | A' }], { puissance:true }),
  m('no-woman', 'No Woman, No Cry', 'Bob Marley', 'reggae', 2, 78, '4/4', 'reggae', [
    { nom:'Grille', mesures:'C G | Am F | C F | C G', rep:2 }]),
  m('three-birds', 'Three Little Birds', 'Bob Marley', 'reggae', 1, 74, '4/4', 'reggae', [
    { nom:'Refrain', mesures:'A | A | D | A | A | A | E | A' }]),
  m('with-without', 'With or Without You', 'U2', 'reggae', 1, 110, '4/4', 'croches', [
    { nom:'Grille', mesures:'D | A | Bm | G', rep:2 }]),

  /* --- grilles types --- */
  m('g-pop4', 'Les quatre accords de la pop', 'I – V – vi – IV', 'grilles', 1, 90, '4/4', 'pop', [
    { nom:'Grille', mesures:'C | G | Am | F', rep:2 }]),
  m('g-50s', 'La grille des années 50', 'I – vi – IV – V', 'grilles', 1, 100, '4/4', 'croches', [
    { nom:'Grille', mesures:'C | Am | F | G', rep:2 }]),
  m('g-mineur', 'Ballade mineure', 'vi – IV – I – V', 'grilles', 1, 80, '4/4', 'ballade', [
    { nom:'Grille', mesures:'Am | F | C | G', rep:2 }]),
  m('g-blues', 'Blues 12 mesures', 'I – IV – V en 12/8', 'grilles', 2, 70, '12/8', 'shuffle', [
    { nom:'Blues', mesures:'E7 | A7 | E7 | E7 | A7 | A7 | E7 | E7 | B7 | A7 | E7 | B7' }]),
  m('g-andalouse', 'Cadence andalouse', 'Am – G – F – E (flamenco)', 'grilles', 2, 96, '4/4', 'croches', [
    { nom:'Grille', mesures:'Am | G | F | E', rep:2 }], { mode:'arp' }),
  m('g-valse', 'Valse en sol', 'I – IV – V en 3/4', 'grilles', 1, 120, '3/4', 'valse', [
    { nom:'Grille', mesures:'G | G | C | G | D | D | G | G' }]),
  m('g-jazz', 'II – V – I', 'La cadence du jazz', 'grilles', 3, 110, '4/4', 'noires', [
    { nom:'Grille', mesures:'Dm7 | G7 | Cmaj7 | Cmaj7', rep:2 }])
];

export const genreDe = mo => GENRES.find(g => g.id === mo.genre) || GENRES[0];
export const morceauxDuGenre = id => MORCEAUX.filter(mo => mo.genre === id).sort((a, b) => a.niveau - b.niveau);
/* tous les accords utilisés, sans doublon */
export const accordsDe = mo => [...new Set(mo.sections.flatMap(s => s.mesures.split(/[|\s]+/).filter(Boolean)))];
