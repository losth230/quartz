// ============================================================
//  C&P — Résultats & Statistiques
//  À placer dans : quartz/static/cp-stats.js
//  Saisie de parties (multijoueur), historique, et stats croisées.
//  Architecture par délégation sur document (robuste navigation SPA).
// ============================================================

import { sb } from "/quartz/static/cp-supabase.js";
import Chart from "https://cdn.jsdelivr.net/npm/chart.js@4.4.3/auto/+esm";

// État module (survit aux nav)
let refPeuples = [], refScenarios = [], refDeploiements = [], refVersions = [];
let parties = [], participations = [];
let armyLists = [];          // listes d'armées disponibles (army_lists)

// ============================================================
//  Détection d'archétype de liste par mots-clés (APPROXIMATIF)
//  Édite ce dictionnaire pour ajouter/affiner les archétypes.
//  Chaque mot-clé trouvé rapporte des points ; le titre pèse plus
//  lourd que le corps. L'archétype au plus haut score gagne.
//  Un score nul => "Non catégorisé".
// ============================================================
const ARCHETYPES = {
  "Poison":      ["poison", "venin", "venimeu", "toxine", "toxique"],
  "Tir":         ["arc", "arbalèt", "arbalet", "tir", "archer", "fronde", "javelot"],
  "Cavalerie":   ["cavalerie", "cavalier", "monture", "chevauché", "chevauche", "loup", "destrier"],
  "Élite":       ["élite", "elite", "champion", "garde", "vétéran", "veteran"],
  "Magie":       ["mage", "magie", "sorcier", "sortilège", "sortilege", "invocation", "rituel"],
  "Horde":       ["horde", "masse", "nuée", "nuee", "essaim", "gobelin", "nombre"],
};
// Poids : une occurrence dans le titre vaut TITLE_WEIGHT, dans le corps BODY_WEIGHT
const TITLE_WEIGHT = 5;
const BODY_WEIGHT = 1;

