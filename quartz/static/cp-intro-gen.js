// ============================================================
//  C&P — Préparer une bataille
//  À placer dans : quartz/static/cp-intro-gen.js
//  Deux outils sur une page :
//   1) Tirage aléatoire scénario + déploiement (avec images/détails)
//   2) Génération d'une introduction narrative par LLM (Edge Function)
//  Conteneur attendu sur la page : <div id="cp-intro-app"></div>
// ============================================================

import { sb } from "/quartz/static/cp-supabase.js";

// URL de la fonction Edge. REMPLACE <TON-PROJET> par la ref de ton projet Supabase.
const EDGE_URL = "https://TON-PROJET.supabase.co/functions/v1/generer-intro";

let refPeuples = [], refScenarios = [], refDeploiements = [];
let nbCamps = 2;
let wired = false;

function getApp() { return document.getElementById("cp-intro-app"); }
function $(id) { return document.getElementById(id); }
function esc(s) {
  return (s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

async function loadRefs() {
  const [rp, rs, rd] = await Promise.all([
    sb.from("ref_peuples").select("*").order("ordre"),
    sb.from("ref_scenarios").select("*").order("ordre"),
    sb.from("ref_deploiements").select("*").order("ordre"),
  ]);
  refPeuples = rp.data || [];
  refScenarios = rs.data || [];
  refDeploiements = rd.data || [];
  render();
}

function peupleOptions() {
  return '<option value="">— faction —</option>' +
    refPeuples.map((p) => '<option value="' + esc(p.nom) + '">' + esc(p.nom) + "</option>").join("");
}

function campRow(i) {
  return '<div class="cp-intro-camp" data-idx="' + i + '">' +
    '<span class="cp-intro-campnum">Camp ' + (i + 1) + "</span>" +
    '<input class="cp-intro-joueur" placeholder="Joueur (optionnel)" />' +
    '<select class="cp-intro-faction">' + peupleOptions() + "</select>" +
    (i >= 2 ? '<button class="cp-intro-camp-del" title="Retirer">\u2715</button>' : "") +
  "</div>";
}

function render() {
  const app = getApp();
  if (!app) return;
  let camps = "";
  for (let i = 0; i < nbCamps; i++) camps += campRow(i);

  app.innerHTML =
    // --- Bloc tirage ---
    '<div class="cp-card cp-tirage">' +
      '<div class="cp-tirage-head">' +
        '<button class="cp-btn" id="cp-tirage-btn">\u{1F3B2} Tirer un scénario + déploiement</button>' +
      "</div>" +
      '<div id="cp-tirage-result"></div>' +
    "</div>" +
    // --- Bloc génération d'intro ---
    '<div class="cp-card">' +
      '<p class="cp-intro-hint">Renseigne les forces en présence et, si tu veux, une ambiance. ' +
        "Le générateur produira une courte introduction narrative pour ta bataille.</p>" +
      '<label class="cp-section-label">Forces en présence</label>' +
      '<div id="cp-intro-camps">' + camps + "</div>" +
      '<button class="cp-btn-ghost" id="cp-intro-add">+ Ajouter un camp</button>' +
      '<label class="cp-section-label">Ambiance / thème (optionnel)</label>' +
      '<input id="cp-intro-ambiance" class="cp-intro-ambiance" placeholder="Ex. : siège hivernal, vengeance, brume maudite..." />' +
      '<div class="cp-form-actions">' +
        '<button class="cp-btn" id="cp-intro-gen">\u2728 Générer l\'introduction</button>' +
      "</div>" +
      '<div class="cp-msg" id="cp-intro-msg"></div>' +
      '<div id="cp-intro-result"></div>' +
    "</div>";
}

// ---------- Tirage ----------
function doTirage() {
  const box = $("cp-tirage-result");
  if (!box) return;
  if (!refScenarios.length || !refDeploiements.length) {
    box.innerHTML = '<p class="cp-empty">Référentiel scénarios/déploiements vide.</p>';
    return;
  }
  const sc = refScenarios[Math.floor(Math.random() * refScenarios.length)];
  const dp = refDeploiements[Math.floor(Math.random() * refDeploiements.length)];
  box.innerHTML =
    '<div class="cp-tirage-grid">' +
      tirageCard("Scénario", sc) +
      tirageCard("Déploiement", dp) +
    "</div>" +
    tirageDetails(sc);
}

function tirageDetails(item) {
  if (!item.description && !item.mise_en_place && !item.objectif) return "";
  const nl2br = (s) => esc(s).replace(/\n/g, "<br>");
  return '<div class="cp-tirage-details">' +
    (item.description ? '<p class="cp-tirage-desc">' + nl2br(item.description) + "</p>" : "") +
    (item.mise_en_place ? '<div class="cp-tirage-detail"><span class="cp-tirage-detail-lbl">Mise en place</span><p>' + nl2br(item.mise_en_place) + "</p></div>" : "") +
    (item.objectif ? '<div class="cp-tirage-detail"><span class="cp-tirage-detail-lbl">Objectif</span><p>' + nl2br(item.objectif) + "</p></div>" : "") +
  "</div>";
}

function tirageCard(titre, item) {
  const blason = '<div class="cp-tirage-noimg">' +
    '<svg viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M32 2 L60 12 V36 C60 54 48 64 32 70 C16 64 4 54 4 36 V12 Z" ' +
        'fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" opacity="0.5"/>' +
      '<path d="M32 14 L32 52 M18 26 L46 26" stroke="currentColor" stroke-width="2" opacity="0.35"/>' +
      '<circle cx="32" cy="26" r="5" fill="none" stroke="currentColor" stroke-width="2" opacity="0.35"/>' +
    "</svg>" +
  "</div>";
  const img = item.image_url
    ? '<div class="cp-tirage-imgwrap"><img class="cp-tirage-img" src="' + esc(item.image_url) + '" alt="' + esc(item.nom) + '" loading="lazy" /></div>'
    : '<div class="cp-tirage-imgwrap">' + blason + "</div>";
  return '<div class="cp-tirage-card">' +
    '<div class="cp-tirage-label">' + titre + "</div>" +
    img +
    '<div class="cp-tirage-nom">' + esc(item.nom) + "</div>" +
  "</div>";
}

// ---------- Génération d'intro ----------
async function generer() {
  const msgEl = $("cp-intro-msg");
  if (msgEl) { msgEl.className = "cp-msg"; msgEl.textContent = ""; }

  const rows = [...document.querySelectorAll(".cp-intro-camp")];
  const joueurs = [], factions = [];
  rows.forEach((r) => {
    const j = r.querySelector(".cp-intro-joueur").value.trim();
    const f = r.querySelector(".cp-intro-faction").value;
    if (f) { factions.push(f); joueurs.push(j); }
  });
  if (factions.length < 2) {
    if (msgEl) { msgEl.className = "cp-msg err"; msgEl.textContent = "Choisis au moins deux factions."; }
    return;
  }
  const ambiance = $("cp-intro-ambiance").value.trim();

  // descriptions des factions choisies (lore) -> envoyées au prompt
  const descriptions = {};
  factions.forEach((f) => {
    const ref = refPeuples.find((p) => p.nom === f);
    if (ref && ref.description) descriptions[f] = ref.description;
  });

  // Pas de re-render (préserve les champs). On manipule bouton + zone résultat.
  const btn = $("cp-intro-gen");
  if (btn) { btn.disabled = true; btn.textContent = "Génération en cours\u2026"; }
  const res = $("cp-intro-result");
  if (res) res.innerHTML = '<p class="cp-intro-loading">Le barde compose votre légende\u2026</p>';

  try {
    const r = await fetch(EDGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ joueurs, factions, ambiance, descriptions }),
    });
    const data = await r.json();
    if (btn) { btn.disabled = false; btn.textContent = "\u2728 Générer l'introduction"; }
    if (!r.ok || data.error) {
      if (msgEl) { msgEl.className = "cp-msg err"; msgEl.textContent = "Échec de la génération : " + (data.error || r.status); }
      if (res) res.innerHTML = "";
      return;
    }
    if (res) {
      res.innerHTML =
        '<div class="cp-intro-texte">' +
          '<div class="cp-intro-texte-corps">' + esc(data.texte).replace(/\n/g, "<br>") + "</div>" +
          '<div class="cp-intro-meta">Généré par ' + esc(data.provider || "IA") +
            " \u00b7 prototype \u2014 le texte peut varier à chaque essai</div>" +
        "</div>";
    }
  } catch (e) {
    if (btn) { btn.disabled = false; btn.textContent = "\u2728 Générer l'introduction"; }
    if (msgEl) { msgEl.className = "cp-msg err"; msgEl.textContent = "Erreur réseau : " + e.message; }
    if (res) res.innerHTML = "";
  }
}

