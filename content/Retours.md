<!-- ============================================================ Page Quartz : content/Retours.md Suivi des retours. HTML + CSS (variables Quartz). JS dans /quartz/static/cp-bug-tracker.js ============================================================ --> 

<div id="cp-bug-app"> <style> #cp-bug-app { font-family: Georgia, "Times New Roman", serif; color: var(--dark); max-width: 920px; margin: 0 auto; } #cp-bug-app * { box-sizing: border-box; } #cp-bug-app h2 { font-variant: small-caps; letter-spacing: 0.04em; color: var(--dark); border-bottom: 2px solid var(--gray); padding-bottom: 0.3em; } #cp-bug-app .cp-intro { font-size: 0.9em; color: var(--gray); font-style: italic; margin-bottom: 1.2em; }

```
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
.cp-table thead th:hover[data-sort] { color: var(--dark); }
.cp-sort { font-size: 0.8em; color: var(--tertiary); }
.cp-table tbody td { padding: 0.5em 0.6em; border-bottom: 1px solid var(--lightgray); vertical-align: top; }
.cp-table tbody tr:not(.cp-detail-row) { cursor: pointer; }
.cp-c-state { width: 1%; white-space: nowrap; }
.cp-c-page a { color: var(--secondary); }
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
.cp-coll-head:hover { filter: brightness(0.97); }
.cp-coll-arrow { color: var(--secondary); font-size: 0.8em; }
.cp-coll-title { font-variant: small-caps; font-weight: bold; flex: 1; color: var(--dark); }
.cp-coll-meta { font-size: 0.8em; font-style: italic; color: var(--gray); }
.cp-coll-body { padding: 0.2em 0.9em 0.8em 1.9em; }
.cp-coll-desc { white-space: pre-wrap; line-height: 1.55; font-size: 0.93em; color: var(--dark); margin-bottom: 0.6em; }
.cp-coll-foot { display: flex; flex-wrap: wrap; gap: 0.8em; align-items: center; font-size: 0.82em; color: var(--gray); }
.cp-coll-pagelink a { color: var(--secondary); }

/* ---- États : badges + selects colorés ---- */
.cp-badge {
  font-size: 0.72em; font-variant: small-caps; letter-spacing: 0.04em;
  padding: 0.15em 0.55em; border-radius: 999px; border: 1px solid currentColor; white-space: nowrap;
}
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

/* ---- Fonds pastel des lignes/cartes par statut ---- */
/* color-mix garde le pastel lisible en clair ET en sombre en mélangeant
   la teinte avec le fond courant de la page. */
.cp-row-st-poste,
.cp-row-st-poste + .cp-detail-row {
  background: color-mix(in srgb, #2f72b5 12%, var(--light));
}
.cp-row-st-encours,
.cp-row-st-encours + .cp-detail-row {
  background: color-mix(in srgb, #b59024 14%, var(--light));
}
.cp-row-st-traite,
.cp-row-st-traite + .cp-detail-row {
  background: color-mix(in srgb, #3a8a4a 13%, var(--light));
}
.cp-row-st-refuse,
.cp-row-st-refuse + .cp-detail-row {
  background: color-mix(in srgb, #b5524a 13%, var(--light));
}
/* survol : on fonce légèrement la teinte */
.cp-table tbody tr.cp-row-st-poste:hover   { background: color-mix(in srgb, #2f72b5 20%, var(--light)); }
.cp-table tbody tr.cp-row-st-encours:hover { background: color-mix(in srgb, #b59024 22%, var(--light)); }
.cp-table tbody tr.cp-row-st-traite:hover  { background: color-mix(in srgb, #3a8a4a 21%, var(--light)); }
.cp-table tbody tr.cp-row-st-refuse:hover  { background: color-mix(in srgb, #b5524a 21%, var(--light)); }
/* cartes repliables : teinte aussi le fond global de la carte */
.cp-coll.cp-row-st-poste   { background: color-mix(in srgb, #2f72b5 10%, var(--lightgray)); }
.cp-coll.cp-row-st-encours { background: color-mix(in srgb, #b59024 12%, var(--lightgray)); }
.cp-coll.cp-row-st-traite  { background: color-mix(in srgb, #3a8a4a 11%, var(--lightgray)); }
.cp-coll.cp-row-st-refuse  { background: color-mix(in srgb, #b5524a 11%, var(--lightgray)); }

/* ---- Panneau d'édition en ligne ---- */
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

.cp-edit {
  background: none; border: 1px solid transparent; color: var(--secondary);
  cursor: pointer; font-size: 0.95em; line-height: 1; padding: 0.15em 0.4em; border-radius: 3px;
}
.cp-edit:hover { background: var(--secondary); color: var(--light); }

.cp-empty { font-style: italic; color: var(--gray); }
```

</style> <h2>Signalements</h2> <p class="cp-intro">Tous les problèmes remontés par les joueurs. Clique une ligne pour lire le détail, le crayon pour modifier, le menu pour changer l'état.</p> <!-- Contrôles --> <div class="cp-controls"> <div class="cp-viewtoggle"> <button id="cp-bug-view-table">Tableau</button> <button id="cp-bug-view-collapse">Repliable</button> </div> <select id="cp-bug-filter-status"> <option value="">Tous les états</option> <option value="poste">Posté</option> <option value="en_cours">En cours</option> <option value="traite">Traité</option> <option value="refuse">Refusé</option> </select> <input class="cp-search" id="cp-bug-search" type="text" placeholder="Rechercher..." /> </div> <div id="cp-bug-list"><p class="cp-empty">Chargement…</p></div> </div>