/* Assemblage de l'interface : accueil, listes, lecteur d'accompagnement, accordeur.
 * Navigation par l'adresse (#/…), comme Ma Batterie. */
import { INSTRUMENTS, ORDRE_INSTRUMENTS } from './instruments.js';
import { initAudio, reprendreAudio, ctxAudio, gratter, note, setSaturation, setCouche, jouerReference, arreterReference, etoufferTout } from './audio.js';
import { STYLES, STYLES_ORDRE, MESURES, stylesPour, compilerSections, lireGrille } from './rythmes.js';
import { forme, notesDe } from './accords.js';
import { analyserAccord, afficherAccord, transposer, nomClasse, midiEnFreq } from './theorie.js';
import { detecterHauteur, noteProche, cordeProche } from './hauteur.js';
import { MORCEAUX, GENRES, genreDe, morceauxDuGenre, accordsDe } from './songs.js';
import { LECONS, NIVEAUX, sectionsPour } from './lessons.js';
import { schemaAccord, cordesAVide, illusInstrument, ILLUS } from './diagrammes.js';
import { Lecteur, notesBasse } from './player.js';
import * as P from './progress.js';
import { VERSION, DATE_VERSION } from './version.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));

/* ================= réglages mémorisés ================= */
const lire = (cle, defaut) => { try { return JSON.parse(localStorage.getItem(cle)) ?? defaut; } catch { return defaut; } };
const ecrire = (cle, v) => { try { localStorage.setItem(cle, JSON.stringify(v)); } catch { /* mode privé */ } };
const CLE_REGLAGES = 'mes-cordes-reglages';
const reglages = { instrument:'guitare_elec', sat:true, decompte:true, boucle:true, clic:false, solfege:false,
  volAccords:1, volBasse:1, ...lire(CLE_REGLAGES, {}) };
const sauverReglages = () => ecrire(CLE_REGLAGES, reglages);
const inst = () => INSTRUMENTS[reglages.instrument] || INSTRUMENTS.guitare_elec;
const famille = () => inst().famille;

$('#version').textContent = 'v' + VERSION;
$('#version-detail').textContent = `Version ${VERSION} du ${DATE_VERSION.split('-').reverse().join('/')}`;

/* ================= contenus ================= */
const NOMS_NIVEAUX = ['', 'Débutant', 'Débutant +', 'Intermédiaire', 'Confirmé'];
const NIV_GRAD = NIVEAUX.map(n => n.grad);
const gradStyle = g => `--c1:${g[0]};--c2:${g[1]}`;
const CONSEIL = t => `<div class="tip"><span class="tip-lbl">Conseil</span><p>${t}</p></div>`;

/* grille de démonstration d'une rythmique, selon sa mesure */
const GRILLE_DEMO = { '4/4':'C | G | Am | F', '3/4':'C | C | G | G', '2/4':'C | G | C | G', '6/8':'Am | F | C | G', '12/8':'A7 | D7 | A7 | E7' };
const RYTHMIQUES = STYLES_ORDRE.map(id => {
  const s = STYLES[id];
  const mesure = ['4/4', '3/4', '6/8', '12/8', '2/4'].find(m => s[m]);
  return { id, titre:s.nom, niveau:s.niveau, desc:s.desc, mesure, style:id, bpm:mesure === '6/8' || mesure === '12/8' ? 66 : 84,
    mode:id === 'arpege' ? 'arp' : 'grat', sections:[{ nom:'Grille', mesures:GRILLE_DEMO[mesure], rep:2 }] };
});

/* Atelier : grille personnelle, mémorisée */
const CLE_ATELIER = 'mes-cordes-atelier';
const atelier = { id:'perso', titre:'Mon accompagnement', niveau:1, bpm:84, mesure:'4/4', style:'folk',
  texte:'Couplet: C | G | Am | F\nRefrain: F | G | C | C', ...lire(CLE_ATELIER, {}) };
function sectionsAtelier(){
  return atelier.texte.split('\n').map(l => l.trim()).filter(Boolean).map((l, i) => {
    const m = /^([^:|]{1,24}):\s*(.*)$/.exec(l);
    return { nom:m ? m[1].trim() : 'Partie ' + (i + 1), mesures:m ? m[2] : l };
  });
}

const LISTES = {
  lecon:    { nom:'Leçon',     items:() => LECONS,                        retour:it => '#/parcours/' + it.niveau },
  morceau:  { nom:'Morceau',   items:it => morceauxDuGenre(it.genre),     retour:it => '#/morceaux/' + it.genre },
  rythme:   { nom:'Rythmique', items:() => RYTHMIQUES,                    retour:() => '#/rythmiques' },
  atelier:  { nom:'Atelier',   items:() => [atelier],                     retour:() => '#/' }
};
const SOURCES = { lecon:() => LECONS, morceau:() => MORCEAUX, rythme:() => RYTHMIQUES, atelier:() => [atelier] };
const lienJouer = (liste, it) => `#/jouer/${liste}/${encodeURIComponent(it.id)}`;
const prochaineLecon = () => LECONS.find(l => !P.estFaite(l.id)) || LECONS[LECONS.length - 1];

/* ================= lecteur ================= */
let courant = null;             // { liste, item, sections, compile }
let mesureActive = -1;
let accordAffiche = null;
let chrono = null;
const lecteur = new Lecteur({
  onCompte: n => afficherDecompte(n),
  onMesure: m => { masquerDecompte(); activerMesure(m); },
  onPas: c => { if (c.accord !== accordAffiche) majDiagrammes(c.mesure, c.p); allumerPas(c.p); },
  onPos: (pos, c) => majProgression(pos, c),
  onBoucle: () => { if (courant) P.noterTempo(courant.liste + ':' + courant.item.id, lecteur.bpm); },
  onTempo: bpm => { $('#bpm').value = bpm; $('#bpm-val').textContent = bpm; },
  onFin: () => { majBoutonPlay(false); stopChrono(); masquerDecompte(); activerMesure(-1); }
});
Object.assign(lecteur.options, { decompte:reglages.decompte, boucle:reglages.boucle, clic:reglages.clic });
setSaturation(reglages.sat);

/* ================= navigation ================= */
function montrer(id){ for (const e of $$('.ecran')) e.hidden = e.id !== id; }

function route(){
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  fermerVolets(false);
  $('#toast').hidden = true;
  if (parts[0] !== 'jouer') quitterLecteur();
  if (parts[0] !== 'accordeur') arreterMicro();
  switch (parts[0]){
    case 'parcours':    return parts[1] ? ecranNiveau(+parts[1]) : ecranParcours();
    case 'morceaux':    return parts[1] ? ecranGenre(parts[1]) : ecranMorceaux();
    case 'accords':     return ecranAccords();
    case 'rythmiques':  return ecranRythmiques();
    case 'progression': return ecranProgression();
    case 'accordeur':   return ecranAccordeur();
    case 'jouer':       if (ouvrir(parts[1], parts[2])) return; break;
  }
  ecranAccueil();
}
window.addEventListener('hashchange', route);

