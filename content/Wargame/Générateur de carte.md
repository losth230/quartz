<style>
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }

  :root, body.dark {
    --bg: #0f0b08;
    --map-bg: #0a0704;
    --text: #e8dcc0;
    --text-muted: #b8a880;
    --text-dim: #8a7a60;
    --accent: #f4d58b;
    --accent-soft: #c8b896;
    --panel-bg: rgba(20, 14, 8, 0.92);
    --panel-border: #4a3a26;
    --field-bg: #0f0b08;
    --field-border: #4a3a26;
    --separator: #2a1e10;
    --btn-bg: #3a2a16;
    --btn-border: #6a4a26;
    --btn-hover: #4a3520;
    --btn-active: #2a1e10;
    --btn-small-bg: #2a1e10;
    --highlight-bg: #1a1208;
    --highlight-border: #3a2a16;
    --accent-bg: #2a1e10;
  }
  body.light {
    --bg: #f4ecd8;
    --map-bg: #ebe0c4;
    --text: #2a1e10;
    --text-muted: #5a4a30;
    --text-dim: #8a7a60;
    --accent: #7a4a18;
    --accent-soft: #4a3520;
    --panel-bg: rgba(250, 242, 220, 0.94);
    --panel-border: #c8b890;
    --field-bg: #fffaec;
    --field-border: #c8b890;
    --separator: #d0c0a0;
    --btn-bg: #e0d0a8;
    --btn-border: #a88858;
    --btn-hover: #d0bc90;
    --btn-active: #b89a68;
    --btn-small-bg: #ece0c0;
    --highlight-bg: #eee0b8;
    --highlight-border: #c8b890;
    --accent-bg: #d8c498;
  }
  html, body {
    width: 100%; height: 100%;
    background: var(--bg);
    color: var(--text);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 13px;
    overflow: hidden;
    overscroll-behavior: none;
    user-select: none; -webkit-user-select: none;
    transition: background 0.25s, color 0.25s;
  }
  #map {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    background: var(--map-bg);
    touch-action: none;
  }
  .panel {
    position: absolute;
    background: var(--panel-bg);
    border: 1px solid var(--panel-border);
    border-radius: 6px;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    transition: background 0.25s, border-color 0.25s;
  }
  #info {
    top: env(safe-area-inset-top, 10px);
    left: 10px;
    padding: 10px 12px;
    min-width: 170px; max-width: 260px;
    font-size: 12px; line-height: 1.5;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s;
  }
  #info.visible { opacity: 1; }
  #info .biome { font-weight: bold; color: var(--accent); margin-bottom: 4px; font-size: 13px; }
  #info .row { display: flex; justify-content: space-between; gap: 8px; }
  #info .row span:last-child { color: var(--text-muted); }
  #info .res { margin-top: 4px; color: var(--accent); font-weight: bold; }
  #info .river { margin-top: 2px; color: #6eb5ff; }

  #controls {
    right: 10px; top: env(safe-area-inset-top, 10px);
    padding: 8px;
    display: flex; flex-direction: column; gap: 6px;
    max-width: 250px;
    max-height: calc(100vh - env(safe-area-inset-top, 10px) - env(safe-area-inset-bottom, 10px) - 20px);
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  #controls::-webkit-scrollbar { width: 6px; }
  #controls::-webkit-scrollbar-track { background: transparent; }
  #controls::-webkit-scrollbar-thumb { background: var(--panel-border); border-radius: 3px; }
  #controls.collapsed .body { display: none; }
  #controls .head {
    display: flex; align-items: center; justify-content: space-between;
    gap: 8px; cursor: pointer; padding: 2px 4px;
    position: sticky; top: -8px;
    background: var(--panel-bg);
    margin: -8px -8px 0; padding: 10px 12px 6px;
    border-bottom: 1px solid var(--separator);
    z-index: 1;
  }
  #controls .head span:first-child { font-weight: bold; color: var(--accent); letter-spacing: 0.5px; }
  #controls .body { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }

  .field { display: flex; align-items: center; gap: 6px; font-size: 12px; }
  .field label { flex: 1; color: var(--accent-soft); }
  .field input[type="text"], .field select, .field input[type="number"] {
    width: 90px; padding: 4px 6px;
    background: var(--field-bg); color: var(--text);
    border: 1px solid var(--field-border); border-radius: 3px;
    font-family: inherit; font-size: 12px;
  }
  .field input[type="number"] { width: 70px; }
  .field input[type="range"] { flex: 1; accent-color: #a86a30; min-width: 60px; }
  .field input[type="checkbox"] { accent-color: #a86a30; width: 16px; height: 16px; }
  .value { color: var(--text-muted); min-width: 40px; text-align: right; font-size: 11px; }

  .subgroup {
    border-top: 1px solid var(--separator);
    padding-top: 5px; margin-top: 3px;
  }
  .subgroup .subhead {
    cursor: pointer;
    color: var(--accent-soft);
    font-size: 11px;
    font-weight: bold;
    padding: 3px 2px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    letter-spacing: 0.5px;
  }
  .subgroup .subhead:hover { color: var(--accent); }
  .subgroup.collapsed .sub-body { display: none; }
  .subgroup .sub-body {
    display: flex; flex-direction: column; gap: 4px;
    padding: 4px 2px 4px 4px;
  }
  .subgroup .sub-body .field label { font-size: 11px; color: var(--text-muted); }

  /* Sous-sections imbriquées (par ressource) */
  .subgroup.nested {
    border-top: 1px dashed var(--separator);
    margin-top: 2px; padding-top: 2px;
  }

  /* Section Voisinages : paires compactes */
  #adjacency-container .field {
    font-size: 11px;
    gap: 4px;
  }
  #adjacency-container .field label {
    flex: 1; min-width: 0;
    font-size: 10px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  #adjacency-container select {
    flex-shrink: 0;
  }
  .subgroup.nested .subhead {
    font-size: 10px; padding: 2px 2px;
  }
  .subgroup.nested .sub-body {
    padding-left: 10px; padding-right: 2px;
  }
  .subhead .res-icon {
    display: inline-block; width: 10px; height: 10px;
    vertical-align: middle; margin-right: 4px;
  }
  .reset-btn {
    background: none; border: none;
    color: var(--text-dim); font-size: 11px;
    padding: 0 4px; cursor: pointer;
    font-family: inherit;
  }
  .reset-btn:hover { color: var(--text-muted); }

  #size-preview {
    padding: 4px 8px;
    background: var(--highlight-bg);
    border: 1px solid var(--highlight-border);
    border-radius: 3px;
    font-size: 11px; color: var(--text-muted);
    text-align: center;
    font-weight: bold;
  }
  #size-preview b { color: var(--accent); }

  button.primary {
    padding: 8px 10px;
    background: var(--btn-bg); color: var(--accent);
    border: 1px solid var(--btn-border); border-radius: 4px;
    font-family: inherit; font-size: 12px; font-weight: bold;
    cursor: pointer; letter-spacing: 0.5px;
  }
  button.primary:hover { background: var(--btn-hover); }
  button.primary:active { background: var(--btn-active); }
  button.small {
    padding: 4px 8px; font-size: 11px; font-weight: normal;
    background: var(--btn-small-bg); color: var(--accent-soft);
    border: 1px solid var(--field-border); border-radius: 3px;
    font-family: inherit; cursor: pointer;
  }

  #hint {
    position: absolute;
    bottom: calc(env(safe-area-inset-bottom, 0px) + 8px);
    left: 50%; transform: translateX(-50%);
    padding: 6px 12px;
    font-size: 11px; color: var(--text-dim);
    background: var(--panel-bg);
    border-radius: 10px;
    pointer-events: none;
    transition: opacity 1s;
  }

  #legend {
    position: absolute;
    bottom: calc(env(safe-area-inset-bottom, 0px) + 36px);
    left: 10px;
    padding: 8px;
    max-width: 200px;
    font-size: 10px;
    display: none;
  }
  #legend.visible { display: block; }
  #legend .title { font-weight: bold; color: var(--accent); margin-bottom: 4px; font-size: 11px; letter-spacing: 0.5px; }
  #legend .sep { margin: 5px 0 3px; color: var(--text-dim); font-size: 10px; letter-spacing: 0.5px; }
  #legend .sw {
    display: inline-block; width: 12px; height: 12px;
    margin-right: 5px; vertical-align: middle;
    border: 1px solid #000;
  }
  #legend .shape {
    display: inline-block; width: 12px; height: 12px;
    margin-right: 5px; vertical-align: middle;
  }
  #legend .item { display: flex; align-items: center; padding: 1px 0; }

  @media (max-width: 500px) {
    #controls { max-width: 220px; font-size: 11px; }
    .field input[type="text"], .field select { width: 70px; }
  }

  /* Avertissement (placement joueurs impossible, etc.) */
  #warning {
    padding: 6px 8px;
    background: rgba(180, 60, 30, 0.18);
    border: 1px solid rgba(200, 80, 40, 0.5);
    border-radius: 3px;
    font-size: 11px;
    color: #f0a880;
    margin-top: 4px;
    display: none;
  }
  #warning.visible { display: block; }

  /* Bouton thème : discret, en bas à droite */
  #theme-toggle {
    position: absolute;
    bottom: calc(env(safe-area-inset-bottom, 0px) + 10px);
    right: 10px;
    width: 36px; height: 36px;
    border-radius: 50%;
    background: var(--panel-bg);
    border: 1px solid var(--panel-border);
    color: var(--accent);
    font-size: 16px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    transition: background 0.25s, border-color 0.25s, transform 0.15s;
    z-index: 10;
  }
  #theme-toggle:hover { transform: scale(1.08); }
  #theme-toggle:active { transform: scale(0.95); }
</style>
</head>
<body>

<canvas id="map"></canvas>

<div id="info" class="panel"></div>

<div id="legend" class="panel"></div>

