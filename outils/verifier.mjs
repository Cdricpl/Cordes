/* Vérifications sans navigateur. Usage : node outils/verifier.mjs
 *  - chaque rythmique a un signe par pas, pour chaque couche (grattage, arpège, basse, batterie) ;
 *  - chaque leçon se compile ; chaque mesure de tablature a le bon nombre de pas ; chaque note
 *    tombe sur une corde qui existe, à une case jouable ;
 *  - chaque accord a un doigté sur chaque instrument, dans les 12 tonalités ;
 *  - l'accordeur retrouve la note de cordes synthétiques. */
import { PARCOURS, TOUTES_LECONS } from '../js/lessons.js';
import { STYLES, MESURES, pasParMesure, compilerSections } from '../js/rythmes.js';
import { forme, positionsBasse, notesDe } from '../js/accords.js';
import { analyserAccord, transposer } from '../js/theorie.js';
import { INSTRUMENTS } from '../js/instruments.js';
import { detecterHauteur } from '../js/hauteur.js';

let erreurs = 0;
const ko = m => { erreurs++; console.log('✗', m); };

for (const [id, s] of Object.entries(STYLES)){
  for (const i of s.pour) if (!INSTRUMENTS[i]) ko(`rythmique ${id} : instrument inconnu ${i}`);
  for (const [mes, p] of Object.entries(s)) if (MESURES[mes]){
    const n = pasParMesure(mes);
    for (const k of ['grat', 'arp', 'basse']) if (p[k].length !== n) ko(`rythmique ${id} ${mes} ${k} : ${p[k].length} pas au lieu de ${n}`);
    for (const el of ['GC', 'CC', 'CH']) if (!p.batt || p.batt[el].length !== n) ko(`rythmique ${id} ${mes} batterie ${el}`);
  }
}

const tous = new Set();
const ids = new Set();
let nbTab = 0;
for (const [instId, parcours] of Object.entries(PARCOURS)){
  const inst = INSTRUMENTS[instId];
  for (const l of parcours.lecons){
    const q = `${instId}/${l.id}`;
    if (ids.has(l.id)) ko('identifiant en double : ' + l.id);
    ids.add(l.id);
    if (!parcours.niveaux[l.niveau - 1]) ko(q + ' : niveau inconnu');
    if (l.type === 'cordes') continue;
    if (!MESURES[l.mesure]) { ko(q + ' : mesure inconnue ' + l.mesure); continue; }
    if (!STYLES[l.style] || !STYLES[l.style][l.mesure]) ko(`${q} : rythmique ${l.style} absente en ${l.mesure}`);
    let c;
    try { c = compilerSections(l.sections, l.mesure); } catch (e) { ko(q + ' : ' + e.message); continue; }
    for (const [k, m] of c.mesures.entries()){
      m.accords.forEach(a => { if (a.nom !== 'N.C.') tous.add(a.nom); });
      if (!m.tab) continue;
      nbTab++;
      if (m.tab.length !== pasParMesure(l.mesure)) ko(`${q} mesure ${k + 1} : ${m.tab.length} pas au lieu de ${pasParMesure(l.mesure)}`);
      for (const pas of m.tab) for (const n of pas){
        if (n.corde < 1 || n.corde > inst.cordes.length) ko(`${q} mesure ${k + 1} : corde ${n.corde} inexistante`);
        if (n.case > inst.frettes + 5) ko(`${q} mesure ${k + 1} : case ${n.case} hors du manche`);
      }
    }
  }
}
for (const a of tous){
  if (!analyserAccord(a)){ ko('accord inconnu : ' + a); continue; }
  for (let t = 0; t < 12; t++){
    const n = transposer(a, t);
    for (const id of ['guitare_elec', 'guitare_classique', 'ukulele']){
      const f = forme(id, n, { puissance:/5$/.test(n) });
      if (!f){ ko(`pas de doigté : ${n} (${id})`); continue; }
      const pcs = analyserAccord(n).pcs;
      if (!/5$/.test(n)) for (const m of notesDe(id, f)) if (!pcs.includes(m % 12)) ko(`${n} (${id}) : note étrangère ${m}`);
    }
    if (!positionsBasse('basse', n).length) ko('basse : ' + n);
  }
}

const sr = 44100;
for (const [nom, f0] of [['Mi grave', 82.41], ['Mi basse', 41.2], ['La ukulélé', 440], ['Sol', 196]]){
  const sig = new Float32Array(4096);
  for (let i = 0; i < sig.length; i++) sig[i] = 0.5 * Math.sin(2 * Math.PI * f0 * i / sr) + 0.3 * Math.sin(4 * Math.PI * f0 * i / sr) + 0.2 * Math.sin(6 * Math.PI * f0 * i / sr);
  const r = detecterHauteur(sig, sr, 30, 1000);
  if (!r || Math.abs(1200 * Math.log2(r.freq / f0)) > 3) ko(`accordeur ${nom} : ${r && r.freq.toFixed(2)} au lieu de ${f0}`);
}

const parInst = Object.entries(PARCOURS).map(([i, p]) => `${INSTRUMENTS[i].court} ${p.lecons.length}`).join(', ');
console.log(erreurs ? `${erreurs} erreur(s)` : `Tout est bon : ${TOUTES_LECONS.length} leçons (${parInst}), ${nbTab} mesures de tablature, ${tous.size} accords × 12 tonalités.`);
process.exit(erreurs ? 1 : 0);