/* ================= choix de l'instrument ================= */
function majChoixInstrument(){
  for (const cible of ['#choix-inst', '#choix-inst-lecteur']){
    const large = cible.endsWith('lecteur');
    $(cible).innerHTML = ORDRE_INSTRUMENTS.map(id => {
      const i = INSTRUMENTS[id];
      return `<button type="button" class="inst-btn${id === reglages.instrument ? ' actif' : ''}" data-inst="${id}" aria-pressed="${id === reglages.instrument}" style="${gradStyle(i.couleur)}" title="${i.nom}">
        <span class="inst-ill">${illusInstrument(id)}</span><span>${large ? i.nom : i.court}</span></button>`;
    }).join('');
  }
  $('#ligne-sat').hidden = reglages.instrument !== 'guitare_elec';
  $('#ligne-pw').hidden = famille() !== 'guitare';
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-inst]');
  if (!b) return;
  changerInstrument(b.dataset.inst);
});
function changerInstrument(id){
  if (id === reglages.instrument) return;
  reglages.instrument = id;
  sauverReglages();
  majChoixInstrument();
  annoncer(INSTRUMENTS[id].nom);
  if (courant){
    const enCours = lecteur.enLecture;
    if (enCours) lecteur.arreter();
    chargerElement(courant.liste, courant.item, { garderTempo:true });
    if (enCours) basculerLecture();
  } else route();
}

/* ================= accueil ================= */
function ecranAccueil(){
  montrer('ecran-accueil');
  document.title = 'Mes Cordes';
  majChoixInstrument();
  const faites = LECONS.filter(l => P.estFaite(l.id)).length;
  const pc = Math.round(faites / LECONS.length * 100);
  $('#parcours-resume').textContent = faites
    ? `${faites} leçon${faites > 1 ? 's' : ''} sur ${LECONS.length} — ${pc} %`
    : `${LECONS.length} leçons, du premier accord au jeu en arpège, pour ${inst().nom.toLowerCase()}.`;
  $('#parcours-jauge').style.width = pc + '%';
  const suivante = prochaineLecon();
  $('#cta-continuer').href = lienJouer('lecon', suivante);
  $('#cta-texte').textContent = faites ? `Leçon ${LECONS.indexOf(suivante) + 1} : ${suivante.titre}` : 'Commencer';
  $('#compte-morceaux').textContent = `${MORCEAUX.length} accompagnements pour chanter.`;
  $('#compte-accords').textContent = famille() === 'basse' ? 'Fondamentales et quintes sur le manche.' : 'Schémas à toucher pour les entendre.';
  $('#compte-rythmes').textContent = `${RYTHMIQUES.length} façons de gratter.`;
  $('#illus-parcours').innerHTML = ILLUS.parcours;
  $('#illus-morceaux').innerHTML = ILLUS.morceaux;
  $('#illus-accords').innerHTML = ILLUS.accords;
  $('#illus-rythmes').innerHTML = ILLUS.rythmes;
  $('#illus-accordeur').innerHTML = ILLUS.accordeur;
  $('#illus-atelier').innerHTML = ILLUS.atelier;
  majStat();
}
function majStat(){
  const s = P.serie();
  $('#streak-text').textContent = `${P.minutesAujourdhui()} min` + (s > 1 ? ` · ${s} j` : '');
}

/* ================= listes ================= */
function ecranListe({ sur = '', titre, retour = '#/', html, sauts = [] }){
  montrer('ecran-liste');
  $('#liste-sur').textContent = sur;
  $('#liste-titre').textContent = titre;
  $('#liste-retour').href = retour;
  const corps = $('#liste-corps');
  corps.innerHTML = `<div class="bande">${html}</div>`;
  corps.scrollLeft = 0;
  const bar = $('#liste-sauts');
  bar.innerHTML = sauts.map(([id, texte, couleur]) =>
    `<button type="button" class="chip saut" data-cible="${id}" style="--c:${couleur}">${texte}</button>`).join('');
  bar.querySelectorAll('[data-cible]').forEach(b => b.addEventListener('click', () => {
    const cible = document.getElementById(b.dataset.cible);
    if (cible) corps.scrollTo({ left:cible.offsetLeft - corps.offsetLeft - 4, behavior:'smooth' });
  }));
  document.title = titre + ' — Mes Cordes';
}
$('#liste-corps').addEventListener('wheel', e => {
  const corps = e.currentTarget;
  if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || e.ctrlKey) return;
  corps.scrollLeft += e.deltaY;
  e.preventDefault();
}, { passive:false });

