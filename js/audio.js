/* Moteur audio.
 * Les notes sont de vrais enregistrements (banque FluidR3, CC BY 3.0) intégrés à l'appli :
 * guitare nylon (classique, et ukulélé en plus court et plus clair), guitare électrique
 * claire ou saturée, basse aux doigts. La batterie d'accompagnement vient de Ma Batterie
 * (Virtuosity Drums, CC0). Tant que les enregistrements ne sont pas décodés (une fraction
 * de seconde au premier toucher), une corde de synthèse (Karplus-Strong) prend le relais.
 * rendreCorde() ne touche pas au navigateur : elle se teste sous Node. */
import { midiEnFreq } from './theorie.js';
import { SONS_CORDES, SONS_BATTERIE } from './sons.js';

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
const circuits = {};                 // un circuit par timbre (égaliseur, sortie, salle)
const tampons = new Map();           // notes de synthèse (secours)
let saturee = true;                  // guitare électrique : son saturé ou clair
const couches = { accords:1, basse:1, melodie:1, batterie:1, libre:1 };
const sorties = {};                  // un gain par couche, pour régler et couper en douceur

export function ctxAudio(){ return ctx; }

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
  comp.threshold.value = -18; comp.knee.value = 10; comp.ratio.value = 3; comp.attack.value = 0.005; comp.release.value = 0.15;
  const remontee = ctx.createGain(); remontee.gain.value = 1.5;
  const limiteur = ctx.createDynamicsCompressor();
  limiteur.threshold.value = -1.5; limiteur.knee.value = 0; limiteur.ratio.value = 20; limiteur.attack.value = 0.001; limiteur.release.value = 0.08;
  master.connect(comp).connect(remontee).connect(limiteur).connect(ctx.destination);
  // une petite pièce, partagée
  const conv = ctx.createConvolver();
  conv.buffer = reponseReverb(1.1, 3);
  const retour = ctx.createGain(); retour.gain.value = 0.16;
  reverbEnvoi = ctx.createGain();
  reverbEnvoi.connect(conv).connect(retour).connect(master);
  for (const c of Object.keys(couches)){
    sorties[c] = ctx.createGain();
    sorties[c].gain.value = couches[c];
    sorties[c].connect(master);
  }
  chargerBanques();
  return ctx;
}

/* Basse audible sur un haut-parleur de téléphone : on ajoute en parallèle les harmoniques
 * du grave (l'oreille reconstitue la fondamentale qu'elle n'entend pas), comme la grosse
 * caisse de Ma Batterie. */
function chaineGrave(entree, somme){
  const courbe = new Float32Array(2049);
  for (let i = 0; i < courbe.length; i++) courbe[i] = Math.tanh(6 * (i / 1024 - 1));
  const sat = ctx.createWaveShaper(); sat.curve = courbe;
  const dosage = ctx.createGain(); dosage.gain.value = 0.28;
  entree.connect(filtre('lowpass', 160, 0.7)).connect(sat).connect(filtre('highpass', 240, 0.7))
    .connect(filtre('lowpass', 1400, 0.7)).connect(dosage).connect(somme);
}

/* circuit d'un timbre dans une couche : entrée → égaliseur → sortie de la couche (+ un peu de salle) */
function circuit(timbre, couche){
  const cle = timbre + '|' + couche;
  if (circuits[cle]) return circuits[cle];
  const entree = ctx.createGain();
  let fin = entree;
  const enchainer = n => { fin.connect(n); fin = n; return n; };
  let salle = 0.22, niveau = 1;
  switch (timbre){
    case 'nylon': enchainer(filtre('highpass', 70)); enchainer(filtre('peaking', 180, 1, 2)); break;
    case 'uke':   enchainer(filtre('highpass', 190)); enchainer(filtre('peaking', 2600, 0.8, 3)); niveau = 1.05; break;
    case 'elec':  enchainer(filtre('highpass', 80)); salle = 0.26; break;
    case 'sat':   enchainer(filtre('highpass', 90)); enchainer(filtre('lowpass', 7000)); salle = 0.14; niveau = 0.9; break;
    case 'basse': {
      enchainer(filtre('highpass', 30));
      const somme = ctx.createGain();
      fin.connect(somme);
      chaineGrave(fin, somme);
      fin = somme;
      salle = 0.03; niveau = 1.1;
      break;
    }
    default: salle = 0.1;
  }
  const sortie = ctx.createGain(); sortie.gain.value = niveau;
  fin.connect(sortie);
  sortie.connect(sorties[couche] || master);
  const send = ctx.createGain(); send.gain.value = salle;
  sortie.connect(send); send.connect(sorties[couche] ? envoiSalle(couche) : reverbEnvoi);
  circuits[cle] = { entree, sortie };
  return circuits[cle];
}
/* la salle suit le volume de la couche : couper la couche coupe aussi sa réverbération */
const envois = {};
function envoiSalle(couche){
  if (!envois[couche]){ envois[couche] = ctx.createGain(); envois[couche].connect(reverbEnvoi); }
  return envois[couche];
}

