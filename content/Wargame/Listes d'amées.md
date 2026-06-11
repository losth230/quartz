<!-- ============================================================ Page Quartz : content/Wargame/Listes-d-armées.md HTML + CSS uniquement. JS dans /quartz/static/cp-army-lists.js ============================================================ --> <div id="cp-army-app"> <style> #cp-army-app { --cp-ink: #2b2520; --cp-parch: #f4ecdd; --cp-parch-deep: #e8dcc6; --cp-border: #8a7a5c; --cp-accent: #6b3f2a; --cp-gold: #b08d3f; font-family: Georgia, "Times New Roman", serif; color: var(--cp-ink); max-width: 920px; margin: 0 auto; } #cp-army-app * { box-sizing: border-box; } #cp-army-app h2 { font-variant: small-caps; letter-spacing: 0.04em; border-bottom: 2px solid var(--cp-border); padding-bottom: 0.3em; }

```
/* ---- Formulaire ---- */
.cp-form {
  background: var(--cp-parch); border: 1px solid var(--cp-border);
  border-radius: 4px; padding: 1.2em 1.4em; margin-bottom: 2em;
  box-shadow: inset 0 0 30px rgba(138,122,92,0.12);
}
.cp-form-mode {
  font-variant: small-caps; font-size: 0.82em; letter-spacing: 0.05em;
  color: var(--cp-gold); font-weight: bold; min-height: 1em;
}
.cp-form label {
  display: block; font-variant: small-caps; font-size: 0.85em;
  letter-spacing: 0.05em; color: var(--cp-accent); margin: 0.8em 0 0.3em;
}
.cp-form input, .cp-form textarea {
  width: 100%; background: #fffdf8; border: 1px solid var(--cp-border);
  border-radius: 3px; padding: 0.55em 0.7em; font-family: inherit;
  font-size: 0.95em; color: var(--cp-ink);
}
.cp-form textarea { min-height: 200px; resize: vertical; line-height: 1.5; }
.cp-row { display: flex; gap: 1em; }
.cp-row > div { flex: 1; }
.cp-actions-form { display: flex; gap: 0.7em; align-items: center; }
.cp-btn {
  margin-top: 1em; background: var(--cp-accent); color: var(--cp-parch);
  border: 1px solid var(--cp-border); border-radius: 3px;
  padding: 0.6em 1.4em; font-family: inherit; font-variant: small-caps;
  letter-spacing: 0.06em; font-size: 0.95em; cursor: pointer; transition: background 0.15s;
}
.cp-btn:hover { background: #7d4c33; }
.cp-btn:disabled { opacity: 0.5; cursor: wait; }
.cp-btn.ghost { background: transparent; color: var(--cp-accent); display: none; }
.cp-btn.ghost:hover { background: var(--cp-parch-deep); }
.cp-msg { margin-top: 0.8em; font-size: 0.88em; min-height: 1.2em; }
.cp-msg.ok { color: #3a6b2a; }
.cp-msg.err { color: #9a3324; }

/* ---- Contrôles ---- */
.cp-controls {
  display: flex; flex-wrap: wrap; gap: 0.7em; align-items: center;
  margin-bottom: 1.2em; padding-bottom: 0.8em; border-bottom: 1px solid var(--cp-border);
}
.cp-viewtoggle { display: flex; border: 1px solid var(--cp-border); border-radius: 3px; overflow: hidden; }
.cp-viewtoggle button {
  background: var(--cp-parch); color: var(--cp-accent); border: none;
  padding: 0.4em 0.9em; font-family: inherit; font-variant: small-caps;
  font-size: 0.85em; letter-spacing: 0.04em; cursor: pointer;
}
.cp-viewtoggle button.active { background: var(--cp-accent); color: var(--cp-parch); }
.cp-controls select, .cp-controls input {
  background: #fffdf8; border: 1px solid var(--cp-border); border-radius: 3px;
  padding: 0.4em 0.6em; font-family: inherit; font-size: 0.88em; color: var(--cp-ink);
}
.cp-controls .cp-search { flex: 1; min-width: 140px; }

/* ---- Tableau ---- */
.cp-table { width: 100%; border-collapse: collapse; font-size: 0.92em; }
.cp-table thead th {
  text-align: left; font-variant: small-caps; letter-spacing: 0.04em;
  color: var(--cp-accent); border-bottom: 2px solid var(--cp-border);
  padding: 0.5em 0.6em; cursor: pointer; user-select: none; white-space: nowrap;
}
.cp-table thead th:last-child { cursor: default; }
.cp-table thead th:hover[data-sort] { color: var(--cp-ink); }
.cp-sort { font-size: 0.8em; color: var(--cp-gold); }
.cp-table tbody td { padding: 0.5em 0.6em; border-bottom: 1px solid var(--cp-parch-deep); vertical-align: top; }
.cp-table tbody tr:not(.cp-detail-row):hover { background: var(--cp-parch-deep); cursor: pointer; }
.cp-c-title { font-weight: bold; }
.cp-c-pts { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.cp-c-date { white-space: nowrap; font-style: italic; color: var(--cp-accent); }
.cp-c-act { text-align: right; width: 1%; white-space: nowrap; }
.cp-detail-row td { padding: 0; border-bottom: 1px solid var(--cp-parch-deep); }
.cp-detail {
  max-height: 0; overflow: hidden; white-space: pre-wrap; line-height: 1.55;
  padding: 0 0.6em; transition: max-height 0.2s ease, padding 0.2s ease;
}
.cp-detail-row.open .cp-detail { max-height: 600px; padding: 0.6em; }
.cp-hint { font-size: 0.78em; font-style: italic; color: var(--cp-accent); margin-top: 0.5em; }

/* ---- Repliable ---- */
.cp-coll { border: 1px solid var(--cp-border); border-left: 4px solid var(--cp-gold);
  border-radius: 3px; margin-bottom: 0.6em; background: var(--cp-parch); overflow: hidden; }
.cp-coll-head { display: flex; align-items: center; gap: 0.6em; cursor: pointer;
  padding: 0.6em 0.9em; }
.cp-coll-head:hover { background: var(--cp-parch-deep); }
.cp-coll-arrow { color: var(--cp-accent); font-size: 0.8em; }
.cp-coll-title { font-variant: small-caps; font-weight: bold; flex: 1; }
.cp-coll-meta { font-size: 0.8em; font-style: italic; color: var(--cp-accent); }
.cp-coll-acts { display: flex; gap: 0.2em; }
.cp-coll-body { white-space: pre-wrap; line-height: 1.55; padding: 0 0.9em 0.8em 1.9em; font-size: 0.93em; }

/* ---- Boutons action (commun) ---- */
.cp-del, .cp-edit {
  background: none; border: 1px solid transparent; cursor: pointer;
  font-size: 0.95em; line-height: 1; padding: 0.15em 0.4em; border-radius: 3px;
}
.cp-del { color: #9a3324; }
.cp-del:hover { background: #9a3324; color: #f4ecdd; }
.cp-edit { color: var(--cp-accent); }
.cp-edit:hover { background: var(--cp-accent); color: #f4ecdd; }

.cp-empty { font-style: italic; color: var(--cp-accent); }
```

