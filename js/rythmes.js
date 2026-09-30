/* Rythmiques d'accompagnement, tablatures, et compilation d'une grille en mesures.
 * Une mesure est découpée en « pas » : res pas par temps (2 = croches, 3 = triolets).
 *
 * Signes d'une rythmique de grattage (grat) :
 *   D coup vers le bas   U coup vers le haut   d petit coup (cordes graves)
 *   P coup vers le bas étouffé de la paume (palm mute)   x coup étouffé (« chuck »)
 *   k coup bref, aussitôt relâché (le « skank » du reggae)
 *   B note grave seule   b deuxième note grave (basse alternée)   - on ne joue pas
 * Signes d'un arpège (arp) : 0 = corde la plus grave, 1 = la suivante, a = la plus aiguë,
 *   b = la deuxième en partant de l'aigu, c = la troisième.
 * Signes de la basse : R fondamentale, 3 tierce, 5 quinte, 6 sixte, 7 septième, 8 octave, - rien.
 * Batterie (batt) : GC grosse caisse, CC caisse claire, CH charleston ;
 *   x coup, X accent, g coup très léger, o charleston ouvert, - rien.
 *
 * Tablature (tab) : une barre « | » par mesure, un symbole par pas, séparés par des espaces.
 *   « 3.5 » = corde 3, case 5 (corde 1 = la plus aiguë, comme sur une tablature).
 *   Plusieurs notes ensemble : « 6.0+4.2 ». Silence ou note tenue : « - ».
 *   Suffixes : b = tiré (bend d'un ton), h = liaison ascendante (hammer-on),
 *   p = liaison descendante (pull-off), x = note étouffée, ~ = vibrato. */

export const MESURES = {
  '4/4':  { beats:4, res:2, nom:'4/4' },
  '2/4':  { beats:2, res:2, nom:'2/4' },
  '3/4':  { beats:3, res:2, nom:'3/4' },
  '6/8':  { beats:2, res:3, nom:'6/8' },
  '9/8':  { beats:3, res:3, nom:'3/4 en triolets' },
  '12/8': { beats:4, res:3, nom:'12/8' }
};
export const pasParMesure = m => MESURES[m].beats * MESURES[m].res;

const G = ['guitare_elec'], C = ['guitare_classique'], B = ['basse'], U = ['ukulele'];
const TOUS = [...G, ...C, ...B, ...U];
const batt = (GC, CC, CH) => ({ GC, CC, CH });

