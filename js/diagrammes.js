/* Dessins en SVG : schéma d'accord, manche de basse, cordes à vide, illustrations. */
import { INSTRUMENTS } from './instruments.js';
import { forme, positionsBasse } from './accords.js';
import { nomClasse, analyserAccord, afficherAccord, mod12 } from './theorie.js';

const echapper = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));

/* Schéma d'accord vertical : cordes verticales (grave à gauche), cases horizontales.
 * Renvoie le SVG en texte ; null si l'accord est inconnu. */
export function schemaAccord(instId, nom, { puissance = false, titre = true, solfege = false } = {}){
  const inst = INSTRUMENTS[instId];
  if (inst.famille === 'basse') return schemaBasse(instId, nom, { titre, solfege });
  const f = forme(instId, nom, { puissance });
  if (!f) return null;
  const n = inst.cordes.length, cases = 4;
  const ecart = 20, hautCase = 24, x0 = 26, y0 = titre ? 46 : 22;
  const larg = x0 * 2 + ecart * (n - 1), haut = y0 + hautCase * cases + 22;
  let s = `<svg class="schema" viewBox="0 0 ${larg} ${haut}" role="img" aria-label="Accord ${echapper(nom)}">`;
  if (titre) s += `<text class="sc-nom" x="${larg / 2}" y="24" text-anchor="middle">${echapper(afficherAccord(nom, solfege))}</text>`;
  // sillet ou numéro de case
  if (f.base === 1) s += `<rect class="sc-sillet" x="${x0 - 2}" y="${y0 - 5}" width="${ecart * (n - 1) + 4}" height="5" rx="1.5"/>`;
  else s += `<text class="sc-case" x="${x0 - 9}" y="${y0 + hautCase * 0.62}" text-anchor="end">${f.base}</text>`;
  for (let k = 0; k <= cases; k++) s += `<line class="sc-frette" x1="${x0}" x2="${x0 + ecart * (n - 1)}" y1="${y0 + k * hautCase}" y2="${y0 + k * hautCase}"/>`;
  for (let i = 0; i < n; i++) s += `<line class="sc-corde" x1="${x0 + i * ecart}" x2="${x0 + i * ecart}" y1="${y0}" y2="${y0 + cases * hautCase}" stroke-width="${inst.famille === 'ukulele' ? 1.4 : 1 + (n - 1 - i) * 0.25}"/>`;
  // barré : même case minimale sur plusieurs cordes
  const frettees = f.cases.map((c, i) => [c, i]).filter(([c]) => c > 0);
  const mini = frettees.length ? Math.min(...frettees.map(([c]) => c)) : 0;
  const surMini = frettees.filter(([c]) => c === mini).map(([, i]) => i);
  const barre = surMini.length >= 3 && f.cases.slice(surMini[0]).every(c => c >= mini || c < 0);
  if (barre){
    const y = y0 + (mini - f.base + 0.5) * hautCase;
    s += `<rect class="sc-doigt" x="${x0 + surMini[0] * ecart - 8}" y="${y - 8}" width="${(surMini[surMini.length - 1] - surMini[0]) * ecart + 16}" height="16" rx="8"/>`;
  }
  const a = analyserAccord(nom);
  f.cases.forEach((c, i) => {
    const x = x0 + i * ecart;
    const note = inst.cordes[i] + Math.max(0, c);
    const racine = a && c >= 0 && mod12(note) === (a.basse != null ? a.basse : a.racine);
    if (c < 0) s += `<text class="sc-x" x="${x}" y="${y0 - 10}" text-anchor="middle">×</text>`;
    else if (c === 0) s += `<circle class="sc-vide${racine ? ' racine' : ''}" cx="${x}" cy="${y0 - 14}" r="5"/>`;
    else if (!(barre && c === mini)){
      const y = y0 + (c - f.base + 0.5) * hautCase;
      s += `<circle class="sc-doigt${racine ? ' racine' : ''}" cx="${x}" cy="${y}" r="8"/>`;
    }
  });
  // nom des cordes sous le schéma
  inst.lettres.forEach((l, i) => { s += `<text class="sc-lettre" x="${x0 + i * ecart}" y="${haut - 5}" text-anchor="middle">${solfege ? nomClasse(inst.cordes[i], true) : l}</text>`; });
  return s + '</svg>';
}

