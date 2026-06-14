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
let refPeuples = [], refScenarios = [], refDeploiements = [], refVersions = [];
let parties = [], participations = [];
let armyLists = [];          // listes d'armées disponibles (army_lists)
let tab = "saisie";          // "saisie" | "historique" | "stats"
let editingPartieId = null;  // id de la partie en cours d'édition (null = création)
let editData = null;         // {partie, participations} à pré-remplir dans le formulaire
let statMode = "peuple";     // dimension d'analyse des stats
let statFiltreVersion = "";  // filtre version appliqué aux stats
let statFiltreJoueur = "";    // filtre joueur
let statFiltreFaction = "";   // filtre faction (peuple)
let chartInstances = [];      // graphiques Chart.js actifs (à détruire avant re-render)
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
  const [rp, rs, rd, pa, pp, al, rv] = await Promise.all([
    sb.from("ref_peuples").select("*").order("ordre"),
    sb.from("ref_scenarios").select("*").order("ordre"),
    sb.from("ref_deploiements").select("*").order("ordre"),
    sb.from("parties").select("*").order("created_at", { ascending: false }),
    sb.from("participations").select("*"),
    sb.from("army_lists").select("id, title, faction, author, points"),
    sb.from("ref_versions").select("*").order("ordre"),
  ]);
  refPeuples = rp.data || [];
  refScenarios = rs.data || [];
  refDeploiements = rd.data || [];
  parties = pa.data || [];
  participations = pp.data || [];
  armyLists = al.data || [];
  refVersions = rv.data || [];
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
  if (tab === "saisie") { main.innerHTML = renderSaisie(); applyEditData(); }
  else if (tab === "historique") main.innerHTML = renderHistorique();
  else { main.innerHTML = renderStats(); drawCharts(); }
  forceRepaint(app);
}
 
// Force le navigateur à repeindre la zone après injection de contenu.
// Corrige un bug d'affichage où, après une navigation SPA Quartz, le DOM
// est à jour mais l'écran n'est pas rafraîchi tant qu'aucun événement
// (scroll, resize...) ne survient.
function forceRepaint(el) {
  if (!el) return;
  // double rAF : on attend que le navigateur ait terminé son cycle de layout,
  // puis on provoque un changement de style imperceptible qui force le repaint.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const prev = el.style.transform;
      el.style.transform = "translateZ(0)";
      void el.offsetHeight;            // lecture => reflow forcé
      el.style.transform = prev || "";
    });
  });
}
 
// ---------- Onglet Saisie ----------
function optionsFrom(list) {
  return '<option value="">—</option>' +
    list.map((x) => '<option value="' + esc(x.nom) + '">' + esc(x.nom) + "</option>").join("");
}
function resultatOptions() {
  return '<option value="">— résultat —</option>' +
    '<option value="victoire">Victoire</option>' +
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
  // En édition, on génère autant de lignes que de participants existants
  const nb = editData ? editData.participations.length : nbJoueurs;
  let rows = "";
  for (let i = 0; i < nb; i++) rows += participantRow(i);
  const enEdition = !!editingPartieId;
  return '<div class="cp-card">' +
    (enEdition ? '<div class="cp-form-mode" id="cp-edit-banner">Modification d\'une partie</div>' : "") +
    '<div class="cp-form-grid">' +
      '<div><label>Version</label><select id="cp-f-version">' + optionsFrom(refVersions) + "</select></div>" +
      '<div><label>Scénario</label><select id="cp-f-scenario">' + optionsFrom(refScenarios) + "</select></div>" +
      '<div><label>Déploiement</label><select id="cp-f-deploiement">' + optionsFrom(refDeploiements) + "</select></div>" +
      '<div><label>Saisi par</label><input id="cp-f-saisipar" placeholder="Ton nom" /></div>' +
    "</div>" +
    '<label class="cp-section-label">Participants</label>' +
    '<div id="cp-participants">' + rows + "</div>" +
    '<button class="cp-btn-ghost" id="cp-add-participant">+ Ajouter un joueur</button>' +
    '<div class="cp-form-actions">' +
      '<button class="cp-btn" id="cp-save-partie">' + (enEdition ? "Mettre à jour" : "Enregistrer la partie") + "</button>" +
      (enEdition ? '<button class="cp-btn ghost" id="cp-cancel-edit">Annuler</button>' : "") +
    "</div>" +
    '<div class="cp-msg" id="cp-save-msg"></div>' +
  "</div>";
}
 
