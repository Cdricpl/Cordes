/* Prépare js/sons.js : de vraies notes enregistrées, intégrées à l'appli (elle marche hors ligne).
 *
 *  - Cordes : banque « FluidR3 GM » (Frank Wen), rendue en MP3 par Benjamin Gleitzman
 *    (github.com/gleitz/midi-js-soundfonts) — licence Creative Commons Attribution 3.0.
 *    Une note tous les 3 demi-tons : les autres s'obtiennent en décalant la hauteur d'un
 *    demi-ton au plus, ce qui ne s'entend pas.
 *  - Batterie : Virtuosity Drums (Versilian Studios) — licence CC0, déjà préparée pour
 *    Ma Batterie (grosse caisse, caisse claire, charleston fermé et ouvert).
 *
 * Usage : node outils/preparer_sons.mjs <chemin de js/sons.js de Ma Batterie>
 * (les banques de cordes sont téléchargées depuis raw.githubusercontent.com avec curl) */
import { execFileSync } from 'child_process';
import fs from 'fs';

const SOURCE = 'https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/master/FluidR3_GM/';
// banque → instrument General MIDI, notes gardées (numéros MIDI) et gain de mise à niveau
const BANQUES = {
  nylon: { gm:'acoustic_guitar_nylon', de:40, a:85, gain:1.0 },    // guitare classique et ukulélé
  elec:  { gm:'electric_guitar_clean', de:40, a:82, gain:0.9 },    // électrique, son clair
  sat:   { gm:'overdriven_guitar',     de:40, a:82, gain:0.55 },   // électrique, son saturé
  basse: { gm:'electric_bass_finger',  de:28, a:61, gain:1.25 }    // basse aux doigts
};
const PC = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
const midiDe = nom => { const m = /^([A-G])(b?)(-?\d)$/.exec(nom); return (+m[3] + 1) * 12 + PC[m[1]] - (m[2] ? 1 : 0); };

const sons = {};
for (const [id, b] of Object.entries(BANQUES)){
  const js = execFileSync('curl', ['-sS', '--max-time', '120', SOURCE + b.gm + '-mp3.js'], { maxBuffer:64 << 20 }).toString();
  const notes = {};
  for (const m of js.matchAll(/"([A-G]b?-?\d)":\s*"data:audio\/mp3;base64,([^"]+)"/g)) notes[midiDe(m[1])] = m[2];
  const garde = {};
  for (let n = b.de; n <= b.a; n += 3){
    if (!notes[n]) throw new Error(`${id} : note ${n} absente`);
    garde[n] = notes[n];
  }
  sons[id] = { gain:b.gain, notes:garde };
  console.log(id, Object.keys(garde).length, 'notes,', (Object.values(garde).reduce((a, s) => a + s.length, 0) / 1024 | 0), 'Ko');
}

// batterie : on reprend les prises déjà préparées pour Ma Batterie (lecture seule)
const chemin = process.argv[2];
if (!chemin) throw new Error('Indique le chemin de js/sons.js de Ma Batterie');
const src = fs.readFileSync(chemin, 'utf8');
const SONS_BATTERIE = JSON.parse(src.slice(src.indexOf('{', src.indexOf('export const SONS')), src.lastIndexOf('}') + 1));
const batterie = {};
for (const [el, couches] of Object.entries({ GC:['moyen', 'fort'], CC:['ghost', 'moyen', 'fort'], CH:['ghost', 'moyen', 'fort'], CHO:['moyen'] })){
  const def = SONS_BATTERIE[el];
  batterie[el] = { gain:def.gain, sons:def.sons.filter(s => couches.includes(s.couche)) };
}
console.log('batterie', Object.values(batterie).reduce((a, d) => a + d.sons.reduce((x, s) => x + s.mp3.length, 0), 0) / 1024 | 0, 'Ko');

fs.writeFileSync('js/sons.js', `/* Sons enregistrés — générés par outils/preparer_sons.mjs, ne pas modifier à la main.
 * Cordes : FluidR3 GM (Frank Wen), MP3 de github.com/gleitz/midi-js-soundfonts — CC BY 3.0.
 * Batterie : Virtuosity Drums, Versilian Studios — CC0 1.0 (domaine public). */
export const SONS_CORDES = ${JSON.stringify(sons)};
export const SONS_BATTERIE = ${JSON.stringify(batterie)};
`);
console.log('js/sons.js écrit —', (fs.statSync('js/sons.js').size / 1024 | 0), 'Ko');