/* style → { nom, niveau, desc, pour (instruments), type, [mesure]:{ grat, arp, basse, batt } } */
export const STYLES = {
  noires: {
    nom:'Noires', niveau:1, pour:TOUS, type:'grat',
    desc:'Un coup vers le bas à chaque temps. Le plus simple : on ne pense qu\'au changement d\'accord.',
    '4/4':{ grat:'D-D-D-D-', arp:'0-c-b-a-', basse:'R-R-R-R-', batt:batt('x---x---', '--x---x-', 'x-x-x-x-') },
    '3/4':{ grat:'D-D-D-', arp:'0-b-a-', basse:'R-R-R-', batt:batt('x-----', '--x-x-', 'x-x-x-') },
    '2/4':{ grat:'D-D-', arp:'0-b-', basse:'R-R-', batt:batt('x---', '--x-', 'x-x-') }
  },
  croches: {
    nom:'Croches bas-haut', niveau:1, pour:TOUS, type:'grat',
    desc:'Bas-haut sans s\'arrêter : le moteur de tout le grattage. La main ne s\'arrête jamais.',
    '4/4':{ grat:'DUDUDUDU', arp:'0cbabcba', basse:'RRRRRRRR', batt:batt('x---x---', '--x---x-', 'xxxxxxxx') },
    '3/4':{ grat:'DUDUDU', arp:'0cbacb', basse:'RRRRRR', batt:batt('x-----', '--x-x-', 'xxxxxx') }
  },
  folk: {
    nom:'Folk (island strum)', niveau:2, pour:[...G, ...U], type:'grat',
    desc:'Bas, bas-haut, haut-bas-haut. Le grattage universel de la chanson, et l\'« island strum » du ukulélé.',
    '4/4':{ grat:'D-DU-UDU', arp:'0-cbab-b', basse:'R---5-R-', batt:batt('x---x-x-', '--x---x-', 'x-x-x-x-') },
    '2/4':{ grat:'D-DU', arp:'0-ba', basse:'R-5-', batt:batt('x---', '--x-', 'x-x-') }
  },
  pop: {
    nom:'Pop', niveau:2, pour:[...G, ...U], type:'grat',
    desc:'Un gros coup sur le 1, puis un balancement plus souple. Bien pour les ballades et les refrains.',
    '4/4':{ grat:'D--UD-UD', arp:'0-cbabcb', basse:'R--R5-R-', batt:batt('x--x-x--', '--x---x-', 'x-x-x-x-') }
  },
  ballade: {
    nom:'Ballade', niveau:2, pour:[...G, ...C, ...U], type:'grat',
    desc:'Lent et ouvert : la basse d\'abord, puis un coup doux sur les temps 2 et 4.',
    '4/4':{ grat:'B---d-d-', arp:'0-c-b-a-', basse:'R-------', batt:batt('x-------', '----x---', 'x-x-x-x-') },
    '3/4':{ grat:'B-d-d-', arp:'0-cbab', basse:'R-----', batt:batt('x-----', '--g-g-', 'x-x-x-') }
  },
  chuck: {
    nom:'Chuck', niveau:3, pour:[...U, ...G], type:'grat',
    desc:'Le coup étouffé sur les temps 2 et 4 : la main droite tape les cordes et les étouffe aussitôt. Ça sonne comme une caisse claire.',
    '4/4':{ grat:'D-xUD-xU', arp:'0-c-b-c-', basse:'R---R-5-', batt:batt('x---x---', '--x---x-', 'x-x-x-x-') }
  },
  rock: {
    nom:'Rock', niveau:2, pour:[...G, ...B], type:'grat',
    desc:'Gros coups appuyés vers le bas, un temps sur deux dans l\'air. Avec le son saturé : power chords.',
    '4/4':{ grat:'D-D-DUD-', arp:'0-0-0-0-', basse:'RRRRRRRR', batt:batt('x---x-x-', '--x---x-', 'xxxxxxxx') }
  },
  palmMute: {
    nom:'Palm mute', niveau:3, pour:G, type:'grat',
    desc:'Croches vers le bas, la paume posée sur les cordes près du chevalet : le « tchouk-tchouk » du rock et du métal. On relâche la paume pour l\'accent du 1.',
    '4/4':{ grat:'DPPPDPPP', arp:'00000000', basse:'RRRRRRRR', batt:batt('x-x-x-x-', '--x---x-', 'xxxxxxxx') }
  },
  funk: {
    nom:'Funk', niveau:4, pour:[...G, ...B], type:'grat',
    desc:'La main droite ne s\'arrête jamais ; les coups étouffés sur 2 et 4 font le groove. Accords courts, main gauche relâchée.',
    '4/4':{ grat:'DUxUDUxU', arp:'0-c-0-c-', basse:'R--R-8R-', batt:batt('x--x-x--', '--x---x-', 'xxxxxxxx') }
  },
  disco: {
    nom:'Disco (octaves)', niveau:3, pour:[...B, ...G], type:'basse',
    desc:'La basse saute à l\'octave sur chaque croche : fondamentale, octave, fondamentale, octave. Charleston ouvert entre les temps.',
    '4/4':{ grat:'-U-U-U-U', arp:'0a0a0a0a', basse:'R8R8R8R8', batt:batt('x-x-x-x-', '--x---x-', 'xoxoxoxo') }
  },
  soul: {
    nom:'Soul', niveau:3, pour:[...B, ...G], type:'basse',
    desc:'Fondamentale, puis quinte et octave : la basse chante sous l\'accord.',
    '4/4':{ grat:'--k---k-', arp:'0-cb--cb', basse:'R--R5-8-', batt:batt('x---x-x-', '--x---x-', 'x-x-x-x-') }
  },
  reggae: {
    nom:'Reggae', niveau:3, pour:[...G, ...U, ...B], type:'grat',
    desc:'On joue les temps 2 et 4, un coup bref aussitôt relâché (le « skank »). La basse remplit le reste, la grosse caisse tombe sur le 3 (one drop).',
    '4/4':{ grat:'--k---k-', arp:'--c---c-', basse:'R---R-5-', batt:batt('----x---', '----x---', 'x-x-x-x-') }
  },
  country: {
    nom:'Country (basse alternée)', niveau:3, pour:[...G, ...C, ...B], type:'grat',
    desc:'Basse, coup, autre basse, coup. Ça trotte, comme un train.',
    '4/4':{ grat:'BdbdBdbd', arp:'0-b-1-b-', basse:'R---5---', batt:batt('x---x---', '--x---x-', 'xxxxxxxx') }
  },
  valse: {
    nom:'Valse', niveau:1, pour:TOUS, type:'grat',
    desc:'Trois temps : une basse sur le 1, puis deux coups légers. Rum-pa-pa.',
    '3/4':{ grat:'B-D-D-', arp:'0-cba-', basse:'R-5-5-', batt:batt('x-----', '--x-x-', 'x-x-x-') }
  },
  valseCroches: {
    nom:'Valse en croches', niveau:2, pour:[...G, ...U], type:'grat',
    desc:'La valse, avec des bas-haut entre les temps.',
    '3/4':{ grat:'B-DUDU', arp:'0cbacb', basse:'R-5-5-', batt:batt('x-----', '--x-x-', 'xxxxxx') }
  },
  six8: {
    nom:'6/8 balancé', niveau:2, pour:TOUS, type:'grat',
    desc:'Deux grands temps de trois croches : « UN-deux-trois, QUATRE-cinq-six ».',
    '6/8':{ grat:'D-UD-U', arp:'0cbacb', basse:'R--5--', batt:batt('x-----', '---x--', 'xxxxxx') }
  },
  douze8: {
    nom:'12/8 lent', niveau:2, pour:TOUS, type:'grat',
    desc:'Quatre temps de trois : un balancement lent, comme un blues lent ou une berceuse.',
    '12/8':{ grat:'D--D-UD--D-U', arp:'0cbacbcbacbc', basse:'R--5--R--5--', batt:batt('x-----x-----', '---x-----x--', 'xxxxxxxxxxxx') }
  },
  shuffle: {
    nom:'Shuffle', niveau:3, pour:TOUS, type:'grat',
    desc:'Le swing du blues : long-court, long-court. On saute le deuxième temps du triolet.',
    '12/8':{ grat:'D-UD-UD-UD-U', arp:'0-c-b-a-b-c-', basse:'R-5R-6R-5R-6', batt:batt('x-----x-----', '---x-----x--', 'x-xx-xx-xx-x') }
  },
  arpege: {
    nom:'Arpège p-i-m-a', niveau:2, pour:[...C, ...G, ...U], type:'arp',
    desc:'Les cordes une à une : le pouce (p) joue la basse, puis l\'index (i), le majeur (m) et l\'annulaire (a) montent et redescendent.',
    '4/4':{ grat:'0-cbabcb', arp:'0cbabcba', basse:'R-------', batt:batt('x-------', '----x---', 'x-x-x-x-') },
    '3/4':{ grat:'0-cbab', arp:'0cbacb', basse:'R-----', batt:batt('x-----', '--g-g-', 'x-x-x-') }
  },
  arpPim: {
    nom:'Arpège p-i-m-i', niveau:1, pour:[...C, ...U], type:'arp',
    desc:'Le premier arpège : pouce, index, majeur, index. Chaque doigt reste sur sa corde.',
    '4/4':{ grat:'0-c-b-c-', arp:'0-c-b-c-', basse:'R-------', batt:batt('x-------', '----x---', 'x-x-x-x-') },
    '3/4':{ grat:'0-c-b-', arp:'0-c-b-', basse:'R-----', batt:batt('x-----', '--g-g-', 'x-x-x-') }
  },
  arpTriolets: {
    nom:'Arpège en triolets', niveau:3, pour:[...C, ...G], type:'arp',
    desc:'Trois notes par temps, p-i-m sans arrêt : le mouvement des romances et des ballades espagnoles.',
    '9/8':{ grat:'0cb0cb0cb', arp:'0cbacbacb', basse:'R--------', batt:batt('x--------', '---g--g--', 'x--x--x--') },
    '6/8':{ grat:'0cb0cb', arp:'0cbacb', basse:'R-----', batt:batt('x-----', '---x--', 'xxxxxx') }
  },
  travis: {
    nom:'Picking alterné (Travis)', niveau:4, pour:[...C, ...G], type:'arp',
    desc:'Le pouce alterne deux basses sur chaque temps, les doigts pincent les aigus entre les deux. La base du fingerpicking folk.',
    '4/4':{ grat:'0b1a0b1a', arp:'0b1a0b1a', basse:'R---5---', batt:batt('x---x---', '--x---x-', 'x-x-x-x-') }
  }
};
export const STYLES_ORDRE = Object.keys(STYLES);

