// ============================================================
//  C&P — Signalement de bug (bouton flottant global)
//  À placer dans : quartz/static/cp-bug-report.js
//  Chargé sur TOUTES les pages (voir instructions d'intégration).
// ============================================================

import { sb } from "/quartz/static/cp-supabase.js";

// URL de la page de suivi (adapte si tu la places ailleurs).
const TRACKER_URL = "Retours";

// Le CSS du bouton flottant est désormais dans /quartz/static/cp-bug-report.css
// (chargé globalement via Head.tsx).

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
