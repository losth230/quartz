// ============================================================
//  C&P — Générateur procédural de terrain de bataille (v2)
//  À placer dans : quartz/static/cp-terrain.js
//
//  Modèle d'éléments :
//   - arbres        : points (centre de tuile OU croisement de 4 tuiles)
//   - murets        : segments d'un sommet à un autre (diagonale possible)
//   - surélévations : blocs 2×2 cases
//   - bâtiments     : blocs 2×2 cases
//
//  Équité garantie par construction (symétrie de rotation 180°).
//  Zones de déploiement définies EN DONNÉES (patrons nommés), pas par
//  lecture d'image. Le générateur évite d'encombrer ces zones.
//
//  Biomes (paramètre de génération) : foret, plaine, village, vallonne, mixte.
//
//  Module PUR (aucun accès au DOM) : génération + rendu SVG testables.
//
//  API :
//   zonesDeploiement(nom, cols, rows) -> { cle, zoneA:[[r,c]], zoneB:[[r,c]] }
//   genererTerrain({cols,rows,biome,deploiement,seed}) -> terrain
//   rendreTerrainSVG(terrain, {tailleCase}) -> string
//   BIOMES, DEPLOIEMENTS, DEPLOIEMENTS_MAP
// ============================================================

// ---- Biomes : intervalles [min,max] d'éléments générés sur la MOITIÉ haute
//      (puis doublés par symétrie). Ajuste l'ambiance de la table. ----
export const BIOMES = {
  foret:    { libelle: "Forêt",    arbres: [10, 16], murets: [0, 1], surelevations: [0, 1], batiments: [0, 0] },
  plaine:   { libelle: "Plaine",   arbres: [3, 6],   murets: [0, 2], surelevations: [0, 1], batiments: [0, 0] },
  village:  { libelle: "Village",  arbres: [3, 6],   murets: [3, 5], surelevations: [0, 1], batiments: [2, 3] },
  vallonne: { libelle: "Vallonné", arbres: [4, 8],   murets: [0, 1], surelevations: [2, 3], batiments: [0, 1] },
  mixte:    { libelle: "Mixte",    arbres: [6, 10],  murets: [1, 3], surelevations: [1, 2], batiments: [1, 2] },
};

// ---- Patrons de déploiement (en données). Chaque fonction renvoie les
//      cellules des deux camps. Tous sont symétriques par rotation 180°. ----
export const DEPLOIEMENTS = {
  bordsCourts(cols, rows, dz = 3) {
    const A = [], B = [];
    for (let r = 0; r < dz; r++) for (let c = 0; c < cols; c++) A.push([r, c]);
    for (let r = rows - dz; r < rows; r++) for (let c = 0; c < cols; c++) B.push([r, c]);
    return { zoneA: A, zoneB: B };
  },
  bordsLongs(cols, rows, dz = 2) {
    const A = [], B = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < dz; c++) A.push([r, c]);
    for (let r = 0; r < rows; r++) for (let c = cols - dz; c < cols; c++) B.push([r, c]);
    return { zoneA: A, zoneB: B };
  },
  diagonale(cols, rows) {
    // Triangles de coins opposés (haut-gauche / bas-droite), symétriques 180°.
    const A = [], B = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const d = c / (cols - 1) + r / (rows - 1); // 0..2
      if (d <= 0.85) A.push([r, c]);
      else if (d >= 1.15) B.push([r, c]);
    }
    return { zoneA: A, zoneB: B };
  },
  quartiers(cols, rows) {
    // Quart haut-gauche vs quart bas-droite.
    const A = [], B = [];
    const hr = Math.floor(rows / 2), hc = Math.floor(cols / 2);
    for (let r = 0; r < hr; r++) for (let c = 0; c < hc; c++) A.push([r, c]);
    for (let r = rows - hr; r < rows; r++) for (let c = cols - hc; c < cols; c++) B.push([r, c]);
    return { zoneA: A, zoneB: B };
  },
};

// ---- Correspondance nom de déploiement (en base) -> patron.
//      À COMPLÉTER avec tes déploiements pour que le terrain corresponde
//      au déploiement tiré. Toute valeur inconnue retombe sur "bordsCourts". ----
export const DEPLOIEMENTS_MAP = {
  // "Affrontement frontal": "bordsCourts",
  // "Front élargi":         "bordsLongs",
  // "Diagonale":            "diagonale",
  // "Quartiers":            "quartiers",
};