export function setSaturation(oui){ saturee = oui; }
export function setCouche(nom, v){
  couches[nom] = v;
  if (sorties[nom]) sorties[nom].gain.setTargetAtTime(v, ctx.currentTime, 0.02);
  if (envois[nom]) envois[nom].gain.setTargetAtTime(v, ctx.currentTime, 0.02);
}
export function setMasterVolume(v){ if (master) master.gain.value = v; }

export async function reprendreAudio(){
  // Safari iOS 16.4+ : sans ça, le son est coupé quand l'iPhone est en mode silencieux
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* ancien navigateur */ }
  initAudio();
  if (ctx.state === 'suspended') await ctx.resume();
  return ctx;
}

/* ================= enregistrements ================= */
const banques = {};         // nylon, elec, sat, basse → [{ midi, buf, debut }] triés
const batterie = {};        // GC, CC, CH, CHO → { gain, couches:{ nom:[{ buf, debut }] } }
let banquesPretes = false;
export const sonsPrets = () => banquesPretes;

function decoderMp3(b64){
  const bin = atob(b64);
  const octets = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) octets[i] = bin.charCodeAt(i);
  return new Promise((ok, ko) => {
    const p = ctx.decodeAudioData(octets.buffer, ok, ko);
    if (p && p.catch) p.catch(ko);
  });
}
/* Niveau de chaque note : dans la banque d'origine, les notes aiguës sont jusqu'à 4 fois plus
 * faibles que les graves. On mesure chaque enregistrement (première demi-seconde après
 * l'attaque) et on le ramène vers un niveau commun, en gardant un peu de sa couleur. */
const NIVEAU_CIBLE = 0.06;
function egaliser(buf, debut){
  const d = buf.getChannelData(0), i0 = Math.floor(debut * buf.sampleRate), n = Math.min(d.length - i0, Math.floor(buf.sampleRate * 0.5));
  let e = 0;
  for (let i = 0; i < n; i++) e += d[i0 + i] * d[i0 + i];
  const rms = Math.sqrt(e / Math.max(1, n)) || NIVEAU_CIBLE;
  return Math.min(4, Math.max(0.4, Math.pow(NIVEAU_CIBLE / rms, 0.85)));
}
/* équilibre entre instruments, une fois les notes égalisées (le son saturé paraît plus fort) */
const BALANCE = { nylon:1.5, elec:0.95, sat:0.72, basse:0.95 };
/* début réel de l'attaque : le décodeur MP3 ajoute un peu de silence au début */
function debutAttaque(buf){
  const d = buf.getChannelData(0);
  let pic = 0;
  for (let i = 0; i < d.length; i++){ const a = Math.abs(d[i]); if (a > pic) pic = a; }
  const seuil = pic * 0.04;
  for (let i = 0; i < d.length; i++) if (Math.abs(d[i]) > seuil) return Math.max(0, i / buf.sampleRate - 0.002);
  return 0;
}
async function chargerBanques(){
  try {
    const taches = [];
    for (const [id, def] of Object.entries(SONS_CORDES)){
      banques[id] = [];
      for (const [midi, b64] of Object.entries(def.notes))
        taches.push(decoderMp3(b64).then(buf => {
          const debut = debutAttaque(buf);
          banques[id].push({ midi:+midi, buf, debut, gain:(BALANCE[id] ?? 1) * egaliser(buf, debut) });
        }));
    }
    for (const [el, def] of Object.entries(SONS_BATTERIE)){
      batterie[el] = { gain:def.gain, couches:{} };
      for (const s of def.sons)
        taches.push(decoderMp3(s.mp3).then(buf => (batterie[el].couches[s.couche] ||= []).push({ buf, debut:debutAttaque(buf) })));
    }
    await Promise.all(taches);
    for (const l of Object.values(banques)) l.sort((a, b) => a.midi - b.midi);
    banquesPretes = true;
  } catch {
    banquesPretes = false;          // décodage impossible : la synthèse reste utilisée
  }
}
/* enregistrement le plus proche de la note voulue */
function prise(banque, midi){
  const l = banques[banque];
  if (!l || !l.length) return null;
  let best = l[0];
  for (const e of l) if (Math.abs(e.midi - midi) < Math.abs(best.midi - midi)) best = e;
  return best;
}

