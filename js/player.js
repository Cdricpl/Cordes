/* Lecteur d'accompagnement : planification audio précise (lookahead) + suivi visuel.
 * Il joue une suite de mesures (chaque mesure = un ou deux accords) avec une rythmique
 * de grattage ou d'arpège pour l'instrument choisi, et une ligne de basse si on le demande. */
import { reprendreAudio, ctxAudio, clic, gratter, note, etouffer, etoufferTout } from './audio.js';
import { MESURES, pasParMesure, patronsPour, accordAuPas } from './rythmes.js';
import { forme, notesDe } from './accords.js';
import { analyserAccord, transposer, mod12 } from './theorie.js';
import { INSTRUMENTS } from './instruments.js';

const LOOKAHEAD = 0.12;   // secondes planifiées à l'avance
const TICK = 25;          // ms entre deux réveils du planificateur

/* Notes de basse d'un accord : fondamentale dans la zone grave (Mi1 = 28 … Ré#2 = 39) */
export function notesBasse(nom, capo = 0){
  const a = analyserAccord(nom);
  if (!a) return null;
  const r = mod12((a.basse != null ? a.basse : a.racine) + capo);
  let base = 28 + mod12(r - 28);
  const tierce = a.type.tierce || 4;
  return { R:base, 3:base + tierce, 5:base + 7, 6:base + 9, 8:base + 12 };
}

export class Lecteur {
  constructor(cb = {}){
    this.cb = cb;                 // {onPos, onMesure, onBoucle, onFin, onCompte, onTempo, onPas}
    this.mesures = [];
    this.mesureId = '4/4';
    this.bpm = 80;
    this.enLecture = false;
    this.options = {
      boucle:true, decompte:true, clic:false,
      accords:true, basse:false,          // couches jouées par l'appli
      instrument:'guitare_elec',          // instrument qui joue les accords
      style:'folk', mode:'grat',          // 'grat' (grattage) ou 'arp' (arpège)
      capo:0, transpo:0, puissance:false, // capodastre, transposition, power chords
      rampe:null
    };
    this.file = [];
    this.timer = null;
    this.raf = null;
  }

  /* mesures : résultat de compilerSections().mesures */
  charger(mesures, mesureId = '4/4'){
    this.mesures = mesures;
    this.mesureId = mesureId;
    this.pas = pasParMesure(mesureId);
    this.res = MESURES[mesureId].res;
    this.total = mesures.length * this.pas;
    this.plage = null;
    this._voicings = new Map();
  }
  get debutPlage(){ return this.plage ? this.plage.debut * this.pas : 0; }
  get finPlage(){ return this.plage ? this.plage.fin * this.pas : this.total; }
  setPlage(debutMesure, finMesure){
    this.plage = debutMesure == null ? null : { debut:Math.max(0, debutMesure), fin:Math.min(this.mesures.length, finMesure) };
  }
  get dureePas(){ return 60 / this.bpm / this.res; }
  get dureeTemps(){ return 60 / this.bpm; }
  setTempo(bpm){
    this.bpm = Math.max(30, Math.min(240, Math.round(bpm)));
    this.cb.onTempo && this.cb.onTempo(this.bpm);
  }
  /* après un changement d'instrument, de capo, de transposition… */
  invalider(){ this._voicings = new Map(); }

  /* nom d'accord tel qu'on le joue (transposé) */
  nomJoue(nom){ return transposer(nom, this.options.transpo); }

