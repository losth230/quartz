// ============================================================
//  C&P — Générateur procédural de terrain de bataille
//  À placer dans : quartz/static/cp-terrain.js
//
//  Génère un champ de bataille sur une grille carrée (par défaut 10×14),
//  ÉQUILIBRÉ PAR CONSTRUCTION via une symétrie de rotation à 180° :
//  le terrain est généré sur la moitié haute, puis recopié par rotation
//  centrale sur la moitié basse. Chaque camp fait donc face à une
//  configuration rigoureusement équivalente.
//
//  Module PUR (aucun accès au DOM) : la génération et le rendu SVG sont
//  des fonctions sans effet de bord, donc testables et réutilisables.
//
//  API publique :
//    genererTerrain({ cols, rows, couverture, seed }) -> { cols, rows, dz, grille, seed, metriques }
//    rendreTerrainSVG(terrain, { tailleCase }) -> string (SVG)
//    TYPES_TERRAIN -> métadonnées des types (libellé, couleur)
// ============================================================

// ---- Types de terrain (génériques) ----
export const TYPES_TERRAIN = {
  foret:     { libelle: "Forêt",            couleur: "#4f7050", poids: 3, tailleMin: 3, tailleMax: 6 },
  colline:   { libelle: "Colline",          couleur: "#9a7b4f", poids: 2, tailleMin: 2, tailleMax: 4 },
  eau:       { libelle: "Eau",              couleur: "#3f7d96", poids: 2, tailleMin: 3, tailleMax: 7 },
  ruines:    { libelle: "Ruines",           couleur: "#8a8079", poids: 2, tailleMin: 2, tailleMax: 4 },
  difficile: { libelle: "Terrain difficile",couleur: "#7d6a82", poids: 2, tailleMin: 2, tailleMax: 5 },
};

