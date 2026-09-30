/* Détection de hauteur (méthode YIN) : trouve la fréquence fondamentale d'un son de corde.
 * Fonction pure : elle marche aussi bien sur le micro que sur un tableau de test. */
import { freqEnMidi } from './theorie.js';

/* Renvoie { freq, clarte } ou null si le signal est trop faible ou trop bruité.
 * fmin / fmax bornent la recherche (basse : 30 Hz ; ukulélé : jusqu'à 500 Hz). */
export function detecterHauteur(signal, sr, fmin = 30, fmax = 1000){
  const n = signal.length;
  let energie = 0;
  for (let i = 0; i < n; i++) energie += signal[i] * signal[i];
  if (Math.sqrt(energie / n) < 0.008) return null;                     // trop faible
  const tauMax = Math.min(Math.floor(sr / fmin), (n >> 1) - 1);
  const tauMin = Math.max(2, Math.floor(sr / fmax));
  const d = new Float32Array(tauMax + 1);
  const fenetre = n - tauMax;
  for (let tau = 1; tau <= tauMax; tau++){
    let somme = 0;
    for (let i = 0; i < fenetre; i++){ const x = signal[i] - signal[i + tau]; somme += x * x; }
    d[tau] = somme;
  }
  // différence normalisée cumulée
  const dn = new Float32Array(tauMax + 1);
  dn[0] = 1;
  let cumul = 0;
  for (let tau = 1; tau <= tauMax; tau++){ cumul += d[tau]; dn[tau] = cumul ? d[tau] * tau / cumul : 1; }
  // premier creux sous le seuil
  const seuil = 0.12;
  let tau = -1;
  for (let t = tauMin; t < tauMax; t++){
    if (dn[t] < seuil){
      while (t + 1 < tauMax && dn[t + 1] < dn[t]) t++;
      tau = t; break;
    }
  }
  if (tau < 0) return null;
  // interpolation parabolique
  const a = dn[tau - 1], b = dn[tau], c = dn[tau + 1];
  const den = a - 2 * b + c;
  const precis = den ? tau + (a - c) / (2 * den) : tau;
  return { freq:sr / precis, clarte:1 - b };
}

/* Note la plus proche d'une fréquence : { midi, cents } (cents > 0 : trop aigu) */
export function noteProche(freq){
  const m = freqEnMidi(freq);
  const midi = Math.round(m);
  return { midi, cents:(m - midi) * 100 };
}

/* Corde de l'instrument la plus proche de la fréquence : { index, cents } */
export function cordeProche(freq, cordes){
  const m = freqEnMidi(freq);
  let best = 0;
  cordes.forEach((c, i) => { if (Math.abs(c - m) < Math.abs(cordes[best] - m)) best = i; });
  return { index:best, cents:(m - cordes[best]) * 100 };
}
