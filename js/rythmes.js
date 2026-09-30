/* Rythmiques d'accompagnement et compilation d'une grille d'accords en mesures.
 * Une mesure est découpée en « pas » : res pas par temps (2 = croches, 3 = triolets).
 * Signes d'une rythmique de grattage :
 *   D coup vers le bas   U coup vers le haut   d petit coup (3-4 cordes graves)
 *   B note grave seule   b quinte grave (basse alternée)   x corde étouffée (« chuck »)   - silence
 * Signes d'un arpège : 0 = corde la plus grave, a = la plus aiguë, b = la suivante, c = la 3e en partant de l'aigu.
 * Signes de la basse : R fondamentale, 3 tierce, 5 quinte, 6 sixte, 8 octave, - silence. */

export const MESURES = {
  '4/4':  { beats:4, res:2, nom:'4/4' },
  '2/4':  { beats:2, res:2, nom:'2/4' },
  '3/4':  { beats:3, res:2, nom:'3/4' },
  '6/8':  { beats:2, res:3, nom:'6/8' },
  '12/8': { beats:4, res:3, nom:'12/8' }
};
export const pasParMesure = m => MESURES[m].beats * MESURES[m].res;

/* style → par mesure : { grat, arp, basse } */
export const STYLES = {
  noires: {
    nom:'Noires', niveau:1, desc:'Un coup vers le bas à chaque temps. Le plus simple : on ne pense qu\'au changement d\'accord.',
    '4/4':{ grat:'D---D---', arp:'0-c-b-a-', basse:'R---R---' },
    '3/4':{ grat:'D-D-D-', arp:'0-b-a-', basse:'R-R-R-' }
  },
  croches: {
    nom:'Croches bas-haut', niveau:1, desc:'Bas-haut sans s\'arrêter : le moteur de tout le grattage. La main ne s\'arrête jamais.',
    '4/4':{ grat:'DUDUDUDU', arp:'0cbabcba', basse:'RRRRRRRR' },
    '3/4':{ grat:'DUDUDU', arp:'0cbacb', basse:'RRRRRR' }
  },
  folk: {
    nom:'Folk', niveau:2, desc:'Le grattage universel : bas, bas-haut, haut-bas-haut. Il sert pour des centaines de chansons.',
    '4/4':{ grat:'D-DU-UDU', arp:'0-cbab-b', basse:'R-R-5-R-' },
    '2/4':{ grat:'D-DU', arp:'0-ba', basse:'R-5-' }
  },
  pop: {
    nom:'Pop', niveau:2, desc:'Basse sur le 1, puis un balancement plus souple. Bien pour les ballades et les refrains.',
    '4/4':{ grat:'D--UD-UD', arp:'0-cbabcb', basse:'R--R5-R-' }
  },
  ballade: {
    nom:'Ballade', niveau:2, desc:'Lent et ouvert : la basse d\'abord, puis un coup doux sur les temps 2 et 4.',
    '4/4':{ grat:'B---d-d-', arp:'0-c-b-a-', basse:'R-------' },
    '3/4':{ grat:'B-d-d-', arp:'0-cbab', basse:'R-----' }
  },
  rock: {
    nom:'Rock', niveau:2, desc:'Gros coups appuyés, un temps sur deux dans l\'air. Avec le son saturé : power chords.',
    '4/4':{ grat:'D-D-DUD-', arp:'0-0-0-0-', basse:'RRRRRRRR' }
  },
  reggae: {
    nom:'Reggae', niveau:3, desc:'On joue les contretemps : silence sur le 1, coup bref sur le « et » de 2 et de 4. La basse remplit le reste.',
    '4/4':{ grat:'---x-U--', arp:'---c---a', basse:'R--R-5R-' }
  },
  country: {
    nom:'Country (basse alternée)', niveau:3, desc:'Basse, coup, quinte, coup. Ça trotte, comme un train.',
    '4/4':{ grat:'BdbdBdbd', arp:'0-b-5-b-', basse:'R---5---' }
  },
  valse: {
    nom:'Valse', niveau:1, desc:'Trois temps : une basse sur le 1, puis deux coups légers. Rum-pa-pa.',
    '3/4':{ grat:'B-D-D-', arp:'0-cba-', basse:'R-5-5-' }
  },
  valseCroches: {
    nom:'Valse en croches', niveau:2, desc:'La valse, avec des bas-haut entre les temps.',
    '3/4':{ grat:'B-DUDU', arp:'0cbacb', basse:'R-5-5-' }
  },
  six8: {
    nom:'6/8 balancé', niveau:2, desc:'Deux grands temps de trois croches : « UN-deux-trois, QUATRE-cinq-six ».',
    '6/8':{ grat:'D-UD-U', arp:'0cbacb', basse:'R--5--' }
  },
  douze8: {
    nom:'12/8 lent', niveau:2, desc:'Quatre temps de trois : un balancement lent, comme une berceuse ou un blues lent.',
    '12/8':{ grat:'D--D-UD--D-U', arp:'0cbacbcbacbc', basse:'R--5--R--5--' }
  },
  shuffle: {
    nom:'Shuffle', niveau:3, desc:'Le swing du blues : long-court, long-court. On saute le deuxième temps du triolet.',
    '12/8':{ grat:'D-UD-UD-UD-U', arp:'0-c-b-a-b-c-', basse:'R-5R-5R-5R-5' }
  },
  arpege: {
    nom:'Arpège', niveau:2, desc:'Les cordes une à une : la basse en premier, puis les aiguës. Le doigté de la main droite : p i m a.',
    '4/4':{ grat:'0-cbabcb', arp:'0cbabcba', basse:'R-------' },
    '3/4':{ grat:'0-cbab', arp:'0cbacb', basse:'R-----' }
  }
};
export const STYLES_ORDRE = Object.keys(STYLES);

