/* Les quatre instruments. Les cordes sont listées telles qu'on les voit sur le manche,
 * de la plus grave (en haut de la tranche, côté épaule) à la plus aiguë. Le ukulélé est
 * « re-entrant » : sa corde de Sol est accordée plus haut que celle de Do.
 * cordes = numéros MIDI (E2 = 40, C4 = 60, A4 = 69). */
export const INSTRUMENTS = {
  guitare_elec: {
    id:'guitare_elec', nom:'Guitare électrique', court:'Électrique', famille:'guitare', timbre:'elec',
    cordes:[40, 45, 50, 55, 59, 64], lettres:['E', 'A', 'D', 'G', 'B', 'E'], frettes:15,
    couleur:['#ff9f43', '#f5426c'], marques:[3, 5, 7, 9, 12, 15],
    desc:'6 cordes, son clair ou saturé. Accords, power chords, riffs.'
  },
  guitare_classique: {
    id:'guitare_classique', nom:'Guitare classique', court:'Classique', famille:'guitare', timbre:'nylon',
    cordes:[40, 45, 50, 55, 59, 64], lettres:['E', 'A', 'D', 'G', 'B', 'E'], frettes:12,
    couleur:['#fbbf24', '#e8590c'], marques:[3, 5, 7, 9, 12],
    desc:'6 cordes en nylon. Accords, arpèges, doigts de la main droite.'
  },
  basse: {
    id:'basse', nom:'Basse', court:'Basse', famille:'basse', timbre:'basse',
    cordes:[28, 33, 38, 43], lettres:['E', 'A', 'D', 'G'], frettes:15,
    couleur:['#818cf8', '#4338ca'], marques:[3, 5, 7, 9, 12, 15],
    desc:'4 cordes. Fondamentales, quintes, lignes de basse.'
  },
  ukulele: {
    id:'ukulele', nom:'Ukulélé', court:'Ukulélé', famille:'ukulele', timbre:'uke',
    cordes:[67, 60, 64, 69], lettres:['G', 'C', 'E', 'A'], frettes:12,
    couleur:['#2fd6a3', '#0b8f82'], marques:[5, 7, 10, 12],
    desc:'4 cordes en nylon (Sol Do Mi La). Petit, léger, idéal pour chanter.'
  }
};
export const ORDRE_INSTRUMENTS = ['guitare_elec', 'guitare_classique', 'basse', 'ukulele'];
export const instrument = id => INSTRUMENTS[id] || INSTRUMENTS.guitare_elec;