<div id="controls" class="panel">
  <div class="head" id="toggle-controls">
    <span>⚙ GÉNÉRATION</span>
    <span id="chevron">▾</span>
  </div>
  <div class="body">
    <div class="field" style="background:var(--accent-bg);border:1px solid var(--btn-border);border-radius:4px;padding:6px 10px;margin-bottom:4px;">
      <label style="color:var(--accent);font-weight:bold;letter-spacing:0.5px;">TYPE</label>
      <select id="map-type" style="width:110px;">
        <option value="continent">Continent</option>
        <option value="continents">Continents</option>
        <option value="pangea">Pangée</option>
        <option value="islands-large">Grandes îles</option>
        <option value="archipelago">Archipel</option>
        <option value="fragmented">Fragmenté</option>
        <option value="inland-sea">Mer intérieure</option>
        <option value="lakes">Terres + lacs</option>
        <option value="custom" selected>Personnalisé</option>
      </select>
    </div>
    <div class="field">
      <label>Joueurs</label>
      <input type="number" id="players" min="0" max="12" value="0" step="1">
      <button class="small" id="reroll-players" title="Replacer les joueurs">🎲</button>
    </div>
    <div class="field">
      <label>Sites</label>
      <select id="player-spread">
        <option value="close">Rapprochés (2-4)</option>
        <option value="medium">Moyenne (4-8)</option>
        <option value="far" selected>Éloignés (libre)</option>
      </select>
    </div>
    <div class="field">
      <label>Dist. min</label>
      <input type="range" id="player-dist" min="3" max="8" value="5">
      <span class="value" id="player-dist-v">5</span>
    </div>
    <div class="field">
      <label>Marge bord</label>
      <input type="range" id="player-edge" min="0" max="4" value="1">
      <span class="value" id="player-edge-v">1</span>
    </div>
    <div class="field">
      <label>Marge centre</label>
      <input type="range" id="player-center" min="0" max="8" value="0">
      <span class="value" id="player-center-v">0</span>
    </div>
    <div style="font-size:10px;color:var(--text-dim);padding:0 4px 2px;">Viabilité (autour de chaque tuile de départ)</div>
    <div class="field">
      <label>Continent ≥</label>
      <input type="range" id="player-cont" min="0" max="50" value="0" step="1">
      <span class="value" id="player-cont-v">0</span>
    </div>
    <div class="field">
      <label>Rayon insp.</label>
      <input type="range" id="player-inspect" min="1" max="6" value="3">
      <span class="value" id="player-inspect-v">3</span>
    </div>
    <div class="field" style="gap:4px;">
      <label>Requis</label>
      <label style="flex:0;font-size:10px;color:var(--text-muted);"><input type="checkbox" id="req-foret"> Forêt</label>
      <label style="flex:0;font-size:10px;color:var(--text-muted);"><input type="checkbox" id="req-montagne"> Mont.</label>
      <label style="flex:0;font-size:10px;color:var(--text-muted);"><input type="checkbox" id="req-desert"> Dés.</label>
    </div>
    <div class="field">
      <label>Seed</label>
      <input type="text" id="seed" value="grimoire">
    </div>
    <div class="field">
      <label>Bruit</label>
      <select id="noise-type">
        <option value="perlin" selected>Perlin</option>
        <option value="simplex">Simplex</option>
        <option value="perlin2">Perlin v2</option>
        <option value="simplex2">Simplex v2</option>
        <option value="mixed">Mixte</option>
      </select>
    </div>
    <div class="field">
      <label>Rayon</label>
      <input type="range" id="radius" min="10" max="18" value="12">
      <span class="value" id="radius-v">12</span>
    </div>
    <div id="size-preview">→ <b id="tile-count">469</b> tuiles</div>
    <div id="biome-counts" style="font-size:10px;color:var(--text-muted);padding:4px 6px;line-height:1.6;display:none;"></div>
    <div class="field">
      <label>Mer</label>
      <input type="range" id="sealevel" min="25" max="65" value="45">
      <span class="value" id="sealevel-v">45%</span>
    </div>
    <div class="field">
      <label>Montagnes</label>
      <input type="range" id="mountains" min="5" max="30" value="14">
      <span class="value" id="mountains-v">14%</span>
    </div>
    <button class="primary" id="regen">⟳ Générer</button>
    <div id="warning"></div>

    <!-- Élévation -->
    <div class="subgroup collapsed" id="sub-elev">
      <div class="subhead" data-toggle="sub-elev">
        <span>▸ TERRAIN</span>
        <button class="reset-btn" data-reset="elev">↺</button>
      </div>
      <div class="sub-body">
        <div style="font-size:10px;color:var(--text-dim);padding:0 4px 4px;line-height:1.4;">Forme et texture du relief.</div>
        <div class="field" title="Quel critère détermine le biome en priorité ? Exemple : si Élévation est 1er, l'altitude définit océans/terres/montagnes en premier ; si Humidité est 1er, ce sont les zones humides/sèches qui dominent quitte à laisser apparaître des marais en altitude.">
          <label>Priorité</label>
          <select id="biome-order">
            <option value="ETH" selected>Élév › Temp › Humid</option>
            <option value="EHT">Élév › Humid › Temp</option>
            <option value="TEH">Temp › Élév › Humid</option>
            <option value="THE">Temp › Humid › Élév</option>
            <option value="HET">Humid › Élév › Temp</option>
            <option value="HTE">Humid › Temp › Élév</option>
          </select>
        </div>
        <div class="field" title="Plus c'est haut, plus les continents sont LARGES. Bas = nombreuses petites masses, haut = un ou deux gros continents.">
          <label>Taille continents</label>
          <input type="range" id="e-cont" min="2" max="15" value="5">
          <span class="value" id="e-cont-v">5</span>
        </div>
        <div class="field" title="Plus c'est haut, plus les côtes sont DÉCOUPÉES (péninsules, golfes, presqu'îles). Bas = côtes lisses et rondes.">
          <label>Côtes irrégul.</label>
          <input type="range" id="e-scale" min="5" max="30" value="18">
          <span class="value" id="e-scale-v">18</span>
        </div>
        <div class="field" title="Compacité des terres. Haut = continents d'un seul tenant, océans bien dégagés. Bas = archipels, beaucoup de petites îles.">
          <label>Compacité</label>
          <input type="range" id="e-compact" min="0" max="100" value="65">
          <span class="value" id="e-compact-v">65%</span>
        </div>
        <div class="field" title="Niveau de détail du relief. Haut = nombreuses collines et vallées, terrain accidenté. Bas = relief plat et uniforme.">
          <label>Variabilité</label>
          <input type="range" id="e-oct" min="1" max="6" value="4">
          <span class="value" id="e-oct-v">4</span>
        </div>
        <div class="field" title="Rugosité du terrain. Haut = relief tourmenté avec contrastes forts (pics et fosses). Bas = relief doux, transitions graduelles.">
          <label>Rugosité</label>
          <input type="range" id="e-pers" min="20" max="80" value="50">
          <span class="value" id="e-pers-v">0.50</span>
        </div>
        <div class="field" title="Force du masque qui éloigne la terre des bords de la carte. Haut = océan tout autour des terres. Bas = continents qui peuvent toucher le bord.">
          <label>Réduction bords</label>
          <input type="range" id="e-edge" min="0" max="60" value="10">
          <span class="value" id="e-edge-v">10%</span>
        </div>
        <div class="field" title="Probabilité d'apparition d'îles isolées au milieu des océans. Haut = beaucoup d'archipels et d'îlots. Bas = océans propres sans îles parasites.">
          <label>Îlots</label>
          <input type="range" id="e-islands" min="0" max="100" value="20">
          <span class="value" id="e-islands-v">20%</span>
        </div>
      </div>
    </div>

    <!-- Humidité -->
    <div class="subgroup collapsed" id="sub-humid">
      <div class="subhead" data-toggle="sub-humid">
        <span>▸ CLIMAT — HUMIDITÉ</span>
        <button class="reset-btn" data-reset="humid">↺</button>
      </div>
      <div class="sub-body">
        <div style="font-size:10px;color:var(--text-dim);padding:0 4px 4px;line-height:1.4;">Influence forêts, déserts et marais.</div>
        <div class="field" title="Taille des zones climatiques humides ou sèches. Haut = grandes régions homogènes (un grand désert, une grande forêt). Bas = patchwork de petites zones.">
          <label>Taille zones</label>
          <input type="range" id="h-scale" min="3" max="30" value="14">
          <span class="value" id="h-scale-v">14</span>
        </div>
        <div class="field" title="Variabilité interne d'une zone climatique. Haut = chaque zone a sous-zones et nuances. Bas = zones très uniformes.">
          <label>Variabilité</label>
          <input type="range" id="h-oct" min="1" max="6" value="3">
          <span class="value" id="h-oct-v">3</span>
        </div>
        <div class="field" title="Force des transitions entre humide et sec. Haut = transitions abruptes (frontière nette désert/forêt). Bas = transitions douces.">
          <label>Contraste</label>
          <input type="range" id="h-pers" min="20" max="80" value="55">
          <span class="value" id="h-pers-v">0.55</span>
        </div>
        <div class="field" title="Effet de continentalité : tuiles proches d'un océan = humides, cœur des continents = sec. Haut = grands déserts continentaux réalistes. Bas = humidité libre (placement plus aléatoire).">
          <label>Continentalité</label>
          <input type="range" id="h-cont" min="0" max="100" value="40">
          <span class="value" id="h-cont-v">40%</span>
        </div>
      </div>
    </div>

    <!-- Température -->
    <div class="subgroup collapsed" id="sub-temp">
      <div class="subhead" data-toggle="sub-temp">
        <span>▸ CLIMAT — TEMPÉRATURE</span>
        <button class="reset-btn" data-reset="temp">↺</button>
      </div>
      <div class="sub-body">
        <div style="font-size:10px;color:var(--text-dim);padding:0 4px 4px;line-height:1.4;">Influence neige et zones glaciales.</div>
        <div class="field" title="Position des pôles : Nord/Sud (haut/bas), Est/Ouest (gauche/droite), Centre (un seul pôle au milieu) ou Aucun (climat uniforme).">
          <label>Pôles</label>
          <select id="t-poles">
            <option value="ns" selected>Nord / Sud</option>
            <option value="ew">Est / Ouest</option>
            <option value="center">Centre</option>
            <option value="none">Aucun</option>
          </select>
        </div>
        <div class="field" title="Force du gradient entre l'équateur et les pôles. Haut = pôles très petits, équateur très large. Bas = transitions douces, climat plus uniforme.">
          <label>Force pôles</label>
          <input type="range" id="t-lat" min="50" max="300" value="140">
          <span class="value" id="t-lat-v">1.40</span>
        </div>
        <div class="field" title="Taille des taches climatiques chaudes/froides hors-gradient. Haut = grandes anomalies. Bas = perturbations fines.">
          <label>Taches climat.</label>
          <input type="range" id="t-scale" min="3" max="30" value="10">
          <span class="value" id="t-scale-v">10</span>
        </div>
        <div class="field" title="Intensité des perturbations climatiques aléatoires. Haut = climat chaotique, ne suit plus la latitude. Bas = climat purement zonal (équateur chaud, pôles froids).">
          <label>Désordre</label>
          <input type="range" id="t-noise" min="0" max="40" value="12">
          <span class="value" id="t-noise-v">0.12</span>
        </div>
        <div class="field" title="Refroidissement avec l'altitude. Haut = sommets gelés, neige dès que ça monte. Bas = montagnes gardent le climat de leur région.">
          <label>Froid altitude</label>
          <input type="range" id="t-alt" min="0" max="100" value="50">
          <span class="value" id="t-alt-v">0.50</span>
        </div>
      </div>
    </div>

    <!-- Contraintes géographiques -->
    <div class="subgroup collapsed" id="sub-constraints">
      <div class="subhead" data-toggle="sub-constraints">
        <span>▸ CONTRAINTES</span>
        <button class="reset-btn" data-reset="constraints">↺</button>
      </div>
      <div class="sub-body">
        <div class="field">
          <label>Même biome</label>
          <select id="c-surround-same">
            <option value="0">Désactivé</option>
            <option value="4">Max 4 voisins</option>
            <option value="5" selected>Max 5 voisins</option>
            <option value="6">Max 6 voisins</option>
          </select>
        </div>
        <div style="font-size:10px;color:var(--text-dim);padding:0 4px 2px;">≥ N voisins du même biome → mute un voisin</div>
        <div class="field">
          <label>Encerclement</label>
          <select id="c-surround-any">
            <option value="0" selected>Désactivé</option>
            <option value="4">Max 4 voisins</option>
            <option value="5">Max 5 voisins</option>
            <option value="6">Max 6 voisins</option>
          </select>
        </div>
        <div style="font-size:10px;color:var(--text-dim);padding:0 4px 4px;">≥ N voisins d'un même biome (≠ centre) → un voisin adopte le biome central</div>
        <div style="font-size:10px;color:var(--text-dim);padding:2px 4px 4px;">Cap par biome (0 = illimité)</div>
        <div class="field">
          <label>Plaine</label>
          <input type="number" id="cap-plaine" min="0" max="1000" value="0" step="10">
        </div>
        <div class="field">
          <label>Forêt</label>
          <input type="number" id="cap-foret" min="0" max="1000" value="0" step="10">
        </div>
        <div class="field">
          <label>Désert</label>
          <input type="number" id="cap-desert" min="0" max="1000" value="0" step="10">
        </div>
        <div class="field">
          <label>Marais</label>
          <input type="number" id="cap-marais" min="0" max="1000" value="0" step="10">
        </div>
        <div class="field">
          <label>Montagne</label>
          <input type="number" id="cap-montagne" min="0" max="1000" value="0" step="10">
        </div>
        <div class="field">
          <label>Océan</label>
          <input type="number" id="cap-ocean" min="0" max="1000" value="0" step="10">
        </div>
        <div class="field">
          <label>Neige</label>
          <input type="number" id="cap-neige" min="0" max="1000" value="0" step="10">
        </div>
      </div>
    </div>

    <!-- Voisinages : règles d'adjacence entre biomes -->
    <div class="subgroup collapsed" id="sub-adjacency">
      <div class="subhead" data-toggle="sub-adjacency">
        <span>▸ VOISINAGES</span>
        <button class="reset-btn" data-reset="adjacency">↺</button>
      </div>
      <div class="sub-body">
        <div style="font-size:10px;color:var(--text-dim);padding:0 4px 4px;line-height:1.4;">Règles d'adjacence entre biomes. <b>Libre</b> = peut se toucher, <b>Tampon</b> = passe par une plaine entre les deux, <b>Interdit</b> = jamais voisins.</div>
        <div class="field">
          <input type="checkbox" id="adj-enabled">
          <label>Activer les règles</label>
        </div>
        <div id="adjacency-container">
          <!-- peuplé dynamiquement -->
        </div>
      </div>
    </div>

    <!-- Ressources (une sous-section par type) -->
    <div class="subgroup" id="sub-res">
      <div class="subhead" data-toggle="sub-res">
        <span>▾ RESSOURCES</span>
        <button class="reset-btn" data-reset="res">↺</button>
      </div>
      <div class="sub-body" id="res-container">
        <!-- peuplé dynamiquement -->
      </div>
    </div>

    <!-- Événements (nouveau) -->
    <div class="subgroup collapsed" id="sub-evt">
      <div class="subhead" data-toggle="sub-evt">
        <span>▸ ÉVÉNEMENTS</span>
        <button class="reset-btn" data-reset="evt">↺</button>
      </div>
      <div class="sub-body">
        <div class="field">
          <label>Volcans</label>
          <input type="range" id="evt-volcan" min="0" max="30" value="6">
          <span class="value" id="evt-volcan-v">6%</span>
        </div>
      </div>
    </div>

    <!-- Rivières : section dédiée -->
    <div class="subgroup collapsed" id="sub-rivers">
      <div class="subhead" data-toggle="sub-rivers">
        <span>▸ RIVIÈRES</span>
        <button class="reset-btn" data-reset="rivers">↺</button>
      </div>
      <div class="sub-body">
        <div style="font-size:10px;color:var(--text-dim);padding:0 4px 4px;line-height:1.4;">Cours d'eau entre les tuiles (flux hydrologique).</div>
        <div class="field" title="Densité du réseau hydrographique. Haut = beaucoup de cours d'eau (ruisseaux inclus). Bas = seuls les grands fleuves.">
          <label>Densité</label>
          <input type="range" id="evt-river" min="0" max="25" value="8">
          <span class="value" id="evt-river-v">8%</span>
        </div>
        <div class="field" title="Longueur minimale d'une rivière en arêtes. Les rivières plus courtes sont supprimées (élimine les petits segments isolés en bord de mer).">
          <label>Long. min</label>
          <input type="range" id="evt-riverlen" min="1" max="8" value="3">
          <span class="value" id="evt-riverlen-v">3</span>
        </div>
      </div>
    </div>

    <!-- Calques -->
    <div class="subgroup" style="border-top: 1px solid #2a1e10;">
      <div class="sub-body" style="padding-top: 4px;">
        <div class="field"><input type="checkbox" id="lay-rivers" checked><label>Rivières</label></div>
        <div class="field"><input type="checkbox" id="lay-resources" checked><label>Ressources</label></div>
        <div class="field"><input type="checkbox" id="lay-grid"><label>Grille</label></div>
        <div class="field"><input type="checkbox" id="lay-legend"><label>Légende</label></div>
      </div>
    </div>

    <button class="small" id="export">📷 Export PNG</button>
  </div>
</div>

<div id="hint">Pan · Pinch · Tap pour inspecter</div>

<button id="theme-toggle" title="Changer de thème" aria-label="Changer de thème">☾</button>

<script>
"use strict";

// ============================================================
// Valeurs par défaut des paramètres
// ============================================================
// ============================================================
// Presets de type de carte
// Chaque preset pousse un sous-ensemble des paramètres liés à la géographie.
// Ce qui n'est pas listé reste inchangé (climat, ressources, événements...).
// ============================================================
const MAP_PRESETS = {
  // Un gros continent unique, qui touche presque les bords
  'continent': {
    sealevel: 35,
    'e-cont':    4,   // continents très larges
    'e-scale':   14,
    'e-compact': 80,
    'e-edge':    5,
    'e-pers':    45
  },
  // Deux ou trois continents séparés par de la mer
  'continents': {
    sealevel: 50,
    'e-cont':    6,
    'e-scale':   16,
    'e-compact': 70,
    'e-edge':    15,
    'e-pers':    50
  },
  // Une seule masse qui couvre quasiment toute la carte (comme la Pangée)
  'pangea': {
    sealevel: 25,
    'e-cont':    3,   // très basse fréquence = une seule bosse centrale
    'e-scale':   12,
    'e-compact': 90,
    'e-edge':    0,
    'e-pers':    40
  },
  // Quelques grandes îles bien distinctes
  'islands-large': {
    sealevel: 55,
    'e-cont':    8,
    'e-scale':   18,
    'e-compact': 65,
    'e-edge':    25,
    'e-pers':    55
  },
  // Beaucoup de petites îles
  'archipelago': {
    sealevel: 55,
    'e-cont':    11,
    'e-scale':   22,
    'e-compact': 35,
    'e-edge':    30,
    'e-pers':    60
  },
  // Miettes de terre éparpillées dans un océan
  'fragmented': {
    sealevel: 60,
    'e-cont':    13,
    'e-scale':   26,
    'e-compact': 15,
    'e-edge':    35,
    'e-pers':    65
  },
  // Un grand continent avec une mer intérieure au milieu
  'inland-sea': {
    sealevel: 40,
    'e-cont':    5,
    'e-scale':   16,
    'e-compact': 75,
    'e-edge':    55,  // bord élevé pousse la mer au centre
    'e-pers':    45
  },
  // Grand continent criblé de petits lacs et golfes
  'lakes': {
    sealevel: 38,
    'e-cont':    5,
    'e-scale':   22,
    'e-compact': 55,  // détail fort → beaucoup de petites dépressions
    'e-edge':    10,
    'e-pers':    60
  }
};

const DEFAULTS = {
  elev:  { cont: 5, scale: 18, compact: 65, oct: 4, pers: 50, edge: 10, islands: 20 },
  humid: { scale: 14, oct: 3, pers: 55, cont: 40 },
  temp:  { lat: 140, scale: 10, noise: 12, alt: 50 },
  evt:   { volcan: 6, river: 8, riverlen: 3 },
  constraints: {
    surroundSame: 5,
    surroundAny: 0,
    'cap-plaine': 0, 'cap-foret': 0, 'cap-desert': 0, 'cap-marais': 0,
    'cap-montagne': 0, 'cap-ocean': 0, 'cap-neige': 0
  }
};

// Défauts par ressource (density en ‰, prox et size en pourcentage ou valeur entière)
const RES_DEFAULTS = {
  'Bétail':   { density: 30, prox: 70, size: 4 },
  'Baleines': { density: 12, prox: 60, size: 3 },
  'Poissons': { density: 35, prox: 65, size: 4 },
  'Or':       { density: 15, prox: 55, size: 3 },
  'Fer':      { density: 25, prox: 60, size: 4 },
  'Charbon':  { density: 20, prox: 55, size: 4 },
  'Ruines':   { density: 12, prox: 30, size: 2 },
  'Geyser':   { density: 8,  prox: 25, size: 2 },
  'Soie':     { density: 18, prox: 50, size: 3 }
};