export function zonesDeploiement(nom, cols = 10, rows = 14) {
  const cle = (nom && DEPLOIEMENTS_MAP[nom]) || "bordsCourts";
  const fn = DEPLOIEMENTS[cle] || DEPLOIEMENTS.bordsCourts;
  const { zoneA, zoneB } = fn(cols, rows);
  return { cle, zoneA, zoneB };
}

// ---- PRNG reproductible ----
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================================
//  Génération
// ============================================================
export function genererTerrain(opts = {}) {
  const cols = opts.cols || 10;
  const rows = opts.rows || 14;
  const biome = BIOMES[opts.biome] ? opts.biome : "mixte";
  const seed = opts.seed != null ? opts.seed : (Math.random() * 1e9) | 0;
  const cfg = BIOMES[biome];
  const rng = mulberry32(seed);
  const ri = (a, b) => a + Math.floor(rng() * (b - a + 1));

  const half = Math.floor(rows / 2);

  // Déploiement (données) : ensemble des cellules à garder dégagées des blocs.
  const dep = opts.deploiement && opts.deploiement.zoneA
    ? opts.deploiement
    : zonesDeploiement(null, cols, rows);
  const depSet = new Set();
  [...dep.zoneA, ...dep.zoneB].forEach(([r, c]) => depSet.add(r + "," + c));

  const occ = Array.from({ length: rows }, () => Array(cols).fill(false)); // cases prises par des blocs
  const cellLibre = (r, c) =>
    r >= 0 && r < rows && c >= 0 && c < cols && !occ[r][c] && !depSet.has(r + "," + c);
  const blocLibre = (r, c) =>
    r >= 0 && r <= half - 2 && c >= 0 && c <= cols - 2 &&
    cellLibre(r, c) && cellLibre(r + 1, c) && cellLibre(r, c + 1) && cellLibre(r + 1, c + 1);
  const marquerBloc = (r, c) => { occ[r][c] = occ[r + 1][c] = occ[r][c + 1] = occ[r + 1][c + 1] = true; };

  const batiments = [], surelevations = [], arbres = [], murets = [];

  // 1) Bâtiments (2×2)
  let nb = ri(cfg.batiments[0], cfg.batiments[1]);
  for (let i = 0, g = 0; i < nb && g < 60; g++) {
    const r = ri(0, half - 2), c = ri(0, cols - 2);
    if (!blocLibre(r, c)) continue;
    marquerBloc(r, c); batiments.push({ r, c }); i++;
  }
  // 2) Surélévations (2×2)
  let ns = ri(cfg.surelevations[0], cfg.surelevations[1]);
  for (let i = 0, g = 0; i < ns && g < 60; g++) {
    const r = ri(0, half - 2), c = ri(0, cols - 2);
    if (!blocLibre(r, c)) continue;
    marquerBloc(r, c); surelevations.push({ r, c }); i++;
  }
  // 3) Arbres (points : centre de tuile ou croisement de 4 tuiles)
  let na = ri(cfg.arbres[0], cfg.arbres[1]);
  const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
  for (let i = 0, g = 0; i < na && g < na * 12 + 40; g++) {
    const centre = rng() < 0.5;
    let pt;
    if (centre) {
      const r = ri(0, half - 1), c = ri(0, cols - 1);
      if (!cellLibre(r, c)) continue;
      pt = { x: c + 0.5, y: r + 0.5, v: false };
    } else {
      // croisement : sommet interne (1..cols-1, 1..half-1)
      const vc = ri(1, cols - 1), vr = ri(1, half - 1);
      // au moins une des 4 cases autour doit être libre (pas en plein bloc)
      const autour = [[vr - 1, vc - 1], [vr - 1, vc], [vr, vc - 1], [vr, vc]];
      if (!autour.some(([rr, cc]) => cellLibre(rr, cc))) continue;
      pt = { x: vc, y: vr, v: true };
    }
    if (arbres.some((a) => dist2(a, pt) < 0.7)) continue; // espacement
    arbres.push(pt); i++;
  }
  // 4) Murets (chaînes de 1 à 2 segments entre sommets, diagonale possible)
  const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
  let nm = ri(cfg.murets[0], cfg.murets[1]);
  for (let i = 0, g = 0; i < nm && g < nm * 12 + 40; g++) {
    let vx = ri(1, cols - 1), vy = ri(1, half - 1);
    const len = ri(1, 2);
    const segs = [];
    let ok = true;
    for (let k = 0; k < len; k++) {
      const [dc, dr] = DIRS[Math.floor(rng() * DIRS.length)];
      const nx = vx + dc, ny = vy + dr;
      if (nx < 0 || nx > cols || ny < 0 || ny > half - 1) { ok = false; break; }
      // la cellule sous le milieu du segment ne doit pas être en zone de déploiement
      const mr = Math.floor((vy + ny) / 2 - 0.0001), mc = Math.floor((vx + nx) / 2 - 0.0001);
      if (depSet.has(Math.max(0, mr) + "," + Math.max(0, mc))) { ok = false; break; }
      segs.push({ x1: vx, y1: vy, x2: nx, y2: ny });
      vx = nx; vy = ny;
    }
    if (!ok || !segs.length) continue;
    segs.forEach((s) => murets.push(s)); i++;
  }

  // ---- Symétrie 180° : on duplique la moitié haute vers le bas ----
  const mp = (x, y) => ({ x: cols - x, y: rows - y });
  const arbresF = arbres.concat(arbres.map((a) => ({ ...mp(a.x, a.y), v: a.v })));
  // murets : dédup pour éviter qu'un segment sur l'axe se recopie sur lui-même
  const keyW = (s) => {
    const a = [s.x1, s.y1], b = [s.x2, s.y2];
    const [p, q] = (a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1])) ? [a, b] : [b, a];
    return p[0] + ":" + p[1] + ":" + q[0] + ":" + q[1];
  };
  const muretsF = []; const vus = new Set();
  murets.concat(murets.map((s) => {
    const p1 = mp(s.x1, s.y1), p2 = mp(s.x2, s.y2);
    return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
  })).forEach((s) => { const k = keyW(s); if (!vus.has(k)) { vus.add(k); muretsF.push(s); } });
  const surF = surelevations.concat(surelevations.map((b) => ({ r: rows - 2 - b.r, c: cols - 2 - b.c })));
  const batF = batiments.concat(batiments.map((b) => ({ r: rows - 2 - b.r, c: cols - 2 - b.c })));

  const metriques = {
    biome,
    nbArbres: arbresF.length,
    nbMurets: muretsF.length,
    nbSurelevations: surF.length,
    nbBatiments: batF.length,
    couvertureBlocs: ((surF.length + batF.length) * 4) / (rows * cols),
    equilibre: "symétrie 180° (équité garantie par construction)",
  };

  return {
    cols, rows, biome, seed,
    deploiement: dep,
    arbres: arbresF, murets: muretsF, surelevations: surF, batiments: batF,
    metriques,
  };
}

