/* Assemble l'application en un seul fichier HTML autonome.
 * Usage : node build.js            ->  mes-cordes.html (à double-cliquer)
 *         node build.js --site     ->  site/ (à publier, installable sur téléphone)
 */
const fs = require('fs');

const ORDRE = [
  'js/version.js', 'js/theorie.js', 'js/instruments.js', 'js/hauteur.js', 'js/audio.js', 'js/accords.js',
  'js/rythmes.js', 'js/player.js', 'js/songs.js', 'js/lessons.js', 'js/diagrammes.js', 'js/progress.js', 'js/app.js'
];

/* app.js fait « import * as P from './progress.js' » : on reconstruit l'objet */
const exportsP = [...fs.readFileSync('js/progress.js', 'utf8')
  .matchAll(/^export\s+(?:function|const|let)\s+([A-Za-z_$][\w$]*)/gm)].map(m => m[1]);
const SHIM_P = `\nconst P = { ${exportsP.join(', ')} };\n`;

function module(chemin){
  let src = fs.readFileSync(chemin, 'utf8');
  src = src.replace(/^import[^\n]*;\s*$/gm, '');
  src = src.replace(/^export\s+/gm, '');
  return `\n/* ================= ${chemin} ================= */\n` + src.trim() + '\n';
}
function declarations(src){
  const noms = new Set();
  const re = /^(?:const|let|var|function|async function|class)\s+([A-Za-z_$][\w$]*)/gm;
  let m;
  while ((m = re.exec(src))) noms.add(m[1]);
  return noms;
}
const vus = new Map();
const morceaux = ORDRE.map(f => {
  const src = f === 'js/app.js' ? SHIM_P + module(f) : module(f);
  for (const n of declarations(src)){
    if (vus.has(n)){
      console.error(`ERREUR : « ${n} » est déclaré dans ${vus.get(n)} et dans ${f}.`);
      process.exit(1);
    }
    vus.set(n, f);
  }
  return src;
});
const js = morceaux.join('\n');

const numeroVersion = fs.readFileSync('js/version.js', 'utf8').match(/VERSION = '([^']+)'/)[1];
const swSource = fs.readFileSync('sw.js', 'utf8');
const swAJour = swSource.replace(/const VERSION = '[^']*';/, `const VERSION = 'mes-cordes-${numeroVersion}';`);
if (swAJour !== swSource) fs.writeFileSync('sw.js', swAJour);

const css = fs.readFileSync('css/styles.css', 'utf8') + '\n' + fs.readFileSync('css/cordes.css', 'utf8');
const icone = fs.readFileSync('icons/icone.svg', 'utf8').trim();

let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('<link rel="stylesheet" href="css/styles.css">', () => `<style>\n${css}\n</style>`);
html = html.replace('<link rel="stylesheet" href="css/cordes.css">\n', '');
html = html.replace('<script type="module" src="js/app.js"></script>', () => `<script type="module">\n${js}\n</script>`);
html = html.replace(/<img class="logo-img"[^>]*>/, () => icone.replace('<svg ', '<svg class="logo-img" '));
html = html.replace('href="icons/icone.svg" data-favicon', () => `href="data:image/svg+xml,${encodeURIComponent(icone)}"`);
html = html.replace('<title>', '<!-- Fichier autonome généré par build.js : ne pas modifier à la main -->\n<title>');

const args = process.argv.slice(2);
if (args.includes('--site')){
  const dossier = 'site';
  fs.rmSync(dossier, { recursive:true, force:true });
  fs.mkdirSync(dossier + '/icons', { recursive:true });
  fs.writeFileSync(dossier + '/index.html', html.replace(/ data-pwa/g, ''));
  fs.copyFileSync('manifest.webmanifest', dossier + '/manifest.webmanifest');
  fs.copyFileSync('sw.js', dossier + '/sw.js');
  for (const f of fs.readdirSync('icons')) fs.copyFileSync('icons/' + f, dossier + '/icons/' + f);
  console.log(`${dossier}/ écrit — site installable`);
  process.exit(0);
}
html = html.replace(/^.*data-pwa.*\n/gm, '');
fs.writeFileSync('mes-cordes.html', html);
console.log('mes-cordes.html écrit —', (html.length / 1024).toFixed(0), 'Ko');