  /* notes jouées pour un accord donné (mémorisées) */
  voicing(nom){
    const o = this.options;
    const cle = `${nom}|${o.instrument}|${o.transpo}|${o.capo}|${o.puissance}`;
    let v = this._voicings.get(cle);
    if (v) return v;
    const jouee = this.nomJoue(nom);
    const inst = INSTRUMENTS[o.instrument];
    // un accordeur de basse ne « gratte » pas : pour la basse, les accords sont joués à la guitare acoustique
    const famille = inst.famille === 'basse' ? INSTRUMENTS.guitare_classique : inst;
    const f = forme(famille.id, jouee, { puissance:o.puissance && famille.famille === 'guitare' });
    const notes = f ? notesDe(famille.id, f, o.capo) : [];
    v = { notes, basse:notesBasse(jouee, o.capo), nom:jouee, famille };
    this._voicings.set(cle, v);
    return v;
  }

  async basculer(){ this.enLecture ? this.arreter() : await this.demarrer(); }

  async demarrer(){
    if (!this.mesures.length || this.enLecture) return;
    const ctx = await reprendreAudio();
    this.enLecture = true;
    this.boucles = 0;
    this.step = this.debutPlage;
    this.file = [];
    this._dernier = null;
    this.compteRestant = this.options.decompte ? MESURES[this.mesureId].beats : 0;
    this.prochain = ctx.currentTime + 0.12;
    this.debutBoucle = this.prochain + this.compteRestant * this.dureeTemps;
    this.timer = setInterval(() => this._planifier(), TICK);
    this._planifier();
    this._suivre();
  }

  arreter(){
    this.enLecture = false;
    clearInterval(this.timer); this.timer = null;
    cancelAnimationFrame(this.raf); this.raf = null;
    this.file = [];
    etoufferTout();
    this.cb.onPos && this.cb.onPos(null);
    this.cb.onFin && this.cb.onFin();
  }

  _planifier(){
    const ctx = ctxAudio();
    if (!ctx || !this.enLecture) return;
    const limite = ctx.currentTime + LOOKAHEAD;
    const beats = MESURES[this.mesureId].beats;

    while (this.prochain < limite){
      if (this.compteRestant > 0){
        const n = beats - this.compteRestant + 1;
        clic(this.prochain, n === 1 ? 2 : 1);
        this.file.push({ compte:n, temps:this.prochain });
        this.prochain += this.dureeTemps;
        this.compteRestant--;
        if (this.compteRestant === 0) this.debutBoucle = this.prochain;
        continue;
      }
      const s = this.step;
      const m = Math.floor(s / this.pas), p = s % this.pas;
      const mesure = this.mesures[m];
      if (s === this.debutPlage) this.debutBoucle = this.prochain;

      this._jouerPas(mesure, m, p, this.prochain);

      if (this.options.clic){
        if (p % this.res === 0) clic(this.prochain, p === 0 ? 2 : 1);
      }
      this.file.push({ step:s, mesure:m, p, temps:this.prochain, duree:this.dureePas, accord:accordAuPas(mesure, p).nom });

      this.prochain += this.dureePas;
      this.step++;
      if (this.step >= this.finPlage){
        this.step = this.debutPlage;
        this.boucles++;
        const r = this.options.rampe;
        if (r && this.boucles % r.chaque === 0 && this.bpm < r.max) this.setTempo(Math.min(r.max, this.bpm + r.pas));
        if (!this.options.boucle){
          this.file.push({ fin:true, temps:this.prochain });
          clearInterval(this.timer); this.timer = null;
          return;
        }
      }
    }
  }