// Applique les valeurs de editData dans le formulaire (après rendu)
function applyEditData() {
  if (!editData) return;
  const pa = editData.partie;
  if ($("cp-f-version")) $("cp-f-version").value = pa.version || "";
  if ($("cp-f-scenario")) $("cp-f-scenario").value = pa.scenario || "";
  if ($("cp-f-deploiement")) $("cp-f-deploiement").value = pa.deploiement || "";
  if ($("cp-f-saisipar")) $("cp-f-saisipar").value = pa.saisi_par || "";
 
  const rows = [...document.querySelectorAll(".cp-part-row")];
  editData.participations.forEach((p, i) => {
    const row = rows[i];
    if (!row) return;
    row.querySelector(".cp-p-joueur").value = p.joueur || "";
    row.querySelector(".cp-p-peuple").value = p.peuple || "";
    fillListeMenu(row); // remplit le menu listes selon le peuple
    const liste = row.querySelector(".cp-p-liste");
    if (p.army_list_id && [...liste.options].some((o) => o.value === p.army_list_id)) {
      liste.value = p.army_list_id;
      const arch = row.querySelector(".cp-p-archetype");
      arch.value = ""; arch.disabled = true; arch.placeholder = "(liste choisie)";
    } else {
      row.querySelector(".cp-p-archetype").value = p.archetype || "";
    }
    if (p.pertes != null) row.querySelector(".cp-p-pertes").value = p.pertes;
    row.querySelector(".cp-p-resultat").value = p.resultat || "";
  });
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
    if (!resultat) {
      msg.className = "cp-msg err";
      msg.textContent = "Indique le résultat de chaque participant (victoire, défaite ou égalité).";
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
 
  let partieId;
  if (editingPartieId) {
    // --- MODE ÉDITION ---
    // 1) mettre à jour le contexte de la partie
    const { error: upErr } = await sb.from("parties")
      .update({ version, scenario, deploiement, saisi_par })
      .eq("id", editingPartieId);
    if (upErr) {
      btn.disabled = false;
      msg.className = "cp-msg err";
      msg.textContent = "Échec (mise à jour partie) : " + upErr.message;
      return;
    }
    partieId = editingPartieId;
    // 2) remplacer les participations : on supprime puis on réinsère
    const { error: delErr } = await sb.from("participations").delete().eq("partie_id", partieId);
    if (delErr) {
      btn.disabled = false;
      msg.className = "cp-msg err";
      msg.textContent = "Échec (nettoyage participations) : " + delErr.message;
      return;
    }
  } else {
    // --- MODE CRÉATION ---
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
    partieId = pData[0].id;
  }
 
  // insertion des participations (commun aux deux modes)
  const rowsToInsert = parts.map((p) => ({ ...p, partie_id: partieId }));
  const { error: ppErr } = await sb.from("participations").insert(rowsToInsert);
  if (ppErr) {
    btn.disabled = false;
    msg.className = "cp-msg err";
    msg.textContent = "Échec (participations) : " + ppErr.message;
    return;
  }
 
  btn.disabled = false;
  const etaitEdition = !!editingPartieId;
  editingPartieId = null;
  editData = null;
  nbJoueurs = 2;
  await loadAll();
  if (etaitEdition) { tab = "historique"; render(); }   // retour à l'historique après édition
  else { tab = "saisie"; render(); }                     // reste en saisie après création
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
      '<td class="cp-c-act">' +
        '<button class="cp-partie-edit" data-id="' + pa.id + '" title="Modifier">\u270E</button>' +
        '<button class="cp-partie-del" data-id="' + pa.id + '" title="Supprimer">\u2715</button>' +
      "</td>" +
      "</tr>";
  }).join("");
  return '<table class="cp-table"><thead><tr><th>Scénario</th><th>Opposition</th><th>Date</th><th></th></tr></thead><tbody>' +
    rows + "</tbody></table>";
}
 