// ============================================================
// PRNG (mulberry32)
// ============================================================
function hashString(s) {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h ^= h >>> 16) >>> 0;
}
function mulberry32(seed) {
  let s = seed >>> 0;
  return function() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================================
// Bruit de Perlin 2D
// ============================================================
class PerlinNoise {
  constructor(rand) {
    const perm = new Uint8Array(256);
    for (let i = 0; i < 256; i++) perm[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    this.p = new Uint8Array(512);
    for (let i = 0; i < 512; i++) this.p[i] = perm[i & 255];
  }
  fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  lerp(a, b, t) { return a + t * (b - a); }
  grad(hash, x, y) {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }
  noise2D(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = this.fade(xf);
    const v = this.fade(yf);
    const aa = this.p[this.p[X] + Y];
    const ab = this.p[this.p[X] + Y + 1];
    const ba = this.p[this.p[X + 1] + Y];
    const bb = this.p[this.p[X + 1] + Y + 1];
    const x1 = this.lerp(this.grad(aa, xf, yf),     this.grad(ba, xf - 1, yf),     u);
    const x2 = this.lerp(this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1), u);
    return this.lerp(x1, x2, v);
  }
  fbm(x, y, oct, pers, lac) {
    let sum = 0, amp = 1, freq = 1, norm = 0;
    for (let i = 0; i < oct; i++) {
      sum += amp * this.noise2D(x * freq, y * freq);
      norm += amp;
      amp *= pers;
      freq *= lac;
    }
    return sum / norm;
  }
}

// ============================================================
// Bruit Simplex 2D
// ============================================================
class SimplexNoise {
  constructor(rand) {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    this.p = new Uint8Array(512);
    for (let i = 0; i < 512; i++) this.p[i] = p[i & 255];
    this.grad = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[1,0],[-1,0],[0,1],[0,-1],[0,1],[0,-1]];
  }
  noise2D(x, y) {
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const G2 = (3 - Math.sqrt(3)) / 6;
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const t = (i + j) * G2;
    const x0 = x - (i - t);
    const y0 = y - (j - t);
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    const gi0 = this.p[ii + this.p[jj]] % 12;
    const gi1 = this.p[ii + i1 + this.p[jj + j1]] % 12;
    const gi2 = this.p[ii + 1 + this.p[jj + 1]] % 12;
    let n0 = 0, n1 = 0, n2 = 0;
    let t0 = 0.5 - x0*x0 - y0*y0;
    if (t0 > 0) { t0 *= t0; n0 = t0 * t0 * (this.grad[gi0][0]*x0 + this.grad[gi0][1]*y0); }
    let t1 = 0.5 - x1*x1 - y1*y1;
    if (t1 > 0) { t1 *= t1; n1 = t1 * t1 * (this.grad[gi1][0]*x1 + this.grad[gi1][1]*y1); }
    let t2 = 0.5 - x2*x2 - y2*y2;
    if (t2 > 0) { t2 *= t2; n2 = t2 * t2 * (this.grad[gi2][0]*x2 + this.grad[gi2][1]*y2); }
    return 70 * (n0 + n1 + n2);
  }
  fbm(x, y, oct, pers, lac) {
    let sum = 0, amp = 1, freq = 1, norm = 0;
    for (let i = 0; i < oct; i++) {
      sum += amp * this.noise2D(x * freq, y * freq);
      norm += amp;
      amp *= pers;
      freq *= lac;
    }
    return sum / norm;
  }
}

// ============================================================
// Hex axial (pointy-top)
// ============================================================
const SQRT3 = Math.sqrt(3);
let HEX = 20;
const AXIAL_DIRS = [
  [ 1,  0], [ 1, -1], [ 0, -1],
  [-1,  0], [-1,  1], [ 0,  1]
];
function axialToPixel(q, r) {
  return { x: HEX * SQRT3 * (q + r / 2), y: HEX * 1.5 * r };
}
function pixelToAxial(x, y) {
  const qF = (x * SQRT3 / 3 - y / 3) / HEX;
  const rF = (y * 2 / 3) / HEX;
  const xc = qF, zc = rF, yc = -xc - zc;
  let rx = Math.round(xc), ry = Math.round(yc), rz = Math.round(zc);
  const dx = Math.abs(rx - xc), dy = Math.abs(ry - yc), dz = Math.abs(rz - zc);
  if (dx > dy && dx > dz)      rx = -ry - rz;
  else if (dy > dz)             ry = -rx - rz;
  else                          rz = -rx - ry;
  return { q: rx, r: rz };
}

// Distance hexagonale entre deux tuiles axiales (en nombre de hex)
function axialDistance(aq, ar, bq, br) {
  return (Math.abs(aq - bq) + Math.abs(aq + ar - bq - br) + Math.abs(ar - br)) / 2;
}

// ============================================================
// BIOMES et RESSOURCES
// ============================================================
const BIOMES = {
  'Océan':    { color: '#1c4a7a', border: '#0a2e52' },
  'Plaine':   { color: '#aec95b', border: '#6e8a30' },
  'Forêt':    { color: '#2e5a28', border: '#153008' },
  'Désert':   { color: '#e0c470', border: '#a48030' },
  'Marais':   { color: '#6a4828', border: '#3a2814' },
  'Montagne': { color: '#808088', border: '#404048' },
  'Volcan':   { color: '#4a2018', border: '#1a0808' },
  'Neige':    { color: '#e8eef4', border: '#a8b8c4' }
};

// =============================================================
// CLASSIFICATION DES BIOMES
// L'ordre des trois critères (E=élévation, T=température, H=humidité)
// est paramétrable. On garde toujours certains invariants :
//   - Océan : si dessous niveau de la mer (toujours, peu importe l'ordre)
//   - Volcan : ajouté après classification (cas particulier)
// L'ordre influence le reste : qui domine la décision finale.
// =============================================================

// Catégories normalisées de chaque axe
function tempZone(t) {
  if (t < 0.15) return 'glacial';
  if (t < 0.30) return 'froid';
  if (t > 0.60) return 'chaud';
  return 'tempere';
}
function humidZone(h) {
  if (h < 0.30) return 'sec';
  if (h > 0.60) return 'humide';
  return 'modere';
}

function classifyBiome(e, t, h, seaLevel, mountainLevel, order) {
  // Invariants
  if (e < seaLevel) return 'Océan';

  order = order || 'ETH';
  const tZ = tempZone(t);
  const hZ = humidZone(h);
  const isHigh = e > mountainLevel;

  // -------------------------------------------------
  // Élévation EN PREMIER : montagnes priment sur le climat
  // -------------------------------------------------
  if (order[0] === 'E') {
    if (isHigh) return 'Montagne';
    // En second : T ou H
    if (order[1] === 'T') return _byTempThenHumid(tZ, hZ, t, h);
    return _byHumidThenTemp(tZ, hZ, t, h);
  }

  // -------------------------------------------------
  // Température EN PREMIER : climat domine, montagne 2e ou 3e
  // -------------------------------------------------
  if (order[0] === 'T') {
    // En zone glaciale, neige même au sommet (pas de Montagne)
    if (tZ === 'glacial') return 'Neige';
    // Sinon, montagne possible si on l'autorise (ordre[1] ou [2])
    if (order[1] === 'E') {
      if (isHigh) return 'Montagne';
      return _humidByTemp(tZ, hZ, h);
    }
    // T › H › E : humidité 2e, élévation 3e (montagne reste possible mais
    // les marais/déserts peuvent apparaître en altitude)
    if (isHigh && hZ === 'modere') return 'Montagne';
    return _humidByTemp(tZ, hZ, h);
  }

  // -------------------------------------------------
  // Humidité EN PREMIER : zones humides/sèches dominent
  // -------------------------------------------------
  if (order[0] === 'H') {
    // Zones très humides en climat tempéré/chaud → marais (même en altitude)
    if (hZ === 'humide' && (tZ === 'tempere' || tZ === 'chaud')) return 'Marais';
    // Zones très sèches en climat tempéré/chaud → désert (même en altitude)
    if (hZ === 'sec' && (tZ === 'tempere' || tZ === 'chaud')) return 'Désert';
    // Zones glaciales : neige domine
    if (tZ === 'glacial') return 'Neige';
    // Sinon : T ou E pour décider
    if (order[1] === 'E') {
      if (isHigh) return 'Montagne';
      return _humidByTemp(tZ, hZ, h);
    }
    // H › T › E : température 2e, élévation 3e
    if (tZ === 'froid') {
      if (h > 0.55) return 'Forêt';
      return 'Plaine';
    }
    if (isHigh) return 'Montagne';
    return _humidByTemp(tZ, hZ, h);
  }

  return 'Plaine';
}

// Helpers : déclinaison standard climat (ordre H par défaut dans la zone T)
function _humidByTemp(tZ, hZ, h) {
  if (tZ === 'glacial') return 'Neige';
  if (tZ === 'froid') {
    if (h > 0.55) return 'Forêt';
    return 'Plaine';
  }
  if (tZ === 'chaud') {
    if (h > 0.58) return 'Marais';
    if (h < 0.38) return 'Désert';
    if (h > 0.42) return 'Forêt';
    return 'Plaine';
  }
  // tempéré
  if (h > 0.65) return 'Marais';
  if (h < 0.30) return 'Désert';
  if (h > 0.48) return 'Forêt';
  return 'Plaine';
}

// E › T › H : élévation déjà gérée, on délègue à humidByTemp
function _byTempThenHumid(tZ, hZ, t, h) {
  return _humidByTemp(tZ, hZ, h);
}

// E › H › T : élévation déjà gérée, humidité prend le pas sur le climat
function _byHumidThenTemp(tZ, hZ, t, h) {
  // Zones très humides forment des marais quel que soit le climat (sauf gel)
  if (hZ === 'humide') {
    if (tZ === 'glacial') return 'Neige';
    if (tZ === 'froid') return 'Forêt';
    return 'Marais';
  }
  // Zones très sèches : désert si pas gel, sinon toundra (Plaine)
  if (hZ === 'sec') {
    if (tZ === 'glacial') return 'Neige';
    if (tZ === 'froid') return 'Plaine';
    return 'Désert';
  }
  // Modéré : selon climat
  if (tZ === 'glacial') return 'Neige';
  if (tZ === 'froid') return 'Forêt';
  if (tZ === 'chaud' && h < 0.42) return 'Plaine';
  return 'Forêt';
}

const RES_BY_BIOME = {
  'Plaine':   ['Bétail', 'Ruines'],
  'Marais':   ['Ruines'],
  'Désert':   ['Fer', 'Or', 'Charbon', 'Geyser'],
  'Océan':    ['Baleines', 'Poissons'],
  'Montagne': ['Fer', 'Or', 'Charbon'],
  'Forêt':    ['Soie', 'Ruines'],
  'Neige':    ['Ruines', 'Or', 'Fer', 'Charbon'],
  'Volcan':   []
};

const RES_STYLE = {
  'Bétail':   { shape: 'circle',   color: '#8a5028' },
  'Baleines': { shape: 'circle',   color: '#1e3250' },
  'Poissons': { shape: 'circle',   color: '#7ec4ea' },
  'Or':       { shape: 'square',   color: '#ffd040' },
  'Fer':      { shape: 'square',   color: '#b4b4bc' },
  'Charbon':  { shape: 'square',   color: '#1a1a1a' },
  'Ruines':   { shape: 'triangle', color: '#c8b890' },
  'Geyser':   { shape: 'triangle', color: '#80d8e8' },
  'Soie':     { shape: 'triangle', color: '#e890b0' }
};

// Palette joueurs : 12 couleurs distinctes, contrastantes sur tous les biomes
const PLAYER_COLORS = [
  '#ff3030', // rouge vif
  '#3070ff', // bleu vif
  '#30c850', // vert vif
  '#ffea00', // jaune
  '#c040d8', // violet
  '#ff9020', // orange
  '#00d8c0', // cyan
  '#ff60c0', // rose
  '#a07840', // bronze
  '#80ff60', // vert lime
  '#6040ff', // indigo
  '#d8d8d8'  // blanc cassé
];

