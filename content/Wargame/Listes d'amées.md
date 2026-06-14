<!-- ============================================================
     Page Quartz : content/Wargame/Listes-d-armées.md
     HTML + CSS SPÉCIFIQUE uniquement. Le CSS commun est dans
     /quartz/static/cp-common.css (chargé via Head.tsx).
     Le JS est dans /quartz/static/cp-army-lists.js (chargé via Head.tsx).
     ============================================================ -->

<div id="cp-army-app">
  <style>
    /* --- Spécifique aux listes d'armées --- */
    #cp-army-app { max-width: 920px; }
    .cp-form-mode {
      font-variant: small-caps; font-size: 0.82em; letter-spacing: 0.05em;
      color: var(--tertiary); font-weight: bold; min-height: 1em;
    }
    .cp-actions-form { display: flex; gap: 0.7em; align-items: center; }
    #cp-cancel-edit { display: none; }  /* affiché par le JS en mode édition */
    .cp-c-title { font-weight: bold; }
    .cp-c-pts { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
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
        <input id="cp-points" type="number" min="0" step="1" placeholder="ex. 300" />
      </div>
      <div>
        <label for="cp-version">Version</label>
        <select id="cp-version"><option value="">— version —</option></select>
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