function startEditPartie(id) {
  const pa = parties.find((x) => x.id === id);
  if (!pa) return;
  const parts = participations.filter((p) => p.partie_id === id);
  editingPartieId = id;
  editData = { partie: pa, participations: parts };
  tab = "saisie";
  render();
  const app = getApp();
  if (app) app.scrollIntoView({ behavior: "smooth", block: "start" });
}
 
function cancelEditPartie() {
  editingPartieId = null;
  editData = null;
  nbJoueurs = 2;
  render();
}
 
async function deletePartie(id) {
  if (!confirm("Supprimer cette partie et ses résultats ? Action définitive.")) return;
  const { error } = await sb.from("parties").delete().eq("id", id);
  if (error) { alert("Échec : " + error.message); return; }
  await loadAll();
  tab = "historique"; render();
}
 
// ---------- Onglet Stats ----------
// Détruit les graphiques Chart.js existants avant un nouveau rendu
function destroyCharts() {
  chartInstances.forEach((c) => { try { c.destroy(); } catch (e) {} });
  chartInstances = [];
}
 
// Renvoie les participations filtrées selon les filtres stats actifs.
// Le filtre version porte sur la partie ; joueur et faction sur la participation.
function statParticipations() {
  const partieOk = {};
  parties.forEach((pa) => {
    partieOk[pa.id] = !statFiltreVersion || pa.version === statFiltreVersion;
  });
  return participations.filter((p) => {
    if (!partieOk[p.partie_id]) return false;
    if (statFiltreJoueur && p.joueur !== statFiltreJoueur) return false;
    if (statFiltreFaction && p.peuple !== statFiltreFaction) return false;
    return true;
  });
}
// Parties filtrées (pour les calculs au niveau partie : matchups, répartition)
function statParties() {
  return parties.filter((pa) => !statFiltreVersion || pa.version === statFiltreVersion);
}
 
function renderStats() {
  if (!participations.length) return '<p class="cp-empty">Pas encore de données. Enregistre des parties pour voir les statistiques.</p>';
 
  // Listes de valeurs pour les menus de filtre
  const joueurs = [...new Set(participations.map((p) => p.joueur).filter(Boolean))].sort();
  const versions = [...new Set(parties.map((p) => p.version).filter(Boolean))].sort();
  const factions = [...new Set(participations.map((p) => p.peuple).filter(Boolean))].sort();
 
  const opt = (list, current) => '<option value="">— tous —</option>' +
    list.map((v) => '<option value="' + esc(v) + '"' + (v === current ? " selected" : "") + ">" + esc(v) + "</option>").join("");
 
  const filtres = '<div class="cp-stat-filtres">' +
    '<div><label>Version</label><select id="cp-stat-f-version">' + opt(versions, statFiltreVersion) + "</select></div>" +
    '<div><label>Joueur</label><select id="cp-stat-f-joueur">' + opt(joueurs, statFiltreJoueur) + "</select></div>" +
    '<div><label>Faction</label><select id="cp-stat-f-faction">' + opt(factions, statFiltreFaction) + "</select></div>" +
    "</div>";
 
  const dims = [
    ["peuple", "Par peuple"],
    ["joueur", "Par joueur"],
    ["scenario", "Par scénario"],
    ["deploiement", "Par déploiement"],
    ["matchup", "Matchups"],
  ];
  const switcher = '<div class="cp-statswitch">' +
    dims.map(([k, lbl]) => '<button class="cp-statbtn' + (statMode === k ? " active" : "") +
      '" data-stat="' + k + '">' + lbl + "</button>").join("") + "</div>";
 
  let contenu;
  if (statMode === "matchup") contenu = renderMatchups();
  else if (statMode === "scenario" || statMode === "deploiement") contenu = renderByPartieDim(statMode);
  else contenu = renderByParticipantDim(statMode);
 
  return filtres + switcher + contenu + renderEvolution();
}
 
