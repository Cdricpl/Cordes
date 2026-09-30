/* Moteur audio : cordes pincées synthétisées (algorithme de Karplus-Strong), aucun fichier son.
 * Chaque note est calculée une fois (un petit tableau d'échantillons), puis rejouée à volonté.
 * Chaque instrument a son caractère :
 *  - classique : nylon doux, sourd, corps de caisse qui résonne autour de 200 Hz ;
 *  - électrique : cordes d'acier, son clair ou saturé (ampli + haut-parleur simulés) ;
 *  - basse : grave, rond, très peu d'aigus ;
 *  - ukulélé : nylon aigu, court et vif.
 * Ces calculs ne touchent pas au navigateur : rendreCorde() se teste sous Node. */
import { midiEnFreq } from './theorie.js';

/* paramètres par timbre : d = amortissement des aigus (0 = corde très brillante, 0,5 = sourde),
 * t60 = durée de la note, dur = dureté du pincement (0 = doigt doux, 1 = médiator),
 * pos = position du pincement sur la corde (0,5 = au milieu : son creux) */
export const TIMBRES = {
  nylon:   { d:0.30, t60:2.4, dur:0.35, pos:0.18, longueur:2.8 },
  acier:   { d:0.17, t60:3.4, dur:0.85, pos:0.14, longueur:3.4 },
  elec:    { d:0.19, t60:3.6, dur:0.90, pos:0.12, longueur:3.6 },
  basse:   { d:0.36, t60:2.8, dur:0.25, pos:0.25, longueur:3.0 },
  uke:     { d:0.25, t60:1.25, dur:0.55, pos:0.16, longueur:1.6 },
  etouffe: { d:0.49, t60:0.07, dur:0.9,  pos:0.2,  longueur:0.22 }     // corde étouffée : « chuck »
};

function prng(graine){
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Calcule une note : tableau de flottants de durée p.longueur. */
export function rendreCorde(freq, sr, p, graine = 1){
  const longueur = Math.floor(sr * p.longueur);
  const sortie = new Float32Array(longueur);
  const a = p.d;                                            // coefficient du filtre de boucle (1−a)+a·z⁻¹
  const periode = sr / freq;
  const N = Math.max(2, Math.floor(periode - a - 0.5));     // ligne à retard entière
  const frac = periode - a - N;                             // reste, rattrapé par un filtre passe-tout
  const C = (1 - frac) / (1 + frac);
  const rho = Math.pow(10, -3 / (freq * p.t60));            // perte par tour de boucle (−60 dB en t60 s)
  const ligne = new Float32Array(N);
  // excitation : bruit filtré (plus la dureté est grande, plus il est brillant), puis pincement
  const hasard = prng(graine);
  const k = 0.08 + 0.9 * p.dur;
  let y = 0;
  for (let i = 0; i < N; i++){ y += k * ((hasard() * 2 - 1) - y); ligne[i] = y; }
  const m = Math.max(1, Math.round(p.pos * N));             // effet de la position du pincement (peigne)
  for (let i = N - 1; i >= m; i--) ligne[i] -= ligne[i - m];
  let pic = 0, moyenne = 0;
  for (let i = 0; i < N; i++) moyenne += ligne[i];
  moyenne /= N;
  for (let i = 0; i < N; i++){ ligne[i] -= moyenne; pic = Math.max(pic, Math.abs(ligne[i])); }
  for (let i = 0; i < N; i++) ligne[i] /= pic || 1;
  let idx = 0, prec = 0, apx = 0, apy = 0;
  for (let n = 0; n < longueur; n++){
    const s = ligne[idx];
    sortie[n] = s;
    const lp = (1 - a) * s + a * prec; prec = s;
    const ap = C * lp + apx - C * apy; apx = lp; apy = ap;
    ligne[idx] = ap * rho;
    if (++idx === N) idx = 0;
  }
  // fondu de fin : pas de clic quand le tableau s'arrête
  const fin = Math.min(longueur, Math.floor(sr * 0.04));
  for (let i = 0; i < fin; i++) sortie[longueur - 1 - i] *= i / fin;
  return sortie;
}

/* ================= contexte et circuits ================= */
let ctx = null, master = null, reverbEnvoi = null;
const circuits = {};                 // un circuit par timbre (filtres, ampli)
const tampons = new Map();           // notes calculées
let saturee = true;                  // guitare électrique : son saturé ou clair
const couches = { accords:1, basse:1 };   // gains des deux couches d'accompagnement

export function ctxAudio(){ return ctx; }

function courbeSaturation(k){
  const c = new Float32Array(4096);
  for (let i = 0; i < c.length; i++){ const x = i / 2048 - 1; c[i] = Math.tanh(k * x) / Math.tanh(k); }
  return c;
}
function filtre(type, f, q = 0.707, gain = 0){
  const b = ctx.createBiquadFilter();
  b.type = type; b.frequency.value = f; b.Q.value = q; b.gain.value = gain;
  return b;
}
function reponseReverb(duree, decroissance){
  const len = Math.floor(ctx.sampleRate * duree);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++){
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decroissance);
  }
  return buf;
}

