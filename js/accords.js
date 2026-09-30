/* Doigtés d'accords : quelques formes classiques écrites à la main (les plus courantes,
 * faciles à jouer), les barrés construits par gabarit, et pour tout le reste un petit
 * solveur qui cherche la forme la plus simple. Une forme = un tableau de cases par corde
 * (-1 = corde non jouée, 0 = corde à vide). */
import { analyserAccord, mod12 } from './theorie.js';
import { INSTRUMENTS } from './instruments.js';

const X = -1;
const parse = s => [...s].map(c => c === 'x' ? X : parseInt(c, 16));   // « x32010 » ; a = 10, b = 11…

/* --- guitare : cordes Mi La Ré Sol Si Mi --- */
const OUVERT_GUITARE = {
  'C':'x32010', 'C7':'x32310', 'Cmaj7':'x32000', 'Cadd9':'x32030', 'C6':'x32210',
  'D':'xx0232', 'Dm':'xx0231', 'D7':'xx0212', 'Dsus4':'xx0233', 'Dsus2':'xx0230', 'Dmaj7':'xx0222', 'Dm7':'xx0211', 'D6':'xx0202',
  'E':'022100', 'Em':'022000', 'E7':'020100', 'Em7':'022030', 'Esus4':'022200', 'Emaj7':'021100', 'E7sus4':'020200', 'E9':'020102', 'Eadd9':'022102', 'E6':'022120',
  'F':'133211', 'Fm':'133111', 'Fmaj7':'xx3210', 'F7':'131211', 'Fadd9':'xx3213',
  'G':'320003', 'G7':'320001', 'Gm':'355333', 'Gmaj7':'320002', 'Gsus4':'330013', 'G6':'320000', 'Gadd9':'300203',
  'A':'x02220', 'Am':'x02210', 'A7':'x02020', 'Am7':'x02010', 'Asus4':'x02230', 'Asus2':'x02200', 'Amaj7':'x02120', 'A7sus4':'x02030', 'Am6':'x02212', 'A6':'x02222', 'A9':'x02423',
  'B':'x24442', 'Bm':'x24432', 'B7':'x21202', 'Bm7':'x20202', 'Bsus4':'x24452',
  'Bb':'x13331', 'Bbm':'x13321', 'Bbmaj7':'x13231', 'Bb7':'x13131'
};
/* power chords : fondamentale sur la corde de Mi grave (ou de La), quinte, octave */
function puissance(racine){
  const r = mod12(racine - 4);
  return r <= 8 ? [r, r + 2, r + 2, X, X, X] : [X, mod12(racine - 9), mod12(racine - 9) + 2, mod12(racine - 9) + 2, X, X];
}
/* barrés : gabarits « forme de Mi » (fondamentale sur la corde 6) et « forme de La » (corde 5) */
const FORME_MI = {
  '':[0, 2, 2, 1, 0, 0], 'm':[0, 2, 2, 0, 0, 0], '7':[0, 2, 0, 1, 0, 0], 'm7':[0, 2, 0, 0, 0, 0],
  'maj7':[0, 2, 1, 1, 0, 0], 'sus4':[0, 2, 2, 2, 0, 0], '6':[0, 2, 2, 1, 2, 0], '9':[0, 2, 0, 1, 0, 2]
};
const FORME_LA = {
  '':[X, 0, 2, 2, 2, 0], 'm':[X, 0, 2, 2, 1, 0], '7':[X, 0, 2, 0, 2, 0], 'm7':[X, 0, 2, 0, 1, 0],
  'maj7':[X, 0, 2, 1, 2, 0], 'sus4':[X, 0, 2, 2, 3, 0], 'sus2':[X, 0, 2, 2, 0, 0], '6':[X, 0, 2, 2, 2, 2],
  'm6':[X, 0, 2, 2, 1, 2], '7sus4':[X, 0, 2, 0, 3, 0], 'add9':[X, 0, 2, 4, 2, 0], 'm7b5':[X, 0, 1, 0, 1, X]
};