// Stats sur une dimension portée par la participation (peuple, joueur)
function renderByParticipantDim(dim) {
  const data = statParticipations();
  const map = {};
  data.forEach((p) => {
    const key = p[dim] || "—";
    if (!map[key]) map[key] = { total: 0, v: 0, d: 0, e: 0, pertes: 0, nPertes: 0 };
    const m = map[key];
    m.total++;
    if (p.resultat === "victoire") m.v++;
    else if (p.resultat === "egalite") m.e++;
    else m.d++;
    if (p.pertes != null) { m.pertes += p.pertes; m.nPertes++; }
  });
  const entries = Object.entries(map).sort((a, b) => (b[1].v / b[1].total) - (a[1].v / a[1].total));
  if (!entries.length) return '<p class="cp-empty">Aucune donnée pour ces filtres.</p>';
 
  const rows = entries.map(([key, m]) => {
    const avgPertes = m.nPertes ? Math.round(m.pertes / m.nPertes) : "—";
    return "<tr><td class=\"cp-c-key\">" + esc(key) + "</td>" +
      "<td>" + m.total + "</td>" +
      '<td class="cp-win">' + m.v + "</td>" +
      '<td class="cp-lose">' + m.d + "</td>" +
      '<td class="cp-draw">' + m.e + "</td>" +
      '<td class="cp-c-rate">' + pct(m.v, m.total) + "</td>" +
      "<td>" + avgPertes + "</td></tr>";
  }).join("");
  const table = '<table class="cp-table"><thead><tr>' +
    "<th>" + (dim === "peuple" ? "Peuple" : "Joueur") + "</th>" +
    "<th>Parties</th><th>V</th><th>D</th><th>É</th><th>Taux victoire</th><th>Pertes moy.</th>" +
    "</tr></thead><tbody>" + rows + "</tbody></table>";
 
  // Données pour graphiques : on garde l'ordre par taux de victoire
  const labels = entries.map(([k]) => k);
  const taux = entries.map(([, m]) => Math.round((m.v / m.total) * 100));
  const repartition = entries.map(([, m]) => m.total);
  // On stocke les données dans des attributs pour que drawCharts les lise après injection
  const payload = encodeURIComponent(JSON.stringify({ labels, taux, repartition, dimLabel: dim === "peuple" ? "peuple" : "joueur" }));
 
  return '<div class="cp-charts">' +
      '<div class="cp-chart-box"><h4>Taux de victoire</h4><canvas id="cp-chart-bars"></canvas></div>' +
      '<div class="cp-chart-box"><h4>Répartition des parties</h4><canvas id="cp-chart-pie"></canvas></div>' +
    "</div>" +
    '<div id="cp-chart-data" data-payload="' + payload + '" hidden></div>' +
    table;
}
 
// Stats sur une dimension portée par la partie (scenario, deploiement)
function renderByPartieDim(dim) {
  const data = statParties();
  // si filtre joueur/faction actif, on restreint aux parties où ils apparaissent
  let allowed = null;
  if (statFiltreJoueur || statFiltreFaction) {
    allowed = new Set(statParticipations().map((p) => p.partie_id));
  }
  const map = {};
  data.forEach((pa) => {
    if (allowed && !allowed.has(pa.id)) return;
    const key = pa[dim] || "—";
    map[key] = (map[key] || 0) + 1;
  });
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return '<p class="cp-empty">Aucune donnée pour ces filtres.</p>';
 
  const rows = entries.map(([key, n]) => "<tr><td class=\"cp-c-key\">" + esc(key) + "</td><td>" + n + "</td></tr>").join("");
  const table = '<table class="cp-table"><thead><tr><th>' +
    (dim === "scenario" ? "Scénario" : "Déploiement") +
    "</th><th>Parties jouées</th></tr></thead><tbody>" + rows + "</tbody></table>";
 
  const payload = encodeURIComponent(JSON.stringify({
    labels: entries.map(([k]) => k), repartition: entries.map(([, n]) => n), onlyPie: true,
  }));
  return '<div class="cp-charts">' +
      '<div class="cp-chart-box"><h4>Répartition des parties</h4><canvas id="cp-chart-pie"></canvas></div>' +
    "</div>" +
    '<div id="cp-chart-data" data-payload="' + payload + '" hidden></div>' +
    table;
}
 
