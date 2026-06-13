<!-- ============================================================
     Page Quartz : content/Wargame/Resultats.md
     Résultats & statistiques. HTML + CSS (variables Quartz).
     JS dans /quartz/static/cp-stats.js
     ============================================================ -->

<div id="cp-stats-app">
  <style>
    #cp-stats-app {
      font-family: Georgia, "Times New Roman", serif; color: var(--dark);
      max-width: 960px; margin: 0 auto;
    }
    #cp-stats-app * { box-sizing: border-box; }
    #cp-stats-app h2 {
      font-variant: small-caps; letter-spacing: 0.04em; color: var(--dark);
      border-bottom: 2px solid var(--gray); padding-bottom: 0.3em;
    }

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
    .cp-stats-app label, #cp-stats-app label {
      display: block; font-variant: small-caps; font-size: 0.8em; letter-spacing: 0.05em;
      color: var(--secondary); margin: 0 0 0.25em;
    }
    .cp-section-label { margin-top: 0.6em !important; }
    #cp-stats-app input, #cp-stats-app select {
      width: 100%; background: var(--light); border: 1px solid var(--gray); border-radius: 3px;
      padding: 0.45em 0.6em; font-family: inherit; font-size: 0.9em; color: var(--dark);
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

    .cp-btn-ghost {
      background: transparent; border: 1px dashed var(--gray); color: var(--secondary);
      border-radius: 3px; padding: 0.4em 0.9em; font-family: inherit; font-size: 0.85em;
      cursor: pointer; margin-top: 0.3em;
    }
    .cp-btn-ghost:hover { background: var(--highlight); }
    .cp-form-actions { margin-top: 1em; }
    .cp-btn {
      background: var(--secondary); color: var(--light); border: 1px solid var(--secondary);
      border-radius: 3px; padding: 0.6em 1.4em; font-family: inherit; font-variant: small-caps;
      letter-spacing: 0.06em; font-size: 0.95em; cursor: pointer;
    }
    .cp-btn:hover { opacity: 0.88; }
    .cp-btn:disabled { opacity: 0.5; cursor: wait; }
    .cp-msg { margin-top: 0.7em; font-size: 0.88em; min-height: 1.1em; }
    .cp-msg.ok { color: #3a8a4a; }
    .cp-msg.err { color: #b5524a; }

    /* Tables (historique + stats) */
    .cp-table { width: 100%; border-collapse: collapse; font-size: 0.9em; margin-top: 0.3em; }
    .cp-table thead th {
      text-align: left; font-variant: small-caps; letter-spacing: 0.04em; color: var(--secondary);
      border-bottom: 2px solid var(--gray); padding: 0.5em 0.6em; white-space: nowrap;
    }
    .cp-table tbody td { padding: 0.45em 0.6em; border-bottom: 1px solid var(--lightgray); }
    .cp-table tbody tr:hover { background: var(--highlight); }
    .cp-c-key { font-weight: bold; }
    .cp-c-rate { font-weight: bold; font-variant-numeric: tabular-nums; }
    .cp-c-date { white-space: nowrap; font-style: italic; color: var(--gray); }
    .cp-c-act { text-align: right; width: 1%; }
    .cp-partie-del { background: none; border: 1px solid transparent; color: #b5524a; cursor: pointer;
      border-radius: 3px; padding: 0.15em 0.4em; }
    .cp-partie-del:hover { background: #b5524a; color: var(--light); }

    .cp-camp { padding: 0.05em 0.3em; border-radius: 3px; }
    .cp-win { color: #3a8a4a; font-weight: bold; }
    .cp-lose { color: #b5524a; }
    .cp-draw { color: #b59024; }

    /* Switch de stats */
    .cp-statswitch { display: flex; flex-wrap: wrap; gap: 0.4em; margin-bottom: 1em; }
    .cp-statbtn {
      background: var(--lightgray); border: 1px solid var(--gray); border-radius: 999px;
      padding: 0.35em 0.9em; font-family: inherit; font-size: 0.82em; color: var(--secondary); cursor: pointer;
    }
    .cp-statbtn:hover { background: var(--highlight); }
    .cp-statbtn.active { background: var(--secondary); color: var(--light); border-color: var(--secondary); }

    .cp-hint { font-size: 0.78em; font-style: italic; color: var(--gray); margin-top: 0.6em; }
    .cp-empty { font-style: italic; color: var(--gray); }
  </style>

  <h2>Résultats &amp; statistiques</h2>

  <div class="cp-tabs">
    <button id="cp-tab-saisie" data-tab="saisie">Saisir une partie</button>
    <button id="cp-tab-historique" data-tab="historique">Historique</button>
    <button id="cp-tab-stats" data-tab="stats">Statistiques</button>
  </div>

  <div id="cp-stats-main"><p class="cp-empty">Chargement…</p></div>
</div>