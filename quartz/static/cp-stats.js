// ============================================================
//  C&P — Résultats & Statistiques
//  À placer dans : quartz/static/cp-stats.js
//  Saisie de parties (multijoueur), historique, et stats croisées.
//  Architecture par délégation sur document (robuste navigation SPA).
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ⬇️⬇️ REMPLACE CES DEUX VALEURS ⬇️⬇️
const SUPABASE_URL = "https://kucgmmefluwmlobujanc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_YB_VCzZgD2vi4xeFvFT6ZA_BA9Pwn7R";
// ⬆️⬆️ ----------------------------- ⬆️⬆️

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
 
// État module (survit aux nav)
let refPeuples = [], refScenarios = [], refDeploiements = [];
let parties = [], participations = [];
let armyLists = [];          // listes d'armées disponibles (army_lists)
let tab = "saisie";          // "saisie" | "historique" | "stats"
let statMode = "peuple";     // dimension d'analyse des stats
let nbJoueurs = 2;           // nombre de lignes de participants dans le formulaire
let wired = false;
 
function getApp() { return document.getElementById("cp-stats-app"); }
function $(id) { return document.getElementById(id); }
 
function esc(s) {
  return (s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
function frDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}
function pct(n, d) { return d === 0 ? "—" : Math.round((n / d) * 100) + " %"; }
 
async function loadAll() {
  const [rp, rs, rd, pa, pp, al] = await Promise.all([
    sb.from("ref_peuples").select("*").order("ordre"),
    sb.from("ref_scenarios").select("*").order("ordre"),
    sb.from("ref_deploiements").select("*").order("ordre"),
    sb.from("parties").select("*").order("created_at", { ascending: false }),
    sb.from("participations").select("*"),
    sb.from("army_lists").select("id, title, faction, author, points"),
  ]);
  refPeuples = rp.data || [];
  refScenarios = rs.data || [];
  refDeploiements = rd.data || [];
  parties = pa.data || [];
  participations = pp.data || [];
  armyLists = al.data || [];
  render();
}
 
// ---------- Rendu général ----------
function render() {
  const app = getApp();
  if (!app) return;
  const main = $("cp-stats-main");
  if (!main) return;
  // onglets actifs
  ["saisie", "historique", "stats"].forEach((t) => {
    const b = $("cp-tab-" + t);
    if (b) b.classList.toggle("active", tab === t);
  });
  if (tab === "saisie") main.innerHTML = renderSaisie();
  else if (tab === "historique") main.innerHTML = renderHistorique();
  else main.innerHTML = renderStats();
}
 
// ---------- Onglet Saisie ----------
function optionsFrom(list) {
  return '<option value="">—</option>' +
    list.map((x) => '<option value="' + esc(x.nom) + '">' + esc(x.nom) + "</option>").join("");
}
function resultatOptions() {
  return '<option value="victoire">Victoire</option>' +
    '<option value="defaite">Défaite</option>' +
    '<option value="egalite">Égalité</option>';
}
 
function participantRow(i) {
  return '<div class="cp-part-row" data-idx="' + i + '">' +
    '<span class="cp-part-num">J' + (i + 1) + '</span>' +
    '<input class="cp-p-joueur" placeholder="Joueur" />' +
    '<select class="cp-p-peuple">' + optionsFrom(refPeuples) + "</select>" +
    '<select class="cp-p-liste"><option value="">— archétype libre —</option></select>' +
    '<input class="cp-p-archetype" placeholder="Archétype" />' +
    '<input class="cp-p-pertes" type="number" min="0" placeholder="Pertes" />' +
    '<select class="cp-p-resultat">' + resultatOptions() + "</select>" +
    (i >= 2 ? '<button class="cp-part-del" title="Retirer">\u2715</button>' : "") +
  "</div>";
}
 
// Normalisation tolérante pour comparer un peuple (ref) et une faction (texte libre)
function normFaction(s) {
  return (s || "").toString().trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // retire les accents
}
 
// Remplit le menu des listes d'une ligne, filtré par le peuple choisi.
// Repli : si aucune liste ne correspond au peuple, on montre toutes les listes.
function fillListeMenu(row) {
  const sel = row.querySelector(".cp-p-liste");
  const peuple = row.querySelector(".cp-p-peuple").value;
  if (!sel) return;
  const np = normFaction(peuple);
  let matching = peuple ? armyLists.filter((l) => normFaction(l.faction) === np) : [];
  let note = "";
  if (peuple && matching.length === 0) { matching = armyLists; note = " (toutes — aucune ne correspond au peuple)"; }
  if (!peuple) matching = armyLists;
 
  const current = sel.value;
  sel.innerHTML = '<option value="">— archétype libre —</option>' +
    matching.map((l) => {
      const pts = l.points != null ? " (" + l.points + " pts)" : "";
      const auth = l.author ? " · " + l.author : "";
      return '<option value="' + l.id + '">' + esc(l.title) + pts + auth + "</option>";
    }).join("");
  // restaure la sélection si encore présente
  if ([...sel.options].some((o) => o.value === current)) sel.value = current;
  // libellé d'aide éventuel
  const hint = row.querySelector(".cp-liste-note");
  if (hint) hint.textContent = note;
}
 
function renderSaisie() {
  let rows = "";
  for (let i = 0; i < nbJoueurs; i++) rows += participantRow(i);
  return '<div class="cp-card">' +
    '<div class="cp-form-grid">' +
      '<div><label>Version</label><input id="cp-f-version" placeholder="ex. A3.1" /></div>' +
      '<div><label>Scénario</label><select id="cp-f-scenario">' + optionsFrom(refScenarios) + "</select></div>" +
      '<div><label>Déploiement</label><select id="cp-f-deploiement">' + optionsFrom(refDeploiements) + "</select></div>" +
      '<div><label>Saisi par</label><input id="cp-f-saisipar" placeholder="Ton nom" /></div>' +
    "</div>" +
    '<label class="cp-section-label">Participants</label>' +
    '<div id="cp-participants">' + rows + "</div>" +
    '<button class="cp-btn-ghost" id="cp-add-participant">+ Ajouter un joueur</button>' +
    '<div class="cp-form-actions">' +
      '<button class="cp-btn" id="cp-save-partie">Enregistrer la partie</button>' +
    "</div>" +
    '<div class="cp-msg" id="cp-save-msg"></div>' +
  "</div>";
}
 
async function savePartie() {
  const msg = $("cp-save-msg");
  msg.className = "cp-msg"; msg.textContent = "";
 
  const version = $("cp-f-version").value.trim() || null;
  const scenario = $("cp-f-scenario").value || null;
  const deploiement = $("cp-f-deploiement").value || null;
  const saisi_par = $("cp-f-saisipar").value.trim() || "Anonyme";
 
  // collecte des participants
  const rows = [...document.querySelectorAll(".cp-part-row")];
  const parts = [];
  for (const r of rows) {
    const joueur = r.querySelector(".cp-p-joueur").value.trim();
    const peuple = r.querySelector(".cp-p-peuple").value;
    const archetype = r.querySelector(".cp-p-archetype").value.trim() || null;
    const pertesRaw = r.querySelector(".cp-p-pertes").value.trim();
    const pertes = pertesRaw === "" ? null : parseInt(pertesRaw, 10);
    const resultat = r.querySelector(".cp-p-resultat").value;
    const army_list_id = r.querySelector(".cp-p-liste").value || null;
    if (!joueur && !peuple) continue; // ligne vide ignorée
    if (!joueur || !peuple) {
      msg.className = "cp-msg err";
      msg.textContent = "Chaque participant doit avoir un joueur ET un peuple.";
      return;
    }
    parts.push({ joueur, peuple, archetype, pertes, resultat, army_list_id });
  }
  if (parts.length < 2) {
    msg.className = "cp-msg err";
    msg.textContent = "Une partie nécessite au moins 2 participants.";
    return;
  }
 
  const btn = $("cp-save-partie");
  btn.disabled = true;
 
  // 1) créer la partie
  const { data: pData, error: pErr } = await sb
    .from("parties")
    .insert({ version, scenario, deploiement, saisi_par })
    .select();
  if (pErr || !pData || !pData.length) {
    btn.disabled = false;
    msg.className = "cp-msg err";
    msg.textContent = "Échec (partie) : " + (pErr ? pErr.message : "aucune ligne créée");
    return;
  }
  const partieId = pData[0].id;
 
  // 2) créer les participations
  const rowsToInsert = parts.map((p) => ({ ...p, partie_id: partieId }));
  const { error: ppErr } = await sb.from("participations").insert(rowsToInsert);
  if (ppErr) {
    btn.disabled = false;
    msg.className = "cp-msg err";
    msg.textContent = "Échec (participations) : " + ppErr.message;
    return;
  }
 
  btn.disabled = false;
  msg.className = "cp-msg ok";
  msg.textContent = "Partie enregistrée !";
  nbJoueurs = 2;
  await loadAll();           // recharge et re-render
  tab = "saisie"; render();  // reste sur la saisie, formulaire vidé
}
 
// ---------- Onglet Historique ----------
function partParts(partieId) {
  return participations.filter((p) => p.partie_id === partieId);
}
function renderHistorique() {
  if (!parties.length) return '<p class="cp-empty">Aucune partie enregistrée pour l\'instant.</p>';
  const listById = {};
  armyLists.forEach((l) => { listById[l.id] = l; });
  const rows = parties.map((pa) => {
    const ps = partParts(pa.id);
    const camps = ps.map((p) => {
      const cls = p.resultat === "victoire" ? "cp-win" : (p.resultat === "egalite" ? "cp-draw" : "cp-lose");
      // armée affichée : liste liée en priorité, sinon archétype libre
      let army = "";
      if (p.army_list_id && listById[p.army_list_id]) army = " — " + esc(listById[p.army_list_id].title);
      else if (p.archetype) army = " — " + esc(p.archetype);
      return '<span class="cp-camp ' + cls + '">' + esc(p.joueur) + " (" + esc(p.peuple) + army + ")</span>";
    }).join(" vs ");
    return '<tr data-partie="' + pa.id + '">' +
      "<td>" + esc(pa.scenario || "—") + "</td>" +
      "<td>" + camps + "</td>" +
      '<td class="cp-c-date">' + frDate(pa.created_at) + "</td>" +
      '<td class="cp-c-act"><button class="cp-partie-del" data-id="' + pa.id + '" title="Supprimer">\u2715</button></td>' +
      "</tr>";
  }).join("");
  return '<table class="cp-table"><thead><tr><th>Scénario</th><th>Opposition</th><th>Date</th><th></th></tr></thead><tbody>' +
    rows + "</tbody></table>";
}
async function deletePartie(id) {
  if (!confirm("Supprimer cette partie et ses résultats ? Action définitive.")) return;
  const { error } = await sb.from("parties").delete().eq("id", id);
  if (error) { alert("Échec : " + error.message); return; }
  await loadAll();
  tab = "historique"; render();
}
 
// ---------- Onglet Stats ----------
function renderStats() {
  if (!participations.length) return '<p class="cp-empty">Pas encore de données. Enregistre des parties pour voir les statistiques.</p>';
 
  const dims = [
    ["peuple", "Par peuple"],
    ["joueur", "Par joueur"],
    ["scenario", "Par scénario"],
    ["deploiement", "Par déploiement"],
    ["matchup", "Matchups peuple vs peuple"],
  ];
  const switcher = '<div class="cp-statswitch">' +
    dims.map(([k, lbl]) => '<button class="cp-statbtn' + (statMode === k ? " active" : "") +
      '" data-stat="' + k + '">' + lbl + "</button>").join("") + "</div>";
 
  let table;
  if (statMode === "matchup") table = renderMatchups();
  else if (statMode === "scenario" || statMode === "deploiement") table = renderByPartieDim(statMode);
  else table = renderByParticipantDim(statMode); // peuple | joueur
 
  return switcher + table;
}
 
// Stats sur une dimension portée par la participation (peuple, joueur)
function renderByParticipantDim(dim) {
  const map = {};
  participations.forEach((p) => {
    const key = p[dim] || "—";
    if (!map[key]) map[key] = { total: 0, v: 0, d: 0, e: 0, pertes: 0, nPertes: 0 };
    const m = map[key];
    m.total++;
    if (p.resultat === "victoire") m.v++;
    else if (p.resultat === "egalite") m.e++;
    else m.d++;
    if (p.pertes != null) { m.pertes += p.pertes; m.nPertes++; }
  });
  const rows = Object.entries(map)
    .sort((a, b) => (b[1].v / b[1].total) - (a[1].v / a[1].total))
    .map(([key, m]) => {
      const avgPertes = m.nPertes ? Math.round(m.pertes / m.nPertes) : "—";
      return "<tr><td class=\"cp-c-key\">" + esc(key) + "</td>" +
        "<td>" + m.total + "</td>" +
        '<td class="cp-win">' + m.v + "</td>" +
        '<td class="cp-lose">' + m.d + "</td>" +
        '<td class="cp-draw">' + m.e + "</td>" +
        '<td class="cp-c-rate">' + pct(m.v, m.total) + "</td>" +
        "<td>" + avgPertes + "</td></tr>";
    }).join("");
  return '<table class="cp-table"><thead><tr>' +
    "<th>" + (dim === "peuple" ? "Peuple" : "Joueur") + "</th>" +
    "<th>Parties</th><th>V</th><th>D</th><th>É</th><th>Taux victoire</th><th>Pertes moy.</th>" +
    "</tr></thead><tbody>" + rows + "</tbody></table>";
}
 
// Stats sur une dimension portée par la partie (scenario, deploiement)
// => on compte les parties, pas les participations
function renderByPartieDim(dim) {
  const map = {};
  parties.forEach((pa) => {
    const key = pa[dim] || "—";
    if (!map[key]) map[key] = 0;
    map[key]++;
  });
  const rows = Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([key, n]) => "<tr><td class=\"cp-c-key\">" + esc(key) + "</td><td>" + n + "</td></tr>")
    .join("");
  return '<table class="cp-table"><thead><tr><th>' +
    (dim === "scenario" ? "Scénario" : "Déploiement") +
    "</th><th>Parties jouées</th></tr></thead><tbody>" + rows + "</tbody></table>";
}
 
