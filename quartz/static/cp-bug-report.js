// ============================================================
//  C&P — Suivi des signalements (page de visualisation)
//  À placer dans : quartz/static/cp-bug-tracker.js
//  Affiche tous les signalements, vues tableau / repliable,
//  filtres, et changement d'état (poste / en_cours / traite / refuse).
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ⬇️⬇️ REMPLACE CES DEUX VALEURS ⬇️⬇️
const SUPABASE_URL = "https://kucgmmefluwmlobujanc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_YB_VCzZgD2vi4xeFvFT6ZA_BA9Pwn7R";
// ⬆️⬆️ ----------------------------- ⬆️⬆️

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
 
// URL de la page de suivi
const TRACKER_URL = "/quartz/Retours";
 
function injectStyles() {
  if (document.getElementById("cp-bug-styles")) return;
  const css = `
    #cp-bug-fab {
      position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999;
      width: 3.2rem; height: 3.2rem; border-radius: 50%;
      background: var(--secondary, #6b3f2a); color: var(--light, #f4ecdd);
      border: 1px solid var(--gray, #8a7a5c);
      box-shadow: 0 3px 10px rgba(0,0,0,0.3);
      font-family: Georgia, serif; font-size: 1.4rem;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: transform 0.15s, opacity 0.15s;
    }
    #cp-bug-fab:hover { opacity: 0.88; transform: scale(1.05); }
    #cp-bug-overlay {
      position: fixed; inset: 0; z-index: 10000;
      background: rgba(20,16,12,0.55);
      display: none; align-items: center; justify-content: center;
    }
    #cp-bug-overlay.open { display: flex; }
    #cp-bug-modal {
      background: var(--lightgray, #f4ecdd); color: var(--dark, #2b2520);
      border: 1px solid var(--gray, #8a7a5c); border-radius: 5px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.4);
      width: min(420px, 92vw); padding: 1.4em 1.6em;
      font-family: Georgia, "Times New Roman", serif;
    }
    #cp-bug-modal h3 {
      margin: 0 0 0.6em; font-variant: small-caps; letter-spacing: 0.04em;
      color: var(--dark, #2b2520);
      border-bottom: 2px solid var(--gray, #8a7a5c); padding-bottom: 0.3em;
    }
    #cp-bug-modal label {
      display: block; font-variant: small-caps; font-size: 0.82em;
      letter-spacing: 0.05em; color: var(--secondary, #6b3f2a); margin: 0.7em 0 0.25em;
    }
    #cp-bug-modal input, #cp-bug-modal textarea, #cp-bug-modal select {
      width: 100%; box-sizing: border-box; background: var(--light, #fffdf8);
      border: 1px solid var(--gray, #8a7a5c); border-radius: 3px;
      padding: 0.5em 0.65em; font-family: inherit; font-size: 0.92em; color: var(--dark, #2b2520);
    }
    #cp-bug-modal textarea { min-height: 110px; resize: vertical; line-height: 1.5; }
    #cp-bug-page {
      font-size: 0.8em; color: var(--secondary, #6b3f2a); font-style: italic;
      margin: 0.7em 0 0; word-break: break-all;
    }
    .cp-bug-actions { display: flex; gap: 0.6em; margin-top: 1.1em; }
    .cp-bug-btn {
      flex: 1; border: 1px solid var(--gray, #8a7a5c); border-radius: 3px;
      padding: 0.55em 1em; font-family: inherit; font-variant: small-caps;
      letter-spacing: 0.05em; font-size: 0.9em; cursor: pointer;
    }
    .cp-bug-btn.primary { background: var(--secondary, #6b3f2a); color: var(--light, #f4ecdd); }
    .cp-bug-btn.primary:hover { opacity: 0.88; }
    .cp-bug-btn.primary:disabled { opacity: 0.5; cursor: wait; }
    .cp-bug-btn.ghost { background: transparent; color: var(--secondary, #6b3f2a); }
    #cp-bug-link {
      display: block; margin-top: 0.9em; font-size: 0.8em; text-align: center;
      color: var(--secondary, #6b3f2a);
    }
    .cp-bug-msg { margin-top: 0.7em; font-size: 0.85em; min-height: 1.1em; }
    .cp-bug-msg.ok { color: var(--tertiary, #3a6b2a); }
    .cp-bug-msg.err { color: #c0563f; }
  `;
  const style = document.createElement("style");
  style.id = "cp-bug-styles";
  style.textContent = css;
  document.head.appendChild(style);
}
 