/* ================= notes ================= */
function tamponSynthese(timbre, midi){
  const t = TIMBRES[timbre] ? timbre : timbre === 'sat' ? 'elec' : 'nylon';
  const cle = t + midi;
  let b = tampons.get(cle);
  if (b) return b;
  const donnees = rendreCorde(midiEnFreq(midi), ctx.sampleRate, TIMBRES[t], midi * 31 + 7);
  b = ctx.createBuffer(1, donnees.length, ctx.sampleRate);
  b.copyToChannel(donnees, 0);
  tampons.set(cle, b);
  return b;
}

/* voix en cours, par couche : on étouffe l'accord précédent quand un nouveau arrive */
const voix = { accords:[], basse:[], melodie:[], libre:[] };
export function etouffer(couche, t, fondu = 0.03){
  for (const v of voix[couche] || []){
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
  for (const c of Object.keys(voix)) etouffer(c, maintenant, 0.06);
}

/* Joue une note. instTimbre : 'nylon', 'uke', 'elec', 'basse'.
 * opt : { couche, velo, etouffe (coup étouffé), pm (palm mute), bend (demi-tons), duree (s), pan } */
export function note(instTimbre, midi, t, opt = {}){
  if (!ctx) return;
  const timbre = instTimbre === 'elec' && saturee ? 'sat' : instTimbre === 'clair' ? 'elec' : instTimbre;
  const banque = timbre === 'uke' ? 'nylon' : timbre;
  const couche = opt.couche || 'libre';
  const circ = circuit(timbre, couche);
  const p = banquesPretes ? prise(banque, midi) : null;
  const src = ctx.createBufferSource();
  let rate = 1, debut = 0, niveau = 0.5;
  if (p){
    src.buffer = p.buf; debut = p.debut; niveau = 0.5 * p.gain;
    rate = Math.pow(2, (midi - p.midi) / 12);
  } else {
    src.buffer = tamponSynthese(timbre, midi);
  }
  rate *= 1 + (Math.random() - 0.5) * 0.002;          // deux notes ne sont jamais identiques
  src.playbackRate.setValueAtTime(rate, t);
  if (opt.bend){
    src.playbackRate.setValueAtTime(rate, t + 0.06);
    src.playbackRate.linearRampToValueAtTime(rate * Math.pow(2, opt.bend / 12), t + 0.22);
  }
  const g = ctx.createGain();
  let arret = 0;                                      // instant où la note s'arrête (0 : quand elle s'éteint)
  const velo = (opt.velo ?? 0.8) * (1 + (Math.random() - 0.5) * 0.1);
  g.gain.setValueAtTime(velo * niveau, t);
  src.connect(g);
  let sortie = g;
  // coup étouffé (chuck) et palm mute : la corde est freinée, les aigus disparaissent
  if (opt.etouffe || opt.pm){
    const lp = filtre('lowpass', opt.etouffe ? 1800 : 1100, 0.7);
    g.connect(lp); sortie = lp;
    g.gain.setTargetAtTime(0, t + (opt.etouffe ? 0.012 : 0.05), opt.etouffe ? 0.018 : 0.07);
    arret = t + (opt.etouffe ? 0.2 : 0.6);
  } else if (timbre === 'uke'){
    // le ukulélé sonne court : la note s'éteint plus vite que celle d'une guitare
    g.gain.setTargetAtTime(0, t + 0.15, 0.55);
    arret = t + 3;
  }
  if (opt.duree){
    g.gain.setValueAtTime(velo * niveau, t + opt.duree);
    g.gain.linearRampToValueAtTime(0, t + opt.duree + 0.06);
    arret = t + opt.duree + 0.1;
  }
  if (opt.pan != null && ctx.createStereoPanner){ const pn = ctx.createStereoPanner(); pn.pan.value = opt.pan; sortie.connect(pn); sortie = pn; }
  sortie.connect(circ.entree);
  src.start(t, debut);
  if (arret) src.stop(arret);
  const v = { src, gain:g };
  (voix[couche] ||= []).push(v);
  src.onended = () => { const l = voix[couche]; const i = l.indexOf(v); if (i >= 0) l.splice(i, 1); };
  return v;
}

/* Coup de médiator ou de doigts sur plusieurs cordes : les cordes partent l'une après l'autre.
 * sens 'D' (vers le bas : grave → aigu), 'U' (vers le haut : aigu → grave, moins de cordes),
 * 'd' (petit coup sur les cordes graves). */
export function gratter(inst, notes, t, { sens = 'D', velo = 0.8, couche = 'accords', etouffe = false, pm = false, vitesse = 0.012, nbMax = 6 } = {}){
  if (!ctx || !notes.length) return;
  let liste = sens === 'U' ? [...notes].reverse() : [...notes];
  if (sens === 'U') liste = liste.slice(0, Math.min(liste.length, Math.max(3, Math.ceil(notes.length * 0.6))));
  if (sens === 'd') liste = liste.slice(0, Math.min(liste.length, 4));
  if (pm) liste = liste.slice(0, Math.min(liste.length, 3));
  liste = liste.slice(0, nbMax);
  const pas = inst.famille === 'ukulele' ? vitesse * 0.8 : vitesse;
  liste.forEach((m, i) => {
    const hum = (Math.random() - 0.5) * 0.003;
    const force = velo * (sens === 'U' ? 0.7 : 1) * (1 - 0.05 * i / liste.length);
    note(inst.timbre, m, t + i * pas + hum, { couche, velo:force, etouffe, pm });
  });
}

/* ================= batterie ================= */
const PAN_BATTERIE = { GC:0, CC:-0.05, CH:-0.3, CHO:-0.3 };
let charleyOuvert = null;
export function frapper(el, t, velo = 0.85){
  if (!ctx || !banquesPretes || !batterie[el]) return;
  const b = batterie[el];
  const nom = el === 'GC' ? (velo >= 0.8 ? 'fort' : 'moyen')
    : el === 'CHO' ? 'moyen'
    : velo < 0.45 ? 'ghost' : velo >= 0.97 ? 'fort' : 'moyen';
  const liste = b.couches[nom] || b.couches.moyen || Object.values(b.couches)[0];
  if (!liste || !liste.length) return;
  const e = liste[Math.floor(Math.random() * liste.length)];
  const src = ctx.createBufferSource();
  src.buffer = e.buf;
  src.playbackRate.value = 1 + (Math.random() - 0.5) * 0.01;
  const g = ctx.createGain();
  // la couche « fort » du charleston est enregistrée beaucoup plus fort : on la ramène
  const f = el === 'CH' && nom === 'fort' ? 0.3 : el === 'CH' || el === 'CC' ? Math.min(1.2, velo / 0.85) : 1;
  g.gain.value = b.gain * f * 1.3 * (1 + (Math.random() - 0.5) * 0.08);
  let fin = g;
  if (ctx.createStereoPanner){ const pn = ctx.createStereoPanner(); pn.pan.value = PAN_BATTERIE[el] ?? 0; g.connect(pn); fin = pn; }
  if (el === 'GC'){ const eq = filtre('peaking', 3000, 0.9, 8); fin.connect(eq); fin = eq; }
  src.connect(g);
  fin.connect(sorties.batterie || master);
  // un coup de charleston fermé étouffe le charleston ouvert
  if (el === 'CH' && charleyOuvert && charleyOuvert.t < t){
    try { charleyOuvert.g.gain.setTargetAtTime(0, t, 0.015); charleyOuvert.src.stop(t + 0.12); } catch { /* fini */ }
    charleyOuvert = null;
  }
  if (el === 'CHO') charleyOuvert = { src, g, t };
  src.start(t, e.debut);
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

/* Note de référence de l'accordeur : la corde elle-même (enregistrée), jouée deux fois */
export function jouerReference(midi, timbre = 'nylon'){
  if (!ctx) return;
  etouffer('libre', ctx.currentTime, 0.03);
  const t = ctx.currentTime + 0.02;
  note(timbre, midi, t, { velo:0.95 });
  note(timbre, midi, t + 1.6, { velo:0.8 });
}
export function arreterReference(){ if (ctx) etouffer('libre', ctx.currentTime, 0.05); }
