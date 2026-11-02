// ============================================================
//  C&P — Suivi des signalements (page de visualisation)
//  À placer dans : quartz/static/cp-bug-tracker.js
//  Vues tableau / repliable, filtres, changement d'état,
//  édition en ligne (auteur + description), fonds pastel par statut.
// ============================================================

import { sb } from "/quartz/static/cp-supabase.js";

// Libellés + classes des états (la classe sert au badge, au select ET au fond de ligne)
const STATUS = {
  poste:    { label: "Posté",      cls: "st-poste" },
  en_cours: { label: "En cours",   cls: "st-encours" },
  traite:   { label: "Traité",     cls: "st-traite" },
  refuse:   { label: "Refusé",     cls: "st-refuse" },
};
const STATUS_KEYS = ["poste", "en_cours", "traite", "refuse"];

const TYPE = {
  bug:         { label: "Bug",          cls: "ty-bug" },
  equilibrage: { label: "Équilibrage",  cls: "ty-equilibrage" },
  idee:        { label: "Idée",         cls: "ty-idee" },
  regle:       { label: "Règle",        cls: "ty-regle" },
  autre:       { label: "Autre",        cls: "ty-autre" },
};
function typeInfo(t) { return TYPE[t] || { label: t || "—", cls: "" }; }


// État global au module (survit aux nav, réinitialisé à chaque setup)
let all = [];
let view = "table";
let statusFilter = "";
let typeFilter = "";
let searchTerm = "";
let sortKey = "created_at";
let sortDir = "desc";
let editingId = null;
let wired = false;   // les écouteurs délégués sur document ne sont posés qu'une fois

function getApp() { return document.getElementById("cp-bug-app"); }
function getList() { return document.getElementById("cp-bug-list"); }

function esc(s) {
  return (s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
function frDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });
}
function statusInfo(s) { return STATUS[s] || { label: s, cls: "" }; }

async function load() {
  const listsEl = getList();
  if (!listsEl) return;
  const { data, error } = await sb
    .from("bug_reports")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    listsEl.innerHTML = '<p class="cp-empty">Erreur de chargement : ' + esc(error.message) + "</p>";
    return;
  }
  all = data || [];
  render();
}

async function changeStatus(id, newStatus) {
  const { data, error } = await sb
    .from("bug_reports").update({ status: newStatus }).eq("id", id).select();
  if (error) { alert("Échec du changement d'état : " + error.message); return; }
  if (!data || !data.length) { alert("Aucune ligne modifiée (vérifie les permissions)."); return; }
  const row = all.find((r) => r.id === id);
  if (row) row.status = newStatus;
  render();
}

async function saveEdit(id) {
  const authorEl = document.getElementById("cp-edit-author-" + id);
  const descEl = document.getElementById("cp-edit-desc-" + id);
  const reporter = (authorEl?.value || "").trim() || "Anonyme";
  const description = (descEl?.value || "").trim();
  if (!description) { alert("La description ne peut pas être vide."); return; }
  const { data, error } = await sb
    .from("bug_reports").update({ reporter, description }).eq("id", id).select();
  if (error) { alert("Échec de la modification : " + error.message); return; }
  if (!data || !data.length) { alert("Aucune ligne modifiée (vérifie les permissions)."); return; }
  const row = all.find((r) => r.id === id);
  if (row) { row.reporter = reporter; row.description = description; }
  editingId = null;
  render();
}

function filtered() {
  const term = searchTerm.toLowerCase();
  let rows = all.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (typeFilter && r.type !== typeFilter) return false;
    if (term) {
      const hay = (r.reporter + " " + (r.page_title || "") + " " + r.description).toLowerCase();
      if (!hay.includes(term)) return false;
    }
    return true;
  });
  rows.sort((a, b) => {
    let va = a[sortKey], vb = b[sortKey];
    if (sortKey === "created_at") { va = new Date(va).getTime(); vb = new Date(vb).getTime(); }
    else { va = (va || "").toString().toLowerCase(); vb = (vb || "").toString().toLowerCase(); }
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });
  return rows;
}