// ---- Générateur pseudo-aléatoire reproductible (mulberry32) ----
// Un même seed redonne exactement le même terrain (utile pour rejouer / mémoriser).
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
  const couverture = opts.couverture != null ? opts.couverture : 0.25; // part visée de cases de terrain
  const seed = opts.seed != null ? opts.seed : (Math.random() * 1e9) | 0;
  const rng = mulberry32(seed);

  const grille = Array.from({ length: rows }, () => Array(cols).fill(null));
  const half = Math.floor(rows / 2);                 // on génère sur rows 0..half-1, puis on mirroir
  const dz = rows <= 12 ? 2 : 3;                      // profondeur des zones de déploiement (haut/bas)
  const typeList = Object.keys(TYPES_TERRAIN);

  function pickType() {
    const total = typeList.reduce((s, t) => s + TYPES_TERRAIN[t].poids, 0);
    let x = rng() * total;
    for (const t of typeList) { x -= TYPES_TERRAIN[t].poids; if (x <= 0) return t; }
    return typeList[0];
  }
  // Distance min à une case de même type déjà posée (évite l'agglutination)
  function tropProche(r, c, type, dmin) {
    for (let rr = Math.max(0, r - dmin); rr <= Math.min(half - 1, r + dmin); rr++)
      for (let cc = Math.max(0, c - dmin); cc <= Math.min(cols - 1, c + dmin); cc++)
        if (grille[rr][cc] === type) return true;
    return false;
  }

  const cibleHaut = Math.round((couverture * rows * cols) / 2); // cases de terrain visées sur la moitié haute
  const maxFeatures = 9;
  let posees = 0, features = 0, garde = 0;

  while (posees < cibleHaut && features < maxFeatures && garde++ < 300) {
    const type = pickType();
    // Choix d'une graine dans la moitié haute, en évitant la toute dernière ligne (bord arrière)
    const sr = 1 + Math.floor(rng() * (half - 1));   // 1..half-1
    const sc = Math.floor(rng() * cols);
    if (grille[sr][sc] !== null) continue;
    if (tropProche(sr, sc, type, 2)) continue;       // espacement entre clusters de même type

    // Croissance d'un amas organique à partir de la graine
    const tMin = TYPES_TERRAIN[type].tailleMin, tMax = TYPES_TERRAIN[type].tailleMax;
    const taille = tMin + Math.floor(rng() * (tMax - tMin + 1));
    const cells = [[sr, sc]];
    grille[sr][sc] = type;
    let ajout = 1, essais = 0;

    // L'eau s'allonge (rivière/ruisseau) : on biaise sa croissance sur un axe
    const axeEau = rng() < 0.5 ? "h" : "v";
    const dirs4 = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const dirsEau = axeEau === "h"
      ? [[0, -1], [0, 1], [0, -1], [0, 1], [-1, 0], [1, 0]]
      : [[-1, 0], [1, 0], [-1, 0], [1, 0], [0, -1], [0, 1]];

    while (ajout < taille && essais++ < taille * 10) {
      const [br, bc] = cells[Math.floor(rng() * cells.length)];
      const dirs = type === "eau" ? dirsEau : dirs4;
      const [dr, dc] = dirs[Math.floor(rng() * dirs.length)];
      const nr = br + dr, nc = bc + dc;
      if (nr >= 0 && nr < half && nc >= 0 && nc < cols && grille[nr][nc] === null) {
        grille[nr][nc] = type; cells.push([nr, nc]); ajout++;
      }
    }
    posees += ajout; features++;
  }

  // ---- Symétrie de rotation à 180° : (r,c) -> (rows-1-r, cols-1-c) ----
  for (let r = 0; r < half; r++)
    for (let c = 0; c < cols; c++)
      if (grille[r][c]) grille[rows - 1 - r][cols - 1 - c] = grille[r][c];

  // ---- Dégagement des zones de déploiement (symétrique) ----
  // On garantit qu'au moins ~60 % de chaque zone de déploiement reste praticable.
  function clairsDeZone(r0, r1) {
    let libres = 0, total = 0;
    for (let r = r0; r <= r1; r++) for (let c = 0; c < cols; c++) { total++; if (!grille[r][c]) libres++; }
    return libres / total;
  }
  // zone haute = rows 0..dz-1 ; on retire des cases (et leur miroir) tant que < 0.6
  let secu = 0;
  while (clairsDeZone(0, dz - 1) < 0.6 && secu++ < 100) {
    // trouve une case de terrain dans la zone haute et la retire avec son miroir
    let fait = false;
    for (let r = 0; r < dz && !fait; r++) for (let c = 0; c < cols && !fait; c++) {
      if (grille[r][c]) {
        grille[r][c] = null;
        grille[rows - 1 - r][cols - 1 - c] = null;
        fait = true;
      }
    }
    if (!fait) break;
  }

  // ---- Métriques (rendent l'ingénierie visible) ----
  let terrain = 0; const parType = {};
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const t = grille[r][c];
    if (t) { terrain++; parType[t] = (parType[t] || 0) + 1; }
  }
  const tiers = Math.floor(rows / 3);
  let centre = 0, centreTotal = 0;
  for (let r = tiers; r < rows - tiers; r++) for (let c = 0; c < cols; c++) { centreTotal++; if (grille[r][c]) centre++; }

  const metriques = {
    couverture: terrain / (rows * cols),
    parType,
    couvertureCentre: centreTotal ? centre / centreTotal : 0,
    clairsDeploiement: clairsDeZone(0, dz - 1),
    equilibre: "symétrie 180° (équité garantie par construction)",
  };

  return { cols, rows, dz, grille, seed, metriques };
}