// ============================================================
//  Rendu SVG (chaîne, sans DOM)
// ============================================================
function dessinArbre(px, py, s) {
  const f1 = "#4f7050", f2 = "#456448", f3 = "#577a59", tr = "#6b4f3a";
  return (
    `<rect x="${px - s * 0.05}" y="${py + s * 0.12}" width="${s * 0.1}" height="${s * 0.2}" fill="${tr}"/>` +
    `<circle cx="${px - s * 0.15}" cy="${py + s * 0.04}" r="${s * 0.2}" fill="${f2}"/>` +
    `<circle cx="${px + s * 0.15}" cy="${py + s * 0.04}" r="${s * 0.2}" fill="${f3}"/>` +
    `<circle cx="${px}" cy="${py - s * 0.1}" r="${s * 0.24}" fill="${f1}"/>`
  );
}
function dessinSurelevation(x, y, w, h) {
  const fill = "#9a7b4f", st = "#75592f";
  const cx = x + w / 2;
  return (
    `<rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${h - 2}" rx="3" fill="${fill}" fill-opacity="0.85" stroke="${st}" stroke-width="1.4"/>` +
    `<path d="M${x + w * 0.18} ${y + h * 0.6} Q${cx} ${y + h * 0.3} ${x + w * 0.82} ${y + h * 0.6}" fill="none" stroke="${st}" stroke-opacity="0.6" stroke-width="${w * 0.04}"/>` +
    `<path d="M${x + w * 0.3} ${y + h * 0.78} Q${cx} ${y + h * 0.52} ${x + w * 0.7} ${y + h * 0.78}" fill="none" stroke="${st}" stroke-opacity="0.5" stroke-width="${w * 0.035}"/>`
  );
}
function dessinBatiment(x, y, w, h) {
  const mur = "#9a8f84", toit = "#6e4b3a", st = "#4f4640";
  const inset = w * 0.12;
  const bx = x + inset, by = y + h * 0.34, bw = w - inset * 2, bh = h - h * 0.34 - inset;
  return (
    // toit
    `<path d="M${x + inset * 0.6} ${y + h * 0.4} L${x + w / 2} ${y + inset} L${x + w - inset * 0.6} ${y + h * 0.4} Z" fill="${toit}" stroke="${st}" stroke-width="1"/>` +
    // corps
    `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${mur}" stroke="${st}" stroke-width="1"/>` +
    // porte + fenêtre
    `<rect x="${bx + bw * 0.4}" y="${by + bh * 0.45}" width="${bw * 0.2}" height="${bh * 0.55}" fill="${st}"/>` +
    `<rect x="${bx + bw * 0.12}" y="${by + bh * 0.2}" width="${bw * 0.18}" height="${bh * 0.25}" fill="${st}"/>` +
    `<rect x="${bx + bw * 0.7}" y="${by + bh * 0.2}" width="${bw * 0.18}" height="${bh * 0.25}" fill="${st}"/>`
  );
}

