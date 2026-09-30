/* Théorie musicale : notes, accords, transposition. Aucune dépendance au navigateur. */

const DIESES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BEMOLS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const PC_LETTRE = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
const SOLFEGE = { C:'Do', D:'Ré', E:'Mi', F:'Fa', G:'Sol', A:'La', B:'Si' };

export const mod12 = n => ((n % 12) + 12) % 12;
export const midiEnFreq = m => 440 * Math.pow(2, (m - 69) / 12);
export const freqEnMidi = f => 69 + 12 * Math.log2(f / 440);

/* Nom d'une note à partir de son numéro MIDI : « E2 », « C#4 »… */
export function nomNote(midi, bemol = false){
  return (bemol ? BEMOLS : DIESES)[mod12(midi)] + (Math.floor(midi / 12) - 1);
}
/* Nom sans octave, en lettres ou en solfège (« La », « Fa# ») */
export function nomClasse(pc, solfege = false, bemol = false){
  const n = (bemol ? BEMOLS : DIESES)[mod12(pc)];
  return solfege ? SOLFEGE[n[0]] + n.slice(1) : n;
}
export const solfegeDe = lettre => SOLFEGE[lettre];

/* Suffixes d'accords reconnus → intervalles (en demi-tons depuis la fondamentale).
 * req = notes indispensables (la quinte est facultative pour les accords à 4 sons). */
export const TYPES = {
  ''      : { iv:[0, 4, 7],        req:[0, 4],        tierce:4 },
  'm'     : { iv:[0, 3, 7],        req:[0, 3],        tierce:3 },
  '5'     : { iv:[0, 7],           req:[0, 7],        tierce:null },
  '7'     : { iv:[0, 4, 7, 10],    req:[0, 4, 10],    tierce:4 },
  'm7'    : { iv:[0, 3, 7, 10],    req:[0, 3, 10],    tierce:3 },
  'maj7'  : { iv:[0, 4, 7, 11],    req:[0, 4, 11],    tierce:4 },
  '6'     : { iv:[0, 4, 7, 9],     req:[0, 4, 9],     tierce:4 },
  'm6'    : { iv:[0, 3, 7, 9],     req:[0, 3, 9],     tierce:3 },
  '9'     : { iv:[0, 4, 7, 10, 2], req:[0, 4, 10, 2], tierce:4 },
  'add9'  : { iv:[0, 4, 7, 2],     req:[0, 4, 2],     tierce:4 },
  'sus2'  : { iv:[0, 2, 7],        req:[0, 2],        tierce:null },
  'sus4'  : { iv:[0, 5, 7],        req:[0, 5],        tierce:null },
  '7sus4' : { iv:[0, 5, 7, 10],    req:[0, 5, 10],    tierce:null },
  'dim'   : { iv:[0, 3, 6],        req:[0, 3, 6],     tierce:3 },
  'm7b5'  : { iv:[0, 3, 6, 10],    req:[0, 3, 6, 10], tierce:3 },
  'aug'   : { iv:[0, 4, 8],        req:[0, 4, 8],     tierce:4 }
};
/* écritures équivalentes acceptées à la saisie */
const ALIAS = { 'M7':'maj7', 'Δ':'maj7', 'min':'m', '-':'m', 'maj':'', 'M':'', '2':'sus2', '4':'sus4', 'dim7':'dim', '°':'dim', '+':'aug' };

/* « F#m7/C# » → { racine, suffixe, basse, nom, intervalles… } ; null si inconnu */
export function analyserAccord(nom){
  const m = /^([A-G])([#b]?)([^/]*)(?:\/([A-G])([#b]?))?$/.exec((nom || '').trim());
  if (!m) return null;
  let racine = PC_LETTRE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  let suffixe = m[3];
  if (!(suffixe in TYPES)){
    if (suffixe in ALIAS) suffixe = ALIAS[suffixe]; else return null;
  }
  const t = TYPES[suffixe];
  const basse = m[4] ? mod12(PC_LETTRE[m[4]] + (m[5] === '#' ? 1 : m[5] === 'b' ? -1 : 0)) : null;
  return {
    racine:mod12(racine), suffixe, basse, type:t,
    intervalles:t.iv, pcs:t.iv.map(i => mod12(racine + i)),
    requis:t.req.map(i => mod12(racine + i)),
    mineur:t.tierce === 3
  };
}

/* Écrit un accord à partir de sa fondamentale (numéro 0-11) : « Bb », « F#m7 » */
export function ecrireAccord(pc, suffixe, basse = null, bemol = false){
  return nomClasse(pc, false, bemol) + suffixe + (basse != null ? '/' + nomClasse(basse, false, bemol) : '');
}

/* Préférence d'écriture pour une fondamentale : Bb plutôt que A#, F# plutôt que Gb… */
const BEMOL_MAJEUR = new Set([1, 3, 8, 10]);        // Db Eb Ab Bb
const BEMOL_MINEUR = new Set([3, 10, 5]);           // Ebm Bbm … (F : Fm reste Fm, pas de # possible)
export function bemolPrefere(pc, mineur){
  return mineur ? (pc === 3 || pc === 10) : BEMOL_MAJEUR.has(mod12(pc));
}

/* Transpose un accord de n demi-tons. Garde les bémols si l'accord d'origine en avait. */
export function transposer(nom, n){
  if (!n) return nom;
  const a = analyserAccord(nom);
  if (!a) return nom;
  const racine = mod12(a.racine + n);
  const bem = /^[A-G]b/.test(nom) || bemolPrefere(racine, a.mineur);
  const dieseDebut = /^[A-G]#/.test(nom) && !bemolPrefere(racine, a.mineur);
  const b = a.basse != null ? mod12(a.basse + n) : null;
  return ecrireAccord(racine, a.suffixe, b, dieseDebut ? false : bem);
}

/* Affichage : lettres (« Am7 ») ou solfège (« Lam7 ») */
export function afficherAccord(nom, solfege = false){
  if (!solfege) return nom;
  return nom.replace(/(^|\/)([A-G])/g, (_, sep, l) => sep + SOLFEGE[l]);
}