// ============================================================
// GÉNÉRATION
// ============================================================
function generateMap(N, seedStr, params) {
  const baseHash = hashString(seedStr);
  // PRNG principal pour les bruits (ordre fixe : les noises ne bougent jamais)
  const rand = mulberry32(baseHash);
  // PRNG dédiés, indépendants — chaque étape stochastique a le sien.
  // Ainsi, changer un paramètre d'une étape ne décale pas les tirages des autres.
  const randVolcan = mulberry32(baseHash ^ 0x9E3779B1);
  const randRiver  = mulberry32(baseHash ^ 0x85EBCA77);
  const randRes    = mulberry32(baseHash ^ 0xC2B2AE3D);
  const noiseMode = params.noiseType || 'perlin';
  // 5 modes :
  //  - 'perlin'   / 'simplex'   : versions originales sans redistribution
  //  - 'perlin2'  / 'simplex2'  : avec redistribution (continents plus contrastés)
  //  - 'mixed'    : Perlin v2 pour continents + Simplex v2 pour détail
  const isV2 = noiseMode === 'perlin2' || noiseMode === 'simplex2' || noiseMode === 'mixed';
  let NoiseSlow, NoiseFast;
  if (noiseMode === 'mixed') {
    NoiseSlow = PerlinNoise;   // continents = Perlin (formes massives lisses)
    NoiseFast = SimplexNoise;  // détail     = Simplex (variations vives)
  } else if (noiseMode === 'simplex' || noiseMode === 'simplex2') {
    NoiseSlow = NoiseFast = SimplexNoise;
  } else {
    // perlin / perlin2
    NoiseSlow = NoiseFast = PerlinNoise;
  }
  const nCont  = new NoiseSlow(rand);  // continents (basse fréquence)
  const nDet   = new NoiseFast(rand);  // détail (haute fréquence)
  const nIsle  = new NoiseFast(rand);  // îlots isolés au milieu des océans
  const nHumid = new NoiseSlow(rand);  // humidité (lisse pour grandes zones climatiques)
  const nTemp  = new NoiseFast(rand);  // température

  // Hexagone géant
  const tiles = [];
  const indexOf = new Map();
  for (let q = -N; q <= N; q++) {
    const rMin = Math.max(-N, -q - N);
    const rMax = Math.min( N, -q + N);
    for (let r = rMin; r <= rMax; r++) {
      const i = tiles.length;
      tiles.push({ q, r, i });
      indexOf.set(q + ',' + r, i);
    }
  }
  const size = tiles.length;
  const neighborsOf = (i) => {
    const t = tiles[i];
    const out = [];
    for (const [dq, dr] of AXIAL_DIRS) {
      const ni = indexOf.get((t.q + dq) + ',' + (t.r + dr));
      if (ni !== undefined) out.push(ni);
    }
    return out;
  };

  const pE = params.elev, pH = params.humid, pT = params.temp;
  const pV = params.evt;

  const elev = new Float32Array(size);
  const humid = new Float32Array(size);
  const temp = new Float32Array(size);

  for (let i = 0; i < size; i++) {
    const t = tiles[i];
    const { x, y } = axialToPixel(t.q, t.r);
    const px = x / HEX, py = y / HEX;

    // --- Élévation = blend(continent, détail)
    // Continent : basse fréquence, peu d'octaves → formes massives et lisses
    let cont = nCont.fbm(px * pE.cont, py * pE.cont, 2, 0.5, 2.0);
    cont = (cont + 1) * 0.5;
    // Redistribution (modes v2 et mixte uniquement) : étire vers les extrêmes
    // pour avoir plus de variations près du seuil de mer → plus de côtes
    // découpées et de petites îles. Sur 'perlin' / 'simplex' (v1), on garde
    // la distribution originale du bruit pour préserver le look classique.
    if (isV2) {
      cont = cont < 0.5
        ? 0.5 * Math.pow(cont * 2, 1.4)
        : 1 - 0.5 * Math.pow((1 - cont) * 2, 1.4);
    }
    // Détail : haute fréquence, plus d'octaves → côtes irrégulières, petites îles
    let detail = nDet.fbm(px * pE.scale, py * pE.scale, pE.oct, pE.pers, 2.0);
    detail = (detail + 1) * 0.5;
    // Mélange : compacité élevée → continent dominant → océans d'un seul tenant
    let e = cont * pE.compact + detail * (1 - pE.compact);
    // Masque de bord (léger par défaut : permet calanques et terres côtières)
    const dist = Math.max(Math.abs(t.q), Math.abs(t.r), Math.abs(t.q + t.r)) / N;
    e = e * (1 - dist * dist * pE.edge);

    // Îlots : bruit haute fréquence ajouté SEULEMENT là où l'élévation est
    // basse (zones océaniques). Crée des points hauts isolés au milieu des
    // océans → archipels et îlots indépendants du continent principal.
    if (pE.islands > 0) {
      // Bruit positif (0..1) à fréquence moyenne
      let isle = nIsle.fbm(px * 0.10, py * 0.10, 3, 0.5, 2.0);
      isle = (isle + 1) * 0.5;
      // On accentue le bruit pour qu'il soit "tout ou rien" : on garde
      // seulement les pics > 0.65, transformés en bumps positifs.
      // Sinon le bruit serait juste du flou qui modulerait l'océan.
      isle = Math.max(0, isle - 0.65) / 0.35; // 0..1, seulement les pics
      // Influence : forte là où l'élévation est basse, nulle sur les terres
      // (max(0, 0.5 - e) → 0 si e>=0.5, max 0.5 si e=0)
      const oceanFactor = Math.max(0, 0.5 - e) * 2; // 0..1
      e += isle * oceanFactor * pE.islands * 0.5;
    }

    elev[i] = Math.max(0, Math.min(1, e));
    // (humidité et température calculées après le niveau de la mer)

    // --- Température : latitude + bruit + altitude
    // La "latitude" dépend de l'orientation des pôles :
    //  - 'ns' (nord/sud) : pôles haut/bas, équateur au centre   → |r|/N
    //  - 'ew' (est/ouest) : pôles gauche/droite, équateur vert. → |q + r/2| / N
    //  - 'center' : pôle au centre, équateur sur les bords      → 1 - dist/N
    //  - 'none' : pas de gradient, climat uniforme              → 0
    let lat;
    const polesMode = params.poles || 'ns';
    if (polesMode === 'ew') {
      lat = Math.min(1, Math.abs(t.q + t.r / 2) / N);
    } else if (polesMode === 'center') {
      const d = Math.max(Math.abs(t.q), Math.abs(t.r), Math.abs(t.q + t.r));
      lat = 1 - d / N;
    } else if (polesMode === 'none') {
      lat = 0;
    } else {
      lat = Math.abs(t.r) / N;
    }
    let te = 1 - Math.pow(lat, pT.lat);
    te += pT.noise * nTemp.noise2D(px * pT.scale + 50, py * pT.scale + 50);
    te -= Math.max(0, elev[i] - 0.5) * pT.alt;
    temp[i] = Math.max(0, Math.min(1, te));
  }

  // Quantiles : seaLevel puis mountainLevel
  const elevSorted = new Float32Array(elev);
  elevSorted.sort();
  const seaLevel = elevSorted[Math.floor(size * params.sea)];
  const landElevs = [];
  for (let i = 0; i < size; i++) if (elev[i] >= seaLevel) landElevs.push(elev[i]);
  landElevs.sort((a, b) => a - b);
  const mountainLevel = landElevs.length > 0
    ? (landElevs[Math.floor(landElevs.length * (1 - params.mountains))] || 1)
    : 1;

  // --- Humidité (calculée APRÈS le niveau de la mer pour pouvoir tenir
  // compte de la distance à l'océan = effet de continentalité).
  // Pipeline :
  //   1) BFS depuis chaque tuile océan : oceanDist[i] = distance hex à
  //      l'océan le plus proche
  //   2) humidité = bruit Perlin + bonus côtier proportionnel à pH.cont
  //
  // Effet de la continentalité (slider 0-100%) :
  //   - 0   : humidité libre, comme avant (déserts un peu aléatoires)
  //   - 50  : équilibre bruit + côtier (recommandé)
  //   - 100 : humidité dictée par la distance à l'océan (déserts au cœur
  //           des continents, côtes humides)
  const oceanDist = new Float32Array(size);
  {
    const queue = [];
    for (let i = 0; i < size; i++) {
      if (elev[i] < seaLevel) {
        oceanDist[i] = 0;
        queue.push(i);
      } else {
        oceanDist[i] = -1; // non visité
      }
    }
    let head = 0;
    while (head < queue.length) {
      const t = queue[head++];
      const d = oceanDist[t];
      for (const n of neighborsOf(t)) {
        if (oceanDist[n] === -1) {
          oceanDist[n] = d + 1;
          queue.push(n);
        }
      }
    }
    // Normaliser : 0 = sur l'océan, 1 = le plus loin de l'océan
    let maxD = 1;
    for (let i = 0; i < size; i++) if (oceanDist[i] > maxD) maxD = oceanDist[i];
    for (let i = 0; i < size; i++) {
      oceanDist[i] = Math.max(0, oceanDist[i]) / maxD;
    }
  }
  // Calcul humidité
  for (let i = 0; i < size; i++) {
    const t = tiles[i];
    const { x, y } = axialToPixel(t.q, t.r);
    const px = x / HEX, py = y / HEX;
    let h = nHumid.fbm(px * pH.scale + 100, py * pH.scale + 100, pH.oct, pH.pers, 2.0);
    h = (h + 1) * 0.5;
    // Bonus côtier (= pénalité de continentalité) : 1 sur la côte, 0 au cœur
    const coastBonus = 1 - oceanDist[i];
    // Combinaison : (1 - cont) * bruit + cont * coastBonus
    h = (1 - pH.cont) * h + pH.cont * coastBonus;
    humid[i] = Math.max(0, Math.min(1, h));
  }

  // Biomes
  const biome = new Array(size);
  for (let i = 0; i < size; i++) {
    biome[i] = classifyBiome(elev[i], temp[i], humid[i], seaLevel, mountainLevel, params.biomeOrder);
  }

  // --- Lissage des déserts ---
  // Le classificateur produit souvent des taches désertiques de 1-3 tuiles
  // car l'humidité varie à haute fréquence. On applique un automate cellulaire
  // simple : on supprime les déserts isolés et on étend les amas existants.
  // Résultat : amas plus grands et plus naturels, moins de bruit visuel.
  // Deux passes pour la stabilité.
  for (let pass = 0; pass < 2; pass++) {
    const newBiome = biome.slice();
    for (let i = 0; i < size; i++) {
      const b = biome[i];
      const ns = neighborsOf(i);
      // Compter les voisins désert
      let desertNs = 0;
      for (const n of ns) if (biome[n] === 'Désert') desertNs++;

      if (b === 'Désert') {
        // Désert isolé (0 voisin désert) → convertir en biome adjacent au climat
        // (Plaine en zone chaude = savane, Plaine en tempéré, etc.)
        if (desertNs === 0) {
          newBiome[i] = 'Plaine';
        }
      } else if (b === 'Plaine') {
        // Plaine sèche-chaude entourée de désert → cristallise en désert
        // (étend les amas, sans envahir les zones humides ni les forêts)
        if (desertNs >= 3 && humid[i] < 0.42 && temp[i] > 0.40 && elev[i] >= seaLevel && elev[i] <= mountainLevel) {
          newBiome[i] = 'Désert';
        }
      }
    }
    for (let i = 0; i < size; i++) biome[i] = newBiome[i];
  }

  // --- Anti-encerclement ---
  // Pour chaque tuile non-océan, si elle a ≥ surround voisins du même biome,
  // on la convertit vers un biome alternatif cohérent avec son climat local.
  // L'océan est exclu comme demandé (on veut des grandes masses d'eau).
  const randConstraints = mulberry32(baseHash ^ 0x27D4EB2D);
  const CONV = params.constraints;

  // Biomes "alternatifs" cohérents, par ordre de préférence selon climat.
  // On évite de créer un alt qui violerait l'esprit climatique de la tuile.
  function alternativeBiome(i, forbidden) {
    const t = temp[i], h = humid[i], e = elev[i];
    // Liste d'alternatives candidate selon le climat (ordre = préférence)
    let candidates;
    if (e > mountainLevel * 0.92) {
      // Presque montagneux : privilégier Forêt/Plaine
      candidates = ['Plaine', 'Forêt', 'Désert', 'Marais'];
    } else if (t < 0.30) {
      candidates = ['Plaine', 'Forêt'];
    } else if (t > 0.60) {
      if (h < 0.4) candidates = ['Désert', 'Plaine', 'Forêt'];
      else         candidates = ['Forêt', 'Plaine', 'Marais'];
    } else {
      if (h < 0.35) candidates = ['Plaine', 'Désert', 'Forêt'];
      else if (h > 0.60) candidates = ['Forêt', 'Marais', 'Plaine'];
      else candidates = ['Plaine', 'Forêt'];
    }
    for (const c of candidates) {
      if (c !== forbidden) return c;
    }
    return 'Plaine';
  }

  if (CONV.surroundSame > 0 || CONV.surroundAny > 0) {
    // Ordre de parcours déterministe non-directionnel
    const order = [];
    for (let i = 0; i < size; i++) order.push(i);
    order.sort((a, b) => {
      const ha = Math.imul((a + 1) * 2654435761, baseHash ^ 0x9E3779B1) >>> 0;
      const hb = Math.imul((b + 1) * 2654435761, baseHash ^ 0x9E3779B1) >>> 0;
      return ha - hb;
    });

    // Score de "marginalité" : plus bas = cœur de biome (à préserver),
    // plus haut = marge (à convertir en priorité)
    const marginScore = (i) => {
      const b = biome[i];
      const t = temp[i], h = humid[i];
      if (b === 'Forêt')    return h;
      if (b === 'Marais')   return h + t * 0.5;
      if (b === 'Désert')   return (1 - h) + t * 0.5;
      if (b === 'Montagne') return elev[i];
      if (b === 'Plaine')   return 0.5 - Math.abs(h - 0.4);
      return 0;
    };

    // --- Règle A : "encerclement par un AUTRE biome" (mute UN VOISIN)
    // Si une tuile T a ≥ surroundAny voisins d'un même biome ≠ du sien,
    // UN DE CES VOISINS adopte le biome de T (la tuile centrale impose).
    // Exemple : une Montagne entourée de 6 Forêts → une forêt devient Montagne.
    // L'océan reste protégé : une tuile océan ne peut pas être reconvertie
    // par cette règle, et on ne force pas une tuile à devenir océan.
    function applyRuleAny(threshold) {
      for (const i of order) {
        const bCenter = biome[i];
        // Océan et Neige sont exemptés : ils n'imposent pas leur biome
        // (on veut préserver les grandes masses d'eau et les calottes glaciaires)
        if (bCenter === 'Océan' || bCenter === 'Neige') continue;
        const ns = neighborsOf(i);
        // Grouper les voisins par biome (hors biome central)
        const groups = {};
        for (const n of ns) {
          const nb = biome[n];
          if (nb === bCenter) continue;
          if (nb === 'Océan' || nb === 'Neige') continue; // on ne convertit pas ces voisins
          (groups[nb] = groups[nb] || []).push(n);
        }
        // Trouver le groupe le plus nombreux qui dépasse le seuil
        let targetBiome = null, targetCount = 0;
        for (const [b, arr] of Object.entries(groups)) {
          if (arr.length >= threshold && arr.length > targetCount) {
            targetCount = arr.length;
            targetBiome = b;
          }
        }
        if (!targetBiome) continue;
        // Garde-fou altitude : ne force pas une tuile basse à devenir Montagne
        if (bCenter === 'Montagne') {
          const lowCandidates = groups[targetBiome].filter(n => elev[n] >= mountainLevel * 0.8);
          if (lowCandidates.length === 0) continue;
          lowCandidates.sort((a, b) => elev[b] - elev[a]);
          biome[lowCandidates[0]] = bCenter;
        } else {
          const pool = [...groups[targetBiome]];
          pool.sort((a, b) => marginScore(a) - marginScore(b));
          biome[pool[0]] = bCenter;
        }
      }
    }

    // --- Règle B : "même biome" (mute UN VOISIN)
    // Si une tuile a ≥ surroundSame voisins du même biome, on mute un voisin
    // marginal pour briser la masse. Préserve le cœur.
    function applyRuleSame(threshold) {
      for (const i of order) {
        const b = biome[i];
        // Océan et Neige sont exemptés (grandes masses uniformes autorisées)
        if (b === 'Océan' || b === 'Neige') continue;
        const ns = neighborsOf(i);
        const sameNs = [];
        for (const n of ns) if (biome[n] === b) sameNs.push(n);
        if (sameNs.length < threshold) continue;
        // Éviter les voisins qui sont eux-mêmes des cœurs (≥ threshold voisins identiques)
        const candidates = sameNs.filter(n => {
          const nNs = neighborsOf(n);
          let ns2 = 0;
          for (const nn of nNs) if (biome[nn] === b) ns2++;
          return ns2 < threshold;
        });
        const pool = candidates.length > 0 ? candidates : sameNs;
        pool.sort((a, b) => marginScore(a) - marginScore(b));
        biome[pool[0]] = alternativeBiome(pool[0], b);
      }
    }

    // On applique Any d'abord (résout les isolats prisonniers) puis Same
    // (casse les masses uniformes). Deux passes pour la convergence.
    for (let pass = 0; pass < 2; pass++) {
      if (CONV.surroundAny > 0)  applyRuleAny(CONV.surroundAny);
      if (CONV.surroundSame > 0) applyRuleSame(CONV.surroundSame);
    }
  }

  // --- Cohérence des voisinages (post-traitement type WFC simplifié) ---
  // L'utilisateur définit pour chaque paire de biomes terrestres l'une de :
  //   'libre'    : peut se toucher
  //   'tampon'   : doit y avoir une plaine entre les deux
  //   'interdit' : ne doit jamais se toucher
  // L'algorithme : 3 passes successives, à chaque passe on parcourt les
  // tuiles dans un ordre déterministe non-directionnel. Pour toute tuile
  // qui viole une règle avec un voisin, on convertit la tuile la plus
  // marginale climatiquement en Plaine. Cas particuliers :
  //  - Océan, Volcan : exemptés (jamais modifiés ni causes de violation)
  //  - 'tampon' et 'interdit' sont traités identiquement (la tampon est
  //    obtenue en convertissant la tuile en Plaine, ce qui crée le tampon)
  if (params.adjacency && params.adjacency.enabled) {
    const rules = params.adjacency.rules || {};
    // Score de marginalité (réutilisé de l'anti-encerclement)
    const margin = (i) => {
      const b = biome[i];
      if (b === 'Forêt')    return humid[i];
      if (b === 'Marais')   return humid[i] + temp[i] * 0.5;
      if (b === 'Désert')   return (1 - humid[i]) + temp[i] * 0.5;
      if (b === 'Montagne') return elev[i];
      if (b === 'Plaine')   return 0.5 - Math.abs(humid[i] - 0.4);
      if (b === 'Neige')    return 1 - temp[i];
      return 0;
    };
    // Ordre déterministe non-directionnel
    const adjOrder = [];
    for (let i = 0; i < size; i++) adjOrder.push(i);
    adjOrder.sort((a, b) => {
      const ha = Math.imul((a + 1) * 2654435761, baseHash ^ 0x6789ABCD) >>> 0;
      const hb = Math.imul((b + 1) * 2654435761, baseHash ^ 0x6789ABCD) >>> 0;
      return ha - hb;
    });
    const isExempt = (b) => b === 'Océan' || b === 'Volcan';
    for (let pass = 0; pass < 3; pass++) {
      let conversions = 0;
      for (const i of adjOrder) {
        const bi = biome[i];
        if (isExempt(bi)) continue;
        for (const n of neighborsOf(i)) {
          const bn = biome[n];
          if (isExempt(bn)) continue;
          if (bi === bn) continue;
          const key = adjKey(bi, bn);
          if (!key) continue;
          const rule = rules[key] || 'libre';
          if (rule === 'libre') continue;
          // tampon ou interdit : il faut casser ce contact direct
          // → convertir la tuile la plus marginale en Plaine
          const mi = margin(i), mn = margin(n);
          // Si une des deux est déjà Plaine, on convertit l'autre
          let victim;
          if (bi === 'Plaine') victim = n;
          else if (bn === 'Plaine') victim = i;
          else victim = (mi < mn) ? i : n;
          biome[victim] = 'Plaine';
          conversions++;
          // Si on a converti i, sa nouvelle valeur est Plaine donc inutile de
          // continuer à examiner ses autres voisins
          if (victim === i) break;
        }
      }
      // Si rien n'a changé à cette passe, on a convergé
      if (conversions === 0) break;
    }
  }

  // --- Cap par biome ---
  // Si le nombre de tuiles d'un biome dépasse son cap, on convertit les
  // tuiles excédentaires. On choisit les tuiles à convertir par score :
  // celles qui ont le moins de "cohérence climatique" (les plus atypiques)
  // partent en premier, les tuiles centrales du biome restent.
  const biomeScore = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    const b = biome[i];
    if (b === 'Océan' || b === 'Montagne') continue;
    // Score = humidité pour forêt/marais (plus humide = plus central),
    // inverse pour désert, etc.
    if (b === 'Forêt')  biomeScore[i] = humid[i];
    else if (b === 'Marais') biomeScore[i] = humid[i] + temp[i] * 0.5;
    else if (b === 'Désert') biomeScore[i] = (1 - humid[i]) + temp[i] * 0.5;
    else biomeScore[i] = 0.5; // Plaine : score neutre
  }
  // Pour chaque biome avec un cap actif, convertir les tuiles les moins
  // représentatives jusqu'à respecter le cap.
  for (const [bname, cap] of Object.entries(CONV.caps)) {
    if (!cap || cap <= 0) continue;
    const tilesOfBiome = [];
    for (let i = 0; i < size; i++) if (biome[i] === bname) tilesOfBiome.push(i);
    if (tilesOfBiome.length <= cap) continue;
    // Trier par score croissant : les moins représentatives en premier
    tilesOfBiome.sort((a, b) => biomeScore[a] - biomeScore[b]);
    const excess = tilesOfBiome.length - cap;
    for (let k = 0; k < excess; k++) {
      const i = tilesOfBiome[k];
      if (bname === 'Océan') {
        // Cas particulier : convertir un océan = le remonter en terre
        biome[i] = 'Plaine';
      } else if (bname === 'Montagne') {
        biome[i] = 'Forêt';
      } else {
        biome[i] = alternativeBiome(i, bname);
      }
    }
  }

  // Volcans
  for (let i = 0; i < size; i++) {
    if (biome[i] === 'Montagne' && randVolcan() < pV.volcan) biome[i] = 'Volcan';
  }

  // Rivières — modèle de SOMMETS (corners).
  // L'eau coule LE LONG des arêtes entre tuiles, de sommet en sommet
  // (comme dans Civ 5). Chaque sommet d'hexagone touche jusqu'à 3 tuiles ;
  // chaque arête relie 2 sommets voisins et sépare 2 tuiles. Une rivière
  // est un chemin CONNECTÉ d'arêtes : les segments se suivent bout à bout.
  //
  // Pipeline hydrologique sur le graphe des sommets :
  //   1) Construction du graphe (sommets uniques, adjacences, élévation
  //      = moyenne des tuiles adjacentes, exutoire si touche mer/marais)
  //   2) Remplissage des dépressions (Priority-Flood)
  //   3) Receveur = sommet voisin le plus bas
  //   4) Accumulation de flux (pluie ∝ humidité moyenne locale)
  //   5) Seuil par percentile + tracé complet jusqu'à l'exutoire
  //   6) Filtre de longueur minimale (supprime les segments isolés)
  const isLand = i => elev[i] >= seaLevel;

  // --- (1) Graphe des sommets ---
  const cornerKeyOf = (x, y) => Math.round(x * 10) + ',' + Math.round(y * 10);
  const corners = new Map(); // key -> {x, y, tiles:[], nbrs:Set, elev, sink}
  for (let i = 0; i < size; i++) {
    const t = tiles[i];
    const { x, y } = axialToPixel(t.q, t.r);
    const pts = [];
    for (let k = 0; k < 6; k++) {
      const a = Math.PI / 180 * (60 * k - 30);
      const cx = x + HEX * Math.cos(a);
      const cy = y + HEX * Math.sin(a);
      pts.push({ cx, cy, key: cornerKeyOf(cx, cy) });
    }
    for (let k = 0; k < 6; k++) {
      const p = pts[k];
      let c = corners.get(p.key);
      if (!c) { c = { x: p.cx, y: p.cy, tiles: [], nbrs: new Set() }; corners.set(p.key, c); }
      c.tiles.push(i);
    }
    // Les 6 côtés relient les sommets consécutifs
    for (let k = 0; k < 6; k++) {
      const a = pts[k], b = pts[(k + 1) % 6];
      corners.get(a.key).nbrs.add(b.key);
      corners.get(b.key).nbrs.add(a.key);
    }
  }
  // Élévation / humidité moyennes + statut exutoire par sommet
  for (const c of corners.values()) {
    let e = 0, h = 0, sink = false;
    for (const ti of c.tiles) {
      e += elev[ti];
      h += humid[ti];
      if (elev[ti] < seaLevel || biome[ti] === 'Marais') sink = true;
    }
    c.elev = e / c.tiles.length;
    c.humid = h / c.tiles.length;
    c.sink = sink;
  }

  // --- (2) Remplissage des dépressions (Priority-Flood sur sommets) ---
  const EPS = 1e-4;
  {
    const heap = []; // {e, key}
    const hpush = (e, key) => {
      heap.push({ e, key });
      let c = heap.length - 1;
      while (c > 0) {
        const p = (c - 1) >> 1;
        if (heap[p].e <= heap[c].e) break;
        [heap[p], heap[c]] = [heap[c], heap[p]];
        c = p;
      }
    };
    const hpop = () => {
      const top = heap[0];
      const last = heap.pop();
      if (heap.length > 0) {
        heap[0] = last;
        let c = 0;
        while (true) {
          let l = 2 * c + 1, r = 2 * c + 2, s = c;
          if (l < heap.length && heap[l].e < heap[s].e) s = l;
          if (r < heap.length && heap[r].e < heap[s].e) s = r;
          if (s === c) break;
          [heap[s], heap[c]] = [heap[c], heap[s]];
          c = s;
        }
      }
      return top;
    };
    for (const [key, c] of corners) {
      if (c.sink) { c.filled = c.elev; hpush(c.elev, key); }
      else c.filled = Infinity;
    }
    while (heap.length > 0) {
      const { e, key } = hpop();
      const c = corners.get(key);
      if (e > c.filled + 1e-9) continue;
      for (const nk of c.nbrs) {
        const n = corners.get(nk);
        if (n.filled !== Infinity) continue;
        n.filled = Math.max(n.elev, c.filled + EPS);
        hpush(n.filled, nk);
      }
    }
    for (const c of corners.values()) if (c.filled === Infinity) c.filled = c.elev;
  }

  // --- (3) Receveur par sommet ---
  for (const [key, c] of corners) {
    c.receiver = null;
    if (c.sink) continue;
    let bestE = c.filled;
    for (const nk of c.nbrs) {
      const n = corners.get(nk);
      if (n.filled < bestE) { bestE = n.filled; c.receiver = nk; }
    }
  }

  // --- (4) Accumulation de flux ---
  for (const c of corners.values()) {
    c.flux = c.sink ? 0 : (0.4 + c.humid);
  }
  const cornerOrder = [...corners.entries()]
    .filter(([k, c]) => !c.sink)
    .sort((a, b) => b[1].filled - a[1].filled);
  for (const [key, c] of cornerOrder) {
    if (c.receiver) corners.get(c.receiver).flux += c.flux;
  }

  // --- (5) Seuil + tracé complet jusqu'à l'exutoire ---
  // riverSegments : tableau de segments {x1,y1,x2,y2, tileA, tileB}
  // tileA/tileB = les deux tuiles que l'arête sépare (pour rivers[] et infos)
  const riverSegments = [];
  const drawnEdges = new Set(); // "keyA>keyB" canonique
  const cEdgeKey = (a, b) => (a < b ? a + '>' + b : b + '>' + a);
  {
    const fluxVals = cornerOrder.map(([k, c]) => c.flux).filter(f => f > 0).sort((a, b) => a - b);
    const riverParam = Math.max(0, Math.min(1, pV.river));
    const pct = 0.92 - riverParam * 0.37;
    const idx = Math.min(fluxVals.length - 1, Math.max(0, Math.floor(fluxVals.length * pct)));
    const threshold = fluxVals.length > 0 ? fluxVals[idx] : Infinity;

    for (const [key, c] of cornerOrder) {
      if (c.flux < threshold) continue;
      // Tracer la chaîne aval depuis ce sommet jusqu'à un exutoire
      let curKey = key;
      let guard = 0;
      while (guard++ < 2000) {
        const cur = corners.get(curKey);
        if (cur.sink || !cur.receiver) break;
        const nextKey = cur.receiver;
        const ek = cEdgeKey(curKey, nextKey);
        if (!drawnEdges.has(ek)) {
          drawnEdges.add(ek);
          const next = corners.get(nextKey);
          // Tuiles bordant cette arête = intersection des tuiles des 2 sommets
          const setNext = new Set(next.tiles);
          const shared = cur.tiles.filter(t => setNext.has(t));
          riverSegments.push({
            x1: cur.x, y1: cur.y, x2: next.x, y2: next.y,
            tiles: shared,
            ek
          });
        }
        curKey = nextKey;
      }
    }
  }

  // --- (6) Filtre de longueur minimale (composantes connexes de sommets) ---
  {
    const minLen = Math.max(1, (pV.riverLen | 0) || 3);
    if (minLen > 1 && riverSegments.length > 0) {
      // Adjacence : sommet -> indices de segments
      const bySommet = new Map();
      riverSegments.forEach((s, idx) => {
        const k1 = cornerKeyOf(s.x1, s.y1), k2 = cornerKeyOf(s.x2, s.y2);
        if (!bySommet.has(k1)) bySommet.set(k1, []);
        if (!bySommet.has(k2)) bySommet.set(k2, []);
        bySommet.get(k1).push(idx);
        bySommet.get(k2).push(idx);
        s._k1 = k1; s._k2 = k2;
      });
      const seen = new Set();
      const toRemove = new Set();
      for (let i = 0; i < riverSegments.length; i++) {
        if (seen.has(i)) continue;
        const comp = [];
        const stack = [i];
        seen.add(i);
        while (stack.length) {
          const si = stack.pop();
          comp.push(si);
          const s = riverSegments[si];
          for (const k of [s._k1, s._k2]) {
            for (const ni of bySommet.get(k)) {
              if (!seen.has(ni)) { seen.add(ni); stack.push(ni); }
            }
          }
        }
        if (comp.length < minLen) for (const si of comp) toRemove.add(si);
      }
      if (toRemove.size > 0) {
        for (let i = riverSegments.length - 1; i >= 0; i--) {
          if (toRemove.has(i)) riverSegments.splice(i, 1);
        }
      }
    }
  }

  // Compatibilité : tableau par tuile (rivière borde la tuile ?)
  const rivers = new Uint8Array(size);
  for (const s of riverSegments) {
    for (const t of s.tiles) rivers[t] = 1;
  }

  // Ressources — placement INDÉPENDANT par ressource.
  // Chaque ressource est évaluée dans sa propre passe avec son propre bruit.
  // Modifier les paramètres d'une ressource n'affecte PAS le placement des
  // autres ressources déjà posées (priorité selon l'ordre de RES_DEFAULTS).
  const resource = new Array(size).fill(null);

  // Bruit déterministe par ressource (dérivé du seed XOR hash du nom)
  const resNoises = {};
  for (const resName of Object.keys(params.res)) {
    const seedForRes = (baseHash ^ hashString('res:' + resName)) >>> 0;
    resNoises[resName] = new NoiseFast(mulberry32(seedForRes));
  }

  // Pré-calcule positions normalisées
  const tilePx = new Float32Array(size);
  const tilePy = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    const t = tiles[i];
    const { x, y } = axialToPixel(t.q, t.r);
    tilePx[i] = x / HEX;
    tilePy[i] = y / HEX;
  }

  // Tuiles éligibles pour une ressource (selon biome + statut rivière)
  const eligibleFor = (i, res) => {
    // Les rivières étant désormais des arêtes (entre les tuiles), une tuile
    // terrestre bordée par une rivière garde les ressources de son biome.
    // Les Poissons restent réservés à l'Océan (via RES_BY_BIOME).
    const list = RES_BY_BIOME[biome[i]] || [];
    return list.includes(res);
  };

  // Une passe par ressource, dans l'ordre de RES_DEFAULTS (priorité fixe).
  // Chaque passe ne regarde que ses propres paramètres, son propre bruit,
  // et les tuiles encore libres. Le résultat d'une ressource ne dépend donc
  // QUE de ses propres paramètres et des ressources de plus haute priorité.
  for (const resName of Object.keys(params.res)) {
    const p = params.res[resName];
    if (!p || p.density <= 0) continue;
    const noise = resNoises[resName];
    // proximité haute → basse fréquence → gros amas contigus
    const freq = 0.06 + 0.40 * (1 - p.prox);
    // densité haute → seuil bas → ressource plus fréquente
    const threshold = 1 - p.density * 8;

    // A. Tuiles candidates (éligibles + bruit au-dessus du seuil)
    const scores = new Float32Array(size);
    const candidates = [];
    for (let i = 0; i < size; i++) {
      if (resource[i]) continue; // tuile déjà prise par une ressource prioritaire
      if (!eligibleFor(i, resName)) continue;
      const n = (noise.noise2D(tilePx[i] * freq, tilePy[i] * freq) + 1) * 0.5;
      const s = n - threshold;
      if (s > 0) {
        scores[i] = s;
        candidates.push(i);
      }
    }

    // B. Cap par taille de composante connexe — on ne garde que les `size`
    // meilleures tuiles de chaque amas.
    const visited = new Uint8Array(size);
    const accepted = new Uint8Array(size);
    for (const start of candidates) {
      if (visited[start]) continue;
      const comp = [];
      const queue = [start];
      visited[start] = 1;
      while (queue.length) {
        const t = queue.shift();
        comp.push(t);
        for (const n of neighborsOf(t)) {
          if (!visited[n] && scores[n] > 0) {
            visited[n] = 1;
            queue.push(n);
          }
        }
      }
      comp.sort((a, b) => scores[b] - scores[a]);
      const keep = Math.min(p.size, comp.length);
      for (let k = 0; k < keep; k++) accepted[comp[k]] = 1;
    }

    // C. Poser la ressource sur les tuiles acceptées
    for (let i = 0; i < size; i++) {
      if (accepted[i]) resource[i] = resName;
    }
  }

  return {
    N, tiles, indexOf, neighborsOf,
    elev, temp, humid, biome, resource, rivers, riverSegments,
    seaLevel, mountainLevel,
    players: [], playerWarning: null   // remplis par placePlayers() séparément
  };
}