/* --- ukulélé : cordes Sol Do Mi La --- */
const OUVERT_UKE = {
  'C':'0003', 'Cm':'0333', 'C7':'0001', 'Cmaj7':'0002', 'Csus4':'0013', 'C6':'0000', 'Cadd9':'0203',
  'D':'2220', 'Dm':'2210', 'D7':'2223', 'Dmaj7':'2224', 'Dsus4':'0230', 'Dm7':'2213', 'Dsus2':'2200',
  'E':'4442', 'Em':'0432', 'E7':'1202', 'Em7':'0202',
  'F':'2010', 'Fm':'1013', 'F7':'2313', 'Fmaj7':'2413',
  'G':'0232', 'Gm':'0231', 'G7':'0212', 'Gmaj7':'0222', 'Gsus4':'0233', 'Gm7':'0211', 'G6':'0202',
  'A':'2100', 'Am':'2000', 'A7':'0100', 'Am7':'0000', 'Asus4':'2200', 'Amaj7':'1100', 'A6':'2424',
  'B':'4322', 'Bm':'4222', 'B7':'2322', 'Bm7':'2222',
  'Bb':'3211', 'Bbm':'3111', 'Bb7':'1211'
};

/* --- solveur --- */
/* Cherche les cases qui donnent l'accord : toutes les notes indispensables, fondamentale la plus
 * grave, pas plus de quatre doigts (un barré compte pour un), écart de 3 cases au plus. */
function resoudre(inst, a){
  const cordes = inst.cordes, n = cordes.length;
  const uke = inst.famille === 'ukulele';
  const cibles = new Set(a.pcs);
  const requis = a.requis;
  const grave = a.basse != null ? a.basse : a.racine;
  let meilleur = null, meilleurCout = Infinity;
  const cases = new Array(n);

  const evaluer = base => {
    const sonnees = [];
    for (let i = 0; i < n; i++) if (cases[i] >= 0) sonnees.push(i);
    if (sonnees.length < Math.min(n, 3)) return;
    const pcs = new Set(), hauteurs = sonnees.map(i => cordes[i] + cases[i]);
    for (const h of hauteurs){ const p = mod12(h); if (!cibles.has(p)) return; pcs.add(p); }
    for (const p of requis) if (!pcs.has(p)) return;
    // la note la plus grave doit être la basse de l'accord (le ukulélé, re-entrant, n'a pas cette exigence)
    if (!uke && mod12(Math.min(...hauteurs)) !== grave) return;
    // pas de corde muette au milieu des cordes jouées
    let vu = false, trou = false;
    for (let i = 0; i < n; i++){
      if (cases[i] >= 0){ if (trou) return; vu = true; }
      else if (vu) trou = true;
    }
    // doigts : les cases > 0 ; un barré (même case mini sur 2 cordes ou plus, sans corde à vide entre) = un doigt
    const frettees = sonnees.filter(i => cases[i] > 0);
    if (!frettees.length){ garder(0, 0, sonnees.length, 0); return; }
    const mini = Math.min(...frettees.map(i => cases[i]));
    let doigts = 0;
    const surMini = frettees.filter(i => cases[i] === mini);
    const premiere = surMini[0], derniere = surMini[surMini.length - 1];
    let barre = false;
    if (surMini.length >= 2){
      barre = true;
      for (let i = premiere; i <= derniere; i++) if (cases[i] < mini) barre = false;   // corde à vide ou muette sous le barré
    }
    doigts = barre ? 1 : surMini.length;
    doigts += frettees.filter(i => cases[i] !== mini).length;
    if (doigts > 4) return;
    const maxi = Math.max(...frettees.map(i => cases[i]));
    if (maxi - mini > 3) return;
    garder(mini, doigts + (barre ? 1.2 : 0), sonnees.length, n - sonnees.length);
  };
  const garder = (mini, doigts, nb, muettes) => {
    const cout = doigts * 2 + mini * 0.45 + muettes * 1.4 - nb * 0.2;
    if (cout < meilleurCout){ meilleurCout = cout; meilleur = cases.slice(); }
  };
  const rec = (i, fen) => {
    if (i === n){ evaluer(fen); return; }
    if (!uke) { cases[i] = X; rec(i + 1, fen); }
    cases[i] = 0; rec(i + 1, fen);
    for (let f = Math.max(1, fen); f <= fen + 4 && f <= 12; f++){ cases[i] = f; rec(i + 1, fen); }
  };
  for (let fen = 1; fen <= 9; fen++) rec(0, fen);
  return meilleur;
}

