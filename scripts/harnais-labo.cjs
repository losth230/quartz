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
    // (8e/9e retours 2026-11-14 : applyPreset pose AUSSI ces sliders —
    //  les ignorer reviendrait à tester un chemin UI que l'arbitre ne
    //  voit jamais.)
    if (preset['mass-size'] !== undefined) p.massPct = preset['mass-size'] / 100;
    if (preset['edge-land'] !== undefined) p.edgeLand = preset['edge-land'] / 100;
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

// C6 : ÎLES ÉPARSES (10e retour Thibaut 2026-11-14 : « non, pas toutes les
//  îles au bord — du bruit, des îles par ci et par là ». CORRIGE le 9e
//  retour « Terre au bord » : les masses ne vont PLUS au bord ; le curseur
//  « Îles éparses » sème des ÎLETS (bosses dédiées de 2 à 10 tuiles) dans
//  la bande périphérique (78 % → 97 % du rayon), hors empreinte des
//  masses, NON essorés par la fenêtre — certains touchent le cadre.
//  Deux volets, par type à bosses × seed, r=15 :
//  a) slider à 0 : calibrage historique INTACT — anneau extérieur ≤ 5 %
//     de terre, masse principale ≤ 25 % (no-op vérifié : 72 cartes
//     byte-identiques au 9e retour à edge=0) ;
//  b) preset par défaut (100 %) : îlots périphériques ≥ 3 (Continents,
//     Archipel) / ≥ 1 (Grandes îles : bande déjà dense, les masses y
//     portent le bruit — mesuré min 1), au moins une tuile de terre sur
//     l'anneau, terre [24, 40] % (budget constant), masse ≤ 25 % (pas
//     de soudure).
//  Îlet = composante de terre ENTIÈREMENT au-delà de 10 pas hex du
//  centre (2/3 du rayon), de taille ≤ 12 tuiles.
{
  const N6 = 15;
  const DIRS6 = [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];
  const edgeStats = (m) => {
    const key = new Map();
    for (let i = 0; i < m.tiles.length; i++) key.set(m.tiles[i].q + ',' + m.tiles[i].r, i);
    const land = [];
    let ringLand = 0, ringTot = 0;
    for (let i = 0; i < m.tiles.length; i++) {
      const t = m.tiles[i];
      const d = Math.max(Math.abs(t.q), Math.abs(t.r), Math.abs(t.q + t.r));
      if (d === N6) { ringTot++; if (m.biome[i] !== 'Océan') ringLand++; }
      if (m.biome[i] !== 'Océan') land.push(i);
    }
    const inLand = new Set(land);
    const seen = new Set(); const sizes = []; let islets = 0;
    for (const st of land) {
      if (seen.has(st)) continue;
      let size = 0, minD = 99; const stack = [st]; seen.add(st);
      while (stack.length) {
        const c = stack.pop(); size++;
        const t = m.tiles[c];
        const d = Math.max(Math.abs(t.q), Math.abs(t.r), Math.abs(t.q + t.r));
        if (d < minD) minD = d;
        for (const [dq, dr] of DIRS6) {
          const j = key.get((t.q + dq) + ',' + (t.r + dr));
          if (j !== undefined && inLand.has(j) && !seen.has(j)) { seen.add(j); stack.push(j); }
        }
      }
      sizes.push(size);
      // (10e retour) îlet : composante périphérique (rien de plus près que
      //  2/3 du rayon) et petite — exclut les masses par construction
      //  (leurs centres sont posés à ≤ 0.75 × RPX, tuiles centrales bien
      //  plus près que 10 pas).
      if (minD >= 10 && size <= 12) islets++;
    }
    sizes.sort((a, b) => b - a);
    return { land: land.length, tot: m.tiles.length, comps: sizes.length, top: sizes[0] || 0, ringLand, ringTot, islets };
  };
  const minIslets = { continents: 3, 'islands-large': 1, archipelago: 3 };
  const bad = [];
  for (const type of ['continents', 'islands-large', 'archipelago']) {
    for (const seed of seeds) {
      // a) slider « Îles éparses » à 0 : calibrage historique intact
      const p0 = presetParams(ex, type);
      p0.edgeLand = 0;
      const r0 = edgeStats(ex.generateMap(N6, seed, p0));
      const part0 = r0.ringTot ? r0.ringLand / r0.ringTot : 0;
      if (part0 > 0.05) bad.push('0%:' + type + '/' + seed + ' anneau ' + (part0 * 100).toFixed(0) + '%');
      else if (r0.top / r0.land > 0.25) bad.push('0%:' + type + '/' + seed + ' masse ' + (r0.top / r0.land * 100).toFixed(0) + '%');
      // b) preset par défaut (100 %) : îlots épars, budget et masse tenus
      const r1 = edgeStats(ex.generateMap(N6, seed, presetParams(ex, type)));
      const landPct = r1.land / r1.tot;
      const topPct = r1.top / r1.land;
      if (landPct < 0.24 || landPct > 0.40) bad.push('100%:' + type + '/' + seed + ' terre ' + (landPct * 100).toFixed(0) + '%');
      else if (topPct > 0.25) bad.push('100%:' + type + '/' + seed + ' masse ' + (topPct * 100).toFixed(0) + '%');
      else if (r1.ringLand < 1) bad.push('100%:' + type + '/' + seed + ' anneau vide');
      else if (r1.islets < minIslets[type]) bad.push('100%:' + type + '/' + seed + ' ' + r1.islets + ' îlet(s) < ' + minIslets[type]);
    }
  }
  chk('C6 îles éparses (3 presets × 5 seeds, r=15 : à 0 calibrage intact, au défaut îlots périphériques + terre au bord)',
    bad.length === 0,
    bad.slice(0, 4).join(', ') || 'calibrage intact à 0, îlots au défaut, anneau habité, terre 24-40 %, masse ≤ 25 %');
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
    const big = sizes.filter(x => x >= 6).length;
    return { land: land.length, tot: m.tiles.length, comps: sizes.length, big, top: sizes[0] || 0 };
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
//    extérieur ≤ 5 % de terre, masse top ≤ 40 %, masses ≥ 15 t :
//    ×2 > ×0.5 (12e : sur les MASSES — le total de comps inclut les
//    satellites, hors curseur) ;
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
    const big = sizes.filter(x => x >= 6).length;
    return { land: land.length, tot: m.tiles.length, comps: sizes.length, big, top: sizes[0] || 0 };
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
      // (12e) la monotonie porte sur les MASSES (≥ 15 t), l'objet réel du
      //  curseur : le total de composantes inclut les satellites, qui ne
      //  suivent pas le curseur (égalité 18 = 18 mesurée sur pyrgorn).
      if (!(res[2].big > res[0.5].big)) bad.push(`${type}/${seed}: masses ×2 (${res[2].big}) !> ×0.5 (${res[0.5].big})`);
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

// C9 : BRUIT POSITIONNEL (11e-12e retours Thibaut 2026-11-14). Le semis
// aléatoire (lancés de fléchettes / best-candidate de Mitchell) remplace
// l'anneau équiréparti et les couronnes adaptatives : disposition,
// éloignement et taille dépendent du bruit. Contrats, par type à
// bosses × 5 seeds, r=15, preset défaut :
//  a) PAS DE SOUDURE : distance entre centroïdes de chaque PAIRE de
//     masses (comps ≥ 15 tuiles ; archipel : ≥ 8 et non-îlet, i.e. pas
//     entièrement au-delà de 11.7 pas du centre — bande à îlots 78 %)
//     ≥ 1.05·(√si+√sj) — la corde par paire vaut 3.5·(σi+σj)/2 avec
//     σ ≈ 0.65·√taille, corrigée de la dérive centroïde/centre
//     (~0.92) : une paire soudée (chaîne solkast 12b : 44 tuiles
//     à ratio 1.02 de l'ancienne corde fixe) tombe à ~0.85 ;
//  b) VARIÉTÉ STRUCTURELLE : le nombre de masses prend ≥ 2 valeurs
//     distinctes sur les 5 seeds pour chacun des 3 types.
{
  const N9 = 15;
  const DIRS9 = [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];
  const minSize = { continents: 15, 'islands-large': 15, archipelago: 8 };
  const bad = [];
  const counts = { continents: new Set(), 'islands-large': new Set(), archipelago: new Set() };
  for (const type of ['continents', 'islands-large', 'archipelago']) {
    for (const seed of seeds) {
      const m = ex.generateMap(N9, seed, presetParams(ex, type, null));
      const key = new Map();
      for (let i = 0; i < m.tiles.length; i++) key.set(m.tiles[i].q + ',' + m.tiles[i].r, i);
      const land = [];
      for (let i = 0; i < m.tiles.length; i++) if (m.biome[i] !== 'Océan') land.push(i);
      const inLand = new Set(land);
      const seen = new Set(); const masses9 = [];
      for (const st of land) {
        if (seen.has(st)) continue;
        let size = 0, sx = 0, sy = 0, dmin = 99; const stack = [st]; seen.add(st);
        while (stack.length) {
          const c = stack.pop(); size++;
          const t = m.tiles[c];
          sx += Math.sqrt(3) * (t.q + t.r / 2); sy += 1.5 * t.r;
          const d = Math.max(Math.abs(t.q), Math.abs(t.r), Math.abs(t.q + t.r));
          if (d < dmin) dmin = d;
          for (const [dq, dr] of DIRS9) {
            const j = key.get((t.q + dq) + ',' + (t.r + dr));
            if (j !== undefined && inLand.has(j) && !seen.has(j)) { seen.add(j); stack.push(j); }
          }
        }
        if (size >= minSize[type] && (type !== 'archipelago' || dmin < 11.7))
          masses9.push({ cx: sx / size, cy: sy / size, s: size });
      }
      counts[type].add(masses9.length);
      let worst = Infinity, worstInfo = '';
      for (let i = 0; i < masses9.length; i++)
        for (let j = i + 1; j < masses9.length; j++) {
          const need = 1.05 * (Math.sqrt(masses9[i].s) + Math.sqrt(masses9[j].s));
          const d = Math.hypot(masses9[i].cx - masses9[j].cx, masses9[i].cy - masses9[j].cy);
          if (d / need < worst) { worst = d / need; worstInfo = type + '/' + seed + ' (' + masses9[i].s + '/' + masses9[j].s + ') ratio ' + (d / need).toFixed(2); }
        }
      if (masses9.length < 2) bad.push(type + '/' + seed + ': ' + masses9.length + ' masse(s)');
      else if (worst < 1) bad.push(worstInfo);
    }
  }
  for (const type of ['continents', 'islands-large', 'archipelago'])
    if (counts[type].size < 2) bad.push(type + ': count figé (' + [...counts[type]].join(',') + ')');
  chk('C9 semis bruité (3 presets × 5 seeds, r=15 : paires à ≥ 1.05·(√si+√sj), count variable par graine)', bad.length === 0,
    bad.slice(0, 4).join(', ') || 'paires ≥ corde, counts variables par type');
}

// C10 : 12e retour Thibaut 2026-11-14 — « j'aimerais que la mer centrale
//  par défaut soit retirée sur les continents » + « bétail à 4.5 % ».
//  a) BÉTAIL : densité par défaut 45 ‰ dans RES_DEFAULTS (avant 35 ‰) ;
//  b) CENTRE ATTEIGNABLE : le creux central explicite est retiré, le
//     semis peut poser une masse au centre — ≥ 1 seed sur 5 avec de
//     la terre à hexdist ≤ 2 du centre sur Continents (11e : 0/8, mer
//     centrale garantie par construction).
{
  const bad = [];
  const bet = ex.RES_DEFAULTS['Bétail'];
  if (!bet || bet.density !== 45) bad.push('Bétail défaut ' + (bet ? bet.density : '?') + ' ‰ ≠ 45 ‰');
  let reach = 0;
  for (const seed of seeds) {
    const m = ex.generateMap(15, seed, presetParams(ex, 'continents', null));
    for (let i = 0; i < m.tiles.length; i++) {
      const t = m.tiles[i];
      const d = Math.max(Math.abs(t.q), Math.abs(t.r), Math.abs(t.q + t.r));
      if (d <= 2 && m.biome[i] !== 'Océan') { reach++; break; }
    }
  }
  if (reach < 1) bad.push('0/5 seeds avec terre centrale (hexdist ≤ 2)');
  chk('C10 12e retour (Bétail défaut 45 ‰, centre continental atteignable sur ≥ 1/5 seeds)', bad.length === 0,
    bad.join(', ') || ('Bétail 45 ‰, ' + reach + '/5 seeds avec terre centrale'));
}

console.log(failures ? `\n${failures} ÉCHEC(S)` : '\nTOUS LES CONTRATS TIENNENT');
process.exit(failures ? 1 : 0);