// ============================================================
// PLACEMENT DES JOUEURS — fonction séparée
// On ne touche PAS à la carte (biomes, ressources, etc.) : on lit seulement.
// Appelé manuellement (bouton 🎲 ou changement du nombre de joueurs),
// pas à chaque slider.
// ============================================================
function placePlayers(mapObj, opts) {
  const { tiles, biome, rivers, elev, seaLevel, N, neighborsOf } = mapObj;
  const size = tiles.length;
  const playerCount = Math.max(0, Math.min(12, opts.count | 0));
  const spread = opts.spread || 'far';
  const seedStr = opts.seedStr || 'players';
  const MIN_DIST       = Math.max(1, opts.minDist | 0 || 5);
  const EDGE           = Math.max(0, opts.edgeMargin | 0);
  const CENTER         = Math.max(0, opts.centerMargin | 0);
  const MIN_CONTINENT  = Math.max(0, opts.minContinent | 0);
  const INSPECT        = Math.max(1, opts.inspectRadius | 0 || 3);
  const REQUIRED       = opts.required || [];

  mapObj.players = [];
  mapObj.playerWarning = null;
  if (playerCount === 0) return;

  // Bornes pour la 2e tuile selon le mode "Sites"
  let COMPANION_MIN, COMPANION_MAX;
  if (spread === 'close') {
    COMPANION_MIN = 2;
    COMPANION_MAX = 4;
  } else if (spread === 'medium') {
    COMPANION_MIN = 4;
    COMPANION_MAX = 8;
  } else {
    COMPANION_MIN = MIN_DIST;
    COMPANION_MAX = Infinity;
  }

  // Pré-calcul : taille de la composante connexe terrestre pour chaque tuile.
  // Composante = ensemble de tuiles non-Océan reliées par voisinage.
  // Coût : O(size). On ne le fait qu'une fois par appel.
  const componentId = new Int32Array(size).fill(-1);
  const componentSize = []; // index → taille
  if (MIN_CONTINENT > 0) {
    let cid = 0;
    for (let i = 0; i < size; i++) {
      if (componentId[i] !== -1 || biome[i] === 'Océan') continue;
      // BFS
      const queue = [i];
      componentId[i] = cid;
      let count = 0;
      while (queue.length) {
        const t = queue.shift();
        count++;
        for (const n of neighborsOf(t)) {
          if (componentId[n] === -1 && biome[n] !== 'Océan') {
            componentId[n] = cid;
            queue.push(n);
          }
        }
      }
      componentSize.push(count);
      cid++;
    }
  }

  // Distance hex
  const distAxial = (a, b) => axialDistance(a.q, a.r, b.q, b.r);

  // Test "biomes requis dans rayon d'inspection autour de tile i"
  // Collecte tous les voisins jusqu'à distance INSPECT, vérifie présence
  // de chaque biome requis.
  function biomesInRadius(i) {
    if (REQUIRED.length === 0) return null; // pas de check à faire
    const center = tiles[i];
    const found = new Set();
    // BFS à profondeur INSPECT
    const visited = new Set([i]);
    let frontier = [i];
    for (let depth = 0; depth <= INSPECT; depth++) {
      for (const t of frontier) {
        found.add(biome[t]);
      }
      if (depth === INSPECT) break;
      const next = [];
      for (const t of frontier) {
        for (const n of neighborsOf(t)) {
          if (!visited.has(n)) {
            visited.add(n);
            next.push(n);
          }
        }
      }
      frontier = next;
    }
    return found;
  }

  // Tuiles candidates : terre, biome jouable, pas de rivière,
  // dans la zone autorisée (entre couronnes centre et bord),
  // sur un continent assez grand,
  // avec les biomes requis dans le rayon d'inspection.
  const PLAYABLE = new Set(['Plaine', 'Forêt', 'Désert', 'Marais']);
  const innerEdge   = N - EDGE;     // distance > innerEdge → exclue (bord)
  const innerCenter = CENTER - 1;   // distance ≤ innerCenter → exclue (centre)
  const candidates = [];
  let stats = { biome: 0, river: 0, edge: 0, center: 0, continent: 0, required: 0 };
  for (let i = 0; i < size; i++) {
    if (!PLAYABLE.has(biome[i])) { stats.biome++; continue; }
    if (rivers[i] > 0)            { stats.river++; continue; }
    const t = tiles[i];
    const d = Math.max(Math.abs(t.q), Math.abs(t.r), Math.abs(t.q + t.r));
    if (d > innerEdge)   { stats.edge++; continue; }
    if (d <= innerCenter){ stats.center++; continue; }
    if (MIN_CONTINENT > 0) {
      const cid = componentId[i];
      if (cid === -1 || componentSize[cid] < MIN_CONTINENT) {
        stats.continent++;
        continue;
      }
    }
    if (REQUIRED.length > 0) {
      const found = biomesInRadius(i);
      let ok = true;
      for (const r of REQUIRED) if (!found.has(r)) { ok = false; break; }
      if (!ok) { stats.required++; continue; }
    }
    candidates.push(i);
  }

  if (candidates.length === 0) {
    // Diagnostic plus précis selon la cause majeure du rejet
    const causes = [];
    if (stats.continent > 0)
      causes.push(`${stats.continent} hors de continent assez grand`);
    if (stats.required > 0)
      causes.push(`${stats.required} sans biomes requis`);
    if (stats.center > 0)
      causes.push(`${stats.center} en zone centrale`);
    if (stats.edge > 0)
      causes.push(`${stats.edge} en bord`);
    const detail = causes.length > 0 ? ' (' + causes.join(', ') + ')' : '';
    mapObj.playerWarning = `Aucune tuile jouable${detail}. Assouplir les contraintes.`;
    return;
  }

  const rand = mulberry32(hashString('players:' + seedStr) ^ 0x4F1BBCDC);
  const distIdx = (i, j) => distAxial(tiles[i], tiles[j]);

  // Étape 1 : capitales (farthest-first)
  const primaries = [];
  primaries.push(candidates[Math.floor(rand() * candidates.length)]);
  while (primaries.length < playerCount) {
    let bestTile = -1, bestMinDist = -1;
    for (const c of candidates) {
      let minD = Infinity;
      for (const p of primaries) {
        const d = distIdx(c, p);
        if (d < minD) minD = d;
      }
      if (minD < MIN_DIST) continue;
      if (minD > bestMinDist) {
        bestMinDist = minD;
        bestTile = c;
      }
    }
    if (bestTile === -1) {
      mapObj.playerWarning = `Impossible de placer ${playerCount} joueur(s) (distance min ${MIN_DIST}). ${primaries.length} placé(s). Réduire dist. min, augmenter le rayon, ou changer de seed.`;
      break;
    }
    primaries.push(bestTile);
  }

  // Étape 2 : seconds sites — préférence pour le MÊME biome que la primaire
  const secondaries = [];
  const allPlaced = [...primaries];
  for (let pi = 0; pi < primaries.length; pi++) {
    const primary = primaries[pi];
    const primaryBiome = biome[primary];
    const candComp = [];
    for (const c of candidates) {
      if (c === primary) continue;
      const dToPrimary = distIdx(c, primary);
      if (dToPrimary < COMPANION_MIN || dToPrimary > COMPANION_MAX) continue;
      let ok = true;
      for (const p of allPlaced) {
        if (p === primary) continue;
        if (distIdx(c, p) < MIN_DIST) { ok = false; break; }
      }
      if (ok) candComp.push(c);
    }
    if (candComp.length === 0) {
      secondaries.push(null);
      continue;
    }
    const biomePriority = b =>
      b === 'Plaine' ? 4 :
      b === 'Forêt'  ? 3 :
      b === 'Désert' ? 2 :
      b === 'Marais' ? 1 : 0;
    candComp.sort((a, b) => {
      const sameA = biome[a] === primaryBiome ? 1 : 0;
      const sameB = biome[b] === primaryBiome ? 1 : 0;
      if (sameA !== sameB) return sameB - sameA;
      const pa = biomePriority(biome[a]);
      const pb = biomePriority(biome[b]);
      if (pa !== pb) return pb - pa;
      if (spread === 'far') return distIdx(b, primary) - distIdx(a, primary);
      return rand() - 0.5;
    });
    const chosen = candComp[0];
    secondaries.push(chosen);
    allPlaced.push(chosen);
  }

  const missingComp = secondaries.filter(s => s === null).length;
  if (missingComp > 0 && !mapObj.playerWarning) {
    mapObj.playerWarning = `${missingComp} joueur(s) sans 2e tuile (contraintes trop strictes).`;
  }
  for (let pi = 0; pi < primaries.length; pi++) {
    mapObj.players.push({
      index: pi,
      color: PLAYER_COLORS[pi % PLAYER_COLORS.length],
      primary: primaries[pi],
      secondary: secondaries[pi]
    });
  }
}