/* Basse : un morceau de manche horizontal (cases 0 à 7) avec fondamentale, tierce, quinte, octave */
export function schemaBasse(instId, nom, { titre = true, solfege = false } = {}){
  const inst = INSTRUMENTS[instId];
  const pos = positionsBasse(instId, nom);
  if (!pos.length) return null;
  const n = inst.cordes.length, cases = 7;
  const lc = 30, ec = 20, x0 = 26, y0 = titre ? 40 : 14;
  const larg = x0 + lc * cases + 16, haut = y0 + ec * (n - 1) + 26;
  let s = `<svg class="schema basse" viewBox="0 0 ${larg} ${haut}" role="img" aria-label="Basse : ${echapper(nom)}">`;
  if (titre) s += `<text class="sc-nom" x="${larg / 2}" y="24" text-anchor="middle">${echapper(afficherAccord(nom, solfege))}</text>`;
  s += `<rect class="sc-sillet" x="${x0 - 3}" y="${y0 - 4}" width="5" height="${ec * (n - 1) + 8}" rx="1.5"/>`;
  for (let k = 1; k <= cases; k++) s += `<line class="sc-frette" x1="${x0 + k * lc}" x2="${x0 + k * lc}" y1="${y0}" y2="${y0 + ec * (n - 1)}"/>`;
  [3, 5, 7].forEach(k => { s += `<circle class="sc-repere" cx="${x0 + (k - 0.5) * lc}" cy="${y0 + ec * (n - 1) / 2}" r="3"/>`; });
  // la corde grave en bas, comme sur une tablature
  for (let i = 0; i < n; i++){
    const y = y0 + (n - 1 - i) * ec;
    s += `<line class="sc-corde" x1="${x0}" x2="${x0 + lc * cases}" y1="${y}" y2="${y}" stroke-width="${1.2 + (n - 1 - i) * 0.4}"/>`;
    s += `<text class="sc-lettre" x="${x0 - 12}" y="${y + 4}" text-anchor="middle">${solfege ? nomClasse(inst.cordes[i], true) : inst.lettres[i]}</text>`;
  }
  for (const p of pos){
    const y = y0 + (n - 1 - p.corde) * ec;
    const x = p.case === 0 ? x0 - 0 : x0 + (p.case - 0.5) * lc;
    s += `<circle class="sc-doigt ${p.role === 'R' ? 'racine' : 'autre'}" cx="${x}" cy="${y}" r="8"/>`;
    s += `<text class="sc-role" x="${x}" y="${y + 3.5}" text-anchor="middle">${p.role === 'R' ? 'F' : p.role}</text>`;
  }
  return s + '</svg>';
}

/* Les cordes à vide, à toucher pour les entendre (leçon 1, accordeur) */
export function cordesAVide(instId, solfege = false){
  const inst = INSTRUMENTS[instId];
  const n = inst.cordes.length;
  return `<div class="cordes-vide">${inst.cordes.map((m, i) => `
    <button type="button" class="corde-btn" data-midi="${m}" data-i="${i}">
      <span class="cv-num">${n - i}</span>
      <b>${solfege ? nomClasse(m, true) : inst.lettres[i]}</b>
      <span class="cv-oct">${nomClasse(m)}${Math.floor(m / 12) - 1}</span>
    </button>`).join('')}</div>`;
}