// ============================================================
//  Rendu SVG (chaîne de caractères, sans DOM)
// ============================================================
function iconeCase(type, x, y, s) {
  const cx = x + s / 2, cy = y + s / 2;
  const sombre = "rgba(0,0,0,0.28)", clair = "rgba(255,255,255,0.30)";
  switch (type) {
    case "foret": {
      // quelques sapins (triangles)
      const tri = (tx, ty, h) =>
        `<path d="M${tx} ${ty} L${tx - h * 0.5} ${ty + h} L${tx + h * 0.5} ${ty + h} Z" fill="${sombre}"/>`;
      return tri(cx - s * 0.18, y + s * 0.22, s * 0.34) + tri(cx + s * 0.18, y + s * 0.3, s * 0.3) + tri(cx, y + s * 0.34, s * 0.36);
    }
    case "colline":
      // arcs concentriques (courbes de niveau)
      return `<path d="M${x + s * 0.2} ${y + s * 0.66} Q${cx} ${y + s * 0.28} ${x + s * 0.8} ${y + s * 0.66}" fill="none" stroke="${sombre}" stroke-width="${s * 0.07}"/>` +
             `<path d="M${x + s * 0.34} ${y + s * 0.72} Q${cx} ${y + s * 0.46} ${x + s * 0.66} ${y + s * 0.72}" fill="none" stroke="${sombre}" stroke-width="${s * 0.06}"/>`;
    case "eau":
      // lignes ondulées
      return `<path d="M${x + s * 0.15} ${cy - s * 0.12} q${s * 0.17} ${-s * 0.12} ${s * 0.35} 0 q${s * 0.17} ${s * 0.12} ${s * 0.35} 0" fill="none" stroke="${clair}" stroke-width="${s * 0.07}"/>` +
             `<path d="M${x + s * 0.15} ${cy + s * 0.14} q${s * 0.17} ${-s * 0.12} ${s * 0.35} 0 q${s * 0.17} ${s * 0.12} ${s * 0.35} 0" fill="none" stroke="${clair}" stroke-width="${s * 0.07}"/>`;
    case "ruines": {
      // murs brisés (petits rectangles)
      const r = (rx, ry, rw, rh) => `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="${sombre}"/>`;
      return r(x + s * 0.24, y + s * 0.42, s * 0.16, s * 0.3) + r(x + s * 0.46, y + s * 0.3, s * 0.14, s * 0.42) + r(x + s * 0.64, y + s * 0.5, s * 0.13, s * 0.22);
    }
    case "difficile": {
      // semis de points
      const d = (dx, dy) => `<circle cx="${dx}" cy="${dy}" r="${s * 0.05}" fill="${sombre}"/>`;
      return d(cx - s * 0.2, cy - s * 0.15) + d(cx + s * 0.18, cy - s * 0.1) + d(cx - s * 0.05, cy + s * 0.18) + d(cx + s * 0.22, cy + s * 0.16) + d(cx - s * 0.24, cy + s * 0.05);
    }
    default: return "";
  }
}

export function rendreTerrainSVG(terrain, opts = {}) {
  const s = opts.tailleCase || 26;
  const { cols, rows, dz, grille } = terrain;
  const W = cols * s, H = rows * s;
  let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg" class="cp-terrain-svg" role="img" aria-label="Terrain de bataille généré">`;

  // Fond du plateau
  svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="var(--lightgray, #e8e4da)"/>`;

  // Bandes de déploiement (haut = camp 1, bas = camp 2)
  svg += `<rect x="0" y="0" width="${W}" height="${dz * s}" fill="rgba(46,116,181,0.10)"/>`;
  svg += `<rect x="0" y="${H - dz * s}" width="${W}" height="${dz * s}" fill="rgba(176,86,63,0.10)"/>`;

  // Cases de terrain
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const t = grille[r][c];
    if (!t) continue;
    const x = c * s, y = r * s;
    svg += `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${TYPES_TERRAIN[t].couleur}" fill-opacity="0.92"/>`;
    svg += iconeCase(t, x, y, s);
  }

  // Grille (lignes fines)
  let lignes = "";
  for (let c = 0; c <= cols; c++) lignes += `<line x1="${c * s}" y1="0" x2="${c * s}" y2="${H}"/>`;
  for (let r = 0; r <= rows; r++) lignes += `<line x1="0" y1="${r * s}" x2="${W}" y2="${r * s}"/>`;
  svg += `<g stroke="var(--gray, #b8b0a0)" stroke-width="0.5" stroke-opacity="0.5">${lignes}</g>`;

  // Liserés des zones de déploiement
  svg += `<line x1="0" y1="${dz * s}" x2="${W}" y2="${dz * s}" stroke="rgba(46,116,181,0.55)" stroke-width="1.4" stroke-dasharray="4 3"/>`;
  svg += `<line x1="0" y1="${H - dz * s}" x2="${W}" y2="${H - dz * s}" stroke="rgba(176,86,63,0.55)" stroke-width="1.4" stroke-dasharray="4 3"/>`;

  // Cadre
  svg += `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="none" stroke="var(--gray, #b8b0a0)" stroke-width="1"/>`;
  svg += `</svg>`;
  return svg;
}