// Matchups : heatmap peuple × peuple + table, sur les duels à 2 joueurs
function renderMatchups() {
  const paList = statParties();
  const allowed = (statFiltreJoueur || statFiltreFaction) ? new Set(statParticipations().map((p) => p.partie_id)) : null;
 
  // map "A|B" (trié) -> {first, a, b, e}
  const map = {};
  // ensemble des peuples impliqués (pour la grille)
  const peuplesSet = new Set();
  paList.forEach((pa) => {
    if (allowed && !allowed.has(pa.id)) return;
    const ps = partParts(pa.id);
    if (ps.length !== 2) return;
    const [x, y] = ps;
    const a = x.peuple, b = y.peuple;
    if (!a || !b) return;
    peuplesSet.add(a); peuplesSet.add(b);
    const key = [a, b].sort().join("|");
    const first = key.split("|")[0];
    if (!map[key]) map[key] = { first, a: 0, b: 0, e: 0 };
    const m = map[key];
    if (x.resultat === "egalite" || y.resultat === "egalite") { m.e++; return; }
    const winner = x.resultat === "victoire" ? a : b;
    if (winner === m.first) m.a++; else m.b++;
  });
 
  const entries = Object.entries(map);
  if (!entries.length) return '<p class="cp-empty">Aucun duel (2 joueurs) enregistré pour ces filtres.</p>';
 
  // ----- Heatmap -----
  const peuples = [...peuplesSet].sort();
  // tauxFor(ligne, colonne) = taux de victoire de "ligne" contre "colonne"
  function cell(rowP, colP) {
    if (rowP === colP) return { txt: "", bg: "var(--lightgray)", n: 0 };
    const key = [rowP, colP].sort().join("|");
    const m = map[key];
    if (!m) return { txt: "·", bg: "transparent", n: 0 };
    const total = m.a + m.b;
    // victoires de rowP
    const rowWins = (rowP === m.first) ? m.a : m.b;
    if (total === 0) return { txt: "nul", bg: "transparent", n: m.e };
    const t = Math.round((rowWins / total) * 100);
    // couleur : rouge (0%) -> jaune (50%) -> vert (100%)
    const hue = Math.round((t / 100) * 120); // 0=rouge,120=vert
    return { txt: t + "%", bg: "hsl(" + hue + ", 55%, 75%)", n: total };
  }
  let heat = '<div class="cp-heat-wrap"><table class="cp-heat"><thead><tr><th></th>';
  peuples.forEach((p) => { heat += '<th title="' + esc(p) + '">' + esc(p) + "</th>"; });
  heat += "</tr></thead><tbody>";
  peuples.forEach((rowP) => {
    heat += '<tr><th title="' + esc(rowP) + '">' + esc(rowP) + "</th>";
    peuples.forEach((colP) => {
      const c = cell(rowP, colP);
      const title = rowP + " vs " + colP + (c.n ? " (" + c.n + ")" : "");
      heat += '<td style="background:' + c.bg + '" title="' + esc(title) + '">' + c.txt + "</td>";
    });
    heat += "</tr>";
  });
  heat += "</tbody></table></div>";
 
  // ----- Table détaillée -----
  const rows = entries.sort((u, v) => (v[1].a + v[1].b + v[1].e) - (u[1].a + u[1].b + u[1].e))
    .map(([key, m]) => {
      const [a, b] = key.split("|");
      const total = m.a + m.b + m.e;
      return "<tr><td class=\"cp-c-key\">" + esc(a) + " vs " + esc(b) + "</td>" +
        "<td>" + total + "</td>" +
        "<td>" + m.a + " – " + m.b + (m.e ? " (" + m.e + " nul" + (m.e > 1 ? "s" : "") + ")" : "") + "</td>" +
        '<td class="cp-c-rate">' + pct(m.a, m.a + m.b) + "</td></tr>";
    }).join("");
  const table = '<table class="cp-table"><thead><tr><th>Matchup</th><th>Duels</th><th>Score</th><th>Taux (1er)</th></tr></thead><tbody>' +
    rows + "</tbody></table>";
 
  return '<p class="cp-hint">Lecture de la heatmap : chaque case = taux de victoire du peuple en ligne contre le peuple en colonne. Vert = favorable, rouge = défavorable. Survole pour le nombre de duels.</p>' +
    heat + table;
}
 