const points = n => `<span class="niveau-points" aria-label="Niveau ${n}">${[1, 2, 3, 4].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
function marqueStatut(st, aFaire = false){
  if (st === 'acquis') return '<span class="etat acquis" title="Acquis"><svg class="ico"><use href="#i-coche"/></svg></span>';
  if (st === 'travail') return '<span class="etat travail" title="À travailler"><svg class="ico"><use href="#i-drapeau"/></svg></span>';
  return aFaire ? '<span class="etat" aria-label="à faire"></span>' : '';
}
function tuile({ href, illus = '', titre, texte = '', coin = '', jauge = null, grad }){
  return `<a class="tuile" href="${href}" style="${gradStyle(grad)}">
    ${coin ? `<span class="t-coin">${coin}</span>` : ''}
    <div class="t-illus">${illus}</div><h2>${titre}</h2><p>${texte}</p>
    ${jauge != null ? `<div class="jauge fine"><i style="width:${jauge}%"></i></div>` : ''}</a>`;
}
function itemCarte({ liste, it, num = '', meta = '', bpm = '', aFaire = false, classe = '', badge = '', grad }){
  const st = P.statut(liste, it.id);
  const marque = marqueStatut(st, aFaire);
  const coin = marque.replace('class="etat', 'class="etat etat-vis');
  const visuel = `<div class="i-vis i-vis-num"><span class="i-num">${num}</span>${coin}</div>`;
  if (st === 'travail') classe += ' a-travailler';
  const bas = `<span class="i-bas">${it.niveau ? points(it.niveau) : ''}${bpm ? `<span class="bpm-pastille">${bpm}</span>` : ''}${marque.replace('class="etat', 'class="etat etat-bas')}</span>`;
  return `<a class="item-carte ${classe}" href="${lienJouer(liste, it)}" style="${gradStyle(grad)}">
    <div class="i-corps">${visuel}
      <div class="i-texte">${badge}<span class="i-nom">${esc(it.titre)}</span>${meta ? `<span class="i-meta">${meta}</span>` : ''}</div>
      ${bas}</div></a>`;
}

/* --- parcours --- */
function ecranParcours(){
  const html = NIVEAUX.map(nv => {
    const ls = LECONS.filter(l => l.niveau === nv.n);
    const f = ls.filter(l => P.estFaite(l.id)).length;
    return tuile({ href:'#/parcours/' + nv.n, illus:ILLUS.parcours, titre:nv.nom, coin:`Niveau ${nv.n}`,
      texte:`${ls.length} leçons — ${f} terminée${f > 1 ? 's' : ''}`, jauge:Math.round(f / ls.length * 100), grad:nv.grad });
  }).join('');
  ecranListe({ sur:inst().nom, titre:'Parcours', html:`<div class="rangee tuiles">${html}</div>` });
}
function ecranNiveau(n){
  const nv = NIVEAUX.find(x => x.n === n);
  if (!nv) return ecranParcours();
  const suivante = prochaineLecon();
  const cartes = LECONS.filter(l => l.niveau === n).map(l => itemCarte({
    liste:'lecon', it:l, num:LECONS.indexOf(l) + 1, meta:esc(l.objectif), aFaire:true, grad:nv.grad,
    classe:(P.estFaite(l.id) ? 'faite' : '') + (l === suivante ? ' prochaine' : '')
  })).join('');
  ecranListe({ sur:'Parcours · ' + inst().nom, titre:`${n}. ${nv.nom}`, retour:'#/parcours', html:`<div class="rangee">${cartes}</div>` });
}

/* --- morceaux --- */
function ecranMorceaux(){
  const html = GENRES.map(g => {
    const l = morceauxDuGenre(g.id);
    return tuile({ href:'#/morceaux/' + g.id, illus:ILLUS.morceaux, titre:g.nom, coin:`${l.length} titres`, texte:g.desc, grad:g.grad });
  }).join('');
  ecranListe({ sur:'Accompagnements pour chanter', titre:'Chanter', html:`<div class="rangee tuiles">${html}</div>` });
}
function ecranGenre(id){
  const g = GENRES.find(x => x.id === id);
  if (!g) return ecranMorceaux();
  const l = morceauxDuGenre(id);
  const html = [1, 2, 3].map(n => {
    const lot = l.filter(mo => mo.niveau === n);
    if (!lot.length) return '';
    return `<section class="groupe" id="niv-${n}">
      <div class="groupe-tete" style="${gradStyle(NIV_GRAD[n - 1])}"><span class="g-num">${n}</span><b>${NOMS_NIVEAUX[n]}</b><span>${lot.length} titre${lot.length > 1 ? 's' : ''}</span></div>
      <div class="rangee">${lot.map(mo => itemCarte({ liste:'morceau', it:mo, num:'♪', grad:g.grad, bpm:mo.bpm + ' BPM',
        meta:esc(mo.origine) + ' · ' + accordsDe(mo).slice(0, 5).map(a => afficherAccord(a, reglages.solfege)).join(' ') })).join('')}</div></section>`;
  }).join('');
  const sauts = [1, 2, 3].filter(n => l.some(mo => mo.niveau === n)).map(n => ['niv-' + n, 'N' + n, NIV_GRAD[n - 1][1]]);
  ecranListe({ sur:'Chanter', titre:g.nom, retour:'#/morceaux', html, sauts });
}

/* --- rythmiques --- */
function ecranRythmiques(){
  const cartes = RYTHMIQUES.map((r, i) => itemCarte({ liste:'rythme', it:r, num:r.mesure, meta:esc(r.desc),
    grad:NIV_GRAD[(r.niveau || 1) - 1], bpm:r.bpm + ' BPM' })).join('');
  ecranListe({ sur:'Main droite · ' + inst().nom, titre:'Rythmiques', html:`<div class="rangee">${cartes}</div>` });
}

/* --- accords (bibliothèque) --- */
const FAMILLES_ACCORDS = [
  { id:'essentiels', nom:'Les essentiels', grad:['#34d399', '#059669'], accords:['C', 'D', 'E', 'G', 'A', 'Am', 'Dm', 'Em', 'F', 'G7', 'D7', 'E7', 'A7'] },
  { id:'majeurs', nom:'Majeurs', grad:['#38bdf8', '#2563eb'], accords:['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] },
  { id:'mineurs', nom:'Mineurs', grad:['#a78bfa', '#6d28d9'], accords:['Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'Bbm', 'Bm'] },
  { id:'septiemes', nom:'Septièmes', grad:['#fbbf24', '#e8590c'], accords:['C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7', 'Am7', 'Dm7', 'Em7', 'Cmaj7', 'Fmaj7', 'Gmaj7'] },
  { id:'couleurs', nom:'Sus, add9, 6', grad:['#f472b6', '#be185d'], accords:['Dsus2', 'Dsus4', 'Asus2', 'Asus4', 'Esus4', 'Gsus4', 'Cadd9', 'Em7', 'C6', 'A6'] },
  { id:'power', nom:'Power chords', grad:['#94a3b8', '#1e293b'], accords:['E5', 'F5', 'G5', 'A5', 'B5', 'C5', 'D5'], familles:['guitare'] }
];
function ecranAccords(){
  const html = FAMILLES_ACCORDS.filter(f => !f.familles || f.familles.includes(famille())).map(f => `
    <section class="groupe" id="acc-${f.id}">
      <div class="groupe-tete genre" style="${gradStyle(f.grad)}"><b>${f.nom}</b><span>${f.accords.length} accords</span></div>
      <div class="rangee schemas-rangee">${f.accords.map(a => {
        const svg = schemaAccord(reglages.instrument, a, { solfege:reglages.solfege, puissance:/5$/.test(a) });
        return svg ? `<button type="button" class="carte-schema" data-accord="${a}" style="${gradStyle(f.grad)}">${svg}</button>` : '';
      }).join('')}</div></section>`).join('');
  const sauts = FAMILLES_ACCORDS.filter(f => !f.familles || f.familles.includes(famille())).map(f => ['acc-' + f.id, f.nom, f.grad[1]]);
  ecranListe({ sur:inst().nom, titre:'Accords', html, sauts });
}
/* toucher un schéma : on entend l'accord (ou sa fondamentale à la basse) */
async function jouerAccord(nom, instId = reglages.instrument){
  await reprendreAudio();
  const i = INSTRUMENTS[instId];
  const t = ctxAudio().currentTime + 0.03;
  etoufferTout();
  if (i.famille === 'basse'){
    const b = notesBasse(nom);
    if (b){ note('basse', b.R, t, { velo:0.95 }); note('basse', b[5], t + 0.35, { velo:0.8 }); note('basse', b[8], t + 0.7, { velo:0.8 }); }
    return;
  }
  const f = forme(instId, nom, { puissance:/5$/.test(nom) });
  if (f) gratter(i, notesDe(instId, f), t, { vitesse:0.035, couche:'libre' });
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-accord]');
  if (b) jouerAccord(b.dataset.accord);
  const c = e.target.closest('.corde-btn');
  if (c){ reprendreAudio().then(() => jouerReference(+c.dataset.midi, 2.4)); }
});

/* --- progression --- */
function ecranProgression(){
  const histo = P.historique(21);
  const max = Math.max(10, ...histo.map(h => h.minutes));
  const nomDe = (liste, id) => { const it = (SOURCES[liste] ? SOURCES[liste]() : []).find(x => x.id === id); return it ? it.titre : null; };
  const lignes = s => P.elementsDe(s).map(e => ({ ...e, nom:nomDe(e.liste, e.id) })).filter(e => e.nom)
    .map(e => `<li><a href="#/jouer/${e.liste}/${encodeURIComponent(e.id)}"><span class="ls-cat">${LISTES[e.liste].nom}</span> <span class="ls-nom">${esc(e.nom)}</span></a></li>`).join('')
    || '<li class="muted small">Rien pour l\'instant.</li>';
  const faites = LECONS.filter(l => P.estFaite(l.id)).length;
  const html = `
    <div class="bloc bloc-stats"><h3>Bilan</h3><div class="stats">
      <div class="stat"><span class="stat-n">${P.minutesAujourdhui()}</span><span>min aujourd'hui</span></div>
      <div class="stat"><span class="stat-n">${P.serie()}</span><span>jours d'affilée</span></div>
      <div class="stat"><span class="stat-n">${faites}/${LECONS.length}</span><span>leçons</span></div>
      <div class="stat"><span class="stat-n">${P.minutesTotal()}</span><span>min au total</span></div></div></div>
    <div class="bloc bloc-histo"><h3>Trois semaines</h3><div class="barres">${histo.map(h =>
      `<i style="height:${Math.max(2, h.minutes / max * 100)}%" title="${h.jour} : ${h.minutes} min"></i>`).join('')}</div></div>
    <div class="bloc bloc-statut travail"><h3><svg class="ico"><use href="#i-drapeau"/></svg>À travailler</h3><ul class="liste-statut">${lignes('travail')}</ul></div>
    <div class="bloc bloc-statut acquis"><h3><svg class="ico"><use href="#i-coche"/></svg>Acquis</h3><ul class="liste-statut">${lignes('acquis')}</ul></div>
    <div class="bloc"><h3>Recommencer</h3><p class="small muted">Efface toute la progression enregistrée sur cet appareil.</p><button class="btn-plat" id="btn-effacer" type="button">Tout effacer</button></div>`;
  ecranListe({ titre:'Progression', html });
  $('#btn-effacer').addEventListener('click', () => {
    if (confirm('Effacer toute la progression ?')){ P.toutEffacer(); ecranProgression(); }
  });
}

/* ================= lecteur ================= */
function ouvrir(liste, id){
  const src = SOURCES[liste];
  if (!src) return false;
  const item = src().find(x => x.id === id);
  if (!item) return false;
  montrer('ecran-jouer');
  chargerElement(liste, item);
  return true;
}

function sectionsDe(liste, item){
  if (liste === 'lecon') return sectionsPour(item, famille());
  if (liste === 'atelier') return sectionsAtelier();
  return item.sections;
}

function chargerElement(liste, item, { garderTempo = false } = {}){
  if (lecteur.enLecture) lecteur.arreter();
  const def = LISTES[liste];
  const lecon = liste === 'lecon';
  courant = { liste, item };
  $('#j-sur').textContent = lecon ? `Leçon ${LECONS.indexOf(item) + 1} · ${inst().court}` : def.nom + ' · ' + inst().court;
  $('#j-titre').textContent = item.titre;
  $('#j-retour').href = def.retour(item);
  document.title = item.titre + ' — Mes Cordes';
  const items = def.items(item);
  const i = items.indexOf(item);
  navLien('#j-prec', i > 0 ? lienJouer(liste, items[i - 1]) : null);
  navLien('#j-suiv', i >= 0 && i < items.length - 1 ? lienJouer(liste, items[i + 1]) : null);
  if (lecon) P.setDerniereLecon(item.id);
  majStatutBoutons();
  $('#j-paroles').hidden = lecon && item.type === 'cordes';

  // leçon « cordes » : pas d'accompagnement, les cordes à vide et l'accordeur
  const cordes = item.type === 'cordes';
  $('.barre-transport').classList.toggle('inactif', cordes);
  $('#diag-zone').hidden = cordes;
  if (cordes){
    courant.compile = null;
    $('#sections-bar').hidden = true;
    $('#grille-accords').innerHTML = `<div class="lecon-cordes"><h2>${inst().nom} : ${inst().cordes.length} cordes</h2>
      <p class="muted">De la plus grave à la plus aiguë. Touche une corde pour entendre sa note.</p>
      ${cordesAVide(reglages.instrument, reglages.solfege)}
      <a class="btn-plat accent" href="#/accordeur"><svg class="ico"><use href="#i-micro"/></svg>Ouvrir l'accordeur</a></div>`;
    remplirAide();
    return;
  }

  const o = lecteur.options;
  const mesureId = item.mesure || '4/4';
  o.instrument = reglages.instrument;
  o.style = item.style || 'folk';
  o.mode = item.mode || 'grat';
  o.puissance = !!item.puissance && famille() === 'guitare';
  if (!garderTempo){ o.transpo = 0; o.capo = famille() === 'guitare' ? (item.capo || 0) : 0; }
  // la basse : si c'est ton instrument, c'est toi qui la joues
  o.basse = famille() !== 'basse';
  o.accords = true;
  majBascule($('#opt-basse'), o.basse);
  majBascule($('#opt-accords'), o.accords);
  setCouche('accords', reglages.volAccords);
  setCouche('basse', reglages.volBasse);

  const sections = sectionsDe(liste, item);
  courant.compile = compilerSections(sections, mesureId);
  lecteur.charger(courant.compile.mesures, mesureId);
  lecteur.invalider();
  if (!garderTempo) lecteur.setTempo(item.bpm || 80);
  majReglagesLecteur();
  rendreGrille();
  majSections();
  majDiagrammes(0, 0);
  remplirAide();
}
function navLien(sel, href){
  const a = $(sel);
  if (href){ a.href = href; a.removeAttribute('aria-disabled'); }
  else { a.href = '#/'; a.setAttribute('aria-disabled', 'true'); }
}
function quitterLecteur(){
  if (lecteur.enLecture) lecteur.arreter();
  courant = null;
  arreterReference();
}