function estAdmin() {
  return !!(window.cpAuth && window.cpAuth.isAdmin && window.cpAuth.isAdmin());
}
function statusSelect(r) {
  // Résolution réservée à l'admin (aligné sur le RLS) : les autres voient l'état en lecture seule.
  if (!estAdmin()) {
    const si = statusInfo(r.status);
    return '<span class="cp-badge ' + si.cls + '">' + esc(si.label) + "</span>";
  }
  const opts = STATUS_KEYS.map((k) =>
    '<option value="' + k + '"' + (k === r.status ? " selected" : "") + ">" + STATUS[k].label + "</option>"
  ).join("");
  return '<select class="cp-status-sel ' + statusInfo(r.status).cls + '" data-id="' + r.id + '">' + opts + "</select>";
}

function editPanel(r) {
  return '<div class="cp-edit-panel">' +
    '<label>Auteur</label>' +
    '<input id="cp-edit-author-' + r.id + '" type="text" value="' + esc(r.reporter) + '" />' +
    '<label>Description</label>' +
    '<textarea id="cp-edit-desc-' + r.id + '">' + esc(r.description) + '</textarea>' +
    '<div class="cp-edit-actions">' +
      '<button class="cp-edit-cancel" data-id="' + r.id + '">Annuler</button>' +
      '<button class="cp-edit-save" data-id="' + r.id + '">Enregistrer</button>' +
    '</div>' +
  '</div>';
}

function arrow(key) {
  if (sortKey !== key) return '<span class="cp-sort"> </span>';
  return '<span class="cp-sort">' + (sortDir === "asc" ? "\u25B4" : "\u25BE") + "</span>";
}

function pageLink(r) {
  if (!r.page_url) return esc(r.page_title || "—");
  return '<a href="' + esc(r.page_url) + '" title="' + esc(r.page_url) + '">' + esc(r.page_title || r.page_url) + "</a>";
}

function renderTable(rows) {
  const body = rows.map((r) => {
    const cls = statusInfo(r.status).cls;
    const ti = typeInfo(r.type);
    const editingRow = editingId === r.id
      ? '<tr class="cp-detail-row open ' + cls + '"><td colspan="6">' + editPanel(r) + "</td></tr>"
      : '<tr class="cp-detail-row ' + cls + '"><td colspan="6"><div class="cp-detail">' + esc(r.description) + "</div></td></tr>";
    return '<tr class="cp-row-' + cls + '" data-rowid="' + r.id + '">' +
      '<td class="cp-c-state">' + statusSelect(r) + "</td>" +
      '<td><span class="cp-badge ' + ti.cls + '">' + esc(ti.label) + "</span></td>" +
      '<td class="cp-c-page">' + pageLink(r) + "</td>" +
      '<td>' + esc(r.reporter) + "</td>" +
      '<td class="cp-c-date">' + frDate(r.created_at) + "</td>" +
      '<td class="cp-c-act">' + (estAdmin() ? '<button class="cp-edit" data-id="' + r.id + '" title="Modifier">\u270E</button>' : "") + "</td>" +
      "</tr>" +
      editingRow;
  }).join("");
  return '<p class="cp-hint">Astuce : tape une ligne pour lire le détail' + (estAdmin() ? ", le crayon pour modifier, le menu pour changer l\'état." : ".") + "</p>" +
    '<table class="cp-table"><thead><tr>' +
    '<th data-sort="status">État' + arrow("status") + "</th>" +
    '<th data-sort="type">Type' + arrow("type") + "</th>" +
    '<th data-sort="page_title">Page' + arrow("page_title") + "</th>" +
    '<th data-sort="reporter">Auteur' + arrow("reporter") + "</th>" +
    '<th data-sort="created_at">Date' + arrow("created_at") + "</th>" +
    "<th></th>" +
    "</tr></thead><tbody>" + body + "</tbody></table>";
}