export function initAudio(){
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 1;
  // compresseur doux, remontée du niveau, puis limiteur : fort sans saturer sur un téléphone
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -20; comp.knee.value = 12; comp.ratio.value = 3; comp.attack.value = 0.006; comp.release.value = 0.2;
  const remontee = ctx.createGain(); remontee.gain.value = 1.5;
  const limiteur = ctx.createDynamicsCompressor();
  limiteur.threshold.value = -1.5; limiteur.knee.value = 0; limiteur.ratio.value = 20; limiteur.attack.value = 0.001; limiteur.release.value = 0.08;
  master.connect(comp).connect(remontee).connect(limiteur).connect(ctx.destination);

  // un peu de salle, partagée
  const conv = ctx.createConvolver();
  conv.buffer = reponseReverb(1.3, 2.6);
  const retour = ctx.createGain(); retour.gain.value = 0.22;
  reverbEnvoi = ctx.createGain(); reverbEnvoi.gain.value = 1;
  reverbEnvoi.connect(conv).connect(retour).connect(master);
  return ctx;
}

/* circuit d'un timbre : entrée → filtres → sortie vers master (et un peu de salle) */
function circuit(timbre){
  const cle = timbre === 'elec' ? 'elec' + (saturee ? '-sat' : '-clair') : timbre;
  if (circuits[cle]) return circuits[cle];
  const entree = ctx.createGain();
  let fin = entree;
  const enchainer = n => { fin.connect(n); fin = n; return n; };
  let salle = 0.25, niveau = 1;
  switch (timbre){
    case 'nylon':
      enchainer(filtre('highpass', 70)); enchainer(filtre('peaking', 210, 1.1, 4)); enchainer(filtre('lowpass', 4200)); niveau = 1.0; break;
    case 'acier':
      enchainer(filtre('highpass', 80)); enchainer(filtre('peaking', 140, 1, 3)); enchainer(filtre('peaking', 3000, 0.8, 2)); enchainer(filtre('lowpass', 7500)); niveau = 0.95; break;
    case 'elec':
      if (saturee){
        enchainer(filtre('highpass', 120));
        const pre = ctx.createGain(); pre.gain.value = 9; enchainer(pre);
        const ws = ctx.createWaveShaper(); ws.curve = courbeSaturation(7); ws.oversample = '4x'; enchainer(ws);
        enchainer(filtre('peaking', 900, 0.9, 4));      // médium de l'ampli
        enchainer(filtre('lowpass', 3600, 0.8));         // haut-parleur : coupe les aigus durs
        enchainer(filtre('lowshelf', 160, 0.7, 3));
        niveau = 0.34; salle = 0.12;
      } else {
        enchainer(filtre('highpass', 85)); enchainer(filtre('peaking', 2400, 0.9, 3)); enchainer(filtre('lowpass', 5200)); niveau = 0.95; salle = 0.3;
      }
      break;
    case 'basse':
      enchainer(filtre('highpass', 32)); enchainer(filtre('peaking', 90, 1, 3)); enchainer(filtre('lowpass', 1800, 0.8)); niveau = 1.15; salle = 0.04; break;
    case 'uke':
      enchainer(filtre('highpass', 160)); enchainer(filtre('peaking', 600, 1.2, 3)); enchainer(filtre('lowpass', 6000)); niveau = 1.0; break;
    default:
      enchainer(filtre('lowpass', 6000));
  }
  const sortie = ctx.createGain(); sortie.gain.value = niveau;
  fin.connect(sortie); sortie.connect(master);
  const send = ctx.createGain(); send.gain.value = salle;
  sortie.connect(send); send.connect(reverbEnvoi);
  circuits[cle] = { entree, sortie };
  return circuits[cle];
}