/* --- paroles : une ligne par mesure jouée --- */
const cleParoles = () => courant ? `mes-cordes-paroles:${courant.liste}:${courant.item.id}` : null;
const parolesDe = () => (lire(cleParoles(), '') || '').split('\n');

/* --- la grille à l'écran : sections, mesures, accords, paroles --- */
function nomAffiche(nom){ return afficherAccord(lecteur.nomJoue(nom), reglages.solfege); }
function rendreGrille(){
  const { mesures, sections } = courant.compile;
  const paroles = parolesDe();
  const aParoles = paroles.some(l => l.trim());
  const res = MESURES[lecteur.mesureId];
  let html = barreMainDroite();
  sections.forEach((s, si) => {
    html += `<div class="g-section" data-section="${si}"><h3 class="g-titre">${esc(s.nom)}${s.rep > 1 ? ` <em>×${s.rep}</em>` : ''}</h3><div class="g-mesures">`;
    for (let k = s.debut; k < s.fin; k++){
      const m = mesures[k];
      html += `<div class="g-mesure${m.accords.length > 1 ? ' double' : ''}" data-m="${k}">
        <div class="g-accords">${m.accords.map(a => `<b>${esc(nomAffiche(a.nom))}</b>`).join('')}</div>
        ${aParoles ? `<div class="g-paroles">${esc(paroles[k] || '')}</div>` : ''}
        <div class="g-temps">${Array.from({ length:res.beats }, () => '<i></i>').join('')}</div>
        <span class="g-prog"></span></div>`;
    }
    html += '</div></div>';
  });
  $('#grille-accords').innerHTML = html;
  $('#grille-accords').classList.toggle('avec-paroles', aParoles);
  $('#grille-accords').scrollTop = 0;
  mesureActive = -1;
}
$('#grille-accords').addEventListener('click', e => {
  const c = e.target.closest('.g-mesure');
  if (!c || !courant || !courant.compile) return;
  const m = +c.dataset.m;
  const s = courant.compile.sections.findIndex(x => m >= x.debut && m < x.fin);
  if (lecteur.enLecture) return;
  majDiagrammes(m, 0);
  const a = courant.compile.mesures[m].accords[0];
  jouerAccord(lecteur.nomJoue(a.nom), famille() === 'basse' ? 'basse' : reglages.instrument);
  if (s >= 0) activerMesure(m, false);
});

function activerMesure(m, defiler = true){
  const zone = $('#grille-accords');
  if (mesureActive >= 0){ const p = zone.querySelector(`[data-m="${mesureActive}"]`); if (p){ p.classList.remove('actif'); p.style.removeProperty('--prog'); } }
  mesureActive = m;
  if (m < 0) return;
  const c = zone.querySelector(`[data-m="${m}"]`);
  if (!c) return;
  c.classList.add('actif');
  if (defiler){
    const haut = c.offsetTop - zone.offsetTop;
    const cible = haut - zone.clientHeight * 0.3;
    if (haut < zone.scrollTop + 10 || haut + c.offsetHeight > zone.scrollTop + zone.clientHeight - 20)
      zone.scrollTo({ top:Math.max(0, cible), behavior:'smooth' });
  }
}
function majProgression(pos, c){
  if (pos == null || !c) return;
  const el = $('#grille-accords').querySelector(`[data-m="${c.mesure}"]`);
  if (el) el.style.setProperty('--prog', ((pos % lecteur.pas) / lecteur.pas * 100).toFixed(1) + '%');
}