function renderCollapse(rows) {
  return rows.map((r) => {
    const si = statusInfo(r.status);
    const ti = typeInfo(r.type);
    const inner = editingId === r.id
      ? editPanel(r)
      : '<div class="cp-coll-desc">' + esc(r.description) + "</div>" +
        '<div class="cp-coll-foot">' +
          '<span class="cp-coll-pagelink">' + pageLink(r) + "</span>" +
          '<span class="cp-coll-status">État : ' + statusSelect(r) + "</span>" +
          (estAdmin() ? '<button class="cp-edit" data-id="' + r.id + '" title="Modifier">\u270E</button>' : "") +
        "</div>";
    return '<div class="cp-coll cp-row-' + si.cls + '" data-rowid="' + r.id + '">' +
      '<div class="cp-coll-head" data-collhead="' + r.id + '" aria-expanded="' + (editingId === r.id ? "true" : "false") + '">' +
        '<span class="cp-coll-arrow">' + (editingId === r.id ? "\u25BE" : "\u25B8") + "</span>" +
        '<span class="cp-badge ' + si.cls + '">' + si.label + "</span>" +
        '<span class="cp-badge ' + ti.cls + '">' + esc(ti.label) + "</span>" +
        '<span class="cp-coll-title">' + esc(r.page_title || "—") + "</span>" +
        '<span class="cp-coll-meta">' + esc(r.reporter) + " · " + frDate(r.created_at) + "</span>" +
      "</div>" +
      '<div class="cp-coll-body"' + (editingId === r.id ? "" : " hidden") + ">" + inner + "</div>" +
    "</div>";
  }).join("");
}

function render() {
  const listsEl = getList();
  if (!listsEl) return;
  const rows = filtered();
  if (!rows.length) {
    listsEl.innerHTML = all.length
      ? '<p class="cp-empty">Aucun signalement ne correspond aux filtres.</p>'
      : '<p class="cp-empty">Aucun signalement pour l\'instant.</p>';
  } else {
    listsEl.innerHTML = view === "table" ? renderTable(rows) : renderCollapse(rows);
  }
  // reflète l'état des boutons de vue à chaque rendu
  const bt = document.getElementById("cp-bug-view-table");
  const bc = document.getElementById("cp-bug-view-collapse");
  if (bt) bt.classList.toggle("active", view === "table");
  if (bc) bc.classList.toggle("active", view === "collapse");
  forceRepaint(getApp());
}

// Force le navigateur à repeindre la zone après injection de contenu
// (corrige un bug d'affichage post-navigation SPA Quartz).
function forceRepaint(el) {
  if (!el) return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const prev = el.style.transform;
      el.style.transform = "translateZ(0)";
      void el.offsetHeight;
      el.style.transform = prev || "";
    });
  });
}