/* rythmique utilisable pour une mesure, ou la plus proche */
export function patronsPour(styleId, mesure){
  const s = STYLES[styleId] || STYLES.folk;
  if (s[mesure]) return s[mesure];
  const simple = { '4/4':STYLES.croches['4/4'], '3/4':STYLES.valse['3/4'], '2/4':STYLES.noires['2/4'],
    '6/8':STYLES.six8['6/8'], '9/8':STYLES.arpTriolets['9/8'], '12/8':STYLES.douze8['12/8'] };
  return simple[mesure] || STYLES.croches['4/4'];
}
export const stylesPour = (mesure, instId) => STYLES_ORDRE.filter(id => STYLES[id][mesure] && (!instId || STYLES[id].pour.includes(instId)));

/* ================= tablature ================= */
/* « 6.0+4.2b » → [{ corde:6, case:0, mod:'' }, { corde:4, case:2, mod:'b' }] ; « - » → [] */
export function lireSymbole(s){
  if (!s || s === '-' || s === '.') return [];
  return s.split('+').map(n => {
    const m = /^(\d)\.(\d{1,2})([bhpx~]?)$/.exec(n);
    if (!m) throw new Error('Symbole de tablature illisible : ' + n);
    return { corde:+m[1], case:+m[2], mod:m[3] };
  });
}
export const lireTab = texte => texte.split('|').map(m => m.trim()).filter(Boolean).map(m => m.split(/\s+/).map(lireSymbole));