/* --- diagrammes : accord en cours et suivant --- */
function accordA(m, p){
  const me = courant.compile.mesures[m];
  if (!me) return null;
  let a = me.accords[0];
  for (const x of me.accords) if (x.pas <= p) a = x;
  return a.nom;
}
function suivantApres(m, p){
  const ms = courant.compile.mesures;
  const actuel = accordA(m, p);
  for (let k = m; k < ms.length + m + 1; k++){
    const me = ms[k % ms.length];
    for (const a of me.accords){
      if (k === m && a.pas <= p) continue;
      if (a.nom !== actuel) return a.nom;
    }
  }
  return null;
}
function majDiagrammes(m, p){
  if (!courant || !courant.compile) return;
  const nom = accordA(m, p);
  accordAffiche = nom;
  if (!nom) return;
  const suivant = suivantApres(m, p);
  const pw = lecteur.options.puissance;
  const joue = lecteur.nomJoue(nom);
  $('#diag-actuel').innerHTML = schemaAccord(reglages.instrument, joue, { puissance:pw, solfege:reglages.solfege }) || `<p class="sc-inconnu">${esc(joue)}</p>`;
  $('#diag-suivant').innerHTML = suivant ? (schemaAccord(reglages.instrument, lecteur.nomJoue(suivant), { puissance:pw, solfege:reglages.solfege }) || '') : '';
}

/* --- sections (boucler une partie) --- */
function majSections(){
  const bar = $('#sections-bar');
  const secs = courant.compile.sections;
  if (secs.length < 2){ bar.hidden = true; lecteur.setPlage(null); return; }
  bar.hidden = false;
  bar.innerHTML = `<button type="button" class="chip actif" data-sec="-1">Tout</button>` +
    secs.map((s, i) => `<button type="button" class="chip" data-sec="${i}">${esc(s.nom)}<em>${s.fin - s.debut}</em></button>`).join('');
  lecteur.setPlage(null);
}
$('#sections-bar').addEventListener('click', e => {
  const b = e.target.closest('[data-sec]');
  if (!b) return;
  const i = +b.dataset.sec;
  $$('#sections-bar .chip').forEach(c => c.classList.toggle('actif', c === b));
  const s = courant.compile.sections[i];
  const enCours = lecteur.enLecture;
  if (enCours) lecteur.arreter();
  lecteur.setPlage(s ? s.debut : null, s ? s.fin : null);
  const debut = s ? s.debut : 0;
  majDiagrammes(debut, 0);
  const el = $('#grille-accords').querySelector(`[data-m="${debut}"]`);
  if (el) $('#grille-accords').scrollTo({ top:Math.max(0, el.offsetTop - $('#grille-accords').offsetTop - 10), behavior:'smooth' });
  if (enCours) basculerLecture();
});

/* --- explications --- */
function remplirAide(){
  const it = courant.item, l = courant.liste;
  let h = '';
  if (l === 'lecon'){
    h = `<h2>${esc(it.titre)}</h2><p class="objectif"><b>Objectif :</b> ${esc(it.objectif)}</p>${it.texte}${(it.conseils || []).map(CONSEIL).join('')}`;
    if (famille() === 'basse' && it.type !== 'cordes') h += CONSEIL('À la basse : joue la fondamentale de chaque accord (le rond « F » sur le schéma), sur le premier temps, puis suis la ligne de basse de la rythmique. L\'appli joue les accords pour toi.');
  } else if (l === 'morceau'){
    h = `<h2>${esc(it.titre)}</h2><p class="muted">${esc(it.origine)} · ${it.mesure} · ${it.bpm} BPM</p>
      <p>Grille d'accompagnement simplifiée pour chanter : aucune parole n'est incluse. Touche <b>Mes paroles</b> (icône texte) pour coller les tiennes : une ligne par mesure, elles défilent sous les accords.</p>
      ${it.capo ? CONSEIL(`À la guitare, cette grille se joue avec le capodastre en case ${it.capo} (déjà réglé).`) : ''}
      ${CONSEIL('Trop grave ou trop aigu pour ta voix ? Réglages → Transposer, un demi-ton à la fois.')}`;
  } else if (l === 'rythme'){
    h = `<h2>${esc(it.titre)}</h2><p>${esc(it.desc)}</p>${lectureRythme(it.style, it.mesure)}`;
  } else {
    h = `<h2>Atelier</h2><p>Écris ta propre grille dans <b>Mes paroles</b> (icône texte) : les accords, la mesure, puis tes paroles. Choisis la rythmique et le tempo, et chante.</p>`;
  }
  $('#aide-corps').innerHTML = h;
  const accords = courant.compile ? [...new Set(courant.compile.mesures.flatMap(m => m.accords.map(a => a.nom)))] : [];
  $('#aide-accords').innerHTML = accords.map(a => {
    const joue = lecteur.nomJoue(a);
    const svg = schemaAccord(reglages.instrument, joue, { puissance:lecteur.options.puissance, solfege:reglages.solfege });
    return svg ? `<button type="button" class="carte-schema" data-accord="${esc(joue)}">${svg}</button>` : '';
  }).join('');
}
/* barre « main droite » en haut de la grille : le motif de la mesure, qui s'allume en direct */
const SIG_GRAT = { D:'↓', U:'↑', d:'↓', x:'✕', B:'B', b:'b', '0':'B', '-':'·' };
const SIG_ARP = { '0':'p', c:'i', b:'m', a:'a', '-':'·' };
function barreMainDroite(){
  const o = lecteur.options, mesure = lecteur.mesureId;
  const s = STYLES[o.style], p = s && (s[mesure] || null);
  if (!p) return '';
  const res = MESURES[mesure].res;
  const motif = o.mode === 'arp' ? p.arp : p.grat;
  const sig = o.mode === 'arp' ? SIG_ARP : SIG_GRAT;
  const nom = o.mode === 'arp' ? 'Arpège' : 'Grattage';
  return `<div class="main-droite" id="main-droite" title="${nom} : ${esc(s.nom)}"><span class="md-lbl">${nom}<em>${esc(s.nom)}</em></span>${[...motif].map((c, i) =>
    `<span class="rv-case${i % res === 0 ? ' temps' : ''}${c === '-' ? ' vide' : ''}"><b>${sig[c] || c}</b><em>${i % res === 0 ? i / res + 1 : res === 2 ? 'et' : ''}</em></span>`).join('')}</div>`;
}
let pasAllume = null;
function allumerPas(p){
  const cases = document.querySelectorAll('#main-droite .rv-case');
  if (pasAllume) pasAllume.classList.remove('on');
  pasAllume = cases[p] || null;
  if (pasAllume) pasAllume.classList.add('on');
}
/* la rythmique écrite en toutes lettres : ↓ ↑ par temps */
function lectureRythme(styleId, mesure){
  const s = STYLES[styleId], p = s && s[mesure];
  if (!p) return '';
  const res = MESURES[mesure].res;
  const SIG = { D:'↓', U:'↑', d:'↓', x:'✕', B:'B', b:'b', '-':'·' };
  const cases = [...p.grat].map((c, i) => `<span class="rv-case${i % res === 0 ? ' temps' : ''}"><b>${SIG[c] || c}</b><em>${i % res === 0 ? i / res + 1 : res === 2 ? 'et' : ''}</em></span>`).join('');
  return `<h3>Main droite</h3><div class="rythme-vis">${cases}</div>
    <p class="small muted">↓ vers le bas · ↑ vers le haut · ✕ corde étouffée · B basse seule · · on ne touche pas les cordes (la main continue son mouvement).</p>`;
}