function buildUI() {
  const fab = document.createElement("button");
  fab.id = "cp-bug-fab";
  fab.title = "Signaler un problème sur cette page";
  fab.setAttribute("aria-label", "Signaler un problème");
  fab.textContent = "\u2691"; // ⚑
 
  const overlay = document.createElement("div");
  overlay.id = "cp-bug-overlay";
  overlay.innerHTML = `
    <div id="cp-bug-modal" role="dialog" aria-modal="true">
      <h3>Envoyer un retour</h3>
      <label for="cp-bug-name">Ton nom</label>
      <input id="cp-bug-name" type="text" placeholder="Anonyme" />
      <label for="cp-bug-type">Type de retour</label>
      <select id="cp-bug-type">
        <option value="">— choisir —</option>
        <option value="bug">Bug</option>
        <option value="equilibrage">Équilibrage</option>
        <option value="idee">Idée d'amélioration</option>
        <option value="regle">Règle peu claire</option>
        <option value="autre">Autre</option>
      </select>
      <label for="cp-bug-desc">Description</label>
      <textarea id="cp-bug-desc" placeholder="Decris ton retour sur cette page..."></textarea>
      <p id="cp-bug-page"></p>
      <div class="cp-bug-msg" id="cp-bug-msg"></div>
      <div class="cp-bug-actions">
        <button class="cp-bug-btn ghost" id="cp-bug-cancel">Annuler</button>
        <button class="cp-bug-btn primary" id="cp-bug-send">Envoyer</button>
      </div>
      <a id="cp-bug-link" href="${TRACKER_URL}">Voir tous les signalements →</a>
    </div>
  `;
 
  document.body.appendChild(fab);
  document.body.appendChild(overlay);
  return { fab, overlay };
}
 
function wire(fab, overlay) {
  const $ = (id) => document.getElementById(id);
  const msg = $("cp-bug-msg");
  const pageEl = $("cp-bug-page");
 
  function currentPage() {
    return { url: window.location.href, title: document.title || window.location.pathname };
  }
  function open() {
    const p = currentPage();
    pageEl.textContent = "Page : " + p.title;
    msg.textContent = ""; msg.className = "cp-bug-msg";
    $("cp-bug-type").value = "";
    overlay.classList.add("open");
    $("cp-bug-name").focus();
  }
  function close() { overlay.classList.remove("open"); }
 
  fab.addEventListener("click", open);
  $("cp-bug-cancel").addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) close();
  });
 
  $("cp-bug-send").addEventListener("click", async () => {
    const reporter = $("cp-bug-name").value.trim() || "Anonyme";
    const type = $("cp-bug-type").value;
    const description = $("cp-bug-desc").value.trim();
    const p = currentPage();
 
    msg.className = "cp-bug-msg";
    if (!type) {
      msg.className = "cp-bug-msg err";
      msg.textContent = "Choisis un type de retour.";
      return;
    }
    if (!description) {
      msg.className = "cp-bug-msg err";
      msg.textContent = "La description est requise.";
      return;
    }
    const btn = $("cp-bug-send");
    btn.disabled = true;
    const { error } = await sb.from("bug_reports").insert({
      reporter, type, page_url: p.url, page_title: p.title, description,
      // status laissé à sa valeur par défaut 'poste'
    });
    btn.disabled = false;
    if (error) {
      msg.className = "cp-bug-msg err";
      msg.textContent = "Echec de l'envoi : " + error.message;
      return;
    }
    msg.className = "cp-bug-msg ok";
    msg.textContent = "Merci ! Retour envoye.";
    $("cp-bug-desc").value = "";
    $("cp-bug-type").value = "";
    setTimeout(close, 1200);
  });
}
 
function init() {
  // Le body peut ne pas être prêt si le script s'exécute trop tôt
  // (module dans le <head>). On reporte alors à plus tard.
  if (!document.body) {
    document.addEventListener("DOMContentLoaded", init, { once: true });
    return;
  }
  if (document.getElementById("cp-bug-fab")) return;
  injectStyles();
  const { fab, overlay } = buildUI();
  wire(fab, overlay);
}
 
// Trois filets de sécurité pour ne jamais rater le bon moment :
// 1) si le DOM est déjà prêt, on tente tout de suite ;
// 2) sinon, au DOMContentLoaded ;
// 3) et dans tous les cas, sur l'événement "nav" de Quartz, qui est
//    l'événement officiel signalant que le DOM de la page est prêt
//    (et qui se redéclenche à chaque navigation SPA).
if (document.readyState !== "loading") {
  init();
} else {
  document.addEventListener("DOMContentLoaded", init, { once: true });
}
document.addEventListener("nav", init);
window.addEventListener("load", init, { once: true });