// ---- Câblage unique par DÉLÉGATION sur document ----
// Posé une seule fois pour toute la session ; survit aux navigations SPA
// car document n'est jamais remplacé. On filtre par cible à l'exécution.
function wireOnce() {
  if (wired) return;
  wired = true;

  // Clics
  document.addEventListener("click", (e) => {
    if (!getApp()) return; // pas sur la page Signalements

    const editBtn = e.target.closest(".cp-edit");
    if (editBtn && getApp().contains(editBtn)) {
      e.stopPropagation();
      editingId = (editingId === editBtn.dataset.id) ? null : editBtn.dataset.id;
      render();
      return;
    }
    const saveBtn = e.target.closest(".cp-edit-save");
    if (saveBtn && getApp().contains(saveBtn)) { e.stopPropagation(); saveEdit(saveBtn.dataset.id); return; }

    const cancelBtn = e.target.closest(".cp-edit-cancel");
    if (cancelBtn && getApp().contains(cancelBtn)) { e.stopPropagation(); editingId = null; render(); return; }

    if (e.target.closest(".cp-edit-panel")) { e.stopPropagation(); return; }

    // En-têtes de tri
    const th = e.target.closest("th[data-sort]");
    if (th && getApp().contains(th)) {
      const key = th.dataset.sort;
      if (sortKey === key) sortDir = sortDir === "asc" ? "desc" : "asc";
      else { sortKey = key; sortDir = key === "created_at" ? "desc" : "asc"; }
      render();
      return;
    }

    // Boutons de vue
    const vt = e.target.closest("#cp-bug-view-table");
    if (vt) { view = "table"; render(); return; }
    const vc = e.target.closest("#cp-bug-view-collapse");
    if (vc) { view = "collapse"; render(); return; }

    // Têtes repliables (vue collapse)
    const head = e.target.closest(".cp-coll-head");
    if (head && getApp().contains(head)) {
      const body = head.nextElementSibling;
      const arrowEl = head.querySelector(".cp-coll-arrow");
      const open = body.hasAttribute("hidden");
      if (open) { body.removeAttribute("hidden"); head.setAttribute("aria-expanded", "true"); arrowEl.textContent = "\u25BE"; }
      else { body.setAttribute("hidden", ""); head.setAttribute("aria-expanded", "false"); arrowEl.textContent = "\u25B8"; }
      return;
    }

    // Clic sur une ligne de tableau -> déplie le détail
    if (view === "table") {
      if (e.target.closest(".cp-status-sel") || e.target.closest("a")) return;
      const tr = e.target.closest("tr[data-rowid]");
      if (tr && getApp().contains(tr)) {
        const detail = tr.nextElementSibling;
        if (detail && detail.classList.contains("cp-detail-row")) detail.classList.toggle("open");
      }
    }
  });

  // Changements (menus état + filtre + recherche)
  document.addEventListener("change", (e) => {
    if (!getApp()) return;
    const sel = e.target.closest(".cp-status-sel");
    if (sel && getApp().contains(sel)) { changeStatus(sel.dataset.id, sel.value); return; }
    if (e.target.id === "cp-bug-filter-status") { statusFilter = e.target.value; render(); return; }
    if (e.target.id === "cp-bug-filter-type") { typeFilter = e.target.value; render(); return; }
  });
  document.addEventListener("input", (e) => {
    if (!getApp()) return;
    if (e.target.id === "cp-bug-search") { searchTerm = e.target.value.trim(); render(); }
  });
}

// ---- Setup appelé à chaque affichage de page ----
function setup() {
  if (!getApp()) return;          // pas la page Signalements
  wireOnce();                      // câblage délégué (une fois)
  // réinitialise l'état d'affichage pour une page fraîche
  editingId = null;
  load();                          // recharge et rend
}

// ---- Démarrage robuste ----
// À CHAQUE navigation (et au chargement), on tente de détecter le conteneur
// pendant quelques secondes : Quartz peut émettre "nav" avant d'avoir injecté
// le DOM de la page de destination. Un seul timer actif à la fois.
let bootTimer = null;
function bootstrap() {
  if (bootTimer) clearInterval(bootTimer);
  let tries = 0;
  // tentative immédiate
  if (getApp()) { setup(); return; }
  bootTimer = setInterval(() => {
    tries++;
    if (getApp()) { clearInterval(bootTimer); bootTimer = null; setup(); }
    else if (tries > 50) { clearInterval(bootTimer); bootTimer = null; } // ~5 s puis abandon
  }, 100);
}
if (document.readyState !== "loading") {
  bootstrap();
} else {
  document.addEventListener("DOMContentLoaded", bootstrap);
}
document.addEventListener("nav", bootstrap);   // relance la détection à chaque navigation
document.addEventListener("cp-auth", () => { if (getApp()) render(); }); // affiche/masque les contrôles admin
window.addEventListener("pageshow", bootstrap);