/* ================= réglages du lecteur ================= */
function majReglagesLecteur(){
  const o = lecteur.options;
  const styles = stylesPour(lecteur.mesureId);
  $('#opt-style').innerHTML = styles.map(id => `<option value="${id}"${id === o.style ? ' selected' : ''}>${STYLES[id].nom}</option>`).join('')
    || `<option>${STYLES[o.style] ? STYLES[o.style].nom : o.style}</option>`;
  $('#style-desc').textContent = STYLES[o.style] ? STYLES[o.style].desc : '';
  $$('#opt-mode .seg-btn').forEach(b => { const on = b.dataset.mode === o.mode; b.classList.toggle('actif', on); b.setAttribute('aria-pressed', on); });
  $('#transpo-val').textContent = (o.transpo > 0 ? '+' : '') + o.transpo;
  $('#capo-val').textContent = o.capo;
  $('#capo-note').textContent = o.capo ? `Capo en case ${o.capo} : les formes restent les mêmes, le son est ${o.capo} demi-ton${o.capo > 1 ? 's' : ''} plus haut.` : '';
  $('#opt-pw').checked = o.puissance;
  $('#opt-sat').checked = reglages.sat;
  $('#opt-count').checked = reglages.decompte;
  $('#opt-loop').checked = reglages.boucle;
  $('#opt-solfege').checked = reglages.solfege;
  $('#vol-accords').value = reglages.volAccords;
  $('#vol-basse').value = reglages.volBasse;
  majChoixInstrument();
}
function apresChangement(){
  lecteur.invalider();
  majReglagesLecteur();
  if (courant && courant.compile){ rendreGrille(); majDiagrammes(Math.max(0, mesureActive), 0); remplirAide(); }
}
$('#opt-style').addEventListener('change', e => { lecteur.options.style = e.target.value; apresChangement(); });
$('#opt-mode').addEventListener('click', e => { const b = e.target.closest('[data-mode]'); if (b){ lecteur.options.mode = b.dataset.mode; apresChangement(); } });
$('#transpo-moins').addEventListener('click', () => { lecteur.options.transpo = Math.max(-11, lecteur.options.transpo - 1); apresChangement(); });
$('#transpo-plus').addEventListener('click', () => { lecteur.options.transpo = Math.min(11, lecteur.options.transpo + 1); apresChangement(); });
$('#capo-moins').addEventListener('click', () => { lecteur.options.capo = Math.max(0, lecteur.options.capo - 1); apresChangement(); });
$('#capo-plus').addEventListener('click', () => { lecteur.options.capo = Math.min(9, lecteur.options.capo + 1); apresChangement(); });
$('#opt-pw').addEventListener('change', e => { lecteur.options.puissance = e.target.checked; apresChangement(); });
$('#opt-sat').addEventListener('change', e => { reglages.sat = e.target.checked; setSaturation(reglages.sat); sauverReglages(); });
$('#opt-count').addEventListener('change', e => { reglages.decompte = lecteur.options.decompte = e.target.checked; sauverReglages(); });
$('#opt-loop').addEventListener('change', e => { reglages.boucle = lecteur.options.boucle = e.target.checked; sauverReglages(); });
$('#opt-solfege').addEventListener('change', e => { reglages.solfege = e.target.checked; sauverReglages(); apresChangement(); });
$('#vol-accords').addEventListener('input', e => { reglages.volAccords = +e.target.value; setCouche('accords', reglages.volAccords); sauverReglages(); });
$('#vol-basse').addEventListener('input', e => { reglages.volBasse = +e.target.value; setCouche('basse', reglages.volBasse); sauverReglages(); });

/* ================= transport ================= */
function majBascule(el, on){ el.classList.toggle('actif', on); el.setAttribute('aria-pressed', on); }
majBascule($('#opt-click'), reglages.clic);
$('#opt-click').addEventListener('click', () => { reglages.clic = lecteur.options.clic = !reglages.clic; majBascule($('#opt-click'), reglages.clic); sauverReglages(); });
$('#opt-accords').addEventListener('click', () => { lecteur.options.accords = !lecteur.options.accords; majBascule($('#opt-accords'), lecteur.options.accords); if (!lecteur.options.accords) etoufferTout(); });
$('#opt-basse').addEventListener('click', () => { lecteur.options.basse = !lecteur.options.basse; majBascule($('#opt-basse'), lecteur.options.basse); });
$('#bpm').addEventListener('input', e => lecteur.setTempo(+e.target.value));
$('#tempo-moins').addEventListener('click', () => lecteur.setTempo(lecteur.bpm - 4));
$('#tempo-plus').addEventListener('click', () => lecteur.setTempo(lecteur.bpm + 4));
$('#tempo-reset').addEventListener('click', () => { if (courant) lecteur.setTempo(courant.item.bpm || 80); });
$('#btn-play').addEventListener('click', basculerLecture);

function majBoutonPlay(enCours){
  $('#btn-play').classList.toggle('actif', enCours);
  $('#play-ico').setAttribute('href', enCours ? '#i-stop' : '#i-play');
  $('#btn-play').setAttribute('aria-label', enCours ? 'Arrêt' : 'Lecture');
}
async function basculerLecture(){
  if (!courant || !courant.compile) return;
  if (lecteur.enLecture){ lecteur.arreter(); return; }
  await lecteur.demarrer();
  majBoutonPlay(true);
  startChrono();
  garderEcranAllume(true);
}
let verrou = null;
async function garderEcranAllume(oui){
  try {
    if (oui && 'wakeLock' in navigator && !verrou) verrou = await navigator.wakeLock.request('screen');
    else if (!oui && verrou){ await verrou.release(); verrou = null; }
  } catch { /* refusé */ }
}
function startChrono(){ chrono = performance.now(); }
function stopChrono(){
  if (chrono == null) return;
  const s = (performance.now() - chrono) / 1000;
  chrono = null;
  if (s > 2) P.ajouterSecondes(s);
  garderEcranAllume(false);
}
function afficherDecompte(n){ const o = $('#count-overlay'); o.hidden = false; o.querySelector('span').textContent = n; o.querySelector('span').style.animation = 'none'; void o.offsetWidth; o.querySelector('span').style.animation = ''; }
function masquerDecompte(){ $('#count-overlay').hidden = true; }

/* ================= statut ================= */
function majStatutBoutons(){
  const st = courant ? P.statut(courant.liste, courant.item.id) : null;
  for (const [id, v] of [['#st-travail', 'travail'], ['#st-acquis', 'acquis']]){
    $(id).classList.toggle('actif', st === v);
    $(id).setAttribute('aria-pressed', st === v);
  }
}
function basculerStatut(v){
  if (!courant) return;
  const st = P.statut(courant.liste, courant.item.id);
  P.setStatut(courant.liste, courant.item.id, st === v ? null : v);
  majStatutBoutons();
  annoncer(st === v ? 'Statut retiré' : v === 'acquis' ? 'Acquis !' : 'À travailler');
}
$('#st-travail').addEventListener('click', () => basculerStatut('travail'));
$('#st-acquis').addEventListener('click', () => basculerStatut('acquis'));
let minuteurToast = null;
function annoncer(texte){
  const t = $('#toast');
  t.textContent = texte; t.hidden = false;
  clearTimeout(minuteurToast);
  minuteurToast = setTimeout(() => { t.hidden = true; }, 1600);
}