  _jouerPas(mesure, m, p, t){
    const o = this.options;
    const acc = accordAuPas(mesure, p);
    const v = this.voicing(acc.nom);
    const pat = patronsPour(o.style, this.mesureId);
    const debutAccord = p === acc.pas;
    if (debutAccord && o.accords) etouffer('accords', t);      // l'accord précédent s'arrête

    if (o.accords && v.notes.length){
      const inst = v.famille;
      const signe = (o.mode === 'arp' ? pat.arp : pat.grat)[p] || '-';
      const tri = [...v.notes];          // dans l'ordre des cordes : on trie par hauteur
      tri.sort((a, b) => a - b);
      if (o.mode === 'arp'){
        let idx = -1;
        if (signe === '0') idx = 0;
        else if ('abc'.includes(signe)) idx = tri.length - 1 - 'abc'.indexOf(signe);
        else if (/\d/.test(signe)) idx = Math.min(+signe, tri.length - 1);
        if (idx >= 0) note(inst.timbre, tri[Math.max(0, Math.min(tri.length - 1, idx))], t, { couche:'accords', velo:signe === '0' ? 0.9 : 0.68 });
      } else if (signe !== '-'){
        if (signe === 'D') { etouffer('accords', t); gratter(inst, v.notes, t, { sens:'D', velo:p === 0 ? 0.95 : 0.78 }); }
        else if (signe === 'U') gratter(inst, v.notes, t, { sens:'U', velo:0.6 });
        else if (signe === 'd') { etouffer('accords', t); gratter(inst, v.notes, t, { sens:'d', velo:0.62 }); }
        else if (signe === 'x') gratter(inst, v.notes, t, { sens:'D', velo:0.7, etouffe:true, vitesse:0.004 });
        else if (signe === 'B' || signe === 'b'){
          etouffer('accords', t);
          const grave = signe === 'B' ? tri[0] : (tri[1] !== undefined ? tri[1] : tri[0]);
          note(inst.timbre, grave, t, { couche:'accords', velo:0.85 });
        }
        else if (signe === '0') note(inst.timbre, tri[0], t, { couche:'accords', velo:0.85 });
      }
    }

    if (o.basse && v.basse){
      const b = pat.basse[p] || '-';
      const m = v.basse[b];
      if (m != null && b !== '-'){
        etouffer('basse', t, 0.015);
        note('basse', m, t, { couche:'basse', velo:b === 'R' && p === 0 ? 0.95 : 0.8 });
      }
    }
  }

  /* Instant audio réellement entendu (horodatage de requestAnimationFrame), lissé. */
  _tempsVisuel(ctx, image){
    const maintenant = performance.now();
    let brut = ctx.currentTime - (ctx.outputLatency || 0) - (maintenant - image) / 1000;
    if (ctx.getOutputTimestamp){
      const ts = ctx.getOutputTimestamp();
      if (ts && ts.performanceTime > 0 && ts.contextTime > 0) brut = ts.contextTime + (image - ts.performanceTime) / 1000;
    }
    const ecart = brut - image / 1000;
    if (this._ecart == null || Math.abs(ecart - this._ecart) > 0.05) this._ecart = ecart;
    else this._ecart += (ecart - this._ecart) * 0.04;
    let t = image / 1000 + this._ecart;
    if (this._tPrec != null && t < this._tPrec) t = this._tPrec;
    this._tPrec = t;
    return t;
  }

  _suivre(){
    this._tPrec = null; this._ecart = null;
    const boucle = image => {
      const ctx = ctxAudio();
      if (!ctx || !this.enLecture) return;
      const now = this._tempsVisuel(ctx, image ?? performance.now());
      while (this.file.length && this.file[0].temps <= now){
        const c = this.file.shift();
        if (c.fin){ this.arreter(); return; }
        if (c.compte){ this.cb.onCompte && this.cb.onCompte(c.compte); continue; }
        if (c.step === this.debutPlage) this.cb.onBoucle && this.cb.onBoucle(this.boucles);
        if (c.p === 0 || !this._dernier || this._dernier.mesure !== c.mesure) this.cb.onMesure && this.cb.onMesure(c.mesure);
        this.cb.onPas && this.cb.onPas(c);
        this._dernier = c;
      }
      if (this._dernier){
        const frac = Math.min(0.999, Math.max(0, (now - this._dernier.temps) / this._dernier.duree));
        this.cb.onPos && this.cb.onPos(this._dernier.step + frac, this._dernier);
      }
      this.raf = requestAnimationFrame(boucle);
    };
    this.raf = requestAnimationFrame(boucle);
  }
}
