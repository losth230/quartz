<!-- ============================================================
     Page Quartz : content/Wargame/Resultats.md
     HTML + CSS SPÉCIFIQUE. Commun dans /quartz/static/cp-common.css,
     JS dans /quartz/static/cp-stats.js (chargés via Head.tsx).
     ============================================================ -->

<div id="cp-stats-app">
  <style>
    /* --- Spécifique aux résultats & statistiques --- */
    #cp-stats-app { max-width: 960px; }

    /* Onglets principaux */
    .cp-tabs { display: flex; gap: 0.4em; margin: 1em 0 1.4em; border-bottom: 1px solid var(--gray); }
    .cp-tabs button {
      background: none; border: none; border-bottom: 3px solid transparent;
      padding: 0.5em 1em; font-family: inherit; font-variant: small-caps;
      letter-spacing: 0.04em; font-size: 0.95em; color: var(--gray); cursor: pointer;
    }
    .cp-tabs button:hover { color: var(--dark); }
    .cp-tabs button.active { color: var(--secondary); border-bottom-color: var(--secondary); font-weight: bold; }

    /* Carte formulaire */
    .cp-card { background: var(--lightgray); border: 1px solid var(--gray); border-radius: 4px; padding: 1.2em 1.4em; }
    .cp-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.8em; margin-bottom: 1em; }
    #cp-stats-app label {
      display: block; font-variant: small-caps; font-size: 0.8em; letter-spacing: 0.05em;
      color: var(--secondary); margin: 0 0 0.25em;
    }
    .cp-section-label { margin-top: 0.6em !important; }
    #cp-stats-app input, #cp-stats-app select {
      width: 100%; background: var(--light); border: 1px solid var(--gray); border-radius: 3px;
      padding: 0.45em 0.6em; font-family: inherit; font-size: 0.9em; color: var(--dark);
    }
    /* Filtres de l'historique : en ligne, largeur compacte (et non 100%) */
    #cp-stats-app .cp-controls select {
      width: auto; flex: 0 1 auto; min-width: 130px; max-width: 200px; font-size: 0.85em;
    }
    #cp-stats-app .cp-controls .cp-search {
      width: auto; flex: 1 1 160px; min-width: 140px;
    }

    /* Lignes de participants */
    .cp-part-row { display: flex; flex-wrap: wrap; gap: 0.5em; align-items: center; margin-bottom: 0.6em; }
    .cp-part-num { font-variant: small-caps; font-weight: bold; color: var(--secondary); min-width: 2em; }
    .cp-part-row .cp-p-joueur { flex: 1.1; min-width: 100px; }
    .cp-part-row .cp-p-peuple { flex: 1.2; min-width: 110px; }
    .cp-part-row .cp-p-liste { flex: 1.6; min-width: 140px; }
    .cp-part-row .cp-p-archetype { flex: 1; min-width: 100px; }
    .cp-part-row .cp-p-pertes { flex: 0.6; min-width: 70px; }
    .cp-part-row .cp-p-resultat { flex: 0.9; min-width: 95px; }
    .cp-part-row input:disabled { opacity: 0.5; background: var(--lightgray); }
    .cp-part-del { background: none; border: 1px solid transparent; color: #b5524a; cursor: pointer;
      border-radius: 3px; padding: 0.2em 0.4em; }
    .cp-part-del:hover { background: #b5524a; color: var(--light); }
    .cp-form-actions { margin-top: 1em; }

    /* Cellules de stats */
    .cp-c-key { font-weight: bold; }
    .cp-c-rate { font-weight: bold; font-variant-numeric: tabular-nums; }
    .cp-partie-del { background: none; border: 1px solid transparent; color: #b5524a; cursor: pointer;
      border-radius: 3px; padding: 0.15em 0.4em; }
    .cp-partie-del:hover { background: #b5524a; color: var(--light); }
    .cp-partie-edit { background: none; border: 1px solid transparent; color: var(--secondary); cursor: pointer;
      border-radius: 3px; padding: 0.15em 0.4em; }
    .cp-partie-edit:hover { background: var(--secondary); color: var(--light); }
    .cp-form-mode {
      font-variant: small-caps; font-size: 0.82em; letter-spacing: 0.05em;
      color: var(--tertiary); font-weight: bold; margin-bottom: 0.6em;
    }

    /* Camps colorés dans l'historique */
    .cp-camp { padding: 0.05em 0.3em; border-radius: 3px; }
    .cp-win { color: #3a8a4a; font-weight: bold; }
    .cp-lose { color: #b5524a; }
    .cp-draw { color: #b59024; }

    /* Switch de dimensions de stats */
    .cp-statswitch { display: flex; flex-wrap: wrap; gap: 0.4em; margin-bottom: 1em; }
    .cp-statbtn {
      background: var(--lightgray); border: 1px solid var(--gray); border-radius: 999px;
      padding: 0.35em 0.9em; font-family: inherit; font-size: 0.82em; color: var(--secondary); cursor: pointer;
    }
    .cp-statbtn:hover { background: var(--highlight); }
    .cp-statbtn.active { background: var(--secondary); color: var(--light); border-color: var(--secondary); }

    /* Sous-sélecteur (Par liste / Par archétype) */
    .cp-substat { display: flex; gap: 0.4em; margin-bottom: 0.6em; }
    .cp-subbtn {
      background: transparent; border: 1px solid var(--gray); border-radius: 3px;
      padding: 0.3em 0.8em; font-family: inherit; font-size: 0.8em; color: var(--secondary); cursor: pointer;
    }
    .cp-subbtn:hover { background: var(--highlight); }
    .cp-subbtn.active { background: var(--tertiary); color: var(--light); border-color: var(--tertiary); }

    /* Filtres de statistiques */
    .cp-stat-filtres {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 0.8em; margin-bottom: 1em; padding-bottom: 0.8em; border-bottom: 1px solid var(--gray);
    }

    /* Récap en tête */
    .cp-recap { display: flex; gap: 1em; margin-bottom: 1em; flex-wrap: wrap; }
    .cp-recap-item {
      display: flex; flex-direction: column; align-items: center;
      background: var(--lightgray); border: 1px solid var(--gray); border-radius: 4px;
      padding: 0.5em 1.2em; min-width: 90px;
    }
    .cp-recap-num { font-size: 1.6em; font-weight: bold; color: var(--secondary); line-height: 1; }
    .cp-recap-lbl { font-size: 0.78em; font-variant: small-caps; letter-spacing: 0.04em; color: var(--gray); margin-top: 0.2em; }

    /* Encart de fiabilité statistique */
    .cp-fiab {
      border-left: 4px solid var(--tertiary); background: var(--lightgray);
      border-radius: 0 4px 4px 0; padding: 0.8em 1em; margin-bottom: 1.2em;
    }
    .cp-fiab p { margin: 0 0 0.5em; font-size: 0.92em; line-height: 1.5; }
    .cp-fiab p:last-child { margin-bottom: 0; }
    .cp-fiab-proj { color: var(--secondary); }
    .cp-fiab-alerte {
      border-left-color: #b5824a;
      background: color-mix(in srgb, #b5824a 10%, var(--lightgray));
    }

    .cp-c-eff { font-variant-numeric: tabular-nums; }

    /* Graphiques */
    .cp-charts {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.2em; margin: 1.2em 0;
    }
    .cp-chart-box {
      background: var(--lightgray); border: 1px solid var(--gray); border-radius: 4px;
      padding: 0.9em 1em;
    }
    .cp-chart-box h4 {
      margin: 0 0 0.6em; font-variant: small-caps; letter-spacing: 0.04em;
      color: var(--secondary); font-size: 0.9em;
    }
    .cp-chart-n {
      font-variant: normal; font-size: 0.82em; font-weight: normal; letter-spacing: 0;
      color: var(--gray); background: var(--light); border: 1px solid var(--gray);
      border-radius: 999px; padding: 0.05em 0.5em; margin-left: 0.4em; white-space: nowrap;
    }
    .cp-chart-box canvas { max-height: 280px; }
    .cp-chart-full { margin: 1.4em 0; }
    .cp-chart-full canvas { max-height: 240px; }

    /* Heatmap des matchups */
    .cp-heat-wrap { overflow-x: auto; margin: 0.6em 0 1.2em; }
    .cp-heat { border-collapse: collapse; font-size: 0.75em; }
    .cp-heat th {
      padding: 0.3em 0.5em; font-variant: small-caps; color: var(--secondary);
      white-space: nowrap; text-align: center; font-weight: normal;
    }
    .cp-heat thead th { writing-mode: vertical-rl; transform: rotate(180deg); max-height: 90px; }
    .cp-heat tbody th { text-align: right; }
    .cp-heat td {
      width: 2.6em; height: 2.6em; text-align: center; border: 1px solid var(--light);
      color: #2b2520; font-variant-numeric: tabular-nums; font-size: 0.95em;
    }
  </style>

  <h2>Résultats &amp; statistiques</h2>

  <div class="cp-tabs">
    <button id="cp-tab-saisie" data-tab="saisie">Saisir une partie</button>
    <button id="cp-tab-historique" data-tab="historique">Historique</button>
    <button id="cp-tab-stats" data-tab="stats">Statistiques</button>
  </div>

  <div id="cp-stats-main"><p class="cp-empty">Chargement…</p></div>
</div>