/* ================= grille : « C | G Am | F … » → mesures ================= */
/* Découpe un texte « C | G Am | F » : une mesure par barre ; deux accords dans une mesure
 * se partagent la mesure. */
export function lireGrille(texte){
  return texte.split('|').map(m => m.trim()).filter(m => m.length).map(m => m.split(/\s+/));
}

/* Compile des sections [{ nom, mesures:'C | G', tab:'…|…', rep }] en mesures à plat.
 * Une section peut n'avoir qu'une tablature : les mesures sont alors « N.C. » (pas d'accord).
 * Renvoie { mesures:[{ accords:[{nom, pas}], tab:[[notes par pas]] | null, section, numero }],
 *           sections:[{nom, debut, fin, rep}] } */
export function compilerSections(sections, mesureId){
  const pas = pasParMesure(mesureId);
  const out = [], plages = [];
  sections.forEach((sec, si) => {
    const tab = sec.tab ? lireTab(sec.tab) : null;
    const grille = sec.mesures ? lireGrille(sec.mesures) : tab.map(() => ['N.C.']);
    if (tab && tab.length !== grille.length) throw new Error(`Section « ${sec.nom} » : ${tab.length} mesures de tablature pour ${grille.length} mesures d'accords`);
    const debut = out.length;
    const tours = sec.rep || 1;
    for (let r = 0; r < tours; r++){
      grille.forEach((accords, i) => {
        const n = accords.length;
        out.push({
          accords:accords.map((nom, k) => ({ nom, pas:Math.round(k * pas / n) })),
          tab:tab ? tab[i] : null,
          section:si, numero:i, tour:r
        });
      });
    }
    plages.push({ nom:sec.nom, debut, fin:out.length, rep:tours });
  });
  return { mesures:out, sections:plages, avecTab:out.some(m => m.tab) };
}

/* accord actif au pas p d'une mesure */
export function accordAuPas(mesure, p){
  let cur = mesure.accords[0];
  for (const a of mesure.accords) if (a.pas <= p) cur = a;
  return cur;
}