// ============================================================
// RENDU
// ============================================================
const canvas = document.getElementById('map');
const ctx = canvas.getContext('2d', { alpha: false });

let view = { x: 0, y: 0, scale: 1 };
let map = null;
let layers = { rivers: true, resources: true, grid: false };
let selected = null;

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = window.innerWidth;
  const cssH = window.innerHeight;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
}

function mapBounds() {
  const N = map.N;
  const w = 1.5 * N * SQRT3 * HEX + HEX * SQRT3 / 2;
  const h = 1.5 * N * HEX + HEX;
  return { minX: -w, maxX: w, minY: -h, maxY: h, w: 2*w, h: 2*h };
}

function fitView() {
  if (!map) return;
  const b = mapBounds();
  const cw = window.innerWidth - 40;
  const ch = window.innerHeight - 40;
  view.scale = Math.min(cw / b.w, ch / b.h);
  view.x = window.innerWidth / 2 - (b.minX + b.w/2) * view.scale;
  view.y = window.innerHeight / 2 - (b.minY + b.h/2) * view.scale;
}

function drawHexPath(c, cx, cy, size) {
  c.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 180 * (60 * i - 30);
    const px = cx + size * Math.cos(a);
    const py = cy + size * Math.sin(a);
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
}

function drawShape(c, cx, cy, shape, color, size) {
  c.fillStyle = color;
  c.strokeStyle = 'rgba(0,0,0,0.7)';
  c.lineWidth = Math.max(0.8, size * 0.09);
  if (shape === 'circle') {
    c.beginPath();
    c.arc(cx, cy, size / 2, 0, Math.PI * 2);
    c.fill();
    c.stroke();
  } else if (shape === 'square') {
    const half = size / 2;
    c.beginPath();
    c.rect(cx - half, cy - half, size, size);
    c.fill();
    c.stroke();
  } else if (shape === 'triangle') {
    const h = size * SQRT3 / 2;
    c.beginPath();
    c.moveTo(cx, cy - h * 2 / 3);
    c.lineTo(cx - size / 2, cy + h / 3);
    c.lineTo(cx + size / 2, cy + h / 3);
    c.closePath();
    c.fill();
    c.stroke();
  }
}

function shade(hex, amt) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  const f = v => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

function renderToContext(c) {
  for (let i = 0; i < map.tiles.length; i++) {
    const t = map.tiles[i];
    const { x, y } = axialToPixel(t.q, t.r);
    const b = map.biome[i];
    const def = BIOMES[b];
    let tint;
    if (b === 'Océan') {
      const depth = Math.max(0, (map.seaLevel - map.elev[i]) / Math.max(0.01, map.seaLevel));
      tint = shade(def.color, -depth * 0.18);
    } else if (b === 'Montagne' || b === 'Volcan') {
      const rel = (map.elev[i] - map.mountainLevel) / Math.max(0.01, 1 - map.mountainLevel);
      tint = shade(def.color, rel * 0.10 - 0.02);
    } else {
      const rel = (map.elev[i] - map.seaLevel) / Math.max(0.01, map.mountainLevel - map.seaLevel);
      tint = shade(def.color, (rel - 0.5) * 0.10);
    }
    c.fillStyle = tint;
    drawHexPath(c, x, y, HEX + 0.5);
    c.fill();
  }

  // Volcan
  for (let i = 0; i < map.tiles.length; i++) {
    if (map.biome[i] !== 'Volcan') continue;
    const t = map.tiles[i];
    const { x, y } = axialToPixel(t.q, t.r);
    const s = HEX * 0.45;
    c.fillStyle = '#ff5020';
    c.beginPath();
    c.moveTo(x, y - s * 0.6);
    c.lineTo(x - s * 0.7, y + s * 0.5);
    c.lineTo(x + s * 0.7, y + s * 0.5);
    c.closePath();
    c.fill();
    c.fillStyle = '#ffdc40';
    c.beginPath();
    c.arc(x, y - s * 0.15, s * 0.18, 0, Math.PI * 2);
    c.fill();
  }

  // Rivières — segments le long des arêtes, de sommet en sommet.
  // Les segments successifs partagent leurs extrémités : le tracé est
  // naturellement continu (lineCap round soude visuellement les jonctions).
  if (layers.rivers && map.riverSegments) {
    c.strokeStyle = '#3a86c8';
    c.lineWidth = Math.max(1.5, HEX * 0.16);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (const s of map.riverSegments) {
      c.beginPath();
      c.moveTo(s.x1, s.y1);
      c.lineTo(s.x2, s.y2);
      c.stroke();
    }
  }

  // Grille
  if (layers.grid) {
    c.strokeStyle = 'rgba(0,0,0,0.30)';
    c.lineWidth = 0.6;
    for (const t of map.tiles) {
      const { x, y } = axialToPixel(t.q, t.r);
      drawHexPath(c, x, y, HEX);
      c.stroke();
    }
  }

  // Ressources
  if (layers.resources) {
    const shapeSize = HEX * 0.55;
    for (let i = 0; i < map.tiles.length; i++) {
      const r = map.resource[i];
      if (!r) continue;
      const t = map.tiles[i];
      const { x, y } = axialToPixel(t.q, t.r);
      const st = RES_STYLE[r];
      drawShape(c, x, y, st.shape, st.color, shapeSize);
    }
  }

  // Tuiles de départ joueurs : les deux tuiles d'un même joueur sont
  // rendues à l'identique (bordure pleine épaisse + numéro central),
  // pour qu'elles soient visuellement reconnaissables comme appartenant
  // au même joueur.
  if (map.players && map.players.length > 0) {
    const drawPlayerTile = (idx, color, label) => {
      if (idx === null || idx === undefined) return;
      const t = map.tiles[idx];
      const { x, y } = axialToPixel(t.q, t.r);
      c.save();
      c.lineWidth = Math.max(2.5, HEX * 0.18);
      c.strokeStyle = color;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      drawHexPath(c, x, y, HEX - c.lineWidth * 0.5);
      c.stroke();
      // Numéro du joueur au centre
      c.fillStyle = color;
      c.font = `bold ${Math.round(HEX * 0.7)}px ui-monospace, monospace`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.lineWidth = Math.max(2, HEX * 0.10);
      c.strokeStyle = 'rgba(0,0,0,0.85)';
      c.strokeText(label, x, y);
      c.fillText(label, x, y);
      c.restore();
    };
    for (const p of map.players) {
      const label = String(p.index + 1);
      drawPlayerTile(p.primary,   p.color, label);
      drawPlayerTile(p.secondary, p.color, label);
    }
  }
}

