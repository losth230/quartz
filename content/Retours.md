<!-- ============================================================
     Page Quartz : content/Wargame/Signalements.md
     HTML + CSS SPÉCIFIQUE. Commun dans /quartz/static/cp-common.css,
     JS dans /quartz/static/cp-bug-tracker.js (chargés via Head.tsx).
     ============================================================ -->

<div id="cp-bug-app">
  <style>
    /* --- Spécifique au suivi des signalements --- */
    #cp-bug-app .cp-intro { font-size: 0.9em; color: var(--gray); font-style: italic; margin-bottom: 1.2em; }
    .cp-c-state { width: 1%; white-space: nowrap; }
    .cp-c-page a { color: var(--secondary); }

    /* Vue repliable : contenu spécifique */
    .cp-coll-body { padding: 0.2em 0.9em 0.8em 1.9em; }
    .cp-coll-desc { white-space: pre-wrap; line-height: 1.55; font-size: 0.93em; color: var(--dark); margin-bottom: 0.6em; }
    .cp-coll-foot { display: flex; flex-wrap: wrap; gap: 0.8em; align-items: center; font-size: 0.82em; color: var(--gray); }
    .cp-coll-pagelink a { color: var(--secondary); }

    /* États : sélecteur coloré */
    .cp-status-sel {
      font-family: inherit; font-size: 0.82em; border-radius: 3px;
      border: 1px solid var(--gray); padding: 0.2em 0.4em; cursor: pointer;
      background: var(--light); color: var(--dark);
    }
    .st-poste   { color: #2f72b5; }   /* bleu  : posté */
    .st-encours { color: #b59024; }   /* jaune : en cours */
    .st-traite  { color: #3a8a4a; }   /* vert  : traité */
    .st-refuse  { color: #b5524a; }   /* rouge : refusé */
    .cp-status-sel.st-poste   { border-color: #2f72b5; }
    .cp-status-sel.st-encours { border-color: #b59024; }
    .cp-status-sel.st-traite  { border-color: #3a8a4a; }
    .cp-status-sel.st-refuse  { border-color: #b5524a; }

    /* Types de retour (badges) */
    .ty-bug         { color: #b5524a; }
    .ty-equilibrage { color: #8a5cb5; }
    .ty-idee        { color: #3a8a4a; }
    .ty-regle       { color: #2f72b5; }
    .ty-autre       { color: var(--gray); }

    /* Fonds pastel des lignes/cartes par statut */
    .cp-row-st-poste, .cp-row-st-poste + .cp-detail-row {
      background: color-mix(in srgb, #2f72b5 12%, var(--light));
    }
    .cp-row-st-encours, .cp-row-st-encours + .cp-detail-row {
      background: color-mix(in srgb, #b59024 14%, var(--light));
    }
    .cp-row-st-traite, .cp-row-st-traite + .cp-detail-row {
      background: color-mix(in srgb, #3a8a4a 13%, var(--light));
    }
    .cp-row-st-refuse, .cp-row-st-refuse + .cp-detail-row {
      background: color-mix(in srgb, #b5524a 13%, var(--light));
    }
    .cp-table tbody tr.cp-row-st-poste:hover   { background: color-mix(in srgb, #2f72b5 20%, var(--light)); }
    .cp-table tbody tr.cp-row-st-encours:hover { background: color-mix(in srgb, #b59024 22%, var(--light)); }
    .cp-table tbody tr.cp-row-st-traite:hover  { background: color-mix(in srgb, #3a8a4a 21%, var(--light)); }
    .cp-table tbody tr.cp-row-st-refuse:hover  { background: color-mix(in srgb, #b5524a 21%, var(--light)); }
    .cp-coll.cp-row-st-poste   { background: color-mix(in srgb, #2f72b5 10%, var(--lightgray)); }
    .cp-coll.cp-row-st-encours { background: color-mix(in srgb, #b59024 12%, var(--lightgray)); }
    .cp-coll.cp-row-st-traite  { background: color-mix(in srgb, #3a8a4a 11%, var(--lightgray)); }
    .cp-coll.cp-row-st-refuse  { background: color-mix(in srgb, #b5524a 11%, var(--lightgray)); }
    .cp-coll-head:hover { filter: brightness(0.97); }

    /* Panneau d'édition en ligne */
    .cp-edit-panel { padding: 0.8em; }
    .cp-edit-panel label {
      display: block; font-variant: small-caps; font-size: 0.78em;
      letter-spacing: 0.05em; color: var(--secondary); margin: 0.5em 0 0.2em;
    }
    .cp-edit-panel input, .cp-edit-panel textarea {
      width: 100%; box-sizing: border-box; background: var(--light);
      border: 1px solid var(--gray); border-radius: 3px;
      padding: 0.45em 0.6em; font-family: inherit; font-size: 0.9em; color: var(--dark);
    }
    .cp-edit-panel textarea { min-height: 90px; resize: vertical; line-height: 1.5; }
    .cp-edit-actions { display: flex; gap: 0.6em; margin-top: 0.7em; }
    .cp-edit-actions button {
      border: 1px solid var(--gray); border-radius: 3px; padding: 0.4em 1em;
      font-family: inherit; font-variant: small-caps; font-size: 0.85em;
      letter-spacing: 0.04em; cursor: pointer;
    }
    .cp-edit-save { background: var(--secondary); color: var(--light); border-color: var(--secondary); }
    .cp-edit-save:hover { opacity: 0.88; }
    .cp-edit-cancel { background: transparent; color: var(--secondary); }
    .cp-edit-cancel:hover { background: var(--highlight); }
  </style>

  <h2>Signalements</h2>
  <p class="cp-intro">Tous les retours remontés par les joueurs. Clique une ligne pour lire le détail, le crayon pour modifier, le menu pour changer l'état.</p>

  <!-- Contrôles -->
  <div class="cp-controls">
    <div class="cp-viewtoggle">
      <button id="cp-bug-view-table">Tableau</button>
      <button id="cp-bug-view-collapse">Repliable</button>
    </div>
    <select id="cp-bug-filter-status">
      <option value="">Tous les états</option>
      <option value="poste">Posté</option>
      <option value="en_cours">En cours</option>
      <option value="traite">Traité</option>
      <option value="refuse">Refusé</option>
    </select>
    <select id="cp-bug-filter-type">
      <option value="">Tous les types</option>
      <option value="bug">Bug</option>
      <option value="equilibrage">Équilibrage</option>
      <option value="idee">Idée</option>
      <option value="regle">Règle peu claire</option>
      <option value="autre">Autre</option>
    </select>
    <input class="cp-search" id="cp-bug-search" type="text" placeholder="Rechercher..." />
  </div>

  <div id="cp-bug-list"><p class="cp-empty">Chargement…</p></div>
</div>