// Matchups : pour chaque paire de peuples ayant joué l'un contre l'autre
function renderMatchups() {
  // On parcourt chaque partie à 2 participants (matchup classique)
  const map = {}; // "A|B" -> {aWins, bWins, draws}
  parties.forEach((pa) => {
    const ps = partParts(pa.id);
    if (ps.length !== 2) return; // matchups définis pour le duel
    const [x, y] = ps;
    const a = x.peuple, b = y.peuple;
    if (!a || !b) return;
    const key = [a, b].sort().join("|");
    const [first] = key.split("|");
    if (!map[key]) map[key] = { first, a: 0, b: 0, e: 0 };
    const m = map[key];
    if (x.resultat === "egalite" || y.resultat === "egalite") { m.e++; return; }
    const winnerPeuple = x.resultat === "victoire" ? a : b;
    if (winnerPeuple === m.first) m.a++; else m.b++;
  });
  const entries = Object.entries(map);
  if (!entries.length) return '<p class="cp-empty">Aucun duel (2 joueurs) enregistré pour calculer des matchups.</p>';
  const rows = entries.sort((u, v) => (v[1].a + v[1].b + v[1].e) - (u[1].a + u[1].b + u[1].e))
    .map(([key, m]) => {
      const [a, b] = key.split("|");
      const total = m.a + m.b + m.e;
      return "<tr><td class=\"cp-c-key\">" + esc(a) + " vs " + esc(b) + "</td>" +
        "<td>" + total + "</td>" +
        "<td>" + m.a + " – " + m.b + (m.e ? " (" + m.e + " nul" + (m.e > 1 ? "s" : "") + ")" : "") + "</td>" +
        '<td class="cp-c-rate">' + pct(m.a, m.a + m.b) + "</td></tr>";
    }).join("");
  return '<table class="cp-table"><thead><tr><th>Matchup</th><th>Duels</th><th>Score</th><th>Taux (1er peuple)</th></tr></thead><tbody>' +
    rows + "</tbody></table>" +
    '<p class="cp-hint">Le « taux » correspond au premier peuple cité. Seuls les duels à 2 joueurs sont comptés ici.</p>';
}
 
