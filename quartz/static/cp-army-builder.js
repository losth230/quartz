// ============================================================
//  C&P — Builder d'armée structuré, DATA-DRIVEN (Supabase)
//  À placer dans : quartz/static/cp-army-builder.js
//  + cp-army-builder.css et <script type="module"> dans Head.tsx
//
//  Module AUTONOME : se greffe sur le formulaire de « Listes d'armées »
//  (#cp-faction, #cp-body, #cp-points). Aucune modif de cp-army-lists.js.
//
//  Le roster est chargé depuis Supabase (tables ref_unites +
//  ref_unite_equipements). Le builder est AGNOSTIQUE à la faction :
//  il s'active pour toute faction ayant des unités en base, sinon il
//  laisse la saisie en texte libre. Ajouter une faction = insérer des
//  lignes (voir cp-roster-schema.sql / cp-roster-vermines.sql), zéro code.
//
//  Validation NON BLOQUANTE : un message rouge explique pourquoi une
//  liste est invalide, sans empêcher sa publication.
// ============================================================
import { sb } from "/quartz/static/cp-supabase.js";

// ---- Catégories (ordre + libellés) ----
const CATS = [
  { id: "commandant", label: "Commandants" },
  { id: "base", label: "Modèles de base" },
  { id: "soutien", label: "Modèles de soutien" },
  { id: "special", label: "Modèles spéciaux" },
];

// ---- Règles de composition (communes à presque toutes les factions) ----
const REGLES = {
  minCommandant: 1,
  minBase: 5,
  ptsParCommandant: 100, // 1 commandant autorisé par tranche
  ptsParSoutien: 50,
  ptsParSpecial: 150,
};

// Exceptions de composition propres à certaines factions (dérogent aux règles communes).
// Peuples Libres / Fer de Lance : pas de limite maximale de commandants.
const REGLES_FACTION = {
  "Peuples Libres": { cmdIllimite: true },
};
function reglesActives() {
  return Object.assign({}, REGLES, REGLES_FACTION[R.faction] || {});
}

// ---- Roster courant + cache par faction ----
let R = { faction: null, unites: [], byId: {}, sf: [] };
const cacheRoster = {};

// Choix d'armée hiérarchique générique (Royaume→Ordre, Clan→…). Libellés pilotés par les données.
function sfLabel1() { return (R.sf && R.sf[0] && R.sf[0].niveau1_label) || ""; }
function sfLabel2() { return (R.sf && R.sf[0] && R.sf[0].niveau2_label) || ""; }
function niv1Liste() {
  const seen = [];
  (R.sf || []).forEach((r) => { if (!seen.includes(r.niveau1)) seen.push(r.niveau1); });
  return seen;
}
function niv2De(n1) {
  return (R.sf || []).filter((r) => r.niveau1 === n1 && r.niveau2).map((r) => r.niveau2);
}

async function chargerRoster(faction) {
  if (cacheRoster[faction]) return cacheRoster[faction];
  const { data: unites } = await sb.from("ref_unites").select("*").eq("faction", faction).order("ordre");
  let roster;
  if (!unites || !unites.length) {
    roster = { faction, unites: [], byId: {} };
  } else {
    const ids = unites.map((u) => u.id);
    const { data: equips } = await sb.from("ref_unite_equipements").select("*").in("unite_id", ids).order("ordre");
    const byId = {};
    unites.forEach((u) => { u.options = []; u._grp = {}; byId[u.id] = u; });
    (equips || []).forEach((eq) => {
      const u = byId[eq.unite_id];
      if (!u) return;
      if (eq.groupe) { (u._grp[eq.groupe] = u._grp[eq.groupe] || []).push(eq); }
      else { u.options.push({ t: "opt", nom: eq.nom, cout: eq.cout }); }
    });
    unites.forEach((u) => {
      Object.keys(u._grp).forEach((gn) => {
        const list = u._grp[gn];
        let def = list.findIndex((x) => x.defaut); if (def < 0) def = 0;
        u.options.push({ t: "choix", nom: gn, choix: list.map((x) => ({ nom: x.nom, cout: x.cout })), defaut: def });
      });
      delete u._grp;
    });
    roster = { faction, unites, byId };
  }
  // Choix d'armée (Royaume→Ordre, Clan→…). Table optionnelle : si absente, liste vide.
  const { data: sf } = await sb.from("ref_sous_factions").select("*").eq("faction", faction).order("tri");
  roster.sf = sf || [];
  cacheRoster[faction] = roster;
  return roster;
}