// ---------- Câblage ----------
function wireOnce() {
  if (wired) return;
  wired = true;

  document.addEventListener("click", (e) => {
    if (!getApp()) return;
    if (e.target.closest("#cp-tirage-btn")) { doTirage(); return; }
    if (e.target.closest("#cp-intro-gen")) { generer(); return; }
    if (e.target.closest("#cp-intro-add")) {
      nbCamps++;
      const cont = $("cp-intro-camps");
      if (cont) cont.insertAdjacentHTML("beforeend", campRow(nbCamps - 1));
      return;
    }
    const del = e.target.closest(".cp-intro-camp-del");
    if (del && getApp().contains(del)) {
      const row = del.closest(".cp-intro-camp");
      if (row) { row.remove(); nbCamps = Math.max(2, document.querySelectorAll(".cp-intro-camp").length); }
      return;
    }
  });
}

function setup() {
  if (!getApp()) return;
  wireOnce();
  loadRefs();
}

// Démarrage robuste (navigation SPA Quartz)
let bootTimer = null;
function bootstrap() {
  if (bootTimer) clearInterval(bootTimer);
  let tries = 0;
  if (getApp()) { setup(); return; }
  bootTimer = setInterval(() => {
    tries++;
    if (getApp()) { clearInterval(bootTimer); bootTimer = null; setup(); }
    else if (tries > 50) { clearInterval(bootTimer); bootTimer = null; }
  }, 100);
}
if (document.readyState !== "loading") bootstrap();
else document.addEventListener("DOMContentLoaded", bootstrap);
document.addEventListener("nav", bootstrap);
window.addEventListener("pageshow", bootstrap);