export function rendreTerrainSVG(terrain, opts = {}) {
  const s = opts.tailleCase || 26;
  const { cols, rows, deploiement, arbres, murets, surelevations, batiments } = terrain;
  const W = cols * s, H = rows * s;
  let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg" class="cp-terrain-svg" role="img" aria-label="Terrain de bataille généré">`;

  // Fond
  svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="var(--lightgray, #e8e4da)"/>`;

  // Zones de déploiement (données)
  const drawZone = (cells, color) =>
    cells.map(([r, c]) => `<rect x="${c * s}" y="${r * s}" width="${s}" height="${s}" fill="${color}"/>`).join("");
  svg += drawZone(deploiement.zoneA, "rgba(46,116,181,0.16)");
  svg += drawZone(deploiement.zoneB, "rgba(176,86,63,0.16)");

  // Grille
  let lignes = "";
  for (let c = 0; c <= cols; c++) lignes += `<line x1="${c * s}" y1="0" x2="${c * s}" y2="${H}"/>`;
  for (let r = 0; r <= rows; r++) lignes += `<line x1="0" y1="${r * s}" x2="${W}" y2="${r * s}"/>`;
  svg += `<g stroke="var(--gray, #b8b0a0)" stroke-width="0.5" stroke-opacity="0.5">${lignes}</g>`;

  // Surélévations puis bâtiments (blocs 2×2)
  surelevations.forEach((b) => { svg += dessinSurelevation(b.c * s, b.r * s, 2 * s, 2 * s); });
  batiments.forEach((b) => { svg += dessinBatiment(b.c * s, b.r * s, 2 * s, 2 * s); });

  // Murets (segments, diagonale possible)
  murets.forEach((m) => {
    svg += `<line x1="${m.x1 * s}" y1="${m.y1 * s}" x2="${m.x2 * s}" y2="${m.y2 * s}" stroke="#5f564d" stroke-width="${s * 0.2}" stroke-linecap="round"/>`;
    svg += `<line x1="${m.x1 * s}" y1="${m.y1 * s}" x2="${m.x2 * s}" y2="${m.y2 * s}" stroke="#9a8f84" stroke-width="${s * 0.08}" stroke-linecap="round"/>`;
  });

  // Arbres (points)
  arbres.forEach((a) => { svg += dessinArbre(a.x * s, a.y * s, s); });

  // Liserés de déploiement (cadre fin autour des cellules de zone)
  const frame = `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="none" stroke="var(--gray, #b8b0a0)" stroke-width="1"/>`;
  svg += frame + `</svg>`;
  return svg;
}