export function setSaturation(oui){ saturee = oui; }
export function setCouche(nom, v){ couches[nom] = v; }
export function setMasterVolume(v){ if (master) master.gain.value = v; }

export async function reprendreAudio(){
  // Safari iOS 16.4+ : sans ça, le son est coupé quand l'iPhone est en mode silencieux
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* ancien navigateur */ }
  initAudio();
  if (ctx.state === 'suspended') await ctx.resume();
  return ctx;
}

/* ================= notes ================= */
const VARIANTES = 2;
function tampon(timbre, midi, variante){
  const cle = timbre + midi + '/' + variante;
  let b = tampons.get(cle);
  if (b) return b;
  const modele = TIMBRES[timbre === 'elec' ? 'elec' : timbre];
  const donnees = rendreCorde(midiEnFreq(midi), ctx.sampleRate, modele, midi * 31 + variante * 977 + 7);
  b = ctx.createBuffer(1, donnees.length, ctx.sampleRate);
  b.copyToChannel(donnees, 0);
  tampons.set(cle, b);
  return b;
}

/* voix en cours, par couche : on étouffe l'accord précédent quand un nouveau arrive */
const voix = { accords:[], basse:[] };
export function etouffer(couche, t, fondu = 0.03){
  for (const v of voix[couche]){
    try {
      v.gain.gain.cancelScheduledValues(t);
      v.gain.gain.setValueAtTime(v.gain.gain.value, t);
      v.gain.gain.linearRampToValueAtTime(0, t + fondu);
      v.src.stop(t + fondu + 0.02);
    } catch { /* déjà terminée */ }
  }
  voix[couche] = [];
}
export function etoufferTout(t = 0){
  if (!ctx) return;
  const maintenant = Math.max(t, ctx.currentTime);
  etouffer('accords', maintenant, 0.06); etouffer('basse', maintenant, 0.06); etouffer('libre', maintenant, 0.06);
}

/* Joue une note. opt : { couche, velo, timbre (force un timbre), etouffe (chuck), duree (s), pan } */
export function note(instTimbre, midi, t, opt = {}){
  if (!ctx) return;
  const timbre = opt.etouffe ? 'etouffe' : instTimbre;
  const circ = circuit(instTimbre === 'etouffe' ? 'nylon' : instTimbre);
  const couche = opt.couche || 'libre';
  const src = ctx.createBufferSource();
  src.buffer = tampon(timbre, midi, Math.floor(Math.random() * VARIANTES));
  src.playbackRate.value = 1 + (Math.random() - 0.5) * 0.0015;
  const g = ctx.createGain();
  const velo = (opt.velo ?? 0.8) * (1 + (Math.random() - 0.5) * 0.12) * (couches[couche] ?? 1);
  g.gain.value = velo * 0.5;
  src.connect(g);
  let sortie = g;
  if (opt.pan != null && ctx.createStereoPanner){ const p = ctx.createStereoPanner(); p.pan.value = opt.pan; g.connect(p); sortie = p; }
  sortie.connect(circ.entree);
  src.start(t);
  if (opt.duree){   // note tenue seulement un instant (ex. basse courte)
    g.gain.setValueAtTime(velo * 0.5, t + opt.duree);
    g.gain.linearRampToValueAtTime(0, t + opt.duree + 0.05);
    src.stop(t + opt.duree + 0.08);
  }
  const v = { src, gain:g };
  (voix[couche] ||= []).push(v);
  src.onended = () => { const l = voix[couche]; const i = l.indexOf(v); if (i >= 0) l.splice(i, 1); };
  return v;
}

