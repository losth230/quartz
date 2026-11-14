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

// Params d'un PRESET tel que le labo l'utilise réellement (MAP_PRESETS
// appliqué : sea + elev). C2 teste volontairement le quantile à sea 45
// SANS preset ; C6 teste les presets réels.
function presetParams(ex, name, uiCaps) {
  // uiCaps : caps de DÉFAUT DE L'UI (7e retour : le chemin réel de l'arbitre
  // part des défauts DOM, PUIS le preset écrase les champs qu'il possède.
  // Sans uiCaps : caps à 0 (comportement historique des autres contrats).
  const caps = uiCaps
    ? Object.assign({}, uiCaps)
    : { 'Plaine': 0, 'Forêt': 0, 'Désert': 0, 'Marais': 0, 'Montagne': 0, 'Océan': 0, 'Volcan': 0 };
  const p = refParams(ex, { mapType: name, constraints: { caps, surroundSame: 5 } });
  const preset = ex.MAP_PRESETS[name];
  if (preset) {
    if (preset.sealevel !== undefined) p.sea = preset.sealevel / 100;
    // (7e retour 2026-11-14 : chaque preset pose 'cap-ocean': 0 — un cap
    //  océan résiduel dépassé abaissait le seuil GLOBAL et soudait les
    //  îles en un bloc de 65 % de terre. Incident navigation privée.)
    if (preset['cap-ocean'] !== undefined) p.constraints.caps['Océan'] = preset['cap-ocean'];
    const m = { 'e-cont': 'cont', 'e-scale': 'scale', 'e-compact': 'compact', 'e-edge': 'edge', 'e-pers': 'pers' };
    for (const k in m) if (preset[k] !== undefined) p.elev[m[k]] = preset[k] / 100;
  }
  return p;
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

// C6 : masses visibles EN ENTIER (3e retour Thibaut 2026-11-13, à r=15
// = 721 tuiles, la taille réelle de campagne : « on ne voit jamais les
// continents, ni même les îles en entier »). Pour « continents »,
// « grandes îles » et « archipel » : l'anneau extérieur de la carte
// reste océanique (fenêtre périphérique PERIPH_OCEAN) — sinon les lobes
// du masque collent les masses au bord et le bord les coupe. Contrat :
// ≤ 5 % de terre sur l'anneau r=15, par seed. (« continent » et
// « pangea » touchent volontairement le bord : contrat documenté.)
// (5e retour 2026-11-14 : l'anneau d'eau forcé est SUPPRIMÉ à la demande
// de Thibaut — C6 teste désormais les presets RÉELS (sea 68/66/72) ;
// à sea 45 (55 % de terre) le bord se remplit statistiquement, ce
// n'est plus un creux sculpté qui doit l'en empêcher.)
{
  const N6 = 15;
  const bad = [];
  for (const type of ['continents', 'islands-large', 'archipelago']) {
    for (const seed of seeds) {
      const m = ex.generateMap(N6, seed, presetParams(ex, type));
      let ringLand = 0, ringTot = 0;
      for (let i = 0; i < m.tiles.length; i++) {
        const t = m.tiles[i];
        const d = Math.max(Math.abs(t.q), Math.abs(t.r), Math.abs(t.q + t.r));
        if (d === N6) { ringTot++; if (m.biome[i] !== 'Océan') ringLand++; }
      }
      const part = ringTot ? ringLand / ringTot : 0;
      if (part > 0.05) bad.push(`${type}/${seed}=${(part * 100).toFixed(0)}%`);
    }
  }
  chk('C6 masses détachées du bord (3 presets × 5 seeds, r=15)', bad.length === 0,
    bad.slice(0, 4).join(', ') || 'anneau extérieur ≤ 5 % de terre partout');
}

// C7 : les CAPS DE L'UI PAR DÉFAUT ne doivent pas dérailler les presets
// (7e retour Thibaut 2026-11-14, incident navigation privée : « ceci est
// censé être un archipel » — le défaut cap-ocean=250, une fois dépassé,
// abaissait le seuil de mer GLOBAL au quantile du cap : 65 % de terre,
// masse unique de 96-99 % sur les 3 presets × 8 seeds. Chemin UI fidèle :
// défauts DOM (caps plaine 200 / forêt 200 / désert 50 / marais 80 /
// montagne 80 / océan 250 / volcan 15) PUIS preset appliqué (qui pose
// cap-ocean=0). Contrats par type × seed, r=15 : part de terre dans
// [24 %, 40 %], au moins 6 masses, masse principale ≤ 25 % de la terre.)
{
  const N7 = 15;
  const uiCaps = { 'Plaine': 200, 'Forêt': 200, 'Désert': 50, 'Marais': 80, 'Montagne': 80, 'Océan': 250, 'Volcan': 15 };
  const DIRS = [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];
  const masses = (m) => {
    const key = new Map();
    for (let i = 0; i < m.tiles.length; i++) key.set(m.tiles[i].q + ',' + m.tiles[i].r, i);
    const land = [];
    for (let i = 0; i < m.tiles.length; i++) if (m.biome[i] !== 'Océan') land.push(i);
    const inLand = new Set(land);
    const seen = new Set(); const sizes = [];
    for (const st of land) {
      if (seen.has(st)) continue;
      let size = 0; const stack = [st]; seen.add(st);
      while (stack.length) {
        const c = stack.pop(); size++;
        const t = m.tiles[c];
        for (const [dq, dr] of DIRS) {
          const j = key.get((t.q + dq) + ',' + (t.r + dr));
          if (j !== undefined && inLand.has(j) && !seen.has(j)) { seen.add(j); stack.push(j); }
        }
      }
      sizes.push(size);
    }
    sizes.sort((a, b) => b - a);
    return { land: land.length, tot: m.tiles.length, comps: sizes.length, top: sizes[0] || 0 };
  };
  const bad = [];
  for (const type of ['continents', 'islands-large', 'archipelago']) {
    for (const seed of seeds) {
      const m = ex.generateMap(N7, seed, presetParams(ex, type, uiCaps));
      const r = masses(m);
      const landPct = r.land / r.tot;
      const topPct = r.top / r.land;
      if (landPct < 0.24 || landPct > 0.40) bad.push(`${type}/${seed}: terre ${(landPct * 100).toFixed(0)}%`);
      else if (r.comps < 6) bad.push(`${type}/${seed}: ${r.comps} masses`);
      else if (topPct > 0.25) bad.push(`${type}/${seed}: masse ${(topPct * 100).toFixed(0)}%`);
    }
  }
  chk('C7 presets insensibles aux caps UI par défaut (3 presets × 5 seeds, r=15)', bad.length === 0,
    bad.slice(0, 4).join(', ') || 'terre 24-40 %, ≥ 6 masses, masse ≤ 25 % partout');
}

// C8 : CURSEUR « TAILLE MASSES » (8e retour Thibaut 2026-11-14 : « ajouter
// un slider de taille des masses terrestres, qui remplacerait le slider
// continent qui semble mort »). Sémantique par famille :
//  - types à bosses (continents, islands-large, archipelago) : le curseur
//    (×0.5 à ×2) joue sur le NOMBRE de bosses (6/11/18 × m), chacune
//    compensée en σ (÷√m) pour que le BUDGET DE TERRE reste le calibrage
//    du preset — sans compensation le seuil plongeait sous les bosses et
//    le bruit percolait : masse soudée de 84 % mesurée à ×0.5 ;
//  - fragmented : le nombre d'entailles traversantes suit le curseur
//    (6 × m, borné 3-14) à budget de terre constant ;
//  - types masqués à masse(s) FIXÉE(S) (continent, pangea, inland-sea,
//    lakes) : impossible d'y changer le nombre de masses, le curseur y
//    déplace le BUDGET DE TERRE (quantile de mer ± 10 pts) ;
//  - custom : fréquence du canal continent (l'ancien rôle du slider
//    mort, qui ne faisait rien sur les presets masqués).
// Contrats, chemin UI fidèle (caps défaut + preset + massPct), r=15 :
//  - bosses, aux 3 positions × 0.5/1/2 : terre [24, 40] %, anneau
//    extérieur ≤ 5 % de terre, masse top ≤ 40 %, comps(×2) > comps(×0.5) ;
//  - fragmented : comps(×2) > comps(×0.5) à terre constante ;
//  - masqués : terre(×0.5) > terre(×2) (le budget suit le curseur).
{
  const N8 = 15;
  const uiCaps = { 'Plaine': 200, 'Forêt': 200, 'Désert': 50, 'Marais': 80, 'Montagne': 80, 'Océan': 250, 'Volcan': 15 };
  const DIRS = [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];
  const masses = (m) => {
    const key = new Map();
    for (let i = 0; i < m.tiles.length; i++) key.set(m.tiles[i].q + ',' + m.tiles[i].r, i);
    const land = [];
    for (let i = 0; i < m.tiles.length; i++) if (m.biome[i] !== 'Océan') land.push(i);
    const inLand = new Set(land);
    const seen = new Set(); const sizes = [];
    for (const st of land) {
      if (seen.has(st)) continue;
      let size = 0; const stack = [st]; seen.add(st);
      while (stack.length) {
        const c = stack.pop(); size++;
        const t = m.tiles[c];
        for (const [dq, dr] of DIRS) {
          const j = key.get((t.q + dq) + ',' + (t.r + dr));
          if (j !== undefined && inLand.has(j) && !seen.has(j)) { seen.add(j); stack.push(j); }
        }
      }
      sizes.push(size);
    }
    sizes.sort((a, b) => b - a);
    return { land: land.length, tot: m.tiles.length, comps: sizes.length, top: sizes[0] || 0 };
  };
  const gen8 = (type, seed, m) => {
    const p = presetParams(ex, type, uiCaps);
    p.massPct = m; // le slider est posé APRÈS le choix du type (chemin UI)
    return ex.generateMap(N8, seed, p);
  };
  const bad = [];
  for (const type of ['continents', 'islands-large', 'archipelago']) {
    for (const seed of seeds) {
      const res = {};
      for (const m of [0.5, 1, 2]) {
        res[m] = masses(gen8(type, seed, m));
        const landPct = res[m].land / res[m].tot;
        const topPct = res[m].top / res[m].land;
        if (landPct < 0.24 || landPct > 0.40) bad.push(`${type}/${seed}/×${m}: terre ${(landPct * 100).toFixed(0)}%`);
        else if (topPct > 0.40) bad.push(`${type}/${seed}/×${m}: masse ${(topPct * 100).toFixed(0)}%`);
      }
      if (!(res[2].comps > res[0.5].comps)) bad.push(`${type}/${seed}: comps ×2 (${res[2].comps}) !> ×0.5 (${res[0.5].comps})`);
    }
  }
  for (const seed of seeds) {
    const r05 = masses(gen8('fragmented', seed, 0.5));
    const r2 = masses(gen8('fragmented', seed, 2));
    if (!(r2.comps > r05.comps)) bad.push(`fragmented/${seed}: comps ×2 (${r2.comps}) !> ×0.5 (${r05.comps})`);
  }
  for (const type of ['continent', 'pangea', 'inland-sea', 'lakes']) {
    for (const seed of seeds) {
      const t05 = masses(gen8(type, seed, 0.5));
      const t2 = masses(gen8(type, seed, 2));
      if (!(t05.land > t2.land)) bad.push(`${type}/${seed}: terre ×0.5 (${t05.land}) !> ×2 (${t2.land})`);
    }
  }
  chk('C8 curseur taille masses (3 bosses + fragmented + 4 masqués × 5 seeds, r=15)', bad.length === 0,
    bad.slice(0, 4).join(', ') || 'monotone partout, budget des bosses constant, masse ≤ 40 %');
}

console.log(failures ? `\n${failures} ÉCHEC(S)` : '\nTOUS LES CONTRATS TIENNENT');
process.exit(failures ? 1 : 0);