// ---------- Câblage délégué (une fois) ----------
function wireOnce() {
  if (wired) return;
  wired = true;
 
  document.addEventListener("click", (e) => {
    if (!getApp()) return;
 
    // onglets
    const tabBtn = e.target.closest("[data-tab]");
    if (tabBtn && getApp().contains(tabBtn)) { tab = tabBtn.dataset.tab; render(); return; }
 
    // switch de stats
    const sb2 = e.target.closest(".cp-statbtn");
    if (sb2 && getApp().contains(sb2)) { statMode = sb2.dataset.stat; render(); return; }
 
    // ajouter un participant
    if (e.target.closest("#cp-add-participant")) {
      nbJoueurs++;
      // on préserve les valeurs déjà saisies en re-render ? -> simple : append
      const cont = $("cp-participants");
      cont.insertAdjacentHTML("beforeend", participantRowKeepFocus(nbJoueurs - 1));
      return;
    }
    // retirer un participant
    const delP = e.target.closest(".cp-part-del");
    if (delP && getApp().contains(delP)) {
      const row = delP.closest(".cp-part-row");
      if (row) { row.remove(); nbJoueurs = Math.max(2, document.querySelectorAll(".cp-part-row").length); }
      return;
    }
 
    // enregistrer
    if (e.target.closest("#cp-save-partie")) { savePartie(); return; }
 
    // supprimer une partie
    const delPa = e.target.closest(".cp-partie-del");
    if (delPa && getApp().contains(delPa)) { deletePartie(delPa.dataset.id); return; }
  });
 
  // Changements dans les menus de saisie
  document.addEventListener("change", (e) => {
    if (!getApp()) return;
 
    // changement de peuple -> recharge le menu des listes de cette ligne
    const pe = e.target.closest(".cp-p-peuple");
    if (pe && getApp().contains(pe)) {
      const row = pe.closest(".cp-part-row");
      if (row) fillListeMenu(row);
      return;
    }
 
    // choix d'une liste -> désactive l'archétype libre (et inversement)
    const li = e.target.closest(".cp-p-liste");
    if (li && getApp().contains(li)) {
      const row = li.closest(".cp-part-row");
      const arch = row && row.querySelector(".cp-p-archetype");
      if (arch) {
        if (li.value) { arch.value = ""; arch.disabled = true; arch.placeholder = "(liste choisie)"; }
        else { arch.disabled = false; arch.placeholder = "Archétype"; }
      }
      return;
    }
  });
}
 
// variante d'ajout qui n'efface pas le formulaire existant
function participantRowKeepFocus(i) {
  return participantRow(i);
}
 
// ---------- Setup ----------
function setup() {
  if (!getApp()) return;
  wireOnce();
  loadAll();
}
 
if (document.readyState !== "loading") setup();
else document.addEventListener("DOMContentLoaded", setup);
document.addEventListener("nav", setup);