/* ================= illustrations des cartes ================= */
export function illusInstrument(id){
  switch (INSTRUMENTS[id].famille){
    case 'basse': return `<svg viewBox="0 0 200 90"><rect x="4" y="36" width="126" height="16" rx="4" fill="var(--ill-2)"/><path d="M128 22c14-10 40-12 56 0 10 8 12 22 4 30-6 6-4 16-14 22-18 12-40 6-48-6z" fill="var(--ill-1)"/><g stroke="var(--ill-3)" stroke-width="1.6">${[40, 44, 48, 52].map((y, i) => `<line x1="4" x2="190" y1="${y - 2 + i * 0}" y2="${y - 2}"/>`).join('')}</g><rect x="0" y="30" width="10" height="28" rx="3" fill="var(--ill-1)"/></svg>`;
    case 'ukulele': return `<svg viewBox="0 0 200 90"><rect x="10" y="38" width="92" height="14" rx="4" fill="var(--ill-2)"/><path d="M100 28c10-8 26-8 34 2 6-6 22-8 34 0 14 10 14 30 0 40-12 8-28 6-34 0-8 10-24 10-34 2z" fill="var(--ill-1)"/><circle cx="140" cy="45" r="9" fill="var(--ill-fond)" stroke="var(--ill-3)"/><g stroke="var(--ill-3)" stroke-width="1.4">${[41, 44, 47, 50].map(y => `<line x1="10" x2="172" y1="${y}" y2="${y}"/>`).join('')}</g><rect x="2" y="32" width="14" height="26" rx="4" fill="var(--ill-1)"/></svg>`;
    default: {
      const elec = INSTRUMENTS[id].timbre === 'elec';
      const corps = elec
        ? '<path d="M96 30c20-18 50-22 70-10 14 8 8 20 18 26-8 6-2 20-18 26-22 10-52 4-70-12z" fill="var(--ill-1)"/><rect x="128" y="36" width="8" height="20" rx="2" fill="var(--ill-3)"/><rect x="148" y="36" width="8" height="20" rx="2" fill="var(--ill-3)"/>'
        : '<path d="M92 24c14-10 34-8 44 2 8-10 30-12 46 0 18 14 18 38 0 50-16 12-38 10-46 0-10 10-30 12-44 2z" fill="var(--ill-1)"/><circle cx="130" cy="46" r="11" fill="var(--ill-fond)" stroke="var(--ill-3)"/>';
      return `<svg viewBox="0 0 200 90"><rect x="12" y="38" width="92" height="14" rx="4" fill="var(--ill-2)"/>${corps}<g stroke="var(--ill-3)" stroke-width="1.2">${[40, 42.5, 45, 47.5, 50].map(y => `<line x1="12" x2="178" y1="${y}" y2="${y}"/>`).join('')}</g><rect x="2" y="32" width="14" height="26" rx="4" fill="var(--ill-1)"/></svg>`;
    }
  }
}
export const ILLUS = {
  parcours:'<svg viewBox="0 0 200 110"><path d="M10 96 C60 96 60 60 100 60 S140 20 190 18" fill="none" stroke="var(--ill-3)" stroke-width="5" stroke-dasharray="2 10" stroke-linecap="round"/><circle cx="10" cy="96" r="10" fill="var(--ill-1)"/><circle cx="100" cy="60" r="10" fill="var(--ill-2)"/><circle cx="190" cy="18" r="12" fill="var(--ill-1)"/></svg>',
  accords:'<svg viewBox="0 0 120 110"><rect x="18" y="14" width="84" height="6" rx="2" fill="var(--ill-1)"/><g stroke="var(--ill-2)" stroke-width="2">' + [0, 1, 2, 3, 4, 5].map(i => `<line x1="${22 + i * 15.2}" x2="${22 + i * 15.2}" y1="20" y2="100"/>`).join('') + '</g><g stroke="var(--ill-3)" stroke-width="2">' + [40, 60, 80, 100].map(y => `<line x1="20" x2="100" y1="${y}" y2="${y}"/>`).join('') + '</g><circle cx="52.4" cy="50" r="8" fill="var(--ill-1)"/><circle cx="67.6" cy="50" r="8" fill="var(--ill-1)"/><circle cx="37.2" cy="70" r="8" fill="var(--ill-1)"/></svg>',
  rythmes:'<svg viewBox="0 0 160 110"><g fill="var(--ill-1)">' + [0, 1, 2, 3].map(i => `<path d="M${20 + i * 34} 80 l12 -46 l6 0 l-12 46z" opacity="${i % 2 ? 0.6 : 1}"/>`).join('') + '</g><g fill="var(--ill-2)">' + [0, 1, 2, 3].map(i => `<circle cx="${26 + i * 34}" cy="${i % 2 ? 30 : 90}" r="5"/>`).join('') + '</g></svg>',
  accordeur:'<svg viewBox="0 0 160 110"><path d="M20 90a60 60 0 0 1 120 0" fill="none" stroke="var(--ill-3)" stroke-width="8" stroke-linecap="round"/><path d="M68 32a60 60 0 0 1 24 0" fill="none" stroke="var(--ill-1)" stroke-width="8" stroke-linecap="round"/><line x1="80" y1="90" x2="86" y2="38" stroke="var(--ill-1)" stroke-width="5" stroke-linecap="round"/><circle cx="80" cy="90" r="8" fill="var(--ill-2)"/></svg>',
  atelier:'<svg viewBox="0 0 160 110"><rect x="16" y="18" width="128" height="74" rx="10" fill="var(--ill-fond)" stroke="var(--ill-3)" stroke-width="3"/><g fill="var(--ill-1)"><rect x="28" y="32" width="24" height="16" rx="4"/><rect x="68" y="32" width="24" height="16" rx="4" opacity=".75"/><rect x="108" y="32" width="24" height="16" rx="4"/></g><g stroke="var(--ill-2)" stroke-width="4" stroke-linecap="round"><line x1="28" x2="120" y1="64" y2="64"/><line x1="28" x2="90" y1="78" y2="78"/></g></svg>'
};
