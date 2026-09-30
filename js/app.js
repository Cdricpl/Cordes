/* Assemblage de l'interface : accueil, listes, lecteur d'accompagnement, accordeur.
 * Navigation par l'adresse (#/…), comme Ma Batterie. */
import { INSTRUMENTS, ORDRE_INSTRUMENTS } from './instruments.js';
import { initAudio, reprendreAudio, ctxAudio, gratter, note, setSaturation, setCouche, jouerReference, arreterReference, etoufferTout, frapper } from './audio.js';
import { STYLES, STYLES_ORDRE, MESURES, stylesPour, compilerSections, lireGrille } from './rythmes.js';
import { forme, notesDe } from './accords.js';
import { analyserAccord, afficherAccord, transposer, nomClasse, midiEnFreq } from './theorie.js';
import { detecterHauteur, noteProche, cordeProche } from './hauteur.js';
import { PARCOURS, TOUTES_LECONS, leconsDe, niveauxDe } from './lessons.js';
import { schemaAccord, schemaPositions, cordesAVide, illusInstrument, ILLUS } from './diagrammes.js';
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
const NIV_GRAD = [['#34d399', '#059669'], ['#38bdf8', '#2563eb'], ['#fbbf24', '#e8590c'], ['#f472b6', '#be185d']];
const gradStyle = g => `--c1:${g[0]};--c2:${g[1]}`;
const CONSEIL = t => `<div class="tip"><span class="tip-lbl">Conseil</span><p>${t}</p></div>`;

/* Rythmiques : celles qui conviennent à l'instrument choisi, jouées sur une grille de démonstration.
 * À la basse, ce sont des grooves : on entend (et on voit) la ligne de basse de chacune. */
const GRILLE_DEMO = { '4/4':'C | G | Am | F', '3/4':'C | C | G | G', '2/4':'C | G | C | G', '6/8':'Am | F | C | G', '9/8':'Am | Dm | E | Am', '12/8':'A7 | D7 | A7 | E7' };
const GRILLE_BASSE = { '4/4':'A | A | D | E', '3/4':'C | C | G | G', '6/8':'Am | F | C | G', '12/8':'A7 | D7 | A7 | E7' };
const cacheRythmiques = {};
function rythmiquesDe(instId){
  if (cacheRythmiques[instId]) return cacheRythmiques[instId];
  const basse = INSTRUMENTS[instId].famille === 'basse';
  return cacheRythmiques[instId] = STYLES_ORDRE.filter(id => STYLES[id].pour.includes(instId)).map(id => {
    const s = STYLES[id];
    const mesure = ['4/4', '3/4', '6/8', '9/8', '12/8', '2/4'].find(m => s[m]);
    return { id, titre:s.nom, niveau:s.niveau, desc:s.desc, mesure, style:id,
      bpm:mesure === '6/8' || mesure === '12/8' || mesure === '9/8' ? 66 : s.niveau >= 3 ? 92 : 84,
      mode:s.type === 'arp' ? 'arp' : 'grat',
      couches:{ batterie:instId !== 'guitare_classique', basse:true, accords:true },
      sections:[{ nom:'Grille', mesures:(basse && GRILLE_BASSE[mesure]) || GRILLE_DEMO[mesure], rep:2 }] };
  }).sort((a, b) => a.niveau - b.niveau);
}
const RYTHMIQUES_TOUTES = () => ORDRE_INSTRUMENTS.flatMap(i => rythmiquesDe(i));

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
  lecon:    { nom:'Leçon',     items:() => leconsDe(reglages.instrument),          retour:it => '#/parcours/' + it.niveau },
  rythme:   { nom:'Rythmique', items:() => rythmiquesDe(reglages.instrument),      retour:() => '#/rythmiques' },
  atelier:  { nom:'Atelier',   items:() => [atelier],                              retour:() => '#/' }
};
const SOURCES = { lecon:() => TOUTES_LECONS, rythme:RYTHMIQUES_TOUTES, atelier:() => [atelier] };
const lienJouer = (liste, it) => `#/jouer/${liste}/${encodeURIComponent(it.id)}`;
const LECONS = () => leconsDe(reglages.instrument);
const prochaineLecon = () => LECONS().find(l => !P.estFaite(l.id)) || LECONS()[LECONS().length - 1];
/* instrument d'une leçon (chaque instrument a son parcours) */
const instrumentDe = lecon => Object.keys(PARCOURS).find(i => PARCOURS[i].lecons.includes(lecon));