// ============================================================
//  Logique pure (utilise le roster courant R)
// ============================================================
function uOf(entry) { return R.byId[entry.unitId]; }
function coutOptions(u, entry) {
  let c = 0;
  (u.options || []).forEach((o, i) => {
    if (o.t === "opt") { if ((entry.opts || []).includes(i)) c += o.cout; }
    else if (o.t === "choix") { const ci = (entry.choix && entry.choix[i] != null) ? entry.choix[i] : o.defaut; c += o.choix[ci].cout; }
  });
  return c;
}
// Modificateur de coût par modèle apporté par le niveau1 choisi (ex. Thoriath : -1, plancher 6)
function coutModeleMod() {
  const row = (R.sf || []).find((r) => r.niveau1 === state.niv1);
  return row && row.cout_modele_delta
    ? { delta: row.cout_modele_delta, min: row.cout_modele_min || 0 }
    : { delta: 0, min: 0 };
}
function coutUnitaire(entry) {
  const u = uOf(entry); if (!u) return 0;
  let base = (u.points == null) ? (Number(entry.manuel) || 0) : u.points;
  const mod = coutModeleMod();
  if (mod.delta) base = Math.max(mod.min, base - mod.delta); // réduction appliquée à la base, par modèle
  return base + coutOptions(u, entry);
}
function coutEntry(entry) { return coutUnitaire(entry) * (Number(entry.qty) || 0); }

function totaux(state) {
  let total = 0;
  const parCat = { commandant: 0, base: 0, soutien: 0, special: 0 };
  state.entries.forEach((e) => {
    const u = uOf(e); if (!u) return;
    total += coutEntry(e);
    parCat[u.categorie] += (Number(e.qty) || 0);
  });
  return { total, parCat };
}

function validation(state) {
  const r = reglesActives();
  const { total, parCat } = totaux(state);
  const maxCmd = Math.floor(total / r.ptsParCommandant);
  const maxSout = Math.floor(total / r.ptsParSoutien);
  const maxSpe = Math.floor(total / r.ptsParSpecial);
  const items = [];
  if (parCat.commandant < r.minCommandant) items.push("Au moins " + r.minCommandant + " Commandant requis.");
  if (parCat.base < r.minBase) items.push("Au moins " + r.minBase + " unités de Base requises (actuel : " + parCat.base + ").");
  if (!r.cmdIllimite && parCat.commandant > maxCmd) items.push("Trop de Commandants : " + parCat.commandant + " pour " + maxCmd + " autorisé(s) (1 / " + r.ptsParCommandant + " pts).");
  if (parCat.soutien > maxSout) items.push("Trop de Soutiens : " + parCat.soutien + " pour " + maxSout + " autorisé(s) (1 / " + r.ptsParSoutien + " pts).");
  if (parCat.special > maxSpe) items.push("Trop de Spéciaux : " + parCat.special + " pour " + maxSpe + " autorisé(s) (1 / " + r.ptsParSpecial + " pts).");
  if (state.target && total > state.target) items.push("Dépassement : " + total + " pts > cible " + state.target + " pts.");
  // Personnages légendaires : 1 seul exemplaire par liste
  const legCount = {};
  state.entries.forEach((e) => {
    const u = uOf(e);
    if (u && u.legendaire) legCount[u.id] = (legCount[u.id] || 0) + (Number(e.qty) || 0);
  });
  Object.keys(legCount).forEach((id) => {
    if (legCount[id] > 1) {
      const u = R.byId[id];
      items.push("« " + u.nom + " » est légendaire : 1 seul par liste (actuel : " + legCount[id] + ").");
    }
  });
  return { total, parCat, maxCmd, maxSout, maxSpe, items, valide: items.length === 0 };
}

