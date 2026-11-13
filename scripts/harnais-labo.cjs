#!/usr/bin/env node
// ============================================================
// HARNAIS LABO — tests de contrat du générateur de carte
// (retour Thibaut 2026-11-13 « 5 points » : le harnais de validation
// est COMMITTÉ avec le code qu'il valide, il n'existe plus seulement
// dans la session de l'IA qui écrit le code.)
//
// Usage :
//   node scripts/harnais-labo.cjs                 # quartz/static/generateur-carte-labo.html
//   node scripts/harnais-labo.cjs chemin/labo.html
//
// Principe : CONTRATS, pas bytes. Chaque test vérifie une PROMESSE du
// générateur, pas une capture figée d'une version passée :
//   C1  Déterminisme — même seed + même params = même carte.
//   C2  Part mer contractuelle — le curseur Mer = la part d'océan
//       (quantile), à ±1 tuile près, sur tous les types × rayons.
//   C3  Parts biomes contractuelles — Montagne+Volcan = curseur
//       Montagnes, Forêt/Désert/Marais = curseurs de parts, Plaine =
//       complément, APRÈS lissage (tolérance ±1,2 pt, sans adjacence
//       ni caps — contraintes dures documentées qui peuvent rogner).
//   C4  Ressources — en mode Quantile, chaque ressource déclarée dans
//       RES_DEFAULTS apparaît sur au moins une des graines testées
//       (les défauts du FICHIER sont utilisés, le test suit les
//       réglages, il ne les fige pas).
//   C5  Partage — encodeShare/decodeShare : round-trip exact et
//       encodage canonique (clés triées : deux états égaux = 1 hash).
// Aucune dépendance (Node seul), aucun réseau : la partie pure du
// labo est chargée dans une VM et coupée au marqueur
// `// ===== FIN DE LA PARTIE PURE`.
// ============================================================
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DEFAULT_LABO = path.resolve(__dirname, '..', 'quartz', 'static', 'generateur-carte-labo.html');
const LABO = process.argv[2] || DEFAULT_LABO;

// ---------- Chargement de la partie pure ----------
function loadLabo(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const m = html.match(/<script>([\s\S]*)<\/script>/);
  if (!m) throw new Error('aucun <script> trouvé dans ' + htmlPath);
  const src = m[1];
  const cut = src.indexOf('// ===== FIN DE LA PARTIE PURE');
  let pure;
  if (cut >= 0) {
    pure = src.slice(0, cut);
  } else {
    // Format antérieur au marqueur : couper après la dernière fonction
    // pure (placePlayers), accolade fermante incluse.
    const pp = src.indexOf('function placePlayers');
    if (pp < 0) throw new Error('marqueur harnais et placePlayers introuvables');
    pure = src.slice(0, src.indexOf('\n}', pp) + 2);
  }
  const code = pure +
    '\n;globalThis.__ex={MAP_PRESETS,RES_DEFAULTS,generateMap,placePlayers,drawVariety};' +
    'try{globalThis.__ex.encodeShare=encodeShare;globalThis.__ex.decodeShare=decodeShare;}catch(e){}';
  const ctx = vm.createContext({
    console, Math, JSON, Set, Map, Float32Array, Float64Array,
    Uint8Array, Uint16Array, Uint32Array, Array, Object, String, Number, BigInt
  });
  vm.runInContext(code, ctx, { filename: 'labo-pure.js' });
  return ctx.__ex;
}

// ---------- Params de référence « grimoire » ----------
// Les ressources viennent des RES_DEFAULTS du fichier (le test suit les
// réglages par défaut du labo au lieu de les figer).
function refParams(ex, over) {
  const p = {
    sea: 0.45, mountains: 0.14, noiseType: 'perlin', mapType: 'custom', seaElev: 0,
    elev: { cont: 0.05, scale: 0.18, compact: 0.65, oct: 4, pers: 0.5, edge: 0.10 },
    humid: { scale: 0.14, oct: 3, pers: 0.55, cont: 0.4 },
    temp: { lat: 1.4, noise: 0.12 },
    poles: 'ns', biomeOrder: 'ETH',
    adjacency: { enabled: false, rules: {} },
    res: {},
    resMode: 'quantile',
    ring: 0, playerEdge: 1, playerCenter: 0,
    evt: { volcan: 0.2, river: 0.08, riverLen: 3 },
    constraints: {
      caps: { 'Plaine': 0, 'Forêt': 0, 'Désert': 0, 'Marais': 0, 'Montagne': 0, 'Océan': 0, 'Volcan': 0 },
      surroundSame: 5
    },
    parts: { foret: 0.50, desert: 0.03, marais: 0.05 },
    N: 12
  };
  for (const [name, d] of Object.entries(ex.RES_DEFAULTS)) {
    p.res[name] = { density: d.density / 1000, prox: d.prox / 100, size: d.size };
  }
  return Object.assign(p, over || {});
}