/* ================= volets ================= */
let voletOuvert = null;
function ouvrirVolet(id){
  fermerVolets(false);
  voletOuvert = $('#' + id);
  voletOuvert.hidden = false;
  $('#voile').hidden = false;
  voletOuvert.querySelector('.volet-corps').scrollTop = 0;
}
function fermerVolets(){
  if (!voletOuvert) return;
  voletOuvert.hidden = true;
  $('#voile').hidden = true;
  voletOuvert = null;
}
$('#j-aide').addEventListener('click', () => ouvrirVolet('volet-aide'));
$('#j-reglages').addEventListener('click', () => ouvrirVolet('volet-reglages'));
$('#j-paroles').addEventListener('click', () => {
  if (!courant) return;
  const estAtelier = courant.liste === 'atelier';
  $('#atelier-grille').hidden = !estAtelier;
  if (estAtelier){ $('#atelier-texte').value = atelier.texte; $('#atelier-mesure').value = atelier.mesure; $('#atelier-erreur').textContent = ''; }
  $('#paroles-texte').value = lire(cleParoles(), '') || '';
  $('#paroles-texte').placeholder = courant.compile ? courant.compile.mesures.map((m, i) => `Mesure ${i + 1} (${m.accords.map(a => a.nom).join(' ')})`).slice(0, 8).join('\n') + '\n…' : '';
  $('#paroles-titre').textContent = estAtelier ? 'Ma grille' : 'Mes paroles';
  ouvrirVolet('volet-paroles');
});
$('#paroles-ok').addEventListener('click', () => {
  ecrire(cleParoles(), $('#paroles-texte').value.replace(/\s+$/, ''));
  if (courant && courant.compile) rendreGrille();
  fermerVolets();
  annoncer('Paroles enregistrées');
});
$('#paroles-effacer').addEventListener('click', () => { $('#paroles-texte').value = ''; });
$('#atelier-appliquer').addEventListener('click', () => {
  const texte = $('#atelier-texte').value.trim();
  const secs = texte.split('\n').map(l => l.replace(/^[^:|]{1,24}:\s*/, '')).filter(l => l.trim());
  const inconnus = [...new Set(secs.flatMap(l => lireGrille(l).flat()))].filter(a => !analyserAccord(a));
  if (!secs.length){ $('#atelier-erreur').textContent = 'Écris au moins une mesure, par exemple : C | G | Am | F'; return; }
  if (inconnus.length){ $('#atelier-erreur').textContent = 'Accord(s) non reconnu(s) : ' + inconnus.join(', '); return; }
  atelier.texte = texte;
  atelier.mesure = $('#atelier-mesure').value;
  if (!STYLES[atelier.style] || !STYLES[atelier.style][atelier.mesure]) atelier.style = stylesPour(atelier.mesure)[0] || 'croches';
  ecrire(CLE_ATELIER, { texte:atelier.texte, mesure:atelier.mesure, style:atelier.style, bpm:atelier.bpm });
  chargerElement('atelier', atelier, { garderTempo:true });
  $('#atelier-erreur').textContent = '';
  annoncer('Grille appliquée');
});
$('#opt-style').addEventListener('change', e => {
  if (courant && courant.liste === 'atelier'){ atelier.style = e.target.value; ecrire(CLE_ATELIER, { texte:atelier.texte, mesure:atelier.mesure, style:atelier.style, bpm:atelier.bpm }); }
});
$('#voile').addEventListener('click', () => fermerVolets());
$$('[data-fermer]').forEach(b => b.addEventListener('click', () => fermerVolets()));