</style> <h2>Listes d'armées</h2> <!-- Formulaire --> <div class="cp-form"> <div class="cp-form-mode" id="cp-form-mode"></div> <div class="cp-row"> <div> <label for="cp-author">Auteur / Joueur</label> <input id="cp-author" type="text" placeholder="Ton nom" /> </div> <div> <label for="cp-faction">Faction</label> <input id="cp-faction" type="text" placeholder="ex. Thraksans" /> </div> <div> <label for="cp-points">Coût (points)</label> <input id="cp-points" type="number" min="0" step="1" placeholder="ex. 1500" /> </div> </div> <label for="cp-title">Titre de la liste</label> <input id="cp-title" type="text" placeholder="ex. Avant-garde du Crepuscule" /> <label for="cp-body">Liste (markdown libre)</label> <textarea id="cp-body" placeholder="- 1 Champion&#10;- 3 Lanciers&#10;- ..."></textarea> <div class="cp-actions-form"> <button class="cp-btn" id="cp-submit">Publier la liste</button> <button class="cp-btn ghost" id="cp-cancel-edit">Annuler</button> </div> <div class="cp-msg" id="cp-msg"></div> </div> <!-- Contrôles --> <div class="cp-controls"> <div class="cp-viewtoggle"> <button id="cp-view-table">Tableau</button> <button id="cp-view-collapse">Repliable</button> </div> <select id="cp-filter-faction"><option value="">Toutes les factions</option></select> <input class="cp-search" id="cp-search" type="text" placeholder="Rechercher..." /> </div> <div id="cp-lists"><p class="cp-empty">Chargement…</p></div> </div> <script type="module" src="/quartz/static/cp-army-lists.js"></script>