// ============================================================
//  C&P — Listes d'armées (logique Supabase)
//  Fichier servi tel quel par Quartz (pas de transformation Markdown).
//  À placer dans : quartz/static/cp-army-lists.js
//  Référencé depuis la page via :
//    <script type="module" src="/static/cp-army-lists.js"></script>
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ⬇️⬇️ REMPLACE CES DEUX VALEURS ⬇️⬇️
const SUPABASE_URL = "https://kucgmmefluwmlobujanc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_YB_VCzZgD2vi4xeFvFT6ZA_BA9Pwn7R";
// ⬆️⬆️ ----------------------------- ⬆️⬆️

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
 
function init() {
  const app = document.getElementById("cp-army-app");
  if (!app) return;
  if (app.dataset.cpInit === "1") return;
  app.dataset.cpInit = "1";
 
  const $ = (id) => document.getElementById(id);
  const msg = $("cp-msg");
  const listsEl = $("cp-lists");
 
  // État local
  let allLists = [];
  let refPeuples = [];         // factions de référence (ref_peuples)
  let refVersions = [];        // versions de règles (ref_versions)
  let view = "table";          // "table" | "collapse"
  let factionFilter = "";
  let searchTerm = "";
  let sortKey = "created_at";   // "title" | "faction" | "points" | "created_at"
  let sortDir = "desc";         // "asc" | "desc"
  let editingId = null;         // id de la liste en cours d'édition, ou null
 
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
 
  // ---- Récupération ----
  async function loadRefPeuples() {
    const { data } = await sb.from("ref_peuples").select("nom").order("ordre");
    refPeuples = (data || []).map((r) => r.nom);
    fillFactionSelect();
  }
 
  async function loadRefVersions() {
    const { data } = await sb.from("ref_versions").select("nom").order("ordre");
    refVersions = (data || []).map((r) => r.nom);
    fillVersionSelect();
  }
 
  // Remplit le menu de SAISIE de la faction depuis ref_peuples
  function fillFactionSelect() {
    const sel = $("cp-faction");
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '<option value="">— faction —</option>' +
      refPeuples.map((nom) => '<option value="' + esc(nom) + '">' + esc(nom) + "</option>").join("");
    if ([...sel.options].some((o) => o.value === current)) sel.value = current;
  }
 
  // Remplit le menu de SAISIE de la version depuis ref_versions
  function fillVersionSelect() {
    const sel = $("cp-version");
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '<option value="">— version —</option>' +
      refVersions.map((nom) => '<option value="' + esc(nom) + '">' + esc(nom) + "</option>").join("");
    if ([...sel.options].some((o) => o.value === current)) sel.value = current;
  }
 
  async function loadLists() {
    const { data, error } = await sb
      .from("army_lists")
      .select("*")
      .order("created_at", { ascending: false });
 
    if (error) {
      listsEl.innerHTML = '<p class="cp-empty">Erreur de chargement : ' + esc(error.message) + "</p>";
      return;
    }
    allLists = data || [];
    rebuildFactionOptions();
    render();
  }
 
  // ---- Suppression ----
  async function deleteList(id, label) {
    if (!confirm('Supprimer la liste « ' + label + ' » ? Cette action est définitive.')) return;
    const { error } = await sb.from("army_lists").delete().eq("id", id);
    if (error) { alert("Échec de la suppression : " + error.message); return; }
    allLists = allLists.filter((l) => l.id !== id);
    if (editingId === id) cancelEdit();
    rebuildFactionOptions();
    render();
  }
 
  // ---- Édition : charger une liste dans le formulaire ----
  function startEdit(id) {
    const l = allLists.find((x) => x.id === id);
    if (!l) return;
    editingId = id;
    $("cp-author").value = l.author || "";
    $("cp-faction").value = l.faction || "";
    $("cp-version").value = l.version || "";
    $("cp-title").value = l.title || "";
    $("cp-points").value = (l.points ?? "") === null ? "" : (l.points ?? "");
    $("cp-body").value = l.body || "";
    $("cp-submit").textContent = "Mettre à jour";
    $("cp-cancel-edit").style.display = "inline-block";
    $("cp-form-mode").textContent = "Modification de : " + (l.title || "");
    msg.className = "cp-msg";
    msg.textContent = "";
    app.scrollIntoView({ behavior: "smooth", block: "start" });
  }
 
  function cancelEdit() {
    editingId = null;
    $("cp-author").value = "";
    $("cp-faction").value = "";
    $("cp-version").value = "";
    $("cp-title").value = "";
    $("cp-points").value = "";
    $("cp-body").value = "";
    $("cp-submit").textContent = "Publier la liste";
    $("cp-cancel-edit").style.display = "none";
    $("cp-form-mode").textContent = "";
  }
 
  // ---- Filtres ----
  function rebuildFactionOptions() {
    const sel = $("cp-filter-faction");
    if (!sel) return;
    const current = sel.value;
    const factions = [...new Set(allLists.map((l) => l.faction).filter(Boolean))].sort();
    sel.innerHTML =
      '<option value="">Toutes les factions</option>' +
      factions.map((f) => '<option value="' + esc(f) + '">' + esc(f) + "</option>").join("");
    sel.value = factions.includes(current) ? current : "";
  }
 
  function filtered() {
    const term = searchTerm.toLowerCase();
    let rows = allLists.filter((l) => {
      if (factionFilter && l.faction !== factionFilter) return false;
      if (term) {
        const hay = (l.title + " " + l.author + " " + (l.faction || "") + " " + l.body).toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
    // Tri
    rows.sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey];
      if (sortKey === "points") { va = va ?? -Infinity; vb = vb ?? -Infinity; }
      else if (sortKey === "created_at") { va = new Date(va).getTime(); vb = new Date(vb).getTime(); }
      else { va = (va || "").toString().toLowerCase(); vb = (vb || "").toString().toLowerCase(); }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }
 
  // ---- Rendu ----
  function render() {
    const rows = filtered();
    if (!rows.length) {
      listsEl.innerHTML = allLists.length
        ? '<p class="cp-empty">Aucune liste ne correspond aux filtres.</p>'
        : '<p class="cp-empty">Aucune liste pour l\'instant. Sois le premier !</p>';
      return;
    }
    listsEl.innerHTML = view === "table" ? renderTable(rows) : renderCollapse(rows);
    bindActions();
    if (view === "table") bindSortHeaders();
    if (view === "collapse") bindToggles();
  }
 
  function arrow(key) {
    if (sortKey !== key) return '<span class="cp-sort"> </span>';
    return '<span class="cp-sort">' + (sortDir === "asc" ? "\u25B4" : "\u25BE") + "</span>";
  }
 
  function renderTable(rows) {
    const body = rows.map((l) => {
      const pts = (l.points ?? null) === null ? "—" : l.points;
      return '<tr>' +
        '<td class="cp-c-title">' + esc(l.title) + "</td>" +
        '<td>' + esc(l.faction || "—") + "</td>" +
        '<td class="cp-c-pts">' + pts + "</td>" +
        '<td>' + esc(l.version || "—") + "</td>" +
        '<td>' + esc(l.author) + "</td>" +
        '<td class="cp-c-date">' + frDate(l.created_at) + "</td>" +
        '<td class="cp-c-act">' +
          '<button class="cp-edit" data-id="' + l.id + '" title="Modifier">\u270E</button>' +
          '<button class="cp-del" data-id="' + l.id + '" data-label="' + esc(l.title) + '" title="Supprimer">\u2715</button>' +
        "</td>" +
        "</tr>" +
        '<tr class="cp-detail-row"><td colspan="7"><div class="cp-detail">' + esc(l.body) + "</div></td></tr>";
    }).join("");
    return '<p class="cp-hint">Astuce : clique sur une ligne pour déplier le détail, sur un en-tête pour trier.</p>' +
      '<table class="cp-table"><thead><tr>' +
      '<th data-sort="title">Titre' + arrow("title") + "</th>" +
      '<th data-sort="faction">Faction' + arrow("faction") + "</th>" +
      '<th data-sort="points">Points' + arrow("points") + "</th>" +
      '<th data-sort="version">Version' + arrow("version") + "</th>" +
      '<th data-sort="author">Auteur' + arrow("author") + "</th>" +
      '<th data-sort="created_at">Date' + arrow("created_at") + "</th>" +
      "<th></th>" +
      "</tr></thead><tbody>" + body + "</tbody></table>";
  }
 
  function renderCollapse(rows) {
    return rows.map((l) => {
      const fac = l.faction ? " — " + esc(l.faction) : "";
      const pts = (l.points ?? null) === null ? "" : ' · <strong>' + l.points + " pts</strong>";
      const ver = l.version ? " · " + esc(l.version) : "";
      return '<div class="cp-coll">' +
        '<div class="cp-coll-head" aria-expanded="false">' +
          '<span class="cp-coll-arrow">\u25B8</span>' +
          '<span class="cp-coll-title">' + esc(l.title) + fac + "</span>" +
          '<span class="cp-coll-meta">' + esc(l.author) + " · " + frDate(l.created_at) + pts + ver + "</span>" +
          '<span class="cp-coll-acts">' +
            '<span class="cp-edit" data-id="' + l.id + '" title="Modifier">\u270E</span>' +
            '<span class="cp-del" data-id="' + l.id + '" data-label="' + esc(l.title) + '" title="Supprimer">\u2715</span>' +
          "</span>" +
        "</div>" +
        '<div class="cp-coll-body" hidden>' + esc(l.body) + "</div>" +
      "</div>";
    }).join("");
  }
 
  function bindActions() {
    listsEl.querySelectorAll(".cp-del").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteList(el.dataset.id, el.dataset.label);
      });
    });
    listsEl.querySelectorAll(".cp-edit").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        startEdit(el.dataset.id);
      });
    });
  }
 
  function bindSortHeaders() {
    listsEl.querySelectorAll("th[data-sort]").forEach((th) => {
      th.addEventListener("click", () => {
        const key = th.dataset.sort;
        if (sortKey === key) {
          sortDir = sortDir === "asc" ? "desc" : "asc";
        } else {
          sortKey = key;
          sortDir = key === "created_at" || key === "points" ? "desc" : "asc";
        }
        render();
      });
    });
  }
 
  function bindToggles() {
    listsEl.querySelectorAll(".cp-coll-head").forEach((head) => {
      head.addEventListener("click", (e) => {
        if (e.target.closest(".cp-coll-acts")) return;
        const body = head.nextElementSibling;
        const arrowEl = head.querySelector(".cp-coll-arrow");
        const open = body.hasAttribute("hidden");
        if (open) {
          body.removeAttribute("hidden");
          head.setAttribute("aria-expanded", "true");
          arrowEl.textContent = "\u25BE";
        } else {
          body.setAttribute("hidden", "");
          head.setAttribute("aria-expanded", "false");
          arrowEl.textContent = "\u25B8";
        }
      });
    });
  }
 
  // En vue tableau : clic sur une ligne déplie le détail
  listsEl.addEventListener("click", (e) => {
    if (view !== "table") return;
    const tr = e.target.closest("tr");
    if (!tr) return;
    if (e.target.closest(".cp-del") || e.target.closest(".cp-edit")) return;
    if (tr.parentElement && tr.parentElement.tagName === "THEAD") return;
    if (tr.classList.contains("cp-detail-row")) return;
    const detail = tr.nextElementSibling;
    if (detail && detail.classList.contains("cp-detail-row")) {
      detail.classList.toggle("open");
    }
  });
 
  // ---- Contrôles (vue + filtres) ----
  $("cp-view-table").addEventListener("click", () => { view = "table"; updateViewButtons(); render(); });
  $("cp-view-collapse").addEventListener("click", () => { view = "collapse"; updateViewButtons(); render(); });
  function updateViewButtons() {
    $("cp-view-table").classList.toggle("active", view === "table");
    $("cp-view-collapse").classList.toggle("active", view === "collapse");
  }
  $("cp-filter-faction").addEventListener("change", (e) => { factionFilter = e.target.value; render(); });
  $("cp-search").addEventListener("input", (e) => { searchTerm = e.target.value.trim(); render(); });
 
  // ---- Annuler l'édition ----
  $("cp-cancel-edit").addEventListener("click", cancelEdit);
 
  // ---- Publication / mise à jour ----
  $("cp-submit").addEventListener("click", async () => {
    const author = $("cp-author").value.trim() || "Anonyme";
    const faction = $("cp-faction").value.trim() || null;
    const version = $("cp-version").value.trim() || null;
    const title = $("cp-title").value.trim();
    const body = $("cp-body").value.trim();
    const ptsRaw = $("cp-points").value.trim();
    const points = ptsRaw === "" ? null : parseInt(ptsRaw, 10);
 
    msg.className = "cp-msg";
    msg.textContent = "";
    if (!title || !body) {
      msg.className = "cp-msg err";
      msg.textContent = "Le titre et la liste sont requis.";
      return;
    }
    if (ptsRaw !== "" && (isNaN(points) || points < 0)) {
      msg.className = "cp-msg err";
      msg.textContent = "Le coût en points doit être un nombre positif.";
      return;
    }
 
    const btn = $("cp-submit");
    btn.disabled = true;
 
    let error;
    if (editingId) {
      ({ error } = await sb.from("army_lists")
        .update({ author, faction, version, title, body, points })
        .eq("id", editingId));
    } else {
      ({ error } = await sb.from("army_lists")
        .insert({ author, faction, version, title, body, points }));
    }
 
    btn.disabled = false;
 
    if (error) {
      msg.className = "cp-msg err";
      msg.textContent = (editingId ? "Échec de la mise à jour : " : "Échec de publication : ") + error.message;
      return;
    }
    msg.className = "cp-msg ok";
    msg.textContent = editingId ? "Liste mise à jour !" : "Liste publiée !";
    cancelEdit();
    loadLists();
  });
 
  updateViewButtons();
  loadRefPeuples();
  loadRefVersions();
  loadLists();
}
 
// ---- Démarrage robuste ----
// Le conteneur peut ne pas être présent quand le module s'exécute
// (Quartz injecte le DOM via son routage SPA). On réessaie plusieurs fois,
// et on écoute l'événement "nav" officiel de Quartz.
function bootstrap() {
  let tries = 0;
  const timer = setInterval(() => {
    tries++;
    if (document.getElementById("cp-army-app")) { clearInterval(timer); init(); }
    else if (tries > 40) { clearInterval(timer); }
  }, 100);
}
if (document.readyState !== "loading") {
  bootstrap();
} else {
  document.addEventListener("DOMContentLoaded", bootstrap);
}
document.addEventListener("nav", init);
window.addEventListener("pageshow", () => { if (document.getElementById("cp-army-app")) init(); });