function render() {
  if (!map) return;
  // Le fond suit le thème (lu dynamiquement depuis les variables CSS)
  const bgColor = getComputedStyle(document.body).getPropertyValue('--map-bg').trim() || '#0a0704';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  ctx.save();
  ctx.translate(view.x, view.y);
  ctx.scale(view.scale, view.scale);
  renderToContext(ctx);

  if (selected !== null && map.tiles[selected]) {
    const t = map.tiles[selected];
    const { x, y } = axialToPixel(t.q, t.r);
    ctx.strokeStyle = '#ffe080';
    ctx.lineWidth = Math.max(1.5, HEX * 0.15);
    drawHexPath(ctx, x, y, HEX - 1);
    ctx.stroke();
  }
  ctx.restore();
}

// ============================================================
// INTERACTIONS
// ============================================================
const infoEl = document.getElementById('info');
function showInfo(i) {
  if (!map || i === undefined || i === null || i < 0) {
    infoEl.classList.remove('visible');
    return;
  }
  const b = map.biome[i];
  const r = map.resource[i];
  const hasRiver = map.rivers[i] > 0 && map.elev[i] >= map.seaLevel;
  // Tuile de départ d'un joueur ?
  let playerInfo = '';
  if (map.players) {
    for (const p of map.players) {
      if (p.primary === i || p.secondary === i) {
        playerInfo = `<div style="margin-top:4px;color:${p.color};font-weight:bold;">⌂ Joueur ${p.index + 1} — départ</div>`;
        break;
      }
    }
  }
  infoEl.innerHTML = `
    <div class="biome">${b}</div>
    <div class="row"><span>Élévation</span><span>${Math.round(map.elev[i] * 100)}%</span></div>
    <div class="row"><span>Température</span><span>${Math.round(map.temp[i] * 100)}%</span></div>
    <div class="row"><span>Humidité</span><span>${Math.round(map.humid[i] * 100)}%</span></div>
    ${hasRiver ? '<div class="river">~ bordée par une rivière</div>' : ''}
    ${r ? `<div class="res">◆ ${r}</div>` : ''}
    ${playerInfo}
  `;
  infoEl.classList.add('visible');
}

let pointers = new Map();
let panStart = null;
let pinchStart = null;
let didMove = false;

canvas.addEventListener('pointerdown', e => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  didMove = false;
  if (pointers.size === 1) {
    panStart = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
  } else if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchStart = {
      dist: Math.hypot(a.x - b.x, a.y - b.y),
      cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2,
      vx: view.x, vy: view.y, vs: view.scale
    };
    panStart = null;
  }
});
canvas.addEventListener('pointermove', e => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1 && panStart) {
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    if (Math.hypot(dx, dy) > 6) didMove = true;
    view.x = panStart.vx + dx;
    view.y = panStart.vy + dy;
    render();
  } else if (pointers.size === 2 && pinchStart) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    const newScale = Math.max(0.2, Math.min(8, pinchStart.vs * (d / pinchStart.dist)));
    const cx = (a.x + b.x) / 2;
    const cy = (a.y + b.y) / 2;
    const k = newScale / pinchStart.vs;
    view.x = pinchStart.cx - (pinchStart.cx - pinchStart.vx) * k + (cx - pinchStart.cx);
    view.y = pinchStart.cy - (pinchStart.cy - pinchStart.vy) * k + (cy - pinchStart.cy);
    view.scale = newScale;
    didMove = true;
    render();
  }
});
function endPointer(e) {
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinchStart = null;
  if (pointers.size === 0) {
    if (!didMove && panStart) {
      const sx = (e.clientX - view.x) / view.scale;
      const sy = (e.clientY - view.y) / view.scale;
      const { q, r } = pixelToAxial(sx, sy);
      const idx = map.indexOf.get(q + ',' + r);
      if (idx !== undefined) {
        selected = idx;
        showInfo(idx);
      } else {
        selected = null;
        infoEl.classList.remove('visible');
      }
      render();
    }
    panStart = null;
  } else if (pointers.size === 1) {
    const [p] = [...pointers.values()];
    panStart = { x: p.x, y: p.y, vx: view.x, vy: view.y };
  }
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const factor = Math.exp(-e.deltaY * 0.001);
  const newScale = Math.max(0.2, Math.min(8, view.scale * factor));
  const k = newScale / view.scale;
  view.x = e.clientX - (e.clientX - view.x) * k;
  view.y = e.clientY - (e.clientY - view.y) * k;
  view.scale = newScale;
  render();
}, { passive: false });

// ============================================================
// LÉGENDE
// ============================================================
function renderLegend() {
  const el = document.getElementById('legend');
  let html = '<div class="title">BIOMES</div>';
  for (const k of Object.keys(BIOMES)) {
    html += `<div class="item"><span class="sw" style="background:${BIOMES[k].color}"></span>${k}</div>`;
  }
  html += '<div class="sep">── RESSOURCES</div>';
  for (const k of Object.keys(RES_STYLE)) {
    const s = RES_STYLE[k];
    let svg;
    if (s.shape === 'circle') {
      svg = `<svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill="${s.color}" stroke="#000" stroke-width="1"/></svg>`;
    } else if (s.shape === 'square') {
      svg = `<svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" fill="${s.color}" stroke="#000" stroke-width="1"/></svg>`;
    } else {
      svg = `<svg width="12" height="12" viewBox="0 0 12 12"><polygon points="6,1 11,11 1,11" fill="${s.color}" stroke="#000" stroke-width="1"/></svg>`;
    }
    html += `<div class="item"><span class="shape">${svg}</span>${k}</div>`;
  }
  el.innerHTML = html;
}

// Construit dynamiquement les sous-sections par-ressource
function resShapeSvg(style, sz = 10) {
  if (style.shape === 'circle') {
    return `<svg class="res-icon" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill="${style.color}" stroke="#000" stroke-width="1"/></svg>`;
  } else if (style.shape === 'square') {
    return `<svg class="res-icon" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" fill="${style.color}" stroke="#000" stroke-width="1"/></svg>`;
  } else {
    return `<svg class="res-icon" viewBox="0 0 12 12"><polygon points="6,1 11,11 1,11" fill="${style.color}" stroke="#000" stroke-width="1"/></svg>`;
  }
}

// =============================================================
// RÈGLES D'ADJACENCE DES BIOMES
// 6 biomes terrestres × 6 = 21 paires distinctes (incluant les
// auto-adjacences qu'on n'expose pas, biome-à-soi-même est toujours libre).
// 3 valeurs : 'libre' (✅) | 'tampon' (⚠) | 'interdit' (❌)
// =============================================================
const ADJ_BIOMES = ['Plaine', 'Forêt', 'Désert', 'Marais', 'Montagne', 'Neige'];

// Défauts (issus de la discussion préalable)
const ADJ_DEFAULTS = {
  'Plaine|Forêt':      'libre',
  'Plaine|Désert':     'libre',
  'Plaine|Marais':     'libre',
  'Plaine|Montagne':   'libre',
  'Plaine|Neige':      'libre',
  'Forêt|Désert':      'tampon',
  'Forêt|Marais':      'libre',
  'Forêt|Montagne':    'libre',
  'Forêt|Neige':       'libre',
  'Désert|Marais':     'interdit',
  'Désert|Montagne':   'libre',
  'Désert|Neige':      'tampon',
  'Marais|Montagne':   'tampon',
  'Marais|Neige':      'interdit',
  'Montagne|Neige':    'libre'
};

// Clé canonique pour une paire (biome ordonnés alphabétiquement)
function adjKey(a, b) {
  if (a === b) return null;
  return [a, b].sort().join('|');
}

function biomeSwatch(biome) {
  const c = BIOMES[biome].color;
  return `<span style="display:inline-block;width:10px;height:10px;background:${c};border:1px solid #000;vertical-align:middle;margin-right:3px;"></span>`;
}

function buildAdjacencyControls() {
  const container = document.getElementById('adjacency-container');
  let html = '';
  for (let i = 0; i < ADJ_BIOMES.length; i++) {
    for (let j = i + 1; j < ADJ_BIOMES.length; j++) {
      const a = ADJ_BIOMES[i], b = ADJ_BIOMES[j];
      const key = adjKey(a, b);
      const slug = key.replace('|', '-').toLowerCase()
                      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const def = ADJ_DEFAULTS[key] || 'libre';
      html += `
        <div class="field" style="font-size:11px;">
          <label style="white-space:nowrap;">${biomeSwatch(a)}${a} ↔ ${biomeSwatch(b)}${b}</label>
          <select id="adj-${slug}" data-pair="${key}" style="width:80px;">
            <option value="libre"${def === 'libre' ? ' selected' : ''}>Libre</option>
            <option value="tampon"${def === 'tampon' ? ' selected' : ''}>Tampon</option>
            <option value="interdit"${def === 'interdit' ? ' selected' : ''}>Interdit</option>
          </select>
        </div>
      `;
    }
  }
  container.innerHTML = html;
}

function getAdjacencyRules() {
  const rules = {};
  document.querySelectorAll('[id^="adj-"][data-pair]').forEach(el => {
    rules[el.dataset.pair] = el.value;
  });
  return rules;
}

function resetAdjacency() {
  document.getElementById('adj-enabled').checked = false;
  document.querySelectorAll('[id^="adj-"][data-pair]').forEach(el => {
    el.value = ADJ_DEFAULTS[el.dataset.pair] || 'libre';
  });
}

function buildResourceControls() {
  const container = document.getElementById('res-container');
  let html = '';
  for (const [res, defs] of Object.entries(RES_DEFAULTS)) {
    const slug = slugify(res);
    const icon = resShapeSvg(RES_STYLE[res]);
    // Sous-sections déjà OUVERTES par défaut : les 3 sliders sont visibles
    // sans avoir besoin de cliquer. L'utilisateur peut toujours les replier.
    html += `
      <div class="subgroup nested" id="sub-res-${slug}">
        <div class="subhead" data-toggle="sub-res-${slug}">
          <span>▾ ${icon} <b>${res}</b></span>
          <button class="reset-btn" data-reset-res="${res}">↺</button>
        </div>
        <div class="sub-body">
          <div class="field">
            <label>Densité</label>
            <input type="range" id="res-${slug}-density" min="${RES_PARAM_SPECS.density.min}" max="${RES_PARAM_SPECS.density.max}" value="${defs.density}">
            <span class="value" id="res-${slug}-density-v">${RES_PARAM_SPECS.density.fmt(defs.density)}</span>
          </div>
          <div class="field">
            <label>Proximité</label>
            <input type="range" id="res-${slug}-prox" min="${RES_PARAM_SPECS.prox.min}" max="${RES_PARAM_SPECS.prox.max}" value="${defs.prox}">
            <span class="value" id="res-${slug}-prox-v">${RES_PARAM_SPECS.prox.fmt(defs.prox)}</span>
          </div>
          <div class="field">
            <label>Taille</label>
            <input type="range" id="res-${slug}-size" min="${RES_PARAM_SPECS.size.min}" max="${RES_PARAM_SPECS.size.max}" value="${defs.size}">
            <span class="value" id="res-${slug}-size-v">${RES_PARAM_SPECS.size.fmt(defs.size)}</span>
          </div>
        </div>
      </div>
    `;
    // Enregistrer les specs pour ces 3 sliders
    for (const pkey of ['density', 'prox', 'size']) {
      const id = `res-${slug}-${pkey}`;
      PARAM_SPECS[id] = { fmt: RES_PARAM_SPECS[pkey].fmt, conv: RES_PARAM_SPECS[pkey].conv, resKey: res, pKey: pkey };
    }
  }
  container.innerHTML = html;
}

// ============================================================
// PARAMÈTRES — affichage et conversion
// ============================================================
const PARAM_SPECS = {
  // élévation
  'e-cont':    { fmt: v => v,                     conv: v => v / 100 },
  'e-scale':   { fmt: v => v,                     conv: v => v / 100 },
  'e-compact': { fmt: v => v + '%',               conv: v => v / 100 },
  'e-oct':     { fmt: v => v,                     conv: v => v       },
  'e-pers':    { fmt: v => (v / 100).toFixed(2),  conv: v => v / 100 },
  'e-edge':    { fmt: v => v + '%',               conv: v => v / 100 },
  'e-islands': { fmt: v => v + '%',               conv: v => v / 100 },
  // humidité
  'h-scale':   { fmt: v => v,                     conv: v => v / 100 },
  'h-oct':     { fmt: v => v,                     conv: v => v       },
  'h-pers':    { fmt: v => (v / 100).toFixed(2),  conv: v => v / 100 },
  'h-cont':    { fmt: v => v + '%',               conv: v => v / 100 },
  // température
  't-lat':     { fmt: v => (v / 100).toFixed(2), conv: v => v / 100 },
  't-scale':   { fmt: v => v,                     conv: v => v / 100 },
  't-noise':   { fmt: v => (v / 100).toFixed(2),  conv: v => v / 100 },
  't-alt':     { fmt: v => (v / 100).toFixed(2),  conv: v => v / 100 },
  // événements
  'evt-volcan':  { fmt: v => v + '%', conv: v => v / 100 },
  'evt-river':   { fmt: v => v + '%', conv: v => v / 100 },
  'evt-riverlen': { fmt: v => v, conv: v => v }
  // Les paramètres par-ressource ('res-<slug>-*') sont ajoutés dynamiquement
  // par buildResourceControls() ci-dessous.
};

// Formatters pour les paramètres de ressources (tous identiques)
const RES_PARAM_SPECS = {
  density: { fmt: v => (v / 10).toFixed(1) + '%', conv: v => v / 1000, min: 0,  max: 80, def: 20 },
  prox:    { fmt: v => v + '%',                    conv: v => v / 100,  min: 0,  max: 95, def: 55 },
  size:    { fmt: v => v,                          conv: v => v,        min: 1,  max: 12, def: 5  }
};

