// ============================================================
//  C&P — Préparer une bataille
//  À placer dans : quartz/static/cp-intro-gen.js
//  Deux outils sur une page :
//   1) Tirage aléatoire scénario + déploiement (avec images/détails)
//   2) Génération d'une introduction narrative par LLM (Edge Function)
//  Conteneur attendu sur la page : <div id="cp-intro-app"></div>
// ============================================================

import { sb, supabaseUrl } from "/quartz/static/cp-supabase.js";
import "/quartz/static/cp-saisie.js";

// URL de la fonction Edge, construite à partir de l'URL du projet partagée
// (définie une seule fois dans cp-supabase.js) — rien à remplacer ici.
const EDGE_URL = supabaseUrl + "/functions/v1/generer-intro";

// URL de la page Résultats (pour rediriger après enregistrement d'une partie).
// ⬇️ Vérifie/ajuste ce chemin selon l'emplacement réel de ta page Résultats.
const RESULTATS_URL = "/quartz/Wargame/Des Stats pour les Nerds";

let refPeuples = [], refScenarios = [], refDeploiements = [], refVersions = [], armyLists = [];
let nbCamps = 2;
let wired = false;
let dernierTirage = null; // { scenario, deploiement, camps } du dernier tirage, pour la saisie

function getApp() { return document.getElementById("cp-intro-app"); }
function $(id) { return document.getElementById(id); }
function esc(s) {
  return (s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

async function loadRefs() {
  const [rp, rs, rd, rv, al] = await Promise.all([
    sb.from("ref_peuples").select("*").order("ordre"),
    sb.from("ref_scenarios").select("*").order("ordre"),
    sb.from("ref_deploiements").select("*").order("ordre"),
    sb.from("ref_versions").select("*").order("ordre"),
    sb.from("army_lists").select("id, title, faction, author, points, body"),
  ]);
  refPeuples = rp.data || [];
  refScenarios = rs.data || [];
  refDeploiements = rd.data || [];
  refVersions = rv.data || [];
  armyLists = al.data || [];
  render();
}

function peupleOptions() {
  return '<option value="">— faction —</option>' +
    refPeuples.map((p) => '<option value="' + esc(p.nom) + '">' + esc(p.nom) + "</option>").join("");
}

function campRow(i) {
  return '<div class="cp-intro-camp" data-idx="' + i + '">' +
    '<div class="cp-intro-camp-main">' +
      '<span class="cp-intro-campnum">Camp ' + (i + 1) + "</span>" +
      '<input class="cp-intro-joueur" placeholder="Joueur (optionnel)" />' +
      '<select class="cp-intro-faction">' + peupleOptions() + "</select>" +
      '<select class="cp-intro-liste"><option value="">— liste (optionnel) —</option></select>' +
      '<button class="cp-intro-liste-libre-btn" type="button" title="Saisir une liste à la main">\u270E</button>' +
      (i >= 2 ? '<button class="cp-intro-camp-del" title="Retirer le camp">\u2715</button>' : "") +
    "</div>" +
    '<textarea class="cp-intro-liste-libre" placeholder="Colle ou saisis ta liste d\'armée ici (unités, commandants...)" hidden></textarea>' +
  "</div>";
}

// Remplit le menu des listes d'un camp, filtré par la faction choisie.
function fillCampListe(camp) {
  const sel = camp.querySelector(".cp-intro-liste");
  const faction = camp.querySelector(".cp-intro-faction").value;
  if (!sel) return;
  const nf = normFaction(faction);
  let matching = faction ? armyLists.filter((l) => normFaction(l.faction) === nf) : [];
  const current = sel.value;
  sel.innerHTML = '<option value="">— liste d\'armée (optionnel) —</option>' +
    matching.map((l) => {
      const pts = l.points != null ? " (" + l.points + " pts)" : "";
      const auth = l.author ? " · " + l.author : "";
      return '<option value="' + l.id + '">' + esc(l.title) + pts + auth + "</option>";
    }).join("");
  if ([...sel.options].some((o) => o.value === current)) sel.value = current;
}

// Normalisation tolérante faction/peuple (accents, casse)
function normFaction(s) {
  return (s || "").toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function render() {
  const app = getApp();
  if (!app) return;
  let camps = "";
  for (let i = 0; i < nbCamps; i++) camps += campRow(i);

  app.innerHTML =
    '<div class="cp-card">' +
      '<p class="cp-intro-hint">Renseigne les forces en présence et, si tu veux, une ambiance, ' +
        "puis prépare la bataille : un scénario et un déploiement seront tirés, " +
        "et une introduction narrative sera générée.</p>" +
      '<label class="cp-section-label">Forces en présence</label>' +
      '<div id="cp-intro-camps">' + camps + "</div>" +
      '<button class="cp-btn-ghost" id="cp-intro-add">+ Ajouter un camp</button>' +
      '<label class="cp-section-label">Ambiance / thème (optionnel)</label>' +
      '<input id="cp-intro-ambiance" class="cp-intro-ambiance" placeholder="Ex. : siège hivernal, vengeance, brume maudite..." />' +
      '<div class="cp-form-actions">' +
        '<button class="cp-btn cp-btn-big" id="cp-prepare-btn">\u2694\uFE0F Préparer la bataille</button>' +
        '<button class="cp-btn ghost" id="cp-enregistrer-resultat">\u{1F4DD} Enregistrer un résultat</button>' +
      "</div>" +
      '<div class="cp-msg" id="cp-intro-msg"></div>' +
    "</div>" +
    // zone de résultats : tirage puis intro (remplie par prepareBataille)
    '<div id="cp-tirage-result"></div>' +
    '<div id="cp-intro-result"></div>';
}

// ---------- Préparation complète : tirage + intro ----------
async function prepareBataille() {
  const msgEl = $("cp-intro-msg");
  if (msgEl) { msgEl.className = "cp-msg"; msgEl.textContent = ""; }

  // 1) Collecte des camps (nécessaires pour l'intro)
  const rows = [...document.querySelectorAll(".cp-intro-camp")];
  const joueurs = [], factions = [], listes = [];
  const LISTE_MAX = 1500; // garde-fou : taille max du corps de liste envoyé au LLM
  rows.forEach((r) => {
    const j = r.querySelector(".cp-intro-joueur").value.trim();
    const f = r.querySelector(".cp-intro-faction").value;
    if (!f) return;
    factions.push(f); joueurs.push(j);
    // liste : soit saisie libre (textarea visible), soit liste choisie (son body)
    const ta = r.querySelector(".cp-intro-liste-libre");
    const sel = r.querySelector(".cp-intro-liste");
    let listeTxt = "";
    if (ta && !ta.hidden && ta.value.trim()) {
      listeTxt = ta.value.trim();
    } else if (sel && sel.value) {
      const found = armyLists.find((l) => l.id === sel.value);
      if (found && found.body) listeTxt = found.body;
    }
    listes.push(listeTxt ? listeTxt.slice(0, LISTE_MAX) : "");
  });
  if (factions.length < 2) {
    if (msgEl) { msgEl.className = "cp-msg err"; msgEl.textContent = "Choisis au moins deux factions avant de préparer la bataille."; }
    return;
  }
  if (!refScenarios.length || !refDeploiements.length) {
    if (msgEl) { msgEl.className = "cp-msg err"; msgEl.textContent = "Référentiel scénarios/déploiements vide."; }
    return;
  }
  const ambiance = $("cp-intro-ambiance").value.trim();

  // 2) Tirage scénario + déploiement, avec mise en scène (suspense puis révélation)
  const tStart = Date.now();
  const REVEAL_TOTAL = 2000; // durée approximative de la mise en scène du tirage (ms)
  const sc = refScenarios[Math.floor(Math.random() * refScenarios.length)];
  const dp = refDeploiements[Math.floor(Math.random() * refDeploiements.length)];
  // Mémorise le contexte tiré pour pré-remplir la saisie du résultat
  dernierTirage = {
    scenario: sc.nom,
    deploiement: dp.nom,
    camps: factions.map((f, i) => ({ joueur: joueurs[i] || "", faction: f })),
  };
  const tBox = $("cp-tirage-result");
  if (tBox) {
    // a) bandeau de suspense (brassage)
    tBox.innerHTML =
      '<div class="cp-card">' +
        '<div class="cp-tirage-suspense">Le sort en décide' +
          '<span class="cp-dot">.</span><span class="cp-dot">.</span><span class="cp-dot">.</span>' +
        "</div>" +
      "</div>";

    // b) après un court suspense, on injecte les cartes en état "voilé"
    setTimeout(() => {
      const box = $("cp-tirage-result");
      if (!box) return;
      box.innerHTML =
        '<div class="cp-card">' +
          '<div class="cp-tirage-grid">' +
            '<div class="cp-reveal" id="cp-reveal-sc">' + tirageCard("Scénario", sc) + "</div>" +
            '<div class="cp-reveal" id="cp-reveal-dp">' + tirageCard("Déploiement", dp) + "</div>" +
          "</div>" +
          '<div class="cp-reveal" id="cp-reveal-det">' + tirageDetails(sc) + "</div>" +
        "</div>";
      // c) révélation décalée : scénario, puis déploiement, puis détails
      requestAnimationFrame(() => {
        const elSc = $("cp-reveal-sc"), elDp = $("cp-reveal-dp"), elDet = $("cp-reveal-det");
        if (elSc) setTimeout(() => elSc.classList.add("cp-revealed"), 60);
        if (elDp) setTimeout(() => elDp.classList.add("cp-revealed"), 360);
        if (elDet) setTimeout(() => elDet.classList.add("cp-revealed"), 660);
      });
    }, 1100);
  }

  // 3) Génération de l'intro, en passant l'ambiance du scénario tiré
  const descriptions = {};
  factions.forEach((f) => {
    const ref = refPeuples.find((p) => p.nom === f);
    if (ref && ref.description) descriptions[f] = ref.description;
  });
  // ambiance du scénario = sa description narrative (PAS ses règles)
  const scenarioAmbiance = sc.description || "";

  const btn = $("cp-prepare-btn");
  if (btn) { btn.disabled = true; btn.textContent = "Préparation en cours\u2026"; }
  const res = $("cp-intro-result");
  if (res) res.innerHTML = ""; // l'intro ne se montrera qu'après la révélation du tirage
  // message "le barde compose" affiché une fois les cartes révélées
  setTimeout(() => {
    const r2 = $("cp-intro-result");
    if (r2 && !r2.innerHTML) r2.innerHTML = '<p class="cp-intro-loading">Le barde compose votre légende\u2026</p>';
  }, REVEAL_TOTAL);

  try {
    const r = await fetch(EDGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ joueurs, factions, listes, ambiance, descriptions, scenarioNom: sc.nom, scenarioAmbiance }),
    });
    const data = await r.json();
    if (btn) { btn.disabled = false; btn.textContent = "\u2694\uFE0F Préparer la bataille"; }
    if (!r.ok || data.error) {
      if (msgEl) { msgEl.className = "cp-msg err"; msgEl.textContent = "Échec de la génération : " + (data.error || r.status); }
      if (res) res.innerHTML = "";
      return;
    }
    // On attend que la mise en scène du tirage soit terminée avant de révéler le texte,
    // pour respecter l'enchaînement : on découvre le terrain, puis l'histoire.
    const reste = REVEAL_TOTAL - (Date.now() - tStart);
    if (reste > 0) await new Promise((ok) => setTimeout(ok, reste));
    if (res) {
      res.innerHTML =
        '<div class="cp-intro-texte cp-reveal">' +
          '<div class="cp-intro-texte-corps">' + esc(data.texte).replace(/\n/g, "<br>") + "</div>" +
          '<div class="cp-intro-meta">Généré par ' + esc(data.provider || "IA") +
            " \u00b7 prototype \u2014 le texte peut varier à chaque essai</div>" +
        "</div>";
      // déclenche le fondu d'apparition du texte
      const t = res.querySelector(".cp-intro-texte");
      if (t) requestAnimationFrame(() => setTimeout(() => t.classList.add("cp-revealed"), 30));
    }
  } catch (e) {
    if (btn) { btn.disabled = false; btn.textContent = "\u2694\uFE0F Préparer la bataille"; }
    if (msgEl) { msgEl.className = "cp-msg err"; msgEl.textContent = "Erreur réseau : " + e.message; }
    if (res) res.innerHTML = "";
  }
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

// Ouvre la modale de saisie, pré-remplie avec ce qui est disponible :
// le tirage s'il a eu lieu, sinon les factions saisies dans le formulaire, sinon rien.
function ouvrirSaisieResultat() {
  if (!window.cpSaisie) { console.error("[cp-intro] module cp-saisie non chargé"); return; }
  let prefill = {};
  if (dernierTirage) {
    // un tirage a eu lieu : on pré-remplit tout (scénario, déploiement, camps)
    prefill = dernierTirage;
  } else {
    // pas de tirage : on récupère au moins les camps saisis dans le formulaire
    const rows = [...document.querySelectorAll(".cp-intro-camp")];
    const camps = [];
    rows.forEach((r) => {
      const joueur = r.querySelector(".cp-intro-joueur").value.trim();
      const faction = r.querySelector(".cp-intro-faction").value;
      if (faction || joueur) camps.push({ joueur, faction });
    });
    if (camps.length) prefill.camps = camps;
  }
  window.cpSaisie.open({
    refs: { refPeuples, refScenarios, refDeploiements, refVersions, armyLists },
    prefill,
    onSaved: () => { window.location.href = RESULTATS_URL; },
  });
}

// ---------- Câblage ----------
function wireOnce() {
  if (wired) return;
  wired = true;

  document.addEventListener("click", (e) => {
    if (!getApp()) return;
    if (e.target.closest("#cp-prepare-btn")) { prepareBataille(); return; }
    if (e.target.closest("#cp-enregistrer-resultat")) { ouvrirSaisieResultat(); return; }
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
    // bascule saisie libre de liste
    const libreBtn = e.target.closest(".cp-intro-liste-libre-btn");
    if (libreBtn && getApp().contains(libreBtn)) {
      const camp = libreBtn.closest(".cp-intro-camp");
      const ta = camp.querySelector(".cp-intro-liste-libre");
      const sel = camp.querySelector(".cp-intro-liste");
      const showing = !ta.hidden;
      if (showing) {
        ta.hidden = true; sel.disabled = false; libreBtn.textContent = "\u270E"; libreBtn.title = "Saisir une liste à la main";
      } else {
        ta.hidden = false; sel.value = ""; sel.disabled = true; libreBtn.textContent = "\u2630"; libreBtn.title = "Revenir au menu des listes";
        ta.focus();
      }
      return;
    }
  });

  // changement de faction -> recharge le menu listes du camp
  document.addEventListener("change", (e) => {
    if (!getApp()) return;
    const fac = e.target.closest(".cp-intro-faction");
    if (fac && getApp().contains(fac)) {
      const camp = fac.closest(".cp-intro-camp");
      if (camp) fillCampListe(camp);
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