/* rythmique utilisable pour une mesure, ou la plus proche */
export function patronsPour(styleId, mesure){
  const s = STYLES[styleId] || STYLES.folk;
  if (s[mesure]) return s[mesure];
  // repli : une rythmique simple dans la signature demandée
  const simple = { '4/4':STYLES.croches['4/4'], '3/4':STYLES.valse['3/4'], '2/4':STYLES.folk['2/4'], '6/8':STYLES.six8['6/8'], '12/8':STYLES.douze8['12/8'] };
  return simple[mesure] || STYLES.croches['4/4'];
}
export const stylesPour = mesure => STYLES_ORDRE.filter(id => STYLES[id][mesure]);

/* ================= grille : « C | G Am | F … » → mesures ================= */
/* Découpe un texte « C | G Am | F » : une mesure par barre ; deux accords dans une mesure
 * se partagent la mesure (à égalité, ou moitié-moitié pour deux). */
export function lireGrille(texte){
  return texte.split('|').map(m => m.trim()).filter(m => m.length).map(m => m.split(/\s+/));
}

/* Compile des sections [{ nom, mesures:'C | G', paroles:'… | …', rep }] en mesures à plat.
 * Renvoie { mesures:[{ accords:[{nom, pas}], texte, section, numero }], sections:[{nom, debut, fin}] } */
export function compilerSections(sections, mesureId){
  const pas = pasParMesure(mesureId);
  const out = [], plages = [];
  sections.forEach((sec, si) => {
    const grille = lireGrille(sec.mesures);
    const textes = (sec.paroles || '').split('|').map(t => t.trim());
    const debut = out.length;
    const tours = sec.rep || 1;
    for (let r = 0; r < tours; r++){
      grille.forEach((accords, i) => {
        const n = accords.length;
        out.push({
          accords:accords.map((nom, k) => ({ nom, pas:Math.round(k * pas / n) })),
          texte:textes[i] || '',
          section:si, numero:i, tour:r
        });
      });
    }
    plages.push({ nom:sec.nom, debut, fin:out.length, rep:tours });
  });
  return { mesures:out, sections:plages };
}

/* accord actif au pas p d'une mesure */
export function accordAuPas(mesure, p){
  let cur = mesure.accords[0];
  for (const a of mesure.accords) if (a.pas <= p) cur = a;
  return cur;
}
