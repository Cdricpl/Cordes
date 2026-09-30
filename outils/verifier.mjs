/* Vérifications sans navigateur : chaque accord des morceaux et des leçons a un doigté
 * sur chaque instrument, chaque grille se compile, chaque rythmique a la bonne longueur.
 * Usage : node outils/verifier.mjs */
import { MORCEAUX, accordsDe } from '../js/songs.js';
import { LECONS, sectionsPour } from '../js/lessons.js';
import { STYLES, MESURES, pasParMesure, compilerSections } from '../js/rythmes.js';
import { forme, positionsBasse, notesDe } from '../js/accords.js';
import { analyserAccord, transposer } from '../js/theorie.js';
import { INSTRUMENTS } from '../js/instruments.js';
import { detecterHauteur } from '../js/hauteur.js';

let erreurs = 0;
const ko = m => { erreurs++; console.log('✗', m); };

// rythmiques : un signe par pas
for (const [id, s] of Object.entries(STYLES))
  for (const [mes, p] of Object.entries(s)) if (MESURES[mes])
    for (const k of ['grat', 'arp', 'basse']) if (p[k].length !== pasParMesure(mes)) ko(`rythmique ${id} ${mes} ${k} : ${p[k].length} pas au lieu de ${pasParMesure(mes)}`);

// accords : reconnus, et jouables sur chaque instrument (dans toutes les transpositions)
const tous = new Set();
MORCEAUX.forEach(m => accordsDe(m).forEach(a => tous.add(a)));
for (const l of LECONS) for (const f of ['guitare', 'ukulele']) (sectionsPour(l, f) || []).forEach(s => s.mesures.split(/[|\s]+/).filter(Boolean).forEach(a => tous.add(a)));
for (const a of tous){
  if (!analyserAccord(a)){ ko('accord inconnu : ' + a); continue; }
  for (let t = 0; t < 12; t++){
    const n = transposer(a, t);
    for (const id of ['guitare_elec', 'guitare_classique', 'ukulele']){
      const f = forme(id, n);
      if (!f){ ko(`pas de doigté : ${n} (${id})`); continue; }
      // les notes jouées appartiennent bien à l'accord
      const pcs = analyserAccord(n).pcs;
      if (!/5$/.test(n)) for (const m of notesDe(id, f)) if (!pcs.includes(m % 12)) ko(`${n} (${id}) : note étrangère ${m}`);
    }
    if (!positionsBasse('basse', n).length) ko('basse : ' + n);
  }
}

// grilles : se compilent, un nombre de mesures sensé
for (const m of MORCEAUX){
  const c = compilerSections(m.sections, m.mesure);
  if (!c.mesures.length) ko('grille vide : ' + m.id);
  if (!MESURES[m.mesure]) ko('mesure inconnue : ' + m.id);
}
const ids = new Set();
for (const x of [...MORCEAUX, ...LECONS]){ if (ids.has(x.id)) ko('identifiant en double : ' + x.id); ids.add(x.id); }

// accordeur : retrouve la note d'une corde synthétique (avec harmoniques)
const sr = 44100;
for (const [nom, f0] of [['Mi grave', 82.41], ['Mi basse', 41.2], ['La ukulélé', 440], ['Sol', 196]]){
  const sig = new Float32Array(4096);
  for (let i = 0; i < sig.length; i++) sig[i] = 0.5 * Math.sin(2 * Math.PI * f0 * i / sr) + 0.3 * Math.sin(4 * Math.PI * f0 * i / sr) + 0.2 * Math.sin(6 * Math.PI * f0 * i / sr);
  const r = detecterHauteur(sig, sr, 30, 1000);
  if (!r || Math.abs(1200 * Math.log2(r.freq / f0)) > 3) ko(`accordeur ${nom} : ${r && r.freq.toFixed(2)} au lieu de ${f0}`);
}

console.log(erreurs ? `${erreurs} erreur(s)` : `Tout est bon : ${tous.size} accords × 12 tonalités × 4 instruments, ${MORCEAUX.length} morceaux, ${LECONS.length} leçons.`);
process.exit(erreurs ? 1 : 0);