/* ================= accordeur ================= */
let micro = null;      // { flux, source, analyseur, tampon, raf }
let lissage = null;
function ecranAccordeur(){
  montrer('ecran-accordeur');
  document.title = 'Accordeur — Mes Cordes';
  $('#acc-sur').textContent = inst().nom + ' · ' + inst().lettres.join(' ');
  $('#acc-cordes').innerHTML = cordesAVide(reglages.instrument, reglages.solfege);
  const g = $('#acc-graduations');
  if (!g.childElementCount){
    let s = '';
    for (let c = -50; c <= 50; c += 10){
      const a = c / 50 * 60 * Math.PI / 180;
      const long = c % 50 === 0 ? 16 : c === 0 ? 18 : 9;
      const x1 = 150 + Math.sin(a) * 120, y1 = 150 - Math.cos(a) * 120;
      const x2 = 150 + Math.sin(a) * (120 - long), y2 = 150 - Math.cos(a) * (120 - long);
      s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="acc-grad"/>`;
    }
    g.innerHTML = s + '<text x="30" y="168" class="acc-lbl" text-anchor="middle">♭</text><text x="270" y="168" class="acc-lbl" text-anchor="middle">♯</text>';
  }
  majMicroBouton();
}
function majMicroBouton(){
  $('#acc-micro span').textContent = micro ? 'Arrêter' : 'Écouter';
  $('#acc-micro').classList.toggle('actif', !!micro);
}
$('#acc-micro').addEventListener('click', async () => {
  if (micro){ arreterMicro(); return; }
  try {
    const ctx = await reprendreAudio();
    const flux = await navigator.mediaDevices.getUserMedia({ audio:{ echoCancellation:false, noiseSuppression:false, autoGainControl:false } });
    const source = ctx.createMediaStreamSource(flux);
    const analyseur = ctx.createAnalyser();
    analyseur.fftSize = 4096;
    source.connect(analyseur);
    micro = { flux, source, analyseur, tampon:new Float32Array(analyseur.fftSize), raf:0 };
    lissage = null;
    majMicroBouton();
    $('#acc-conseil').textContent = 'Joue une corde à vide et laisse-la sonner.';
    boucleMicro();
  } catch {
    $('#acc-conseil').textContent = 'Micro indisponible : autorise l\'accès au micro dans le navigateur (le site doit être en https).';
  }
});
function arreterMicro(){
  if (!micro) return;
  cancelAnimationFrame(micro.raf);
  micro.flux.getTracks().forEach(t => t.stop());
  try { micro.source.disconnect(); } catch { /* déjà */ }
  micro = null;
  if (!$('#ecran-accordeur').hidden) majMicroBouton();
}
function boucleMicro(){
  if (!micro) return;
  micro.analyseur.getFloatTimeDomainData(micro.tampon);
  const i = inst();
  const fmin = midiEnFreq(Math.min(...i.cordes) - 5), fmax = midiEnFreq(Math.max(...i.cordes) + 14);
  const r = detecterHauteur(micro.tampon, ctxAudio().sampleRate, fmin, fmax);
  if (r && r.clarte > 0.85){
    lissage = lissage && Math.abs(Math.log2(r.freq / lissage)) < 0.03 ? lissage * 0.75 + r.freq * 0.25 : r.freq;
    afficherHauteur(lissage);
  }
  micro.raf = requestAnimationFrame(boucleMicro);
}
function afficherHauteur(freq){
  const i = inst();
  const c = cordeProche(freq, i.cordes);
  const proche = Math.abs(c.cents) < 250;
  const n = proche ? { midi:i.cordes[c.index], cents:c.cents } : noteProche(freq);
  const cents = Math.max(-50, Math.min(50, n.cents));
  $('#acc-aiguille').style.transform = `rotate(${cents / 50 * 60}deg)`;
  $('#acc-note').textContent = nomClasse(n.midi, reglages.solfege);
  $('#acc-cents').textContent = (n.cents > 0 ? '+' : '') + Math.round(n.cents) + ' cents';
  const juste = Math.abs(n.cents) < 5;
  $('.accordeur').classList.toggle('juste', juste);
  $('#acc-conseil').textContent = juste ? 'Juste !' : n.cents < 0 ? 'Trop grave : serre la corde (tourne la mécanique).' : 'Trop aigu : desserre un peu la corde.';
  $$('#acc-cordes .corde-btn').forEach(b => b.classList.toggle('actif', proche && +b.dataset.i === c.index));
}

/* ================= clavier ================= */
document.addEventListener('keydown', e => {
  if (e.target.closest('textarea, input, select')) return;
  if (e.key === 'Escape'){ fermerVolets(); return; }
  if ($('#ecran-jouer').hidden) return;
  if (e.key === ' ' || e.key === 'Enter'){ e.preventDefault(); basculerLecture(); }
  else if (e.key === 'ArrowLeft'){ const a = $('#j-prec'); if (!a.getAttribute('aria-disabled')) location.hash = a.getAttribute('href'); }
  else if (e.key === 'ArrowRight'){ const a = $('#j-suiv'); if (!a.getAttribute('aria-disabled')) location.hash = a.getAttribute('href'); }
  else if (e.key === 'ArrowUp'){ e.preventDefault(); lecteur.setTempo(lecteur.bpm + 2); }
  else if (e.key === 'ArrowDown'){ e.preventDefault(); lecteur.setTempo(lecteur.bpm - 2); }
});

/* ================= téléphone : horizontal et plein écran ================= */
const tactile = matchMedia('(pointer: coarse)').matches;
const enApp = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
async function pleinEcranPaysage(){
  try {
    if (!enApp && !document.fullscreenElement && document.documentElement.requestFullscreen)
      await document.documentElement.requestFullscreen({ navigationUI:'hide' });
    if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape');
  } catch { /* l'appli pivote d'elle-même (CSS) */ }
}
if (tactile){
  if (enApp && screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
  const auPremierToucher = e => {
    if (e.target.closest('#install-modal')) return;
    document.removeEventListener('pointerup', auPremierToucher);
    pleinEcranPaysage();
  };
  document.addEventListener('pointerup', auPremierToucher);
}
document.addEventListener('pointerdown', () => initAudio(), { once:true });

/* Appli pivotée (téléphone tenu droit) : on traduit le glissé du doigt vers la zone qui défile. */
const pivotee = matchMedia('(orientation: portrait) and (pointer: coarse)');
function zoneDefilante(el, horizontal){
  for (let n = el; n && n.id !== 'appli'; n = n.parentElement){
    const st = getComputedStyle(n);
    const ok = horizontal
      ? /(auto|scroll)/.test(st.overflowX) && n.scrollWidth > n.clientWidth + 1
      : /(auto|scroll)/.test(st.overflowY) && n.scrollHeight > n.clientHeight + 1;
    if (ok) return n;
  }
  return null;
}
let glisse = null, elan = null, ignorerClic = 0;
document.addEventListener('touchstart', e => {
  cancelAnimationFrame(elan);
  glisse = null;
  if (!pivotee.matches || e.touches.length !== 1 || e.target.closest('input[type=range], select, textarea')) return;
  const t = e.touches[0];
  glisse = { x:t.clientX, y:t.clientY, temps:performance.now(), cible:e.target, zone:null, v:0 };
}, { passive:true });
document.addEventListener('touchmove', e => {
  if (!glisse) return;
  const t = e.touches[0];
  const dx = t.clientY - glisse.y, dy = -(t.clientX - glisse.x);
  if (!glisse.zone){
    if (Math.hypot(dx, dy) < 8) return;
    glisse.horizontal = Math.abs(dx) >= Math.abs(dy);
    glisse.zone = zoneDefilante(glisse.cible, glisse.horizontal);
    if (!glisse.zone){ glisse = null; return; }
  }
  e.preventDefault();
  const d = glisse.horizontal ? dx : dy;
  if (glisse.horizontal) glisse.zone.scrollLeft -= d; else glisse.zone.scrollTop -= d;
  const maintenant = performance.now();
  glisse.v = glisse.v * 0.6 + (d / Math.max(1, maintenant - glisse.temps)) * 0.4;
  glisse.x = t.clientX; glisse.y = t.clientY; glisse.temps = maintenant;
}, { passive:false });
document.addEventListener('touchend', () => {
  if (!glisse || !glisse.zone){ glisse = null; return; }
  ignorerClic = performance.now();
  const { zone, horizontal } = glisse;
  let v = glisse.v * 16;
  glisse = null;
  const pas = () => {
    if (Math.abs(v) < 0.4) return;
    if (horizontal) zone.scrollLeft -= v; else zone.scrollTop -= v;
    v *= 0.94;
    elan = requestAnimationFrame(pas);
  };
  elan = requestAnimationFrame(pas);
});
document.addEventListener('click', e => {
  if (performance.now() - ignorerClic < 350){ e.preventDefault(); e.stopPropagation(); }
}, true);

/* ================= installation ================= */
const surIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const installable = !!document.querySelector('link[rel="manifest"]') && /^https?:$/.test(location.protocol);
if (installable && 'serviceWorker' in navigator){
  const avaitDejaUneVersion = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js', { updateViaCache:'none' })
    .then(reg => { reg.update(); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update(); }); })
    .catch(() => {});
  let recharge = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!avaitDejaUneVersion || recharge || lecteur.enLecture) return;
    recharge = true;
    location.reload();
  });
}
const CLE_INSTALLATION = 'mes-cordes-installation-proposee';
let demandeInstallation = null;
function majInstallation(){
  $('#install-oui').hidden = !demandeInstallation;
  $('#install-ios').hidden = !!demandeInstallation || !surIOS;
  $('#install-autre').hidden = !!demandeInstallation || surIOS;
  $('#install-non').textContent = demandeInstallation ? 'Plus tard' : 'Compris';
}
function proposerInstallation(){ if (enApp || !installable) return; majInstallation(); $('#install-modal').hidden = false; }
function fermerInstallation(){ $('#install-modal').hidden = true; }
function premiereProposition(){
  if (enApp || !installable || lire(CLE_INSTALLATION, false)) return;
  ecrire(CLE_INSTALLATION, true);
  proposerInstallation();
}
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  demandeInstallation = e;
  if (enApp) return;
  $('#btn-installer').hidden = false;
  if (!$('#install-modal').hidden) majInstallation(); else premiereProposition();
});
window.addEventListener('appinstalled', () => { $('#btn-installer').hidden = true; fermerInstallation(); });
if (installable && !enApp){
  if (surIOS) $('#btn-installer').hidden = false;
  setTimeout(premiereProposition, surIOS ? 1200 : 3000);
}
$('#btn-installer').addEventListener('click', proposerInstallation);
$('#install-oui').addEventListener('click', async () => {
  if (!demandeInstallation) return;
  demandeInstallation.prompt();
  const choix = await demandeInstallation.userChoice;
  demandeInstallation = null;
  fermerInstallation();
  if (choix && choix.outcome === 'accepted') $('#btn-installer').hidden = true;
});
$('#install-non').addEventListener('click', fermerInstallation);

/* ================= démarrage ================= */
route();