/* ================= lecteur ================= */
let courant = null;             // { liste, item, sections, compile }
let mesureActive = -1;
let accordAffiche = null;
let chrono = null;
const lecteur = new Lecteur({
  onCompte: n => afficherDecompte(n),
  onMesure: m => { masquerDecompte(); activerMesure(m); },
  onPas: c => {
    const me = courant && courant.compile && courant.compile.mesures[c.mesure];
    if (me && me.tab) allumerTab(c);
    else { if (c.accord !== accordAffiche) majDiagrammes(c.mesure, c.p); allumerPas(c.p, c.accord); }
  },
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
  if (courant && courant.liste === 'lecon'){
    // chaque instrument a sa méthode : on passe au parcours du nouvel instrument
    fermerVolets();
    location.hash = '#/parcours';
  } else if (courant && courant.liste === 'rythme' && !STYLES[courant.item.style].pour.includes(id)){
    fermerVolets();
    location.hash = '#/rythmiques';
  } else if (courant){
    const enCours = lecteur.enLecture;
    if (enCours) lecteur.arreter();
    const it = courant.liste === 'rythme' ? rythmiquesDe(id).find(r => r.id === courant.item.id) : courant.item;
    chargerElement(courant.liste, it, { garderTempo:true });
    if (enCours) basculerLecture();
  } else route();
}

/* ================= accueil ================= */
function ecranAccueil(){
  montrer('ecran-accueil');
  document.title = 'Mes Cordes';
  majChoixInstrument();
  const ls = LECONS();
  const faites = ls.filter(l => P.estFaite(l.id)).length;
  const pc = Math.round(faites / ls.length * 100);
  const METHODE = { guitare_elec:'médiator, power chords, riffs, rythmique rock, puis le solo',
    guitare_classique:'pouce et doigts, mélodies, arpèges p-i-m-a, basse et mélodie ensemble',
    basse:'doigts alternés, fondamentales avec la batterie, quinte, octave, grooves',
    ukulele:'accords à un doigt, island strum, chuck, picking et mélodies' };
  $('#parcours-resume').textContent = faites
    ? `${inst().nom} : ${faites} leçon${faites > 1 ? 's' : ''} sur ${ls.length} — ${pc} %`
    : `${inst().nom} : ${ls.length} leçons — ${METHODE[reglages.instrument]}.`;
  $('#parcours-jauge').style.width = pc + '%';
  const suivante = prochaineLecon();
  $('#cta-continuer').href = lienJouer('lecon', suivante);
  $('#cta-texte').textContent = faites ? `Leçon ${ls.indexOf(suivante) + 1} : ${suivante.titre}` : 'Commencer';
  $('#titre-accords').textContent = famille() === 'basse' ? 'Arpèges' : 'Accords';
  $('#compte-accords').textContent = famille() === 'basse' ? 'Fondamentale, tierce, quinte, octave.' : 'Schémas à toucher pour les entendre.';
  $('#titre-rythmes').textContent = famille() === 'basse' ? 'Grooves' : reglages.instrument === 'guitare_classique' ? 'Main droite' : 'Rythmiques';
  $('#compte-rythmes').textContent = famille() === 'basse' ? `${rythmiquesDe(reglages.instrument).length} lignes de basse avec la batterie.`
    : reglages.instrument === 'guitare_classique' ? `${rythmiquesDe(reglages.instrument).length} arpèges et accompagnements.`
    : `${rythmiquesDe(reglages.instrument).length} façons de gratter.`;
  $('#illus-parcours').innerHTML = ILLUS.parcours;
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
  const html = niveauxDe(reglages.instrument).map(nv => {
    const ls = LECONS().filter(l => l.niveau === nv.n);
    const f = ls.filter(l => P.estFaite(l.id)).length;
    return tuile({ href:'#/parcours/' + nv.n, illus:ILLUS.parcours, titre:nv.nom, coin:`Niveau ${nv.n}`,
      texte:`${ls.length} leçons — ${f} terminée${f > 1 ? 's' : ''}`, jauge:Math.round(f / ls.length * 100), grad:nv.grad });
  }).join('');
  ecranListe({ sur:inst().nom, titre:'Parcours', html:`<div class="rangee tuiles">${html}</div>` });
}
function ecranNiveau(n){
  const nv = niveauxDe(reglages.instrument).find(x => x.n === n);
  if (!nv) return ecranParcours();
  const suivante = prochaineLecon();
  const ls = LECONS();
  const cartes = ls.filter(l => l.niveau === n).map(l => itemCarte({
    liste:'lecon', it:l, num:ls.indexOf(l) + 1, meta:esc(l.objectif) + (l.sections && l.sections.some(x => x.tab) ? ' · <b>tablature</b>' : ''), aFaire:true, grad:nv.grad,
    classe:(P.estFaite(l.id) ? 'faite' : '') + (l === suivante ? ' prochaine' : '')
  })).join('');
  ecranListe({ sur:'Parcours · ' + inst().nom, titre:`${n}. ${nv.nom}`, retour:'#/parcours', html:`<div class="rangee">${cartes}</div>` });
}

/* --- rythmiques --- */
function ecranRythmiques(){
  const cartes = rythmiquesDe(reglages.instrument).map(r => itemCarte({ liste:'rythme', it:r, num:r.mesure, meta:esc(r.desc),
    grad:NIV_GRAD[Math.min(3, (r.niveau || 1) - 1)], bpm:r.bpm + ' BPM' })).join('');
  const titre = famille() === 'basse' ? 'Grooves' : reglages.instrument === 'guitare_classique' ? 'Main droite' : 'Rythmiques';
  ecranListe({ sur:inst().nom, titre, html:`<div class="rangee">${cartes}</div>` });
}

/* --- accords (bibliothèque) --- */
const FAMILLES_ACCORDS = [
  { id:'essentiels', nom:'Les essentiels', grad:['#34d399', '#059669'], accords:['C', 'D', 'E', 'G', 'A', 'Am', 'Dm', 'Em', 'F', 'G7', 'D7', 'E7', 'A7'] },
  { id:'majeurs', nom:'Majeurs', grad:['#38bdf8', '#2563eb'], accords:['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] },
  { id:'mineurs', nom:'Mineurs', grad:['#a78bfa', '#6d28d9'], accords:['Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'Bbm', 'Bm'] },
  { id:'septiemes', nom:'Septièmes', grad:['#fbbf24', '#e8590c'], accords:['C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7', 'Am7', 'Dm7', 'Em7', 'Cmaj7', 'Fmaj7', 'Gmaj7'] },
  { id:'couleurs', nom:'Sus, add9, 6', grad:['#f472b6', '#be185d'], accords:['Dsus2', 'Dsus4', 'Asus2', 'Asus4', 'Esus4', 'Gsus4', 'Cadd9', 'Em7', 'C6', 'A6'] },
  { id:'power', nom:'Power chords', grad:['#94a3b8', '#1e293b'], accords:['E5', 'F5', 'G5', 'A5', 'B5', 'C5', 'D5'], pour:['guitare_elec'] }
];
function ecranAccords(){
  const familles = FAMILLES_ACCORDS.filter(f => !f.pour || f.pour.includes(reglages.instrument));
  const html = familles.map(f => `
    <section class="groupe" id="acc-${f.id}">
      <div class="groupe-tete genre" style="${gradStyle(f.grad)}"><b>${f.nom}</b><span>${f.accords.length} accords</span></div>
      <div class="rangee schemas-rangee">${f.accords.map(a => {
        const svg = schemaAccord(reglages.instrument, a, { solfege:reglages.solfege, puissance:/5$/.test(a) });
        return svg ? `<button type="button" class="carte-schema" data-accord="${a}" style="${gradStyle(f.grad)}">${svg}</button>` : '';
      }).join('')}</div></section>`).join('');
  const sauts = familles.map(f => ['acc-' + f.id, f.nom, f.grad[1]]);
  ecranListe({ sur:inst().nom + (famille() === 'basse' ? ' · touche pour entendre l\'arpège' : ''), titre:famille() === 'basse' ? 'Arpèges' : 'Accords', html, sauts });
}
/* toucher un schéma : on entend l'accord (ou sa fondamentale à la basse) */
async function jouerAccord(nom, instId = reglages.instrument){
  await reprendreAudio();
  const i = INSTRUMENTS[instId];
  const t = ctxAudio().currentTime + 0.03;
  etoufferTout();
  if (i.famille === 'basse'){
    const b = notesBasse(nom);
    if (b) ['R', 3, 5, 8].forEach((k, i) => note('basse', b[k], t + i * 0.32, { velo:i ? 0.8 : 0.95, duree:0.3 }));
    return;
  }
  const f = forme(instId, nom, { puissance:/5$/.test(nom) });
  if (f) gratter(i, notesDe(instId, f), t, { vitesse:0.035, couche:'libre' });
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-accord]');
  if (b) jouerAccord(b.dataset.accord);
  const c = e.target.closest('.corde-btn');
  if (c){ reprendreAudio().then(() => jouerReference(+c.dataset.midi, inst().timbre)); }
});

/* --- progression --- */
function ecranProgression(){
  const histo = P.historique(21);
  const max = Math.max(10, ...histo.map(h => h.minutes));
  const nomDe = (liste, id) => { const it = (SOURCES[liste] ? SOURCES[liste]() : []).find(x => x.id === id); return it ? it.titre : null; };
  const lignes = s => P.elementsDe(s).map(e => ({ ...e, nom:nomDe(e.liste, e.id) })).filter(e => e.nom)
    .map(e => `<li><a href="#/jouer/${e.liste}/${encodeURIComponent(e.id)}"><span class="ls-cat">${e.liste === 'lecon' ? INSTRUMENTS[instrumentDe(TOUTES_LECONS.find(l => l.id === e.id))].court : LISTES[e.liste].nom}</span> <span class="ls-nom">${esc(e.nom)}</span></a></li>`).join('')
    || '<li class="muted small">Rien pour l\'instant.</li>';
  const faites = LECONS().filter(l => P.estFaite(l.id)).length;
  const html = `
    <div class="bloc bloc-stats"><h3>Bilan</h3><div class="stats">
      <div class="stat"><span class="stat-n">${P.minutesAujourdhui()}</span><span>min aujourd'hui</span></div>
      <div class="stat"><span class="stat-n">${P.serie()}</span><span>jours d'affilée</span></div>
      <div class="stat"><span class="stat-n">${faites}/${LECONS().length}</span><span>leçons (${inst().court.toLowerCase()})</span></div>
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
  let item = src().find(x => x.id === id);
  if (!item) return false;
  if (liste === 'lecon'){
    // une leçon appartient à la méthode d'un instrument : on passe sur cet instrument
    const i = instrumentDe(item);
    if (i && i !== reglages.instrument){ reglages.instrument = i; sauverReglages(); majChoixInstrument(); }
  } else if (liste === 'rythme'){
    item = rythmiquesDe(reglages.instrument).find(x => x.id === id) || item;
  }
  montrer('ecran-jouer');
  chargerElement(liste, item);
  return true;
}

function sectionsDe(liste, item){
  if (liste === 'atelier') return sectionsAtelier();
  return item.sections;
}

function chargerElement(liste, item, { garderTempo = false } = {}){
  if (lecteur.enLecture) lecteur.arreter();
  const def = LISTES[liste];
  const lecon = liste === 'lecon';
  courant = { liste, item };
  const items = def.items(item);
  const i = items.indexOf(item);
  $('#j-sur').textContent = lecon ? `Leçon ${i + 1} · ${inst().court}` : def.nom + ' · ' + inst().court;
  $('#j-titre').textContent = item.titre;
  $('#j-retour').href = def.retour(item);
  document.title = item.titre + ' — Mes Cordes';
  navLien('#j-prec', i > 0 ? lienJouer(liste, items[i - 1]) : null);
  navLien('#j-suiv', i >= 0 && i < items.length - 1 ? lienJouer(liste, items[i + 1]) : null);
  if (lecon) P.setDerniereLecon(item.id);
  majStatutBoutons();
  $('#j-grille').hidden = liste !== 'atelier';

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

  const sections = sectionsDe(liste, item);
  const mesureId = item.mesure || '4/4';
  courant.compile = compilerSections(sections, mesureId);
  const tab = courant.compile.avecTab;
  const o = lecteur.options;
  o.instrument = reglages.instrument;
  o.style = item.style || 'folk';
  o.mode = item.mode || 'grat';
  o.puissance = !!item.puissance && famille() === 'guitare';
  if (!garderTempo || tab){ o.transpo = 0; o.capo = famille() === 'guitare' && !tab ? (item.capo || 0) : 0; }
  // ce que l'appli fait entendre au départ : la leçon le dit, sinon selon l'instrument
  const c = item.couches || {};
  const basse = famille() === 'basse';
  o.accords = c.accords ?? !tab;
  o.basse = c.basse ?? liste === 'atelier';
  o.batterie = c.batterie ?? (liste === 'atelier' && (basse || reglages.instrument === 'guitare_elec'));
  o.melodie = true;
  o.clic = reglages.clic || !!c.clic;
  setSaturation(item.son === 'clair' ? false : reglages.sat);
  for (const [id, v] of [['#opt-accords', o.accords], ['#opt-basse', o.basse], ['#opt-batterie', o.batterie], ['#opt-exo', o.melodie], ['#opt-click', o.clic]]) majBascule($(id), v);
  $('#opt-exo').hidden = !tab;
  setCouche('accords', reglages.volAccords);
  setCouche('basse', reglages.volBasse);
  setCouche('batterie', reglages.volBatterie ?? 1);

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
  setSaturation(reglages.sat);
}

/* --- la grille à l'écran : sections, mesures, accords (ou tablature) --- */
function nomAffiche(nom){ return nom === 'N.C.' ? '' : afficherAccord(lecteur.nomJoue(nom), reglages.solfege); }
function rendreGrille(){
  const { mesures, sections, avecTab } = courant.compile;
  const res = MESURES[lecteur.mesureId];
  const pas = lecteur.pas;
  const nbCordes = inst().cordes.length;
  let html = avecTab ? '' : barreMainDroite();
  accordBarre = null; pasAllume = null; tabAllumees = []; mancheAffiche = null;
  sections.forEach((s, si) => {
    html += `<div class="g-section" data-section="${si}"><h3 class="g-titre">${esc(s.nom)}${s.rep > 1 ? ` <em>×${s.rep}</em>` : ''}</h3><div class="g-mesures${avecTab ? ' tabs' : ''}">`;
    for (let k = s.debut; k < s.fin; k++){
      const m = mesures[k];
      const accords = `<div class="g-accords">${m.accords.map(a => `<b>${esc(nomAffiche(a.nom))}</b>`).join('')}</div>`;
      if (m.tab){
        // tablature : une ligne par corde (corde 1 en haut), un pas par colonne
        let cases = '';
        for (let p = 0; p < pas; p++){
          const notes = m.tab[p];
          for (let c = 1; c <= nbCordes; c++){
            const n = notes.find(x => x.corde === c);
            if (n) cases += `<span class="t-n" data-p="${p}" style="grid-column:${p + 1};grid-row:${c}">${n.case}${n.mod ? `<sup>${n.mod}</sup>` : ''}</span>`;
          }
        }
        const temps = Array.from({ length:res.beats }, (_, b) => `<i style="grid-column:${b * res.res + 1} / span ${res.res}"></i>`).join('');
        html += `<div class="g-mesure tab" data-m="${k}" style="--pas:${pas};--cordes:${nbCordes}">${accords}
          <div class="t-grille">${Array.from({ length:nbCordes }, (_, c) => `<span class="t-corde" style="grid-row:${c + 1}"></span>`).join('')}${cases}<span class="t-curseur"></span></div>
          <div class="g-temps t-temps">${temps}</div><span class="g-prog"></span></div>`;
      } else {
        html += `<div class="g-mesure${m.accords.length > 1 ? ' double' : ''}" data-m="${k}">${accords}
          <div class="g-temps">${Array.from({ length:res.beats }, () => '<i></i>').join('')}</div>
          <span class="g-prog"></span></div>`;
      }
    }
    html += '</div></div>';
  });
  $('#grille-accords').innerHTML = html;
  $('#grille-accords').classList.toggle('en-tab', !!avecTab);
  $('#grille-accords').scrollTop = 0;
  mesureActive = -1;
}
$('#grille-accords').addEventListener('click', e => {
  const c = e.target.closest('.g-mesure');
  if (!c || !courant || !courant.compile || lecteur.enLecture) return;
  const m = +c.dataset.m;
  const me = courant.compile.mesures[m];
  majDiagrammes(m, 0);
  activerMesure(m, false);
  if (me.tab) jouerMesureTab(me);
  else jouerAccord(lecteur.nomJoue(me.accords[0].nom), reglages.instrument);
});
/* toucher une mesure de tablature : on l'entend, au tempo */
async function jouerMesureTab(me){
  await reprendreAudio();
  const t0 = ctxAudio().currentTime + 0.05;
  const i = inst();
  etoufferTout();
  me.tab.forEach((notes, p) => notes.forEach(n => {
    const midi = i.cordes[i.cordes.length - n.corde] + n.case;
    note(i.timbre, midi, t0 + p * lecteur.dureePas, { couche:'libre', etouffe:n.mod === 'x', bend:n.mod === 'b' ? 2 : 0, velo:0.85 });
  }));
}

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

/* --- diagrammes : accord en cours et suivant, ou le manche de l'exercice --- */
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
/* toutes les positions de la tablature d'une section (pour dessiner le manche) */
function positionsSection(m){
  const secs = courant.compile.sections;
  const s = secs.find(x => m >= x.debut && m < x.fin) || secs[0];
  const vues = new Map();
  for (let k = s.debut; k < s.fin; k++){
    const me = courant.compile.mesures[k];
    if (me.tab) for (const notes of me.tab) for (const n of notes) vues.set(n.corde + '.' + n.case, n);
  }
  return { cle:s.debut, positions:[...vues.values()] };
}
let mancheAffiche = null;
function majDiagrammes(m, p){
  if (!courant || !courant.compile) return;
  const me = courant.compile.mesures[m];
  if (me && me.tab){
    // exercice en tablature : le manche avec toutes les notes de la section, la note jouée s'allume
    const { cle, positions } = positionsSection(m);
    if (mancheAffiche !== cle){
      mancheAffiche = cle;
      $('#diag-actuel').innerHTML = schemaPositions(reglages.instrument, positions, { solfege:reglages.solfege });
    }
    const nom = accordA(m, p);
    accordAffiche = nom;
    $('#diag-suivant').parentElement.hidden = famille() === 'basse' || nom === 'N.C.';
    if (nom !== 'N.C.') $('#diag-suivant').innerHTML = schemaAccord(reglages.instrument, nom, { puissance:lecteur.options.puissance, solfege:reglages.solfege, titre:true }) || '';
    $('.diag-suivant .surtitre').textContent = 'Accord';
    return;
  }
  mancheAffiche = null;
  $('#diag-suivant').parentElement.hidden = false;
  $('.diag-suivant .surtitre').textContent = 'Ensuite';
  const nom = accordA(m, p);
  accordAffiche = nom;
  if (!nom) return;
  const suivant = suivantApres(m, p);
  const pw = lecteur.options.puissance;
  const joue = lecteur.nomJoue(nom);
  $('#diag-actuel').innerHTML = schemaAccord(reglages.instrument, joue, { puissance:pw, solfege:reglages.solfege }) || `<p class="sc-inconnu">${esc(joue)}</p>`;
  $('#diag-suivant').innerHTML = suivant ? (schemaAccord(reglages.instrument, lecteur.nomJoue(suivant), { puissance:pw, solfege:reglages.solfege }) || '') : '';
}
/* pendant la lecture d'une tablature : la note jouée s'allume dans la tablature et sur le manche */
let tabAllumees = [];
function allumerTab(c){
  const me = courant && courant.compile && courant.compile.mesures[c.mesure];
  if (!me || !me.tab) return;
  const notes = me.tab[c.p];
  if (!notes || !notes.length) return;
  tabAllumees.forEach(e => e.classList.remove('on'));
  const bloc = $('#grille-accords').querySelector(`[data-m="${c.mesure}"]`);
  tabAllumees = bloc ? [...bloc.querySelectorAll(`.t-n[data-p="${c.p}"]`)] : [];
  if (mancheAffiche !== positionsSection(c.mesure).cle) majDiagrammes(c.mesure, c.p);
  for (const n of notes){ const d = $('#diag-actuel').querySelector(`[data-pos="${n.corde}.${n.case}"]`); if (d) tabAllumees.push(d); }
  tabAllumees.forEach(e => e.classList.add('on'));
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
    if (courant.compile && courant.compile.avecTab) h += `<h3>Lire la tablature</h3><p class="small">Chaque ligne est une corde (la plus aiguë en haut), le chiffre est la case à jouer (0 = corde à vide). Touche une mesure pour l'entendre. Le manche à droite montre où poser les doigts, et la note jouée s'allume.</p>
      <p class="small">Bouton <b>note</b> (en bas) : entendre l'exercice ou le couper pour le jouer seul.</p>`;
  } else if (l === 'rythme'){
    h = `<h2>${esc(it.titre)}</h2><p>${esc(it.desc)}</p>` + (famille() === 'basse'
      ? `<h3>Ligne de basse</h3><p class="small">En haut de la grille : F = fondamentale, 3 = tierce, 5 = quinte, 6 = sixte, 7 = septième, 8 = octave, avec le nom de la note pour l'accord en cours. Écoute avec le bouton basse, puis coupe-le et joue.</p>`
      : lectureRythme(it.style, it.mesure));
  } else {
    h = `<h2>Atelier</h2><p>Écris ta propre grille (icône texte) : les accords et la mesure. Choisis ensuite la rythmique et le tempo dans les réglages, et joue par-dessus.</p>`;
  }
  $('#aide-corps').innerHTML = h;
  const accords = courant.compile ? [...new Set(courant.compile.mesures.flatMap(m => m.accords.map(a => a.nom)))].filter(a => a !== 'N.C.') : [];
  $('#aide-accords').innerHTML = accords.map(a => {
    const joue = lecteur.nomJoue(a);
    const svg = schemaAccord(reglages.instrument, joue, { puissance:lecteur.options.puissance, solfege:reglages.solfege });
    return svg ? `<button type="button" class="carte-schema" data-accord="${esc(joue)}">${svg}</button>` : '';
  }).join('');
}
/* barre « main droite » en haut de la grille : le motif de la mesure, qui s'allume en direct.
 * À la basse, c'est la ligne de basse du style, avec le nom des notes de l'accord en cours. */
const SIG_GRAT = { D:'↓', U:'↑', d:'↓', x:'✕', P:'↓', k:'↓', B:'B', b:'b', '0':'B', '1':'b', '-':'·' };
const SIG_ARP = { '0':'p', '1':'p', c:'i', b:'m', a:'a', '-':'·' };
const EM_GRAT = { P:'PM', x:'étouffé', k:'bref' };
function barreMainDroite(){
  const o = lecteur.options, mesure = lecteur.mesureId;
  const s = STYLES[o.style], p = s && (s[mesure] || null);
  if (!p) return '';
  const res = MESURES[mesure].res;
  const basse = famille() === 'basse';
  const motif = basse ? p.basse : o.mode === 'arp' ? p.arp : p.grat;
  const nom = basse ? 'Ligne de basse' : o.mode === 'arp' ? 'Arpège' : 'Grattage';
  const signe = c => basse ? (c === '-' ? '·' : c === 'R' ? 'F' : c) : ((o.mode === 'arp' ? SIG_ARP : SIG_GRAT)[c] || c);
  const sous = (c, i) => !basse && o.mode !== 'arp' && EM_GRAT[c] ? EM_GRAT[c] : i % res === 0 ? i / res + 1 : res === 2 ? 'et' : '';
  return `<div class="main-droite${basse ? ' basse' : ''}" id="main-droite"><span class="md-lbl">${nom}<em>${esc(s.nom)}</em></span>${[...motif].map((c, i) =>
    `<span class="rv-case${i % res === 0 ? ' temps' : ''}${c === '-' ? ' vide' : ''}" data-s="${c}"><b>${signe(c)}</b><em>${sous(c, i)}</em><small></small></span>`).join('')}</div>`;
}
let pasAllume = null, accordBarre = null;   // remis à zéro à chaque nouvelle grille
function allumerPas(p, accord){
  const cases = document.querySelectorAll('#main-droite .rv-case');
  // basse : sous chaque signe, le nom de la note pour l'accord en cours
  if (famille() === 'basse' && accord && accord !== accordBarre){
    accordBarre = accord;
    const b = notesBasse(lecteur.nomJoue(accord));
    cases.forEach(c => { const k = c.dataset.s; c.querySelector('small').textContent = b && b[k] != null ? nomClasse(b[k], reglages.solfege) : ''; });
  }
  if (pasAllume) pasAllume.classList.remove('on');
  pasAllume = cases[p] || null;
  if (pasAllume) pasAllume.classList.add('on');
}
/* la rythmique écrite en toutes lettres : ↓ ↑ par temps */
function lectureRythme(styleId, mesure){
  const s = STYLES[styleId], p = s && s[mesure];
  if (!p) return '';
  const res = MESURES[mesure].res;
  const SIG = { D:'↓', U:'↑', d:'↓', x:'✕', P:'↓', k:'↓', B:'B', b:'b', '0':'B', '1':'b', '-':'·' };
  const cases = [...p.grat].map((c, i) => `<span class="rv-case${i % res === 0 ? ' temps' : ''}"><b>${SIG[c] || c}</b><em>${i % res === 0 ? i / res + 1 : res === 2 ? 'et' : ''}</em></span>`).join('');
  return `<h3>Main droite</h3><div class="rythme-vis">${cases}</div>
    <p class="small muted">↓ vers le bas · ↑ vers le haut · ✕ corde étouffée · B basse seule · · on ne touche pas les cordes (la main continue son mouvement).</p>`;
}

/* ================= réglages du lecteur ================= */
function majReglagesLecteur(){
  const o = lecteur.options;
  const styles = stylesPour(lecteur.mesureId, reglages.instrument);
  if (!styles.includes(o.style) && STYLES[o.style]) styles.unshift(o.style);
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
  $('#vol-batterie').value = reglages.volBatterie ?? 1;
  const tab = courant && courant.compile && courant.compile.avecTab;
  $('#bloc-tonalite').hidden = !!tab;
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
$('#vol-batterie').addEventListener('input', e => { reglages.volBatterie = +e.target.value; setCouche('batterie', reglages.volBatterie); sauverReglages(); });

/* ================= transport ================= */
function majBascule(el, on){ el.classList.toggle('actif', on); el.setAttribute('aria-pressed', on); }
majBascule($('#opt-click'), reglages.clic);
$('#opt-click').addEventListener('click', () => { reglages.clic = lecteur.options.clic = !lecteur.options.clic; majBascule($('#opt-click'), reglages.clic); sauverReglages(); });
$('#opt-batterie').addEventListener('click', () => { lecteur.options.batterie = !lecteur.options.batterie; majBascule($('#opt-batterie'), lecteur.options.batterie); });
$('#opt-exo').addEventListener('click', () => {
  lecteur.options.melodie = !lecteur.options.melodie;
  majBascule($('#opt-exo'), lecteur.options.melodie);
  if (!lecteur.options.melodie) annoncer('À toi de jouer l\'exercice');
});
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
$('#j-grille').addEventListener('click', () => {
  if (!courant || courant.liste !== 'atelier') return;
  $('#atelier-texte').value = atelier.texte;
  $('#atelier-mesure').value = atelier.mesure;
  $('#atelier-erreur').textContent = '';
  ouvrirVolet('volet-grille');
});
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