// Évolution temporelle par version (courbe) — graphique transverse affiché en bas
function renderEvolution() {
  // taux de victoire par version, pour la faction filtrée (ou globalement si aucune)
  const versionsOrdre = refVersions.map((r) => r.nom);
  const partieVersion = {};
  parties.forEach((pa) => { partieVersion[pa.id] = pa.version; });
  const acc = {}; // version -> {v, total}
  participations.forEach((p) => {
    if (statFiltreJoueur && p.joueur !== statFiltreJoueur) return;
    if (statFiltreFaction && p.peuple !== statFiltreFaction) return;
    const ver = partieVersion[p.partie_id];
    if (!ver) return;
    if (!acc[ver]) acc[ver] = { v: 0, total: 0 };
    acc[ver].total++;
    if (p.resultat === "victoire") acc[ver].v++;
  });
  const versionsPresentes = versionsOrdre.filter((v) => acc[v]);
  if (versionsPresentes.length < 2) return ""; // pas assez de points pour une courbe
  const payload = encodeURIComponent(JSON.stringify({
    labels: versionsPresentes,
    taux: versionsPresentes.map((v) => Math.round((acc[v].v / acc[v].total) * 100)),
  }));
  return '<div class="cp-chart-box cp-chart-full"><h4>Évolution du taux de victoire par version' +
    (statFiltreFaction ? " — " + esc(statFiltreFaction) : "") + '</h4>' +
    '<canvas id="cp-chart-line"></canvas>' +
    '<div id="cp-line-data" data-payload="' + payload + '" hidden></div></div>';
}
 
 
// Palette pour camemberts (couleurs douces, lisibles en clair/sombre)
const CHART_COLORS = [
  "#6b8cbe", "#b58a4a", "#7fae6f", "#b56b6b", "#8a6bb5",
  "#5fae9e", "#be9a5f", "#9ebe5f", "#be5f8a", "#6b9ebe",
];
 
// Lit la couleur de texte courante (pour que les graphiques suivent le thème)
function chartTextColor() {
  const c = getComputedStyle(document.body).getPropertyValue("--dark").trim();
  return c || "#2b2520";
}
 
