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

<script type="module">
  import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

  // ⬇️⬇️ REMPLACE CES DEUX VALEURS ⬇️⬇️
  const SUPABASE_URL = "https://kucgmmefluwmlobujanc.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_YB_VCzZgD2vi4xeFvFT6ZA_BA9Pwn7R";
  // ⬆️⬆️ ----------------------------- ⬆️⬆️

  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const $ = (id) => document.getElementById(id);
  const msg = $("cp-msg");
  const listsEl = $("cp-lists");

  function esc(s) {
    return (s || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  async function loadLists() {
    const { data, error } = await sb
      .from("army_lists")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      listsEl.innerHTML = `<p class="cp-empty">Erreur de chargement : ${esc(error.message)}</p>`;
      return;
    }
    if (!data.length) {
      listsEl.innerHTML = `<p class="cp-empty">Aucune liste pour l'instant. Sois le premier !</p>`;
      return;
    }
    listsEl.innerHTML = data.map((l) => {
      const date = new Date(l.created_at).toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric"
      });
      const fac = l.faction ? ` — ${esc(l.faction)}` : "";
      return `<div class="cp-card">
        <h3>${esc(l.title)}${fac}</h3>
        <div class="cp-meta">Par ${esc(l.author)} · ${date}</div>
        <div class="cp-body">${esc(l.body)}</div>
      </div>`;
    }).join("");
  }

  $("cp-submit").addEventListener("click", async () => {
    const author = $("cp-author").value.trim() || "Anonyme";
    const faction = $("cp-faction").value.trim() || null;
    const title = $("cp-title").value.trim();
    const body = $("cp-body").value.trim();

    msg.className = "cp-msg";
    msg.textContent = "";

    if (!title || !body) {
      msg.className = "cp-msg err";
      msg.textContent = "Le titre et la liste sont requis.";
      return;
    }

    const btn = $("cp-submit");
    btn.disabled = true;

    const { error } = await sb.from("army_lists").insert({ author, faction, title, body });

    btn.disabled = false;

    if (error) {
      msg.className = "cp-msg err";
      msg.textContent = "Échec de publication : " + error.message;
      return;
    }
    msg.className = "cp-msg ok";
    msg.textContent = "Liste publiée !";
    $("cp-title").value = "";
    $("cp-body").value = "";
    loadLists();
  });

  loadLists();
</script>