function libelleOptions(entry) {
  const u = uOf(entry); if (!u || !u.options) return "";
  const parts = [];
  u.options.forEach((o, i) => {
    if (o.t === "opt") { if ((entry.opts || []).includes(i)) parts.push(o.nom); }
    else if (o.t === "choix") {
      const ci = (entry.choix && entry.choix[i] != null) ? entry.choix[i] : o.defaut;
      const nom = o.choix[ci].nom;
      if (nom !== "Aucune") parts.push(nom); // « Aucune » = pas de sélection -> rien dans le texte
    }
  });
  return parts.join(", ");
}

function genererTexte(state) {
  const v = validation(state);
  const lignes = [];
  lignes.push(R.faction + " — " + v.total + " pts" + (state.target ? " / " + state.target : ""));
  if (state.niv1) lignes.push(sfLabel1() + " : " + state.niv1 + (state.niv2 ? " — " + state.niv2 : ""));
  lignes.push("");
  CATS.forEach((cat) => {
    const es = state.entries.filter((e) => { const u = uOf(e); return u && u.categorie === cat.id; });
    if (!es.length) return;
    lignes.push(cat.label);
    es.forEach((e) => {
      const u = uOf(e);
      const q = (Number(e.qty) || 1);
      const opt = libelleOptions(e);
      lignes.push("- " + (q > 1 ? q + "× " : "") + u.nom + (opt ? " + " + opt : "") + " — " + coutEntry(e) + " pts");
    });
    lignes.push("");
  });
  lignes.push("Total : " + v.total + " pts");
  if (!v.valide) { lignes.push("", "⚠ Composition incomplète :"); v.items.forEach((m) => lignes.push("  - " + m)); }
  return lignes.join("\n");
}

// ============================================================
//  Intégration DOM
// ============================================================
const state = { actif: false, factionActive: null, target: 0, entries: [], seq: 1, pris: false, freeText: "", niv1: "", niv2: "" };

// Séparateur entre la liste générée par le builder et le texte libre de l'utilisateur,
// écrit dans le MÊME champ #cp-body (celui utilisé par les factions sans données).
const SEP = "\n\n———— Texte libre (modifiable) ————\n";