function normTxt(s) {
  return (s || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Détermine l'archétype d'une liste (objet army_lists) par score pondéré.
function detectArchetype(list) {
  if (!list) return "Non catégorisé";
  const titre = normTxt(list.title);
  const corps = normTxt(list.body);
  let best = null, bestScore = 0;
  for (const [arch, motsCles] of Object.entries(ARCHETYPES)) {
    let score = 0;
    for (const mc of motsCles) {
      const m = normTxt(mc);
      if (titre.includes(m)) score += TITLE_WEIGHT;
      // compte les occurrences dans le corps (pondération faible)
      if (corps.includes(m)) {
        const occ = corps.split(m).length - 1;
        score += occ * BODY_WEIGHT;
      }
    }
    if (score > bestScore) { bestScore = score; best = arch; }
  }
  return best || "Non catégorisé";
}
let tab = "saisie";          // "saisie" | "historique" | "stats"
let editingPartieId = null;  // id de la partie en cours d'édition (null = création)
let editData = null;         // {partie, participations} à pré-remplir dans le formulaire
let statMode = "peuple";     // dimension d'analyse des stats
let statFiltreVersion = "";  // filtre version appliqué aux stats
let statFiltreJoueur = "";    // filtre joueur
let statFiltreFaction = "";   // filtre faction (peuple)
let chartInstances = [];      // graphiques Chart.js actifs (à détruire avant re-render)
// Tri des tableaux de stats : une clé + un sens par dimension (chaque onglet garde son tri)
let statSort = {
  peuple:      { key: "rate", dir: "desc" },
  joueur:      { key: "rate", dir: "desc" },
  scenario:    { key: "n", dir: "desc" },
  deploiement: { key: "n", dir: "desc" },
  matchup:     { key: "total", dir: "desc" },
  liste:       { key: "rate", dir: "desc" },
};
let listeSubMode = "individuelle";  // "individuelle" | "archetype"
let chartMode = "taux";             // "taux" (barres) | "nuage" (taux vs pertes)
// Historique : filtres + recherche + tri
let histFiltreVersion = "", histFiltreScenario = "", histFiltreJoueur = "", histFiltreFaction = "";
let histSearch = "";
let histSort = { key: "date", dir: "desc" };
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

  // Valeurs pour les menus de filtre
  const versions = [...new Set(parties.map((p) => p.version).filter(Boolean))].sort();
  const scenarios = [...new Set(parties.map((p) => p.scenario).filter(Boolean))].sort();
  const joueurs = [...new Set(participations.map((p) => p.joueur).filter(Boolean))].sort();
  const factions = [...new Set(participations.map((p) => p.peuple).filter(Boolean))].sort();
  const opt = (list, current) => '<option value="">— tous —</option>' +
    list.map((v) => '<option value="' + esc(v) + '"' + (v === current ? " selected" : "") + ">" + esc(v) + "</option>").join("");

  const filtres = '<div class="cp-controls">' +
    '<select id="cp-hist-f-version">' + ('<option value="">Toutes versions</option>' +
      versions.map((v) => '<option value="' + esc(v) + '"' + (v === histFiltreVersion ? " selected" : "") + ">" + esc(v) + "</option>").join("")) + "</select>" +
    '<select id="cp-hist-f-scenario">' + ('<option value="">Tous scénarios</option>' +
      scenarios.map((v) => '<option value="' + esc(v) + '"' + (v === histFiltreScenario ? " selected" : "") + ">" + esc(v) + "</option>").join("")) + "</select>" +
    '<select id="cp-hist-f-joueur">' + ('<option value="">Tous joueurs</option>' +
      joueurs.map((v) => '<option value="' + esc(v) + '"' + (v === histFiltreJoueur ? " selected" : "") + ">" + esc(v) + "</option>").join("")) + "</select>" +
    '<select id="cp-hist-f-faction">' + ('<option value="">Toutes factions</option>' +
      factions.map((v) => '<option value="' + esc(v) + '"' + (v === histFiltreFaction ? " selected" : "") + ">" + esc(v) + "</option>").join("")) + "</select>" +
    '<input class="cp-search" id="cp-hist-search" type="text" placeholder="Rechercher..." value="' + esc(histSearch) + '" />' +
    "</div>";

  // Construction des lignes-objets (avec champs triables + texte pour recherche)
  const term = histSearch.trim().toLowerCase();
  let baseRows = parties.map((pa) => {
    const ps = partParts(pa.id);
    const oppositionTxt = ps.map((p) => p.joueur + " " + p.peuple).join(" ");
    const campsHtml = ps.map((p) => {
      const cls = p.resultat === "victoire" ? "cp-win" : (p.resultat === "egalite" ? "cp-draw" : "cp-lose");
      let army = "";
      if (p.army_list_id && listById[p.army_list_id]) army = " — " + esc(listById[p.army_list_id].title);
      else if (p.archetype) army = " — " + esc(p.archetype);
      return '<span class="cp-camp ' + cls + '">' + esc(p.joueur) + " (" + esc(p.peuple) + army + ")</span>";
    }).join(" vs ");
    return {
      id: pa.id,
      scenario: pa.scenario || "—",
      version: pa.version || "—",
      opposition: oppositionTxt,            // pour tri/recherche
      campsHtml,                             // pour affichage
      nbjoueurs: ps.length,
      date: new Date(pa.created_at).getTime(),
      dateAffichee: frDate(pa.created_at),
      _peuples: ps.map((p) => p.peuple),
      _joueurs: ps.map((p) => p.joueur),
      _search: (pa.scenario + " " + (pa.version || "") + " " + oppositionTxt).toLowerCase(),
    };
  });

  // Filtres
  baseRows = baseRows.filter((r) => {
    if (histFiltreVersion && r.version !== histFiltreVersion) return false;
    if (histFiltreScenario && r.scenario !== histFiltreScenario) return false;
    if (histFiltreJoueur && !r._joueurs.includes(histFiltreJoueur)) return false;
    if (histFiltreFaction && !r._peuples.includes(histFiltreFaction)) return false;
    if (term && !r._search.includes(term)) return false;
    return true;
  });

  if (!baseRows.length) {
    return filtres + '<p class="cp-empty">Aucune partie ne correspond à ces critères.</p>';
  }

  // Tri
  const rows = sortRows(baseRows, histSort.key, histSort.dir).map((r) =>
    '<tr data-partie="' + r.id + '">' +
      "<td>" + esc(r.scenario) + "</td>" +
      "<td>" + esc(r.version) + "</td>" +
      "<td>" + r.campsHtml + "</td>" +
      '<td class="cp-c-date">' + r.dateAffichee + "</td>" +
      '<td class="cp-c-act">' +
        '<button class="cp-partie-edit" data-id="' + r.id + '" title="Modifier">\u270E</button>' +
        '<button class="cp-partie-del" data-id="' + r.id + '" title="Supprimer">\u2715</button>' +
      "</td>" +
    "</tr>"
  ).join("");

  const head = '<thead><tr>' +
    histTh("scenario", "Scénario") +
    histTh("version", "Version") +
    histTh("opposition", "Opposition") +
    histTh("date", "Date") +
    "<th></th>" +
    "</tr></thead>";

  return filtres +
    '<table class="cp-table">' + head + "<tbody>" + rows + "</tbody></table>";
}

// En-tête triable pour l'historique
function histTh(key, label) {
  const ar = histSort.key === key
    ? '<span class="cp-sort">' + (histSort.dir === "asc" ? "\u25B4" : "\u25BE") + "</span>"
    : '<span class="cp-sort"> </span>';
  return '<th data-histsort="' + key + '">' + label + ar + "</th>";
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

// Trie un tableau d'objets selon une clé et un sens. Gère nombres et chaînes.
function sortRows(rows, key, dir) {
  const sorted = [...rows].sort((a, b) => {
    let va = a[key], vb = b[key];
    if (typeof va === "number" && typeof vb === "number") {
      // ordre numérique direct
    } else {
      va = (va ?? "").toString().toLowerCase();
      vb = (vb ?? "").toString().toLowerCase();
    }
    if (va < vb) return dir === "asc" ? -1 : 1;
    if (va > vb) return dir === "asc" ? 1 : -1;
    return 0;
  });
  return sorted;
}

// Flèche de tri pour un en-tête, selon l'état de tri de la dimension courante
function sortArrow(dim, key) {
  const s = statSort[dim];
  if (!s || s.key !== key) return '<span class="cp-sort"> </span>';
  return '<span class="cp-sort">' + (s.dir === "asc" ? "\u25B4" : "\u25BE") + "</span>";
}

// Construit un <th> triable
function thSort(dim, key, label) {
  return '<th data-statsort="' + dim + ":" + key + '">' + label + sortArrow(dim, key) + "</th>";
}

// ============================================================
//  Fiabilité statistique (formule de Cochran pour une proportion)
//  Paramètres affichés et ajustables — base de la problématique PFE.
//  n0 = Z² · p(1−p) / e²   (p = 0,5 = cas le plus conservateur)
// ============================================================
const STAT_CONFIANCE = 0.95;   // niveau de confiance visé
const STAT_MARGE = 0.10;       // marge d'erreur visée (±10 %)
const Z_PAR_CONFIANCE = { 0.90: 1.645, 0.95: 1.96, 0.99: 2.576 };

// Taille d'échantillon nécessaire pour estimer une proportion
// avec la marge et la confiance données (p=0,5, cas conservateur).
function tailleEchantillonRequise(confiance = STAT_CONFIANCE, marge = STAT_MARGE) {
  const z = Z_PAR_CONFIANCE[confiance] || 1.96;
  const p = 0.5;
  return Math.ceil((z * z * p * (1 - p)) / (marge * marge));
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

  // Récap en tête : nombre de parties correspondant aux filtres actifs
  const partiesFiltrees = statParties().filter((pa) => {
    if (!statFiltreJoueur && !statFiltreFaction) return true;
    const ps = partParts(pa.id);
    if (statFiltreJoueur && !ps.some((p) => p.joueur === statFiltreJoueur)) return false;
    if (statFiltreFaction && !ps.some((p) => p.peuple === statFiltreFaction)) return false;
    return true;
  });
  const filtresActifs = statFiltreVersion || statFiltreJoueur || statFiltreFaction;

  // --- Analyse de fiabilité statistique ---
  const seuil = tailleEchantillonRequise(); // parties nécessaires par catégorie
  // nombre de participations par faction (= taille d'échantillon par faction)
  const parFaction = {};
  statParticipations().forEach((p) => {
    if (!p.peuple) return;
    parFaction[p.peuple] = (parFaction[p.peuple] || 0) + 1;
  });
  const factionsAvecData = Object.keys(parFaction).length;
  const factionsFiables = Object.values(parFaction).filter((n) => n >= seuil).length;
  const maxFaction = Object.values(parFaction).reduce((a, b) => Math.max(a, b), 0);

  // Encart de synthèse : constat global honnête sur la fiabilité
  const confPct = Math.round(STAT_CONFIANCE * 100);
  const margePct = Math.round(STAT_MARGE * 100);
  let constat;
  if (!partiesFiltrees.length) {
    constat = "Aucune donnée à analyser.";
  } else if (factionsFiables === 0) {
    constat = "À ce stade, <strong>aucune faction</strong> n'atteint le volume nécessaire pour des conclusions statistiquement fiables. " +
      "Les taux affichés ci-dessous sont <strong>indicatifs</strong> et peuvent varier fortement avec quelques parties supplémentaires.";
  } else {
    constat = "<strong>" + factionsFiables + "</strong> faction(s) sur " + factionsAvecData +
      " atteignent le seuil de fiabilité. Les autres restent indicatives.";
  }
  // Projection : combien de parties pour conclure
  const manquePlusJoue = Math.max(0, seuil - maxFaction);
  const projection = partiesFiltrees.length
    ? "Pour estimer un taux de victoire à <strong>±" + margePct + " %</strong> près avec un niveau de confiance de <strong>" +
      confPct + " %</strong>, il faut environ <strong>" + seuil + " parties par faction</strong> (formule de Cochran, p = 0,5). " +
      "La faction la plus jouée en compte actuellement <strong>" + maxFaction + "</strong>" +
      (manquePlusJoue > 0 ? " — il en manque encore ~<strong>" + manquePlusJoue + "</strong>." : ".")
    : "";

  const recap = '<div class="cp-recap">' +
    '<div class="cp-recap-item"><span class="cp-recap-num">' + partiesFiltrees.length + "</span>" +
    '<span class="cp-recap-lbl">partie' + (partiesFiltrees.length > 1 ? "s" : "") +
    (filtresActifs ? " (filtrées)" : "") + "</span></div>" +
    '<div class="cp-recap-item"><span class="cp-recap-num">' + seuil + "</span>" +
    '<span class="cp-recap-lbl">seuil de fiabilité</span></div>' +
    '<div class="cp-recap-item"><span class="cp-recap-num">' + factionsFiables + " / " + factionsAvecData + "</span>" +
    '<span class="cp-recap-lbl">factions fiables</span></div>' +
    "</div>" +
    '<div class="cp-fiab' + (factionsFiables === 0 ? " cp-fiab-alerte" : "") + '">' +
      "<p>" + constat + "</p>" +
      (projection ? "<p class=\"cp-fiab-proj\">" + projection + "</p>" : "") +
    "</div>";

  const dims = [
    ["peuple", "Par peuple"],
    ["joueur", "Par joueur"],
    ["liste", "Par liste"],
    ["scenario", "Par scénario"],
    ["deploiement", "Par déploiement"],
    ["matchup", "Matchups"],
  ];
  const switcher = '<div class="cp-statswitch">' +
    dims.map(([k, lbl]) => '<button class="cp-statbtn' + (statMode === k ? " active" : "") +
      '" data-stat="' + k + '">' + lbl + "</button>").join("") + "</div>";

  let contenu;
  if (statMode === "matchup") contenu = renderMatchups();
  else if (statMode === "liste") contenu = renderByListe();
  else if (statMode === "scenario" || statMode === "deploiement") contenu = renderByPartieDim(statMode);
  else contenu = renderByParticipantDim(statMode);

  return filtres + recap + switcher + contenu + renderEvolution();
}

// Indice d'efficacité (relatif) : gagner en limitant les pertes.
// Formule simple : taux de victoire (0-1) / pertes moyennes, remis à une échelle lisible.
// Sert UNIQUEMENT à comparer les lignes entre elles, pas comme valeur absolue.
function efficacite(rate, pertesMoy) {
  if (pertesMoy == null || pertesMoy <= 0) return null;
  return Math.round((rate / pertesMoy) * 1000) / 10; // une décimale
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
  // Lignes-objets (clés alignées avec les data-statsort des en-têtes)
  const baseRows = Object.entries(map).map(([key, m]) => {
    const rate = m.total ? m.v / m.total : 0;
    const pertes = m.nPertes ? Math.round(m.pertes / m.nPertes) : null;
    return { nom: key, total: m.total, v: m.v, d: m.d, e: m.e, rate, pertes, eff: efficacite(rate, pertes) };
  });
  if (!baseRows.length) return '<p class="cp-empty">Aucune donnée pour ces filtres.</p>';

  // Graphiques : ordre fixe par taux de victoire décroissant (indépendant du tri du tableau)
  const chartRows = [...baseRows].sort((a, b) => b.rate - a.rate);
  const labels = chartRows.map((r) => r.nom);
  const taux = chartRows.map((r) => Math.round(r.rate * 100));
  const repartition = chartRows.map((r) => r.total);
  // points pour le nuage taux (x) vs pertes (y) — seulement ceux qui ont des pertes
  const scatter = chartRows.filter((r) => r.pertes != null).map((r) => ({ x: Math.round(r.rate * 100), y: r.pertes, label: r.nom }));
  let colors;
  if (dim === "peuple") colors = colorsForLabels(labels);
  else colors = colorsByFaction(labels, (j) => factionDominanteJoueur(j));
  const payload = encodeURIComponent(JSON.stringify({ labels, taux, repartition, colors, scatter, dimLabel: dim === "peuple" ? "peuple" : "joueur", isPeuple: dim === "peuple" }));

  // Tableau : tri selon l'état de la dimension
  const s = statSort[dim];
  const rows = sortRows(baseRows, s.key, s.dir).map((r) => {
    return "<tr><td class=\"cp-c-key\">" + esc(r.nom) + "</td>" +
      "<td>" + r.total + "</td>" +
      '<td class="cp-win">' + r.v + "</td>" +
      '<td class="cp-lose">' + r.d + "</td>" +
      '<td class="cp-draw">' + r.e + "</td>" +
      '<td class="cp-c-rate">' + pct(r.v, r.total) + "</td>" +
      "<td>" + (r.pertes == null ? "—" : r.pertes) + "</td>" +
      '<td class="cp-c-eff">' + (r.eff == null ? "—" : r.eff) + "</td></tr>";
  }).join("");
  const table = '<table class="cp-table"><thead><tr>' +
    thSort(dim, "nom", dim === "peuple" ? "Peuple" : "Joueur") +
    thSort(dim, "total", "Parties") +
    thSort(dim, "v", "V") +
    thSort(dim, "d", "D") +
    thSort(dim, "e", "É") +
    thSort(dim, "rate", "Taux victoire") +
    thSort(dim, "pertes", "Pertes moy.") +
    thSort(dim, "eff", "Efficacité") +
    "</tr></thead><tbody>" + rows + "</tbody></table>";

  return chartToggle() + chartsBlock(payload) + table;
}

// Bouton de bascule du graphique principal (taux de victoire / nuage taux vs pertes)
function chartToggle() {
  return '<div class="cp-substat">' +
    '<button class="cp-subbtn' + (chartMode === "taux" ? " active" : "") + '" data-chartmode="taux">Taux de victoire</button>' +
    '<button class="cp-subbtn' + (chartMode === "nuage" ? " active" : "") + '" data-chartmode="nuage">Nuage taux vs pertes</button>' +
    "</div>";
}

// Bloc des deux graphiques (le principal bascule selon chartMode) + camembert
function chartsBlock(payload) {
  // total d'observations = somme des répartitions (pour l'afficher sur les graphiques)
  let n = 0;
  try {
    const d = JSON.parse(decodeURIComponent(payload));
    if (Array.isArray(d.repartition)) n = d.repartition.reduce((a, b) => a + b, 0);
  } catch (e) {}
  const badge = '<span class="cp-chart-n">' + n + " donnée" + (n > 1 ? "s" : "") + "</span>";
  const principal = chartMode === "nuage"
    ? '<div class="cp-chart-box"><h4>Taux de victoire vs pertes moyennes ' + badge + '</h4><canvas id="cp-chart-scatter"></canvas></div>'
    : '<div class="cp-chart-box"><h4>Taux de victoire ' + badge + '</h4><canvas id="cp-chart-bars"></canvas></div>';
  return '<div class="cp-charts">' +
      principal +
      '<div class="cp-chart-box"><h4>Répartition des parties ' + badge + '</h4><canvas id="cp-chart-pie"></canvas></div>' +
    "</div>" +
    '<div id="cp-chart-data" data-payload="' + payload + '" hidden></div>';
}

// Stats par liste d'armée : deux sous-modes (liste individuelle / archétype détecté)
function renderByListe() {
  const listById = {};
  armyLists.forEach((l) => { listById[l.id] = l; });
  const data = statParticipations();

  // Clé de regroupement selon le sous-mode
  function groupKey(p) {
    const liste = p.army_list_id ? listById[p.army_list_id] : null;
    if (listeSubMode === "archetype") {
      // liste liée -> archétype détecté ; archétype libre -> son texte ; sinon non catégorisé
      if (liste) return detectArchetype(liste);
      if (p.archetype) return p.archetype;
      return "Non catégorisé";
    }
    // sous-mode "individuelle"
    if (liste) return liste.title;
    if (p.archetype) return "« " + p.archetype + " » (libre)";
    return "Sans liste";
  }

  const map = {};
  const facCount = {}; // clé de groupe -> { faction: count } pour déterminer la couleur
  data.forEach((p) => {
    const key = groupKey(p);
    if (!map[key]) { map[key] = { total: 0, v: 0, d: 0, e: 0, pertes: 0, nPertes: 0 }; facCount[key] = {}; }
    const m = map[key];
    m.total++;
    if (p.resultat === "victoire") m.v++;
    else if (p.resultat === "egalite") m.e++;
    else m.d++;
    if (p.pertes != null) { m.pertes += p.pertes; m.nPertes++; }
    // faction associée à cette participation : peuple du joueur (toujours présent)
    if (p.peuple) facCount[key][p.peuple] = (facCount[key][p.peuple] || 0) + 1;
  });

  // faction dominante d'un groupe (pour la couleur)
  function groupFaction(key) {
    const c = facCount[key] || {};
    let best = null, bestN = 0;
    for (const [f, n] of Object.entries(c)) { if (n > bestN) { bestN = n; best = f; } }
    return best;
  }

  const baseRows = Object.entries(map).map(([key, m]) => {
    const rate = m.total ? m.v / m.total : 0;
    const pertes = m.nPertes ? Math.round(m.pertes / m.nPertes) : null;
    return { nom: key, total: m.total, v: m.v, d: m.d, e: m.e, rate, pertes, eff: efficacite(rate, pertes) };
  });

  // Sélecteur de sous-mode
  const sub = '<div class="cp-substat">' +
    '<button class="cp-subbtn' + (listeSubMode === "individuelle" ? " active" : "") + '" data-listsub="individuelle">Par liste</button>' +
    '<button class="cp-subbtn' + (listeSubMode === "archetype" ? " active" : "") + '" data-listsub="archetype">Par archétype détecté</button>' +
    "</div>";

  const note = listeSubMode === "archetype"
    ? '<p class="cp-hint">⚠ Regroupement approximatif par mots-clés (titre pondéré plus fort que le corps). Une liste non reconnue tombe dans « Non catégorisé ».</p>'
    : '<p class="cp-hint">Regroupement exact : chaque liste enregistrée + les archétypes libres.</p>';

  if (!baseRows.length) return sub + note + '<p class="cp-empty">Aucune donnée pour ces filtres.</p>';

  // Graphiques (ordre fixe par taux décroissant)
  const chartRows = [...baseRows].sort((a, b) => b.rate - a.rate);
  const labels = chartRows.map((r) => r.nom);
  const colors = colorsByFaction(labels, (lbl) => groupFaction(lbl));
  const scatter = chartRows.filter((r) => r.pertes != null).map((r) => ({ x: Math.round(r.rate * 100), y: r.pertes, label: r.nom }));
  const payload = encodeURIComponent(JSON.stringify({
    labels,
    taux: chartRows.map((r) => Math.round(r.rate * 100)),
    repartition: chartRows.map((r) => r.total),
    colors,
    scatter,
    isPeuple: false,
  }));

  // Table triable
  const s = statSort.liste;
  const rows = sortRows(baseRows, s.key, s.dir).map((r) =>
    "<tr><td class=\"cp-c-key\">" + esc(r.nom) + "</td>" +
    "<td>" + r.total + "</td>" +
    '<td class="cp-win">' + r.v + "</td>" +
    '<td class="cp-lose">' + r.d + "</td>" +
    '<td class="cp-draw">' + r.e + "</td>" +
    '<td class="cp-c-rate">' + pct(r.v, r.total) + "</td>" +
    "<td>" + (r.pertes == null ? "—" : r.pertes) + "</td>" +
    '<td class="cp-c-eff">' + (r.eff == null ? "—" : r.eff) + "</td></tr>"
  ).join("");
  const table = '<table class="cp-table"><thead><tr>' +
    thSort("liste", "nom", listeSubMode === "archetype" ? "Archétype" : "Liste") +
    thSort("liste", "total", "Parties") +
    thSort("liste", "v", "V") +
    thSort("liste", "d", "D") +
    thSort("liste", "e", "É") +
    thSort("liste", "rate", "Taux victoire") +
    thSort("liste", "pertes", "Pertes moy.") +
    thSort("liste", "eff", "Efficacité") +
    "</tr></thead><tbody>" + rows + "</tbody></table>";

  return sub + note + chartToggle() + chartsBlock(payload) + table;
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
  const baseRows = Object.entries(map).map(([key, n]) => ({ nom: key, n }));
  if (!baseRows.length) return '<p class="cp-empty">Aucune donnée pour ces filtres.</p>';

  // Graphique : ordre fixe par fréquence décroissante
  const chartRows = [...baseRows].sort((a, b) => b.n - a.n);
  const payload = encodeURIComponent(JSON.stringify({
    labels: chartRows.map((r) => r.nom), repartition: chartRows.map((r) => r.n), onlyPie: true,
  }));

  // Tableau : tri selon l'état de la dimension
  const s = statSort[dim];
  const rows = sortRows(baseRows, s.key, s.dir)
    .map((r) => "<tr><td class=\"cp-c-key\">" + esc(r.nom) + "</td><td>" + r.n + "</td></tr>").join("");
  const table = '<table class="cp-table"><thead><tr>' +
    thSort(dim, "nom", dim === "scenario" ? "Scénario" : "Déploiement") +
    thSort(dim, "n", "Parties jouées") +
    "</tr></thead><tbody>" + rows + "</tbody></table>";

  const totalP = baseRows.reduce((a, r) => a + r.n, 0);
  return '<div class="cp-charts">' +
      '<div class="cp-chart-box"><h4>Répartition des parties <span class="cp-chart-n">' + totalP + " partie" + (totalP > 1 ? "s" : "") + '</span></h4><canvas id="cp-chart-pie"></canvas></div>' +
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

  // ----- Table détaillée (triable) -----
  const baseRows = entries.map(([key, m]) => {
    const [a, b] = key.split("|");
    return {
      matchup: a + " vs " + b,
      total: m.a + m.b + m.e,
      score: m.a + " – " + m.b + (m.e ? " (" + m.e + " nul" + (m.e > 1 ? "s" : "") + ")" : ""),
      rate: (m.a + m.b) ? m.a / (m.a + m.b) : 0,
    };
  });
  const s = statSort.matchup;
  const rows = sortRows(baseRows, s.key, s.dir).map((r) =>
    "<tr><td class=\"cp-c-key\">" + esc(r.matchup) + "</td>" +
    "<td>" + r.total + "</td>" +
    "<td>" + esc(r.score) + "</td>" +
    '<td class="cp-c-rate">' + Math.round(r.rate * 100) + " %</td></tr>"
  ).join("");
  const table = '<table class="cp-table"><thead><tr>' +
    thSort("matchup", "matchup", "Matchup") +
    thSort("matchup", "total", "Duels") +
    thSort("matchup", "score", "Score") +
    thSort("matchup", "rate", "Taux (1er)") +
    "</tr></thead><tbody>" + rows + "</tbody></table>";

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
  // refVersions est trié par "ordre" décroissant (version récente en premier,
  // pratique pour les menus de saisie). Pour la COURBE on veut l'ordre
  // chronologique inverse : du plus ancien au plus récent.
  const versionsPresentes = versionsOrdre.filter((v) => acc[v]).reverse();
  if (versionsPresentes.length < 2) return ""; // pas assez de points pour une courbe
  const payload = encodeURIComponent(JSON.stringify({
    labels: versionsPresentes,
    taux: versionsPresentes.map((v) => Math.round((acc[v].v / acc[v].total) * 100)),
  }));
  const totalEvo = versionsPresentes.reduce((a, v) => a + acc[v].total, 0);
  return '<div class="cp-chart-box cp-chart-full"><h4>Évolution du taux de victoire par version' +
    (statFiltreFaction ? " — " + esc(statFiltreFaction) : "") +
    ' <span class="cp-chart-n">' + totalEvo + " donnée" + (totalEvo > 1 ? "s" : "") + '</span></h4>' +
    '<canvas id="cp-chart-line"></canvas>' +
    '<div id="cp-line-data" data-payload="' + payload + '" hidden></div></div>';
}


// Palette pour camemberts (couleurs douces, lisibles en clair/sombre)
const CHART_COLORS = [
  "#6b8cbe", "#b58a4a", "#7fae6f", "#b56b6b", "#8a6bb5",
  "#5fae9e", "#be9a5f", "#9ebe5f", "#be5f8a", "#6b9ebe",
];

// Couleur d'une faction : d'abord celle définie dans ref_peuples (colonne couleur),
// sinon repli déterministe sur la palette (pour ne jamais avoir de "trou").
function factionColor(nom) {
  const ref = refPeuples.find((p) => p.nom === nom);
  if (ref && ref.couleur) return ref.couleur;
  // repli stable : on hashe le nom pour piocher toujours la même couleur de secours
  let h = 0;
  for (let i = 0; i < (nom || "").length; i++) h = (h * 31 + nom.charCodeAt(i)) % CHART_COLORS.length;
  return CHART_COLORS[h];
}

// Construit un tableau de couleurs aligné sur une liste de labels (factions)
function colorsForLabels(labels) {
  return labels.map((l) => factionColor(l));
}

// Faction la plus jouée par un joueur (sur toutes ses participations).
// Égalité -> première rencontrée. Aucun -> null.
function factionDominanteJoueur(joueur) {
  const cnt = {};
  participations.forEach((p) => {
    if (p.joueur !== joueur || !p.peuple) return;
    cnt[p.peuple] = (cnt[p.peuple] || 0) + 1;
  });
  let best = null, bestN = 0;
  for (const [peuple, n] of Object.entries(cnt)) {
    if (n > bestN) { bestN = n; best = peuple; }
  }
  return best;
}

// Couleurs d'une liste de labels en passant par une fonction label -> faction.
// Si la faction est introuvable, factionColor fournit un repli stable.
function colorsByFaction(labels, labelToFaction) {
  return labels.map((l) => {
    const fac = labelToFaction(l);
    return factionColor(fac || l); // si pas de faction, on hashe le label lui-même
  });
}

// Lit la couleur de texte courante (pour que les graphiques suivent le thème)
function chartTextColor() {
  const c = getComputedStyle(document.body).getPropertyValue("--dark").trim();
  return c || "#2b2520";
}

// Instancie les graphiques Chart.js à partir des payloads injectés dans le DOM.
// Appelée après chaque rendu de l'onglet stats.
// Plugin : affiche le compte au bout de chaque barre horizontale.
// Plugin : affiche le compte au bout de chaque barre horizontale.
// Plugin : affiche le compte au centre de chaque barre horizontale.
function barCountPlugin(counts) {
  return {
    id: "barCount",
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      const meta = chart.getDatasetMeta(0);
      
      ctx.save();
      ctx.font = "600 11px Georgia, serif";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center"; // Le texte est centré par défaut
      
      meta.data.forEach((bar, i) => {
        const n = counts[i];
        if (n == null) return;
        
        const txt = String(n);
        
        // Calcul de la position X au centre exact de la barre
        const posX = (bar.base + bar.x) / 2;
        
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "rgba(0,0,0,0.35)";
        ctx.lineWidth = 3;
        
        // Dessin de l'ombre puis du texte
        ctx.strokeText(txt, posX, bar.y);
        ctx.fillText(txt, posX, bar.y);
      });
      
      ctx.restore();
    },
  };
}

// Plugin : affiche le compte au centre de chaque part de camembert,
// uniquement si la part est assez grande pour rester lisible.
function pieCountPlugin(counts) {
  return {
    id: "pieCount",
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      const meta = chart.getDatasetMeta(0);
      ctx.save();
      ctx.font = "600 11px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      meta.data.forEach((arc, i) => {
        const n = counts[i];
        if (n == null) return;
        const angle = arc.endAngle - arc.startAngle;
        if (angle < 0.35) return; // part trop petite : on n'écrit pas
        const mid = (arc.startAngle + arc.endAngle) / 2;
        const r = (arc.innerRadius + arc.outerRadius) / 2;
        const x = arc.x + Math.cos(mid) * r;
        const y = arc.y + Math.sin(mid) * r;
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "rgba(0,0,0,0.35)";
        ctx.lineWidth = 3;
        ctx.strokeText(String(n), x, y);
        ctx.fillText(String(n), x, y);
      });
      ctx.restore();
    },
  };
}

