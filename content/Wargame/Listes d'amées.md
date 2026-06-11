<!-- ============================================================
     C&P — Listes d'armées (widget Supabase autonome)
     À coller dans une page Quartz dédiée.
     Remplace SUPABASE_URL et SUPABASE_ANON_KEY ci-dessous.
     ============================================================ -->

<div id="cp-army-app">
  <style>
    #cp-army-app {
      --cp-ink: #2b2520;
      --cp-parch: #f4ecdd;
      --cp-parch-deep: #e8dcc6;
      --cp-border: #8a7a5c;
      --cp-accent: #6b3f2a;
      --cp-gold: #b08d3f;
      font-family: Georgia, "Times New Roman", serif;
      color: var(--cp-ink);
      max-width: 820px;
      margin: 0 auto;
    }
    #cp-army-app * { box-sizing: border-box; }
    #cp-army-app h2 {
      font-variant: small-caps;
      letter-spacing: 0.04em;
      border-bottom: 2px solid var(--cp-border);
      padding-bottom: 0.3em;
    }
    .cp-form {
      background: var(--cp-parch);
      border: 1px solid var(--cp-border);
      border-radius: 4px;
      padding: 1.2em 1.4em;
      margin-bottom: 2em;
      box-shadow: inset 0 0 30px rgba(138,122,92,0.12);
    }
    .cp-form label {
      display: block;
      font-variant: small-caps;
      font-size: 0.85em;
      letter-spacing: 0.05em;
      color: var(--cp-accent);
      margin: 0.8em 0 0.3em;
    }
    .cp-form input, .cp-form textarea {
      width: 100%;
      background: #fffdf8;
      border: 1px solid var(--cp-border);
      border-radius: 3px;
      padding: 0.55em 0.7em;
      font-family: inherit;
      font-size: 0.95em;
      color: var(--cp-ink);
    }
    .cp-form textarea { min-height: 200px; resize: vertical; line-height: 1.5; }
    .cp-row { display: flex; gap: 1em; }
    .cp-row > div { flex: 1; }
    .cp-btn {
      margin-top: 1em;
      background: var(--cp-accent);
      color: var(--cp-parch);
      border: 1px solid var(--cp-border);
      border-radius: 3px;
      padding: 0.6em 1.4em;
      font-family: inherit;
      font-variant: small-caps;
      letter-spacing: 0.06em;
      font-size: 0.95em;
      cursor: pointer;
      transition: background 0.15s;
    }
    .cp-btn:hover { background: #7d4c33; }
    .cp-btn:disabled { opacity: 0.5; cursor: wait; }
    .cp-msg { margin-top: 0.8em; font-size: 0.88em; min-height: 1.2em; }
    .cp-msg.ok { color: #3a6b2a; }
    .cp-msg.err { color: #9a3324; }

    .cp-card {
      background: var(--cp-parch);
      border: 1px solid var(--cp-border);
      border-left: 4px solid var(--cp-gold);
      border-radius: 3px;
      padding: 1em 1.3em;
      margin-bottom: 1.2em;
    }
    .cp-card h3 { margin: 0 0 0.2em; font-variant: small-caps; }
    .cp-meta { font-size: 0.82em; color: var(--cp-accent); margin-bottom: 0.6em; font-style: italic; }
    .cp-body { white-space: pre-wrap; line-height: 1.55; font-size: 0.95em; }
    .cp-empty { font-style: italic; color: var(--cp-accent); }
  </style>

  <h2>Listes d'armées</h2>

  <div class="cp-form">
    <div class="cp-row">
      <div>
        <label for="cp-author">Auteur / Joueur</label>
        <input id="cp-author" type="text" placeholder="Ton nom" />
      </div>
      <div>
        <label for="cp-faction">Faction</label>
        <input id="cp-faction" type="text" placeholder="ex. Thraksans" />
      </div>
    </div>
    <label for="cp-title">Titre de la liste</label>
    <input id="cp-title" type="text" placeholder="ex. Avant-garde du Crépuscule" />
    <label for="cp-body">Liste (markdown libre)</label>
    <textarea id="cp-body" placeholder="- 1 Champion&#10;- 3 Lanciers&#10;- ..."></textarea>
    <button class="cp-btn" id="cp-submit">Publier la liste</button>
    <div class="cp-msg" id="cp-msg"></div>
  </div>

  <div id="cp-lists"><p class="cp-empty">Chargement…</p></div>
</div>

<script type="module" src="/static/cp-army-lists.js"></script>