// ============================================================
//  C&P — Suivi des signalements (page de visualisation)
//  À placer dans : quartz/static/cp-bug-tracker.js
//  Affiche tous les signalements, vues tableau / repliable,
//  filtres, et changement d'état (poste / en_cours / traite / refuse).
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ⬇️⬇️ REMPLACE CES DEUX VALEURS ⬇️⬇️
const SUPABASE_URL = "https://TON-PROJET.kucgmmefluwmlobujanc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_YB_VCzZgD2vi4xeFvFT6ZA_BA9Pwn7R";
// ⬆️⬆️ ----------------------------- ⬆️⬆️

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Libellés + ordre d'affichage des états
const STATUS = {
  poste:    { label: "Posté",      cls: "st-poste" },
  en_cours: { label: "En cours",   cls: "st-encours" },
  traite:   { label: "Traité",     cls: "st-traite" },
  refuse:   { label: "Refusé",     cls: "st-refuse" },
};
const STATUS_KEYS = ["poste", "en_cours", "traite", "refuse"];

function init() {
  const app = document.getElementById("cp-bug-app");
  if (!app) return;
  if (app.dataset.cpInit === "1") return;
  app.dataset.cpInit = "1";

  const $ = (id) => document.getElementById(id);
  const listsEl = $("cp-bug-list");

  let all = [];
  let view = "table";
  let statusFilter = "";
  let searchTerm = "";
  let sortKey = "created_at";
  let sortDir = "desc";

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
      .from("bug_reports")
      .update({ status: newStatus })
      .eq("id", id)
      .select();
    if (error) { alert("Échec du changement d'état : " + error.message); return; }
    if (!data || !data.length) { alert("Aucune ligne modifiée (vérifie les permissions)."); return; }
    const row = all.find((r) => r.id === id);
    if (row) row.status = newStatus;
    render();
  }

  function filtered() {
    const term = searchTerm.toLowerCase();
    let rows = all.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
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

  function statusSelect(r) {
    const opts = STATUS_KEYS.map((k) =>
      '<option value="' + k + '"' + (k === r.status ? " selected" : "") + ">" + STATUS[k].label + "</option>"
    ).join("");
    return '<select class="cp-status-sel ' + statusInfo(r.status).cls + '" data-id="' + r.id + '">' + opts + "</select>";
  }

  function render() {
    const rows = filtered();
    if (!rows.length) {
      listsEl.innerHTML = all.length
        ? '<p class="cp-empty">Aucun signalement ne correspond aux filtres.</p>'
        : '<p class="cp-empty">Aucun signalement pour l\'instant.</p>';
      return;
    }
    listsEl.innerHTML = view === "table" ? renderTable(rows) : renderCollapse(rows);
    bindStatus();
    if (view === "table") bindSortHeaders();
    if (view === "collapse") bindToggles();
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
      return '<tr>' +
        '<td class="cp-c-state">' + statusSelect(r) + "</td>" +
        '<td class="cp-c-page">' + pageLink(r) + "</td>" +
        '<td>' + esc(r.reporter) + "</td>" +
        '<td class="cp-c-date">' + frDate(r.created_at) + "</td>" +
        "</tr>" +
        '<tr class="cp-detail-row"><td colspan="4"><div class="cp-detail">' + esc(r.description) + "</div></td></tr>";
    }).join("");
    return '<p class="cp-hint">Astuce : clique sur une ligne pour lire le détail, change l\'état via le menu déroulant.</p>' +
      '<table class="cp-table"><thead><tr>' +
      '<th data-sort="status">État' + arrow("status") + "</th>" +
      '<th data-sort="page_title">Page' + arrow("page_title") + "</th>" +
      '<th data-sort="reporter">Auteur' + arrow("reporter") + "</th>" +
      '<th data-sort="created_at">Date' + arrow("created_at") + "</th>" +
      "</tr></thead><tbody>" + body + "</tbody></table>";
  }

  function renderCollapse(rows) {
    return rows.map((r) => {
      const si = statusInfo(r.status);
      return '<div class="cp-coll">' +
        '<div class="cp-coll-head" aria-expanded="false">' +
          '<span class="cp-coll-arrow">\u25B8</span>' +
          '<span class="cp-badge ' + si.cls + '">' + si.label + "</span>" +
          '<span class="cp-coll-title">' + esc(r.page_title || "—") + "</span>" +
          '<span class="cp-coll-meta">' + esc(r.reporter) + " · " + frDate(r.created_at) + "</span>" +
        "</div>" +
        '<div class="cp-coll-body" hidden>' +
          '<div class="cp-coll-desc">' + esc(r.description) + "</div>" +
          '<div class="cp-coll-foot">' +
            '<span class="cp-coll-pagelink">' + pageLink(r) + "</span>" +
            '<span class="cp-coll-status">État : ' + statusSelect(r) + "</span>" +
          "</div>" +
        "</div>" +
      "</div>";
    }).join("");
  }

  function bindStatus() {
    listsEl.querySelectorAll(".cp-status-sel").forEach((sel) => {
      sel.addEventListener("click", (e) => e.stopPropagation());
      sel.addEventListener("change", (e) => {
        e.stopPropagation();
        changeStatus(sel.dataset.id, sel.value);
      });
    });
  }

  function bindSortHeaders() {
    listsEl.querySelectorAll("th[data-sort]").forEach((th) => {
      th.addEventListener("click", () => {
        const key = th.dataset.sort;
        if (sortKey === key) sortDir = sortDir === "asc" ? "desc" : "asc";
        else { sortKey = key; sortDir = key === "created_at" ? "desc" : "asc"; }
        render();
      });
    });
  }

  function bindToggles() {
    listsEl.querySelectorAll(".cp-coll-head").forEach((head) => {
      head.addEventListener("click", () => {
        const body = head.nextElementSibling;
        const arrowEl = head.querySelector(".cp-coll-arrow");
        const open = body.hasAttribute("hidden");
        if (open) { body.removeAttribute("hidden"); head.setAttribute("aria-expanded", "true"); arrowEl.textContent = "\u25BE"; }
        else { body.setAttribute("hidden", ""); head.setAttribute("aria-expanded", "false"); arrowEl.textContent = "\u25B8"; }
      });
    });
  }

  listsEl.addEventListener("click", (e) => {
    if (view !== "table") return;
    if (e.target.closest(".cp-status-sel")) return;
    if (e.target.closest("a")) return;
    const tr = e.target.closest("tr");
    if (!tr) return;
    if (tr.parentElement && tr.parentElement.tagName === "THEAD") return;
    if (tr.classList.contains("cp-detail-row")) return;
    const detail = tr.nextElementSibling;
    if (detail && detail.classList.contains("cp-detail-row")) detail.classList.toggle("open");
  });

  $("cp-bug-view-table").addEventListener("click", () => { view = "table"; updateViewButtons(); render(); });
  $("cp-bug-view-collapse").addEventListener("click", () => { view = "collapse"; updateViewButtons(); render(); });
  function updateViewButtons() {
    $("cp-bug-view-table").classList.toggle("active", view === "table");
    $("cp-bug-view-collapse").classList.toggle("active", view === "collapse");
  }
  $("cp-bug-filter-status").addEventListener("change", (e) => { statusFilter = e.target.value; render(); });
  $("cp-bug-search").addEventListener("input", (e) => { searchTerm = e.target.value.trim(); render(); });

  updateViewButtons();
  load();
}

if (document.readyState !== "loading") {
  init();
} else {
  document.addEventListener("DOMContentLoaded", init);
}
document.addEventListener("nav", init);