function shares(map) {
  const size = map.tiles.length;
  const c = {};
  for (const b of map.biome) c[b] = (c[b] || 0) + 1;
  const land = size - (c['Océan'] || 0);
  return {
    ocean: (c['Océan'] || 0) / size,
    land,
    mtnVolcan: ((c['Montagne'] || 0) + (c['Volcan'] || 0)) / land,
    foret: (c['Forêt'] || 0) / land,
    desert: (c['Désert'] || 0) / land,
    marais: (c['Marais'] || 0) / land,
    plaine: (c['Plaine'] || 0) / land,
    counts: c
  };
}

// ---------- Exécution ----------
const ex = loadLabo(LABO);
const seeds = ['grimoire', 'corvane', 'eldmere', 'pyrgorn', 'solkast'];
let failures = 0;
const chk = (name, ok, detail) => {
  if (!ok) failures++;
  console.log((ok ? 'OK   ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};
const pct = x => (x * 100).toFixed(1) + '%';

// C3 : parts biomes garanties
for (const seed of seeds) {
  const s = shares(ex.generateMap(12, seed, refParams(ex)));
  const ok = Math.abs(s.mtnVolcan - 0.14) < 0.012
    && Math.abs(s.foret - 0.50) < 0.012
    && Math.abs(s.desert - 0.03) < 0.012
    && Math.abs(s.marais - 0.05) < 0.012;
  chk('C3 parts ' + seed, ok,
    `Mtn+V ${pct(s.mtnVolcan)}/14 | F ${pct(s.foret)}/50 | D ${pct(s.desert)}/3 | M ${pct(s.marais)}/5 | P ${pct(s.plaine)} | terre ${s.land}`);
}

// C1 : déterminisme (biome + ressources + rivières)
{
  const p = refParams(ex);
  const a = ex.generateMap(12, 'grimoire', p);
  const b = ex.generateMap(12, 'grimoire', p);
  chk('C1 déterminisme (2 appels)',
    JSON.stringify(a.biome) === JSON.stringify(b.biome)
    && JSON.stringify(a.resource) === JSON.stringify(b.resource));
}

// C2 : part mer sur tous les types × rayons
{
  const bad = [];
  for (const name of Object.keys(ex.MAP_PRESETS)) {
    for (const n of [10, 14, 18]) {
      const s = shares(ex.generateMap(n, 'grimoire', refParams(ex, { mapType: name })));
      if (Math.abs(s.ocean - 0.45) > 0.008) bad.push(`${name}/r${n}=${s.ocean.toFixed(3)}`);
    }
  }
  chk('C2 part mer 45 % — ' + Object.keys(ex.MAP_PRESETS).length + ' types × 3 rayons', bad.length === 0, bad.join(', '));
}

// C4 : ressources présentes en mode quantile (défauts du fichier)
{
  const resSeen = new Set();
  for (const seed of seeds) {
    const m = ex.generateMap(12, seed, refParams(ex));
    for (const r of m.resource) if (r) resSeen.add(r);
  }
  const missing = Object.keys(ex.RES_DEFAULTS).filter(r => !resSeen.has(r));
  chk('C4 ressources quantile présentes (5 seeds)', missing.length === 0, missing.length ? 'absentes : ' + missing.join(', ') : [...resSeen].sort().join(', '));
}

// C5 : codec de partage
if (ex.encodeShare) {
  const st = { v: 1, n: 12, seed: 'grimoire', p: refParams(ex), pl: { playerSeed: 'p42', required: ['Forêt'] } };
  const rt = ex.decodeShare(ex.encodeShare(st));
  chk('C5 encodeShare/decodeShare round-trip', ex.encodeShare(rt) === ex.encodeShare(st));
  chk('C5 encodage canonique (clés triées)',
    ex.encodeShare({ b: 1, a: { y: 2, x: 1 } }) === ex.encodeShare({ a: { x: 1, y: 2 }, b: 1 }));
} else {
  chk('C5 codec présent', false, 'encodeShare absent de la partie pure');
}

console.log(failures ? `\n${failures} ÉCHEC(S)` : '\nTOUS LES CONTRATS TIENNENT');
process.exit(failures ? 1 : 0);