function $(id) { return document.getElementById(id); }
function esc(s) {
  return (s || "").toString().replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Corps complet écrit dans #cp-body : liste structurée + repère + texte libre.
function genererCorps() {
  return genererTexte(state) + SEP + (state.freeText || "");
}
// Récupère le texte libre saisi par l'utilisateur sous le repère.
function capturerFreeText() {
  const body = $("cp-body");
  if (!body) return;
  const v = body.value || "";
  const idx = v.indexOf(SEP);
  state.freeText = (idx >= 0) ? v.slice(idx + SEP.length) : v;
}

function sync() {
  if (!state.pris) return; // ne pas écraser le champ tant que rien n'est construit
  const body = $("cp-body"), points = $("cp-points");
  const v = validation(state);
  if (body) { body.value = genererCorps(); body.dispatchEvent(new Event("input", { bubbles: true })); }
  if (points) { points.value = v.total; points.dispatchEvent(new Event("input", { bubbles: true })); }
}

function optionSelect() {
  let html = '<select id="cp-ab-pick"><option value="">— ajouter une unité —</option>';
  CATS.forEach((cat) => {
    const us = R.unites.filter((u) => u.categorie === cat.id);
    if (!us.length) return;
    html += '<optgroup label="' + esc(cat.label) + '">';
    us.forEach((u) => {
      const p = (u.points == null) ? "spé" : u.points + " pts";
      html += '<option value="' + u.id + '">' + esc(u.nom) + " (" + p + ")</option>";
    });
    html += "</optgroup>";
  });
  return html + "</select>";
}

function ligneEntree(e) {
  const u = uOf(e); if (!u) return "";
  const cat = CATS.find((c) => c.id === u.categorie);
  const chips = [], choix = [];
  (u.options || []).forEach((o, i) => {
    if (o.t === "opt") {
      const on = (e.opts || []).includes(i);
      chips.push('<label class="cp-ab-chip' + (on ? " on" : "") + '">' +
        '<input type="checkbox" data-opt="' + i + '"' + (on ? " checked" : "") + ">" +
        '<span class="cp-ab-chipnom">' + esc(o.nom) + "</span>" +
        '<span class="cp-ab-chipcout">+' + o.cout + "</span></label>");
    } else if (o.t === "choix") {
      const sel = (e.choix && e.choix[i] != null) ? e.choix[i] : o.defaut;
      choix.push('<div class="cp-ab-choixrow"><span class="cp-ab-choixlbl">' + esc(o.nom) + "</span>" +
        '<select data-choix="' + i + '">' +
        o.choix.map((ch, ci) => '<option value="' + ci + '"' + (ci === sel ? " selected" : "") + ">" +
          esc(ch.nom) + (ch.cout ? " (+" + ch.cout + ")" : "") + "</option>").join("") +
        "</select></div>");
    }
  });
  if (u.points == null) {
    choix.push('<div class="cp-ab-choixrow"><span class="cp-ab-choixlbl">Coût unitaire</span>' +
      '<input type="number" min="0" step="1" class="cp-ab-manuel" value="' + (e.manuel || 0) + '" title="' + esc(u.special_note || "") + '"></div>');
  }
  let opts = "";
  if (chips.length) opts += '<div class="cp-ab-additifs">' + chips.join("") + "</div>";
  if (choix.length) opts += '<div class="cp-ab-choixs">' + choix.join("") + "</div>";
  const collapsed = !!e.collapsed;
  const resume = collapsed ? esc(libelleOptions(e)) : "";
  return '<div class="cp-ab-entry' + (collapsed ? " cp-ab-collapsed" : "") + '" data-uid="' + e.uid + '">' +
    '<div class="cp-ab-entry-head">' +
      '<span class="cp-ab-chevron">' + (opts ? (collapsed ? "\u25B8" : "\u25BE") : "") + "</span>" +
      '<span class="cp-ab-cat cp-ab-cat-' + u.categorie + '">' + esc(cat ? cat.label : "") + "</span>" +
      '<span class="cp-ab-nom">' + esc(u.nom) + "</span>" +
      '<span class="cp-ab-resume">' + resume + "</span>" +
      '<span class="cp-ab-qty"><input type="number" min="1" step="1" class="cp-ab-qtyn" value="' + (e.qty || 1) + '"></span>' +
      '<span class="cp-ab-sub">' + coutEntry(e) + " pts</span>" +
      '<button class="cp-ab-del" title="Retirer">\u2715</button>' +
    "</div>" +
    (opts ? '<div class="cp-ab-opts">' + opts + "</div>" : "") +
  "</div>";
}

function render() {
  const host = $("cp-ab-host");
  if (!host) return;
  const v = validation(state);
  const entries = state.entries.length ? state.entries.map(ligneEntree).join("") : '<p class="cp-ab-empty">Aucune unité. Ajoute-en avec le menu ci-dessus.</p>';
  const warns = v.items.length
    ? '<div class="cp-ab-warns"><strong>Liste invalide :</strong><ul>' + v.items.map((m) => "<li>" + esc(m) + "</li>").join("") + "</ul></div>"
    : '<p class="cp-ab-ok">✓ Composition valide.</p>';
  const sfBloc = (R.sf || []).length
    ? '<div class="cp-ab-roy">' +
        '<label class="cp-ab-roylbl">' + esc(sfLabel1()) + ' <select id="cp-ab-niv1">' +
          niv1Liste().map((n) => '<option value="' + esc(n) + '"' + (n === state.niv1 ? " selected" : "") + ">" + esc(n) + "</option>").join("") +
        "</select></label>" +
        (sfLabel2()
          ? '<label class="cp-ab-roylbl">' + esc(sfLabel2()) + ' <select id="cp-ab-niv2">' +
              niv2De(state.niv1).map((o) => '<option value="' + esc(o) + '"' + (o === state.niv2 ? " selected" : "") + ">" + esc(o) + "</option>").join("") +
            "</select></label>"
          : "") +
      "</div>"
    : "";
  host.innerHTML =
    '<div class="cp-ab-bar">' +
      '<div class="cp-ab-add">' + optionSelect() + '<button class="cp-ab-addbtn" id="cp-ab-add">+ Ajouter</button></div>' +
      '<div class="cp-ab-total">' +
        '<label class="cp-ab-targetlbl">Cible <input type="number" min="0" step="50" id="cp-ab-target" value="' + (state.target || "") + '" placeholder="ex. 1000"></label>' +
        '<span class="cp-ab-totalnum' + (v.valide ? "" : " cp-ab-bad") + '">' + v.total + (state.target ? " / " + state.target : "") + " pts</span>" +
      "</div>" +
    "</div>" +
    sfBloc +
    '<div class="cp-ab-entries">' + entries + "</div>" + warns;
  sync();
}

function ajouter(unitId) {
  if (!R.byId[unitId]) return;
  state.pris = true;
  state.entries.push({ uid: state.seq++, unitId, qty: 1, opts: [], choix: {}, manuel: 0 });
  render();
}
function entryByUid(uid) { return state.entries.find((e) => String(e.uid) === String(uid)); }

function activer(faction) {
  state.actif = true;
  state.factionActive = faction;
  state.entries = [];
  state.pris = false;
  // Choix d'armée par défaut (premier de chaque niveau) si la faction en propose
  if ((R.sf || []).length) {
    state.niv1 = niv1Liste()[0] || "";
    state.niv2 = niv2De(state.niv1)[0] || "";
  } else { state.niv1 = ""; state.niv2 = ""; }
  const body = $("cp-body");
  // Récupère le texte libre éventuellement présent (liste existante ou saisie manuelle) :
  // tout ce qui suit le repère, ou tout le contenu s'il n'y a pas de repère.
  if (body) {
    const v = body.value || "";
    const idx = v.indexOf(SEP);
    state.freeText = (idx >= 0) ? v.slice(idx + SEP.length) : v;
  } else {
    state.freeText = "";
  }
  // Injecte le constructeur AU-DESSUS du textarea existant, qui reste visible et éditable.
  if (body && !$("cp-ab-host")) {
    const host = document.createElement("div");
    host.id = "cp-ab-host";
    host.className = "cp-ab";
    const ancre = document.querySelector('label[for="cp-body"]') || body;
    ancre.parentNode.insertBefore(host, ancre);
  } else if ($("cp-ab-host")) {
    $("cp-ab-host").style.display = "";
  }
  render();
}

function desactiver() {
  if (!state.actif) return;
  state.actif = false;
  state.factionActive = null;
  const host = $("cp-ab-host"); if (host) host.style.display = "none";
  // #cp-body n'est jamais masqué : il redevient un simple champ de texte libre.
}

async function appliquerVisibilite() {
  const fac = $("cp-faction"), body = $("cp-body");
  if (!fac || !body) return;
  const faction = fac.value;
  if (!faction) { desactiver(); return; }
  let roster;
  try { roster = await chargerRoster(faction); } catch (e) { console.error("[cp-builder] chargement roster:", e); return; }
  if (fac.value !== faction) return; // la faction a changé pendant le chargement
  if (roster.unites.length) {
    if (state.actif && state.factionActive === faction) { R = roster; return; } // déjà actif sur cette faction
    R = roster;
    activer(faction);
  } else {
    desactiver();
  }
}

// ---------- Câblage ----------
let lastFaction = null, wired = false;
function wireOnce() {
  if (wired) return; wired = true;

  document.addEventListener("click", (e) => {
    if (!state.actif) return;
    if (e.target.id === "cp-ab-add") {
      const sel = $("cp-ab-pick");
      if (sel && sel.value) { ajouter(sel.value); sel.value = ""; }
      return;
    }
    const del = e.target.closest(".cp-ab-del");
    if (del) {
      const card = del.closest(".cp-ab-entry");
      if (card) { state.entries = state.entries.filter((x) => String(x.uid) !== card.dataset.uid); render(); }
      return;
    }
    // Repli/dépli : clic sur l'entête, sauf sur la quantité ou le bouton ✕
    const head = e.target.closest(".cp-ab-entry-head");
    if (head && !e.target.closest(".cp-ab-qty")) {
      const card = head.closest(".cp-ab-entry");
      const en = card && entryByUid(card.dataset.uid);
      if (en) { en.collapsed = !en.collapsed; render(); }
    }
  });

  document.addEventListener("change", (e) => {
    if (e.target.id === "cp-faction") { lastFaction = e.target.value; appliquerVisibilite(); return; }
    if (!state.actif) return;
    if (e.target.id === "cp-ab-target") { state.target = Math.max(0, parseInt(e.target.value, 10) || 0); render(); return; }
    if (e.target.id === "cp-ab-niv1") { state.niv1 = e.target.value; state.niv2 = niv2De(state.niv1)[0] || ""; render(); return; }
    if (e.target.id === "cp-ab-niv2") { state.niv2 = e.target.value; render(); return; }
    const card = e.target.closest(".cp-ab-entry");
    if (!card) return;
    const en = entryByUid(card.dataset.uid); if (!en) return;
    if (e.target.classList.contains("cp-ab-qtyn")) { en.qty = Math.max(1, parseInt(e.target.value, 10) || 1); render(); return; }
    if (e.target.classList.contains("cp-ab-manuel")) { en.manuel = Math.max(0, parseInt(e.target.value, 10) || 0); render(); return; }
    if (e.target.dataset.opt != null) {
      const i = parseInt(e.target.dataset.opt, 10); en.opts = en.opts || [];
      if (e.target.checked) { if (!en.opts.includes(i)) en.opts.push(i); } else { en.opts = en.opts.filter((x) => x !== i); }
      render(); return;
    }
    if (e.target.dataset.choix != null) {
      const i = parseInt(e.target.dataset.choix, 10); en.choix = en.choix || {}; en.choix[i] = parseInt(e.target.value, 10) || 0; render();
    }
  });

  // Texte libre saisi directement dans #cp-body (sous le repère) : on le mémorise
  // pour le préserver lors des régénérations du builder.
  document.addEventListener("input", (e) => {
    if (!state.actif) return;
    if (e.target.id === "cp-body") capturerFreeText();
  });
}

function bootstrap() {
  wireOnce();
  const fac = $("cp-faction");
  if (fac && fac.value !== lastFaction) { lastFaction = fac.value; }
  appliquerVisibilite();
}

let pollTimer = null;
function startPoll() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(() => {
    const fac = $("cp-faction");
    if (!fac) return;
    if (fac.value !== lastFaction) { lastFaction = fac.value; appliquerVisibilite(); }
  }, 400);
}

if (document.readyState !== "loading") bootstrap();
else document.addEventListener("DOMContentLoaded", bootstrap);
document.addEventListener("nav", () => { desactiver(); lastFaction = null; bootstrap(); startPoll(); });
window.addEventListener("pageshow", bootstrap);
startPoll();

export { coutEntry, totaux, validation, genererTexte, R, state };