/* Coup de médiator / de doigts sur plusieurs cordes : les cordes partent l'une après l'autre.
 * sens 'D' (vers le bas : du grave à l'aigu), 'U' (vers le haut : de l'aigu au grave, peu de cordes). */
export function gratter(inst, notes, t, { sens = 'D', velo = 0.8, couche = 'accords', etouffe = false, vitesse = 0.011, nbMax = 6 } = {}){
  if (!ctx || !notes.length) return;
  let liste = sens === 'D' ? [...notes] : [...notes].reverse();
  if (sens === 'U') liste = liste.slice(0, Math.min(liste.length, Math.max(3, Math.ceil(notes.length * 0.6))));
  if (sens === 'd') liste = liste.slice(0, Math.min(liste.length, 4));
  liste = liste.slice(0, nbMax);
  const ordre = sens === 'D' || sens === 'd' ? 1 : -1;
  liste.forEach((m, i) => {
    const hum = (Math.random() - 0.5) * 0.002;
    const force = velo * (sens === 'U' ? 0.62 : 1) * (0.92 + 0.08 * (i / Math.max(1, liste.length - 1)) * ordre * 0 + 0.06 * (1 - i / liste.length));
    note(inst.timbre, m, t + i * vitesse + hum, { couche, velo:force, etouffe });
  });
}

/* ================= métronome et références ================= */
function enveloppe(t, pic, attaque, decroissance){
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(pic, t + attaque);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attaque + decroissance);
  return g;
}
/* niveau : 2 = premier temps, 1 = temps, 0 = subdivision */
export function clic(t, niveau = 1){
  if (!ctx) return;
  const o = ctx.createOscillator();
  o.type = 'square';
  o.frequency.value = niveau >= 2 ? 1600 : niveau === 1 ? 1050 : 760;
  const g = enveloppe(t, niveau >= 2 ? 0.2 : niveau === 1 ? 0.12 : 0.05, 0.001, 0.035);
  o.connect(g).connect(master);
  o.start(t); o.stop(t + 0.09);
}

/* Note de référence de l'accordeur : un son tenu (sinusoïde + un peu d'harmoniques) */
let tenue = null;
export function jouerReference(midi, duree = 2.2){
  if (!ctx) return;
  arreterReference();
  const f = midiEnFreq(midi), t = ctx.currentTime;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.35, t + 0.03);
  g.gain.setValueAtTime(0.35, t + duree - 0.25);
  g.gain.linearRampToValueAtTime(0.0001, t + duree);
  const oscs = [[1, 1], [2, 0.35], [3, 0.12]].map(([k, a]) => {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * k;
    const ga = ctx.createGain(); ga.gain.value = a;
    o.connect(ga).connect(g); o.start(t); o.stop(t + duree + 0.05);
    return o;
  });
  // le grave de la basse passe mal sur un téléphone : on ajoute son octave un peu plus fort
  g.connect(master);
  tenue = { g, oscs };
}
export function arreterReference(){
  if (!ctx || !tenue) return;
  try { tenue.g.gain.cancelScheduledValues(ctx.currentTime); tenue.g.gain.setTargetAtTime(0, ctx.currentTime, 0.02); tenue.oscs.forEach(o => o.stop(ctx.currentTime + 0.1)); } catch { /* fini */ }
  tenue = null;
}