// Slugify : 'Bétail' → 'betail'
function slugify(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function getParams() {
  const read = (id) => PARAM_SPECS[id].conv(+document.getElementById(id).value);
  const res = {};
  for (const resName of Object.keys(RES_DEFAULTS)) {
    const slug = slugify(resName);
    res[resName] = {
      density: read(`res-${slug}-density`),
      prox:    read(`res-${slug}-prox`),
      size:    read(`res-${slug}-size`)
    };
  }
  const readInt = (id) => parseInt(document.getElementById(id).value, 10) || 0;
  const caps = {
    'Plaine':   readInt('cap-plaine'),
    'Forêt':    readInt('cap-foret'),
    'Désert':   readInt('cap-desert'),
    'Marais':   readInt('cap-marais'),
    'Montagne': readInt('cap-montagne'),
    'Océan':    readInt('cap-ocean'),
    'Neige':    readInt('cap-neige')
  };
  const surroundSame = parseInt(document.getElementById('c-surround-same').value, 10) || 0;
  const surroundAny  = parseInt(document.getElementById('c-surround-any').value, 10) || 0;
  return {
    elev: {
      cont: read('e-cont'), scale: read('e-scale'), compact: read('e-compact'),
      oct: read('e-oct'), pers: read('e-pers'),
      edge: read('e-edge'), islands: read('e-islands')
    },
    humid: {
      scale: read('h-scale'), oct: read('h-oct'),
      pers: read('h-pers'), cont: read('h-cont')
    },
    temp: {
      lat: read('t-lat'), scale: read('t-scale'),
      noise: read('t-noise'), alt: read('t-alt')
    },
    poles: document.getElementById('t-poles').value || 'ns',
    biomeOrder: document.getElementById('biome-order').value || 'ETH',
    adjacency: {
      enabled: document.getElementById('adj-enabled').checked,
      rules: getAdjacencyRules()
    },
    res,
    evt: {
      volcan: read('evt-volcan'),
      river:  read('evt-river'),
      riverLen: read('evt-riverlen')
    },
    constraints: { caps, surroundSame, surroundAny }
  };
}

function updateParamLabels() {
  for (const id in PARAM_SPECS) {
    const el = document.getElementById(id);
    if (!el) continue;
    const lbl = document.getElementById(id + '-v');
    if (lbl) lbl.textContent = PARAM_SPECS[id].fmt(+el.value);
  }
}

// Mapping groupe → préfixe d'id (sauf 'res' qui est géré à part)
const GROUP_PREFIX = {
  elev:  'e-',
  humid: 'h-',
  temp:  't-',
  evt:   'evt-'
};

function resetGroup(group) {
  if (group === 'res') {
    for (const resName of Object.keys(RES_DEFAULTS)) resetResource(resName);
    return;
  }
  if (group === 'adjacency') {
    resetAdjacency();
    return;
  }
  if (group === 'rivers') {
    document.getElementById('evt-river').value = DEFAULTS.evt.river;
    document.getElementById('evt-riverlen').value = DEFAULTS.evt.riverlen;
    updateParamLabels();
    return;
  }
  if (group === 'constraints') {
    const d = DEFAULTS.constraints;
    document.getElementById('c-surround-same').value = d.surroundSame;
    document.getElementById('c-surround-any').value  = d.surroundAny;
    document.getElementById('cap-plaine').value   = d['cap-plaine'];
    document.getElementById('cap-foret').value    = d['cap-foret'];
    document.getElementById('cap-desert').value   = d['cap-desert'];
    document.getElementById('cap-marais').value   = d['cap-marais'];
    document.getElementById('cap-montagne').value = d['cap-montagne'];
    document.getElementById('cap-ocean').value    = d['cap-ocean'];
    document.getElementById('cap-neige').value    = d['cap-neige'];
    return;
  }
  const g = DEFAULTS[group];
  const prefix = GROUP_PREFIX[group];
  for (const key of Object.keys(g)) {
    const id = prefix + key;
    const el = document.getElementById(id);
    if (el) el.value = g[key];
  }
  updateParamLabels();
}

function resetResource(resName) {
  const slug = slugify(resName);
  const defs = RES_DEFAULTS[resName];
  for (const pkey of ['density', 'prox', 'size']) {
    const el = document.getElementById(`res-${slug}-${pkey}`);
    if (el) el.value = defs[pkey];
  }
  updateParamLabels();
}

// ============================================================
// UI
// ============================================================
function updateTileCount() {
  const N = +document.getElementById('radius').value;
  const total = 3 * N * N + 3 * N + 1;
  document.getElementById('tile-count').textContent = total;
  document.getElementById('radius-v').textContent = N;
}

function computeHex(N) {
  const maxW = window.innerWidth - 40;
  const maxH = window.innerHeight - 40;
  const sizeByW = maxW / (3 * N * SQRT3);
  const sizeByH = maxH / (3 * N);
  return Math.max(10, Math.min(32, Math.floor(Math.min(sizeByW, sizeByH) * 1.4)));
}

function regenerate(resetView = true) {
  const seed = document.getElementById('seed').value || 'grimoire';
  const N = Math.max(10, Math.min(18, +document.getElementById('radius').value));
  const sea = +document.getElementById('sealevel').value / 100;
  const mountains = +document.getElementById('mountains').value / 100;
  const noiseType = document.getElementById('noise-type').value;
  HEX = computeHex(N);
  const all = getParams();
  map = generateMap(N, seed, { sea, mountains, noiseType, ...all });
  // Réappliquer le placement joueurs sur la nouvelle carte
  applyPlayers();
  // Mettre à jour le compteur de biomes
  updateBiomeCounts();
  if (resetView) fitView();
  selected = null;
  infoEl.classList.remove('visible');
  render();
}

// Compteur de biomes visible sous le total de tuiles, mis à jour après
// chaque régénération.
function updateBiomeCounts() {
  const el = document.getElementById('biome-counts');
  if (!map || !map.biome) {
    el.style.display = 'none';
    return;
  }
  const counts = {};
  for (const b of map.biome) counts[b] = (counts[b] || 0) + 1;
  // Ordre fixe : Océan en premier, puis terrestres dans l'ordre Plaine → ...
  const order = ['Océan', 'Plaine', 'Forêt', 'Désert', 'Marais', 'Montagne', 'Neige', 'Volcan'];
  let html = '';
  for (const b of order) {
    const c = counts[b] || 0;
    if (c === 0) continue;
    const color = BIOMES[b].color;
    html += `<div style="display:flex;justify-content:space-between;gap:8px;">
      <span><span style="display:inline-block;width:9px;height:9px;background:${color};border:1px solid #000;vertical-align:middle;margin-right:4px;"></span>${b}</span>
      <span style="color:var(--accent);font-weight:bold;">${c}</span>
    </div>`;
  }
  el.innerHTML = html;
  el.style.display = 'block';
}

// Seed dédiée au placement joueurs : ne change qu'en cas de clic 🎲
// (initialisée à une valeur aléatoire au chargement).
let playerSeed = 'p' + Math.floor(Math.random() * 1000000);

function applyPlayers() {
  if (!map) return;
  const count = parseInt(document.getElementById('players').value, 10) || 0;
  const spread = document.getElementById('player-spread').value || 'far';
  const minDist     = parseInt(document.getElementById('player-dist').value, 10)    || 5;
  const edgeMargin  = parseInt(document.getElementById('player-edge').value, 10)    || 0;
  const centerMargin= parseInt(document.getElementById('player-center').value, 10)  || 0;
  const minContinent= parseInt(document.getElementById('player-cont').value, 10)    || 0;
  const inspectRadius = parseInt(document.getElementById('player-inspect').value, 10) || 3;
  const required = [];
  if (document.getElementById('req-foret').checked)    required.push('Forêt');
  if (document.getElementById('req-montagne').checked) required.push('Montagne');
  if (document.getElementById('req-desert').checked)   required.push('Désert');
  placePlayers(map, {
    count, spread, seedStr: playerSeed,
    minDist, edgeMargin, centerMargin,
    minContinent, inspectRadius, required
  });
  // Afficher / masquer l'avertissement
  const warnEl = document.getElementById('warning');
  if (map.playerWarning) {
    warnEl.textContent = '⚠ ' + map.playerWarning;
    warnEl.classList.add('visible');
  } else {
    warnEl.classList.remove('visible');
  }
}

let regenTimer = null;
function scheduleRegen() {
  clearTimeout(regenTimer);
  regenTimer = setTimeout(() => regenerate(false), 80);
}

// Génération d'une graine aléatoire lisible (mots évoquant un grimoire médiéval)
function randomSeed() {
  const prefixes = ['aer', 'bel', 'cor', 'dra', 'eld', 'fer', 'gol', 'har', 'ith', 'jor',
                    'kar', 'lun', 'mor', 'nar', 'ost', 'pyr', 'quer', 'ryn', 'sol', 'tor',
                    'umb', 'val', 'wyr', 'xar', 'yth', 'zel', 'bran', 'cal', 'dun', 'ever'];
  const suffixes = ['arn', 'beth', 'dell', 'faen', 'gorn', 'heim', 'iril', 'kast', 'lain',
                    'mere', 'nord', 'olin', 'peth', 'quel', 'raven', 'stan', 'thir', 'ulm',
                    'varn', 'weald', 'ynth', 'zur', 'moor', 'fell', 'vale', 'wyn', 'dor'];
  const rand = Math.random;
  const a = prefixes[Math.floor(rand() * prefixes.length)];
  const b = suffixes[Math.floor(rand() * suffixes.length)];
  return a + b;
}

// Construction des sliders par ressource (doit être fait avant d'attacher
// les event listeners sur ces éléments)
buildResourceControls();
// Construction des règles d'adjacence (idem)
buildAdjacencyControls();

// Bouton Générer : nouvelle graine aléatoire + régénération complète
document.getElementById('regen').addEventListener('click', () => {
  document.getElementById('seed').value = randomSeed();
  regenerate(true);
});
// Entrée dans le champ seed : régénère avec la graine saisie (sans la modifier)
document.getElementById('seed').addEventListener('keydown', e => { if (e.key === 'Enter') regenerate(true); });
document.getElementById('noise-type').addEventListener('change', () => regenerate(true));
document.getElementById('radius').addEventListener('input', updateTileCount);
document.getElementById('radius').addEventListener('change', () => regenerate(true));

// --- Sélecteur de type de carte (presets)
// Ignore les events déclenchés par le preset lui-même (sinon on basculerait
// immédiatement sur "Personnalisé")
let applyingPreset = false;

function applyPreset(name) {
  const preset = MAP_PRESETS[name];
  if (!preset) return;
  applyingPreset = true;
  try {
    for (const [id, value] of Object.entries(preset)) {
      const el = document.getElementById(id);
      if (el) el.value = value;
    }
    updateParamLabels();
    // Rafraîchir les libellés des sliders classiques (non-PARAM_SPECS)
    document.getElementById('sealevel-v').textContent =
      document.getElementById('sealevel').value + '%';
    document.getElementById('mountains-v').textContent =
      document.getElementById('mountains').value + '%';
  } finally {
    applyingPreset = false;
  }
  scheduleRegen();
}

document.getElementById('map-type').addEventListener('change', e => {
  if (e.target.value === 'custom') return; // juste marquer comme personnalisé
  applyPreset(e.target.value);
});

// Quand l'utilisateur touche un slider de géographie manuellement, bascule
// sur "Personnalisé" pour être honnête sur ce qui est affiché
const GEO_PARAM_IDS = ['sealevel', 'e-cont', 'e-scale', 'e-compact', 'e-edge', 'e-pers'];
function markCustomOnUserEdit(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', () => {
    if (applyingPreset) return;
    document.getElementById('map-type').value = 'custom';
  });
}
GEO_PARAM_IDS.forEach(markCustomOnUserEdit);

['sealevel', 'mountains'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('input', e => {
    document.getElementById(id + '-v').textContent = e.target.value + '%';
    scheduleRegen();
  });
});

Object.keys(PARAM_SPECS).forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', () => {
    updateParamLabels();
    scheduleRegen();
  });
});

// Sélecteur Pôles (climat)
document.getElementById('t-poles').addEventListener('change', scheduleRegen);
// Sélecteur d'ordre des critères de biomes
document.getElementById('biome-order').addEventListener('change', scheduleRegen);

// Règles d'adjacence : checkbox et tous les selects
document.getElementById('adj-enabled').addEventListener('change', scheduleRegen);
document.querySelectorAll('[id^="adj-"][data-pair]').forEach(el => {
  el.addEventListener('change', scheduleRegen);
});

// Contrôles de contraintes (select + inputs number)
['c-surround-same', 'c-surround-any', 'cap-plaine', 'cap-foret', 'cap-desert', 'cap-marais', 'cap-montagne', 'cap-ocean', 'cap-neige'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', scheduleRegen);
  el.addEventListener('change', scheduleRegen);
});

// Champ joueurs : pas besoin de régénérer la carte, juste replacer les joueurs
function rerollPlayersAndRender() {
  applyPlayers();
  render();
}
document.getElementById('players').addEventListener('input', rerollPlayersAndRender);
document.getElementById('players').addEventListener('change', rerollPlayersAndRender);
document.getElementById('player-spread').addEventListener('change', rerollPlayersAndRender);

// Sliders joueurs : mettre à jour libellé puis re-placer
function bindPlayerSlider(id, fmt) {
  const el = document.getElementById(id);
  if (!el) return;
  const lbl = document.getElementById(id + '-v');
  el.addEventListener('input', () => {
    if (lbl) lbl.textContent = fmt(+el.value);
    rerollPlayersAndRender();
  });
}
bindPlayerSlider('player-dist',    v => v);
bindPlayerSlider('player-edge',    v => v);
bindPlayerSlider('player-center',  v => v);
bindPlayerSlider('player-cont',    v => v);
bindPlayerSlider('player-inspect', v => v);

['req-foret', 'req-montagne', 'req-desert'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('change', rerollPlayersAndRender);
});

// Bouton 🎲 : nouvelle seed de placement → nouveau tirage
document.getElementById('reroll-players').addEventListener('click', () => {
  playerSeed = randomSeed();
  rerollPlayersAndRender();
});

document.getElementById('lay-rivers').addEventListener('change', e => { layers.rivers = e.target.checked; render(); });
document.getElementById('lay-resources').addEventListener('change', e => { layers.resources = e.target.checked; render(); });
document.getElementById('lay-grid').addEventListener('change', e => { layers.grid = e.target.checked; render(); });
document.getElementById('lay-legend').addEventListener('change', e => {
  document.getElementById('legend').classList.toggle('visible', e.target.checked);
});

document.getElementById('toggle-controls').addEventListener('click', () => {
  const c = document.getElementById('controls');
  c.classList.toggle('collapsed');
  document.getElementById('chevron').textContent = c.classList.contains('collapsed') ? '▸' : '▾';
});

document.querySelectorAll('.subhead[data-toggle]').forEach(h => {
  h.addEventListener('click', (e) => {
    if (e.target.classList.contains('reset-btn')) return;
    const id = h.dataset.toggle;
    const g = document.getElementById(id);
    const collapsed = g.classList.toggle('collapsed');
    const arrow = collapsed ? '▸' : '▾';
    const span = h.querySelector('span');
    span.textContent = arrow + ' ' + span.textContent.replace(/^[▸▾]\s*/, '');
  });
});

document.querySelectorAll('.reset-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (btn.dataset.resetRes) {
      resetResource(btn.dataset.resetRes);
    } else {
      resetGroup(btn.dataset.reset);
    }
    scheduleRegen();
  });
});

document.getElementById('export').addEventListener('click', () => {
  if (!map) return;
  const savedHex = HEX;
  HEX = 28;
  const b = mapBounds();
  const padding = 24;
  const off = document.createElement('canvas');
  off.width = Math.ceil(b.w + padding * 2);
  off.height = Math.ceil(b.h + padding * 2);
  const oc = off.getContext('2d');
  const bgColor = getComputedStyle(document.body).getPropertyValue('--map-bg').trim() || '#0a0704';
  oc.fillStyle = bgColor;
  oc.fillRect(0, 0, off.width, off.height);
  oc.translate(padding - b.minX, padding - b.minY);
  renderToContext(oc);
  HEX = savedHex;
  off.toBlob(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `carte-${document.getElementById('seed').value || 'grimoire'}-r${map.N}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }, 'image/png');
});

window.addEventListener('resize', () => {
  resizeCanvas();
  fitView();
  render();
});

resizeCanvas();
renderLegend();
updateTileCount();
updateParamLabels();

// --- Thème clair/sombre (persistant via localStorage)
function applyTheme(theme) {
  document.body.classList.remove('dark', 'light');
  document.body.classList.add(theme);
  const btn = document.getElementById('theme-toggle');
  // ☾ lune = on est en sombre et on peut passer en clair ; ☀ soleil = l'inverse
  btn.textContent = (theme === 'dark') ? '☀' : '☾';
  btn.title = (theme === 'dark') ? 'Passer en thème clair' : 'Passer en thème sombre';
  try { localStorage.setItem('grimoire-theme', theme); } catch (_) {}
}
let currentTheme = 'dark';
try {
  const saved = localStorage.getItem('grimoire-theme');
  if (saved === 'light' || saved === 'dark') currentTheme = saved;
} catch (_) {}
applyTheme(currentTheme);
document.getElementById('theme-toggle').addEventListener('click', () => {
  currentTheme = (currentTheme === 'dark') ? 'light' : 'dark';
  applyTheme(currentTheme);
});

regenerate(true);

setTimeout(() => {
  document.getElementById('hint').style.opacity = '0';
}, 5000);

</script>