<!-- ============================================================
     Page Quartz : content/Wargame/Listes-d-armées.md
     HTML + CSS. Couleurs branchées sur les variables natives Quartz
     (--light, --lightgray, --gray, --darkgray, --dark, --secondary,
      --tertiary, --highlight) => bascule clair/sombre automatique.
     JS dans /quartz/static/cp-army-lists.js
     ============================================================ -->

<div id="cp-army-app">
  <style>
    #cp-army-app {
      font-family: Georgia, "Times New Roman", serif;
      color: var(--dark);
      max-width: 920px;
      margin: 0 auto;
    }
    #cp-army-app * { box-sizing: border-box; }
    #cp-army-app h2 {
      font-variant: small-caps; letter-spacing: 0.04em;
      color: var(--dark);
      border-bottom: 2px solid var(--gray); padding-bottom: 0.3em;
    }

    /* ---- Formulaire ---- */
    .cp-form {
      background: var(--lightgray); border: 1px solid var(--gray);
      border-radius: 4px; padding: 1.2em 1.4em; margin-bottom: 2em;
    }
    .cp-form-mode {
      font-variant: small-caps; font-size: 0.82em; letter-spacing: 0.05em;
      color: var(--tertiary); font-weight: bold; min-height: 1em;
    }
    .cp-form label {
      display: block; font-variant: small-caps; font-size: 0.85em;
      letter-spacing: 0.05em; color: var(--secondary); margin: 0.8em 0 0.3em;
    }
    .cp-form input, .cp-form textarea, .cp-form select {
      width: 100%; background: var(--light); border: 1px solid var(--gray);
      border-radius: 3px; padding: 0.55em 0.7em; font-family: inherit;
      font-size: 0.95em; color: var(--dark);
    }
    .cp-form input::placeholder, .cp-form textarea::placeholder { color: var(--gray); }
    .cp-form textarea { min-height: 200px; resize: vertical; line-height: 1.5; }
    .cp-row { display: flex; gap: 1em; }
    .cp-row > div { flex: 1; }
    .cp-actions-form { display: flex; gap: 0.7em; align-items: center; }
    .cp-btn {
      margin-top: 1em; background: var(--secondary); color: var(--light);
      border: 1px solid var(--secondary); border-radius: 3px;
      padding: 0.6em 1.4em; font-family: inherit; font-variant: small-caps;
      letter-spacing: 0.06em; font-size: 0.95em; cursor: pointer; transition: opacity 0.15s;
    }
    .cp-btn:hover { opacity: 0.85; }
    .cp-btn:disabled { opacity: 0.5; cursor: wait; }
    .cp-btn.ghost { background: transparent; color: var(--secondary); display: none; }
    .cp-btn.ghost:hover { background: var(--highlight); opacity: 1; }
    .cp-msg { margin-top: 0.8em; font-size: 0.88em; min-height: 1.2em; }
    .cp-msg.ok { color: var(--tertiary); }
    .cp-msg.err { color: #c0563f; }

    /* ---- Contrôles ---- */
    .cp-controls {
      display: flex; flex-wrap: wrap; gap: 0.7em; align-items: center;
      margin-bottom: 1.2em; padding-bottom: 0.8em; border-bottom: 1px solid var(--gray);
    }
    .cp-viewtoggle { display: flex; border: 1px solid var(--gray); border-radius: 3px; overflow: hidden; }
    .cp-viewtoggle button {
      background: var(--lightgray); color: var(--secondary); border: none;
      padding: 0.4em 0.9em; font-family: inherit; font-variant: small-caps;
      font-size: 0.85em; letter-spacing: 0.04em; cursor: pointer;
    }
    .cp-viewtoggle button.active { background: var(--secondary); color: var(--light); }
    .cp-controls select, .cp-controls input {
      background: var(--light); border: 1px solid var(--gray); border-radius: 3px;
      padding: 0.4em 0.6em; font-family: inherit; font-size: 0.88em; color: var(--dark);
    }
    .cp-controls .cp-search { flex: 1; min-width: 140px; }
    .cp-controls .cp-search::placeholder { color: var(--gray); }

    /* ---- Tableau ---- */
    .cp-table { width: 100%; border-collapse: collapse; font-size: 0.92em; }
    .cp-table thead th {
      text-align: left; font-variant: small-caps; letter-spacing: 0.04em;
      color: var(--secondary); border-bottom: 2px solid var(--gray);
      padding: 0.5em 0.6em; cursor: pointer; user-select: none; white-space: nowrap;
    }
    .cp-table thead th:last-child { cursor: default; }
    .cp-table thead th:hover[data-sort] { color: var(--dark); }
    .cp-sort { font-size: 0.8em; color: var(--tertiary); }
    .cp-table tbody td { padding: 0.5em 0.6em; border-bottom: 1px solid var(--lightgray); vertical-align: top; }
    .cp-table tbody tr:not(.cp-detail-row):hover { background: var(--highlight); cursor: pointer; }
    .cp-c-title { font-weight: bold; }
    .cp-c-pts { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .cp-c-date { white-space: nowrap; font-style: italic; color: var(--gray); }
    .cp-c-act { text-align: right; width: 1%; white-space: nowrap; }
    .cp-detail-row td { padding: 0; border-bottom: 1px solid var(--lightgray); }
    .cp-detail {
      max-height: 0; overflow: hidden; white-space: pre-wrap; line-height: 1.55;
      padding: 0 0.6em; transition: max-height 0.2s ease, padding 0.2s ease;
    }
    .cp-detail-row.open .cp-detail { max-height: 600px; padding: 0.6em; }
    .cp-hint { font-size: 0.78em; font-style: italic; color: var(--gray); margin: 0 0 0.6em; }

    /* ---- Repliable ---- */
    .cp-coll { border: 1px solid var(--gray); border-left: 4px solid var(--tertiary);
      border-radius: 3px; margin-bottom: 0.6em; background: var(--lightgray); overflow: hidden; }
    .cp-coll-head { display: flex; align-items: center; gap: 0.6em; cursor: pointer; padding: 0.6em 0.9em; }
    .cp-coll-head:hover { background: var(--highlight); }
    .cp-coll-arrow { color: var(--secondary); font-size: 0.8em; }
    .cp-coll-title { font-variant: small-caps; font-weight: bold; flex: 1; color: var(--dark); }
    .cp-coll-meta { font-size: 0.8em; font-style: italic; color: var(--gray); }
    .cp-coll-acts { display: flex; gap: 0.2em; }
    .cp-coll-body { white-space: pre-wrap; line-height: 1.55; padding: 0 0.9em 0.8em 1.9em; font-size: 0.93em; color: var(--dark); }

    /* ---- Boutons action ---- */
    .cp-del, .cp-edit {
      background: none; border: 1px solid transparent; cursor: pointer;
      font-size: 0.95em; line-height: 1; padding: 0.15em 0.4em; border-radius: 3px;
    }
    .cp-del { color: #c0563f; }
    .cp-del:hover { background: #c0563f; color: var(--light); }
    .cp-edit { color: var(--secondary); }
    .cp-edit:hover { background: var(--secondary); color: var(--light); }

    .cp-empty { font-style: italic; color: var(--gray); }
  </style>

  <h2>Listes d'armées</h2>

  <!-- Formulaire -->
  <div class="cp-form">
    <div class="cp-form-mode" id="cp-form-mode"></div>
    <div class="cp-row">
      <div>
        <label for="cp-author">Auteur / Joueur</label>
        <input id="cp-author" type="text" placeholder="Ton nom" />
      </div>
      <div>
        <label for="cp-faction">Faction</label>
        <select id="cp-faction"><option value="">— faction —</option></select>
      </div>
      <div>
        <label for="cp-points">Coût (points)</label>
        <input id="cp-points" type="number" min="0" step="1" placeholder="ex. 1500" />
      </div>
    </div>
    <label for="cp-title">Titre de la liste</label>
    <input id="cp-title" type="text" placeholder="ex. Avant-garde du Crepuscule" />
    <label for="cp-body">Liste (markdown libre)</label>
    <textarea id="cp-body" placeholder="- 1 Champion&#10;- 3 Lanciers&#10;- ..."></textarea>
    <div class="cp-actions-form">
      <button class="cp-btn" id="cp-submit">Publier la liste</button>
      <button class="cp-btn ghost" id="cp-cancel-edit">Annuler</button>
    </div>
    <div class="cp-msg" id="cp-msg"></div>
  </div>

  <!-- Contrôles -->
  <div class="cp-controls">
    <div class="cp-viewtoggle">
      <button id="cp-view-table">Tableau</button>
      <button id="cp-view-collapse">Repliable</button>
    </div>
    <select id="cp-filter-faction"><option value="">Toutes les factions</option></select>
    <input class="cp-search" id="cp-search" type="text" placeholder="Rechercher..." />
  </div>

  <div id="cp-lists"><p class="cp-empty">Chargement…</p></div>
</div>

<script type="module" src="/quartz/static/cp-army-lists.js"></script>