function drawCharts() {
  destroyCharts();
  if (typeof Chart === "undefined" || !Chart) {
    console.warn("[cp-stats] Chart.js non disponible, graphiques ignorés.");
    return;
  }
  const txt = chartTextColor();
  Chart.defaults.color = txt;
  Chart.defaults.font.family = "Georgia, serif";

  // Barres + camembert (dimension peuple/joueur)
  const dataEl = document.getElementById("cp-chart-data");
  if (dataEl) {
    let d;
    try { d = JSON.parse(decodeURIComponent(dataEl.dataset.payload)); } catch (e) { d = null; }
    if (d) {
      // Couleurs : priorité au tableau "colors" fourni par le rendu (par faction associée),
      // sinon couleurs par faction si dimension peuple, sinon palette indexée.
      let palette;
      if (Array.isArray(d.colors) && d.colors.length) palette = d.colors;
      else if (d.isPeuple) palette = colorsForLabels(d.labels);
      else palette = CHART_COLORS;
      const bars = document.getElementById("cp-chart-bars");
      if (bars && d.taux) {
        chartInstances.push(new Chart(bars, {
          type: "bar",
          data: { labels: d.labels, datasets: [{ label: "Taux de victoire (%)", data: d.taux, backgroundColor: palette }] },
          options: {
            indexAxis: "y", responsive: true, plugins: { legend: { display: false } },
            scales: { x: { min: 0, max: 100, ticks: { callback: (v) => v + "%" } } },
          },
          plugins: Array.isArray(d.repartition) ? [barCountPlugin(d.repartition)] : [],
        }));
      }
      // Nuage de points : taux de victoire (x) vs pertes moyennes (y)
      const scat = document.getElementById("cp-chart-scatter");
      if (scat && Array.isArray(d.scatter)) {
        const pts = d.scatter.map((p) => ({ x: p.x, y: p.y, label: p.label }));
        const ptColors = d.scatter.map((p) => {
          const i = d.labels.indexOf(p.label);
          return (Array.isArray(d.colors) && i >= 0) ? d.colors[i] : "#6b8cbe";
        });
        chartInstances.push(new Chart(scat, {
          type: "scatter",
          data: { datasets: [{ data: pts, backgroundColor: ptColors, pointRadius: 7, pointHoverRadius: 9 }] },
          options: {
            responsive: true,
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: (ctx) => {
                const r = ctx.raw;
                return r.label + " — " + r.x + "% victoire, " + r.y + " pertes moy.";
              } } },
            },
            scales: {
              x: { title: { display: true, text: "Taux de victoire (%)" }, min: 0, max: 100 },
              y: { title: { display: true, text: "Pertes moyennes" }, beginAtZero: true },
            },
          },
        }));
      }
      const pie = document.getElementById("cp-chart-pie");
      if (pie && d.repartition) {
        chartInstances.push(new Chart(pie, {
          type: "doughnut",
          data: { labels: d.labels, datasets: [{ data: d.repartition, backgroundColor: palette }] },
          options: { responsive: true, plugins: {
            legend: { position: "right" },
            tooltip: { callbacks: { label: (ctx) => " " + ctx.label + " : " + ctx.parsed + " partie" + (ctx.parsed > 1 ? "s" : "") } },
          } },
          plugins: [pieCountPlugin(d.repartition)],
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

    // sous-mode de la dimension "Par liste"
    const sub = e.target.closest(".cp-subbtn");
    if (sub && getApp().contains(sub) && sub.dataset.listsub) { listeSubMode = sub.dataset.listsub; render(); return; }

    // bascule du graphique principal (taux / nuage)
    const cm = e.target.closest("[data-chartmode]");
    if (cm && getApp().contains(cm)) { chartMode = cm.dataset.chartmode; render(); return; }

    // tri d'un tableau de stats (clic sur en-tête)
    const th = e.target.closest("[data-statsort]");
    if (th && getApp().contains(th)) {
      const [dim, key] = th.dataset.statsort.split(":");
      const s = statSort[dim];
      if (s.key === key) { s.dir = s.dir === "asc" ? "desc" : "asc"; }
      else { s.key = key; s.dir = "desc"; }
      render();
      return;
    }

    // tri de l'historique (clic sur en-tête)
    const hth = e.target.closest("[data-histsort]");
    if (hth && getApp().contains(hth)) {
      const key = hth.dataset.histsort;
      if (histSort.key === key) { histSort.dir = histSort.dir === "asc" ? "desc" : "asc"; }
      else { histSort.key = key; histSort.dir = "desc"; }
      render();
      return;
    }

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

    // filtres de l'historique
    if (e.target.id === "cp-hist-f-version")  { histFiltreVersion = e.target.value; render(); return; }
    if (e.target.id === "cp-hist-f-scenario") { histFiltreScenario = e.target.value; render(); return; }
    if (e.target.id === "cp-hist-f-joueur")   { histFiltreJoueur = e.target.value; render(); return; }
    if (e.target.id === "cp-hist-f-faction")  { histFiltreFaction = e.target.value; render(); return; }

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

  // Recherche dans l'historique (input). On re-render puis on restaure le focus
  // et la position du curseur, sinon le champ perdrait le focus à chaque frappe.
  document.addEventListener("input", (e) => {
    if (!getApp()) return;
    if (e.target.id === "cp-hist-search") {
      histSearch = e.target.value;
      const pos = e.target.selectionStart;
      render();
      const again = document.getElementById("cp-hist-search");
      if (again) { again.focus(); try { again.setSelectionRange(pos, pos); } catch (x) {} }
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