const cache = new Map();

/* Cases de l'accord sur l'instrument : { cases:[…], base } ou null (basse : pas de doigtés d'accords) */
export function forme(instId, nom, { puissance:pw = false } = {}){
  const inst = INSTRUMENTS[instId];
  if (!inst || inst.famille === 'basse') return null;
  const a = analyserAccord(nom);
  if (!a) return null;
  const cle = instId + '|' + nom + '|' + (pw ? 'p' : '');
  if (cache.has(cle)) return cache.get(cle);
  let cases = null;
  const court = nom.replace(/\/.*$/, '');
  const simple = court.replace(/^([A-G])#/, (_, l) => ({ C:'Db', D:'Eb', F:'Gb', G:'Ab', A:'Bb' }[l] || l + '#'));
  if (inst.famille === 'guitare'){
    if (pw || a.suffixe === '5') cases = puissance(a.racine);
    else if (a.basse == null && OUVERT_GUITARE[court]) cases = parse(OUVERT_GUITARE[court]);
    else if (a.basse == null && OUVERT_GUITARE[simple]) cases = parse(OUVERT_GUITARE[simple]);
    else if (a.basse == null){
      // barré : forme de Mi ou de La, la plus proche du début du manche
      const cand = [];
      const fm = FORME_MI[a.suffixe], fl = FORME_LA[a.suffixe];
      if (fm){ const r = mod12(a.racine - 4); cand.push(fm.map(c => c === X ? X : c + (r || 12))); }
      if (fl){ const r = mod12(a.racine - 9); cand.push(fl.map(c => c === X ? X : c + (r || 12))); }
      const plat = cand.filter(c => Math.max(...c) <= 14);
      const pos = c => Math.min(...c.filter(x => x > 0));
      plat.sort((x, y) => pos(x) - pos(y));
      cases = plat[0] || null;
    }
  } else {
    if (pw || a.suffixe === '5') return forme(instId, court.replace(/5$/, ''));   // pas de power chord au ukulélé : accord majeur
    else if (a.basse == null && OUVERT_UKE[court]) cases = parse(OUVERT_UKE[court]);
    else if (a.basse == null && OUVERT_UKE[simple]) cases = parse(OUVERT_UKE[simple]);
  }
  if (!cases) cases = resoudre(inst, a);
  const res = cases ? { cases, base:baseDe(cases) } : null;
  cache.set(cle, res);
  return res;
}
/* première case affichée dans le diagramme (1 = sillet visible) */
function baseDe(cases){
  const f = cases.filter(c => c > 0);
  if (!f.length) return 1;
  const maxi = Math.max(...f), mini = Math.min(...f);
  return maxi <= 4 ? 1 : mini;
}

/* Notes (numéros MIDI) jouées par la forme, dans l'ordre des cordes ; capo = case du capodastre */
export function notesDe(instId, f, capo = 0){
  const inst = INSTRUMENTS[instId];
  const out = [];
  f.cases.forEach((c, i) => { if (c >= 0) out.push(inst.cordes[i] + capo + c); });
  return out;
}

/* Basse : positions de la fondamentale, de la quinte, de l'octave et de la tierce sur le manche.
 * On prend la fondamentale la plus proche du début du manche, sur la corde de Mi ou de La. */
export function positionsBasse(instId, nom){
  const inst = INSTRUMENTS[instId];
  const a = analyserAccord(nom);
  if (!a) return [];
  const cordes = inst.cordes;
  // fondamentale : première case (0-7) de la corde de Mi, sinon de La
  let s = 0, f = mod12(a.racine - cordes[0]);
  if (f > 7){ s = 1; f = mod12(a.racine - cordes[1]); }
  const out = [{ corde:s, case:f, role:'R' }];
  const place = (role, demi) => {
    // la même note sur une corde plus aiguë proche, ou plus loin sur la même corde
    const hauteur = cordes[s] + f + demi;
    for (let c = s; c < cordes.length; c++){
      const cs = hauteur - cordes[c];
      if (cs >= 0 && cs <= 7 && c >= s){ if (!(c === s && demi === 0)) { out.push({ corde:c, case:cs, role }); return; } }
    }
  };
  if (a.type.tierce) place('3', a.type.tierce);
  place('5', 7);
  place('8', 12);
  return out;
}