// Instancie les graphiques Chart.js à partir des payloads injectés dans le DOM.
// Appelée après chaque rendu de l'onglet stats.
function drawCharts() {
  destroyCharts();
  const txt = chartTextColor();
  Chart.defaults.color = txt;
  Chart.defaults.font.family = "Georgia, serif";
 
  // Barres + camembert (dimension peuple/joueur)
  const dataEl = document.getElementById("cp-chart-data");
  if (dataEl) {
    let d;
    try { d = JSON.parse(decodeURIComponent(dataEl.dataset.payload)); } catch (e) { d = null; }
    if (d) {
      const bars = document.getElementById("cp-chart-bars");
      if (bars && d.taux) {
        chartInstances.push(new Chart(bars, {
          type: "bar",
          data: { labels: d.labels, datasets: [{ label: "Taux de victoire (%)", data: d.taux, backgroundColor: "#7fae6f" }] },
          options: {
            indexAxis: "y", responsive: true, plugins: { legend: { display: false } },
            scales: { x: { min: 0, max: 100, ticks: { callback: (v) => v + "%" } } },
          },
        }));
      }
      const pie = document.getElementById("cp-chart-pie");
      if (pie && d.repartition) {
        chartInstances.push(new Chart(pie, {
          type: "doughnut",
          data: { labels: d.labels, datasets: [{ data: d.repartition, backgroundColor: CHART_COLORS }] },
          options: { responsive: true, plugins: { legend: { position: "right" } } },
        }));
      }
    }
  }
 
  // Courbe d'évolution par version
  const lineEl = document.getElementById("cp-line-data");
  if (lineEl) {
    let d;
    try { d = JSON.parse(decodeURIComponent(lineEl.dataset.payload)); } catch (e) { d = null; }
    const line = document.getElementById("cp-chart-line");
    if (d && line) {
      chartInstances.push(new Chart(line, {
        type: "line",
        data: { labels: d.labels, datasets: [{ label: "Taux de victoire (%)", data: d.taux, borderColor: "#6b8cbe", backgroundColor: "#6b8cbe33", tension: 0.25, fill: true }] },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100, ticks: { callback: (v) => v + "%" } } } },
      }));
    }
  }
}
 
// ---------- Câblage délégué (une fois) ----------
function wireOnce() {
  if (wired) return;
  wired = true;
 
  document.addEventListener("click", (e) => {
    if (!getApp()) return;
 
    // onglets
    const tabBtn = e.target.closest("[data-tab]");
    if (tabBtn && getApp().contains(tabBtn)) {
      // si on quitte la saisie en cours d'édition, on annule proprement le mode édition
      if (editingPartieId && tabBtn.dataset.tab !== "saisie") {
        editingPartieId = null; editData = null; nbJoueurs = 2;
      }
      tab = tabBtn.dataset.tab; render(); return;
    }
 
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
 
    // enregistrer / mettre à jour
    if (e.target.closest("#cp-save-partie")) { savePartie(); return; }
 
    // annuler l'édition
    if (e.target.closest("#cp-cancel-edit")) { cancelEditPartie(); return; }
 
    // éditer une partie
    const editPa = e.target.closest(".cp-partie-edit");
    if (editPa && getApp().contains(editPa)) { startEditPartie(editPa.dataset.id); return; }
 
    // supprimer une partie
    const delPa = e.target.closest(".cp-partie-del");
    if (delPa && getApp().contains(delPa)) { deletePartie(delPa.dataset.id); return; }
  });
 
  // Changements dans les menus de saisie
  document.addEventListener("change", (e) => {
    if (!getApp()) return;
 
    // filtres de statistiques
    if (e.target.id === "cp-stat-f-version") { statFiltreVersion = e.target.value; render(); return; }
    if (e.target.id === "cp-stat-f-joueur")  { statFiltreJoueur = e.target.value; render(); return; }
    if (e.target.id === "cp-stat-f-faction") { statFiltreFaction = e.target.value; render(); return; }
 
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
 
    // pré-remplissage intelligent des résultats
    const res = e.target.closest(".cp-p-resultat");
    if (res && getApp().contains(res)) {
      const allRes = [...document.querySelectorAll(".cp-p-resultat")];
      if (res.value === "victoire") {
        // les autres passent en défaite (cas du duel : finit la saisie)
        allRes.forEach((s) => { if (s !== res) s.value = "defaite"; });
      } else if (res.value === "egalite") {
        // une égalité est partagée par tous
        allRes.forEach((s) => { s.value = "egalite"; });
      }
      // "defaite" : on ne déduit rien (trop ambigu)
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
 
// ---- Démarrage robuste ----
// À CHAQUE navigation (et au chargement), on tente de détecter le conteneur
// pendant quelques secondes : Quartz peut émettre "nav" avant d'avoir injecté
// le DOM de la page de destination.
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