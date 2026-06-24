// ============================================================
//  C&P — Builder d'armée structuré (faction : Vermines de Kaoss)
//  À placer dans : quartz/static/cp-army-builder.js
//  + <link> vers cp-army-builder.css et <script type="module"> dans Head.tsx
//
//  Module AUTONOME : se greffe sur le formulaire existant de la page
//  « Listes d'armées » (champs #cp-faction, #cp-body, #cp-points).
//  Quand la faction sélectionnée est « Vermines de Kaoss », il remplace
//  la zone de texte libre par un constructeur (unités + quantité +
//  équipement optionnel), calcule les points et valide la composition.
//  Aucune modification de cp-army-lists.js n'est nécessaire.
//
//  Données : unités par catégorie, points de base, options d'équipement
//  (additives ou choix exclusif). Source : page de faction A3.2.
// ============================================================

// ---- Catégories (ordre + libellés) ----
const CATS = [
  { id: "commandant", label: "Commandants" },
  { id: "base", label: "Modèles de base" },
  { id: "soutien", label: "Modèles de soutien" },
  { id: "special", label: "Modèles spéciaux" },
];

// ---- Données de la faction ----
// option additive : { t:"opt", nom, cout }
// choix exclusif  : { t:"choix", nom, choix:[{nom,cout}], defaut }
const UNITES = [
  // Commandants
  { id: "assassin", nom: "Assassin des bas-fonds", cat: "commandant", pts: 56, options: [{ t: "opt", nom: "Lame empoisonnée", cout: 4 }] },
  { id: "molluskus", nom: "Docteur Molluskus", cat: "commandant", pts: 46 },
  { id: "petit-roi", nom: "Petit roi", cat: "commandant", pts: 26 },
  { id: "meneur", nom: "Meneur", cat: "commandant", pts: 34 },
  { id: "prophete", nom: "Prophète de Kaoss", cat: "commandant", pts: 29 },
  { id: "saboteur", nom: "Saboteur", cat: "commandant", pts: 38 },
  { id: "saxon", nom: "Saxon", cat: "commandant", pts: 48 },
  { id: "zigzon", nom: "ZigZon", cat: "commandant", pts: 42, options: [{ t: "opt", nom: "Mort sur Roue de Guerre", cout: 38 }] },
  // Modèles de base
  { id: "levee", nom: "Basse levée du clan", cat: "base", pts: 5, options: [{ t: "opt", nom: "Lance", cout: 1 }, { t: "opt", nom: "Bouclier", cout: 1 }] },
  { id: "bagarreur", nom: "Bagarreur des bas-fonds", cat: "base", pts: null, manuel: "Prix = 4× la masse de la troupe hôte" },
  { id: "harceleur", nom: "Harceleur des ombres", cat: "base", pts: 13 },
  { id: "long-tireur", nom: "Long-tireur", cat: "base", pts: 14, options: [{ t: "opt", nom: "Réservoir à peste", cout: 2 }] },
  { id: "porte-peste", nom: "Porte-peste", cat: "base", pts: 16, options: [{ t: "opt", nom: "Fléau enflammée", cout: 2 }] },
  { id: "rat-mutant", nom: "Rat mutant", cat: "base", pts: 21 },
  { id: "veteran", nom: "Vétéran", cat: "base", pts: 16, options: [{ t: "opt", nom: "Bouclier", cout: 2 }, { t: "opt", nom: "Hallebarde", cout: 2 }] },
  { id: "mort-roue", nom: "Mort sur roue", cat: "base", pts: 24 },
  // Modèles de soutien
  { id: "catapulte", nom: "Catapulte à peste", cat: "soutien", pts: 24 },
  { id: "machiniste", nom: "Machiniste", cat: "soutien", pts: 17 },
  { id: "mutation", nom: "Mutation colossale", cat: "soutien", pts: 32, options: [{ t: "opt", nom: "Faux rotatives", cout: 6 }, { t: "opt", nom: "Poings épineux", cout: 2 }] },
  {
    id: "technomage", nom: "Technomage", cat: "soutien", pts: 15, options: [
      { t: "choix", nom: "Niveau de sorts", choix: [{ nom: "Colporteur de peste (niv.1)", cout: 0 }, { nom: "Érudit pestiféré (niv.2)", cout: 5 }, { nom: "Prophète (niv.3)", cout: 11 }], defaut: 0 },
      { t: "opt", nom: "Monture Abominable", cout: 46 },
    ],
  },
  // Modèles spéciaux
  { id: "belier", nom: "Bélier Pestilentiel", cat: "special", pts: 58 },
  { id: "bourreau", nom: "Bourreau à Roulis", cat: "special", pts: 52, options: [{ t: "choix", nom: "Armement", choix: [{ nom: "Roulis léger", cout: 0 }, { nom: "Roulis lourd", cout: 0 }], defaut: 0 }] },
  { id: "cloche", nom: "Cloche hurlante", cat: "special", pts: 52 },
  { id: "experience", nom: "Formidable Expérience", cat: "special", pts: 64 },
  { id: "mort-roue-guerre", nom: "Mort sur Roue de Guerre", cat: "special", pts: 46 },
  { id: "techno-canon", nom: "Techno-canon", cat: "special", pts: 41 },
  { id: "tunnel", nom: "Tunnel", cat: "special", pts: 24 },
];

const FACTION_NOM = "Vermines de Kaoss";
const U_BY_ID = Object.fromEntries(UNITES.map((u) => [u.id, u]));

// ============================================================
//  Logique pure (testable) : coûts, totaux, validation, texte
// ============================================================
// entry : { uid, unitId, qty, opts:[indices additifs], choix:{idxGroupe:idxChoix}, manuel:number }
function coutOptions(unit, entry) {
  let c = 0;
  (unit.options || []).forEach((o, i) => {
    if (o.t === "opt") { if ((entry.opts || []).includes(i)) c += o.cout; }
    else if (o.t === "choix") { const ci = (entry.choix && entry.choix[i] != null) ? entry.choix[i] : o.defaut; c += o.choix[ci].cout; }
  });
  return c;
}
function coutUnitaire(entry) {
  const u = U_BY_ID[entry.unitId];
  if (!u) return 0;
  const base = (u.pts == null) ? (Number(entry.manuel) || 0) : u.pts;
  return base + coutOptions(u, entry);
}
function coutEntry(entry) { return coutUnitaire(entry) * (Number(entry.qty) || 0); }

function totaux(state) {
  let total = 0;
  const parCat = { commandant: 0, base: 0, soutien: 0, special: 0 };
  state.entries.forEach((e) => {
    const u = U_BY_ID[e.unitId];
    if (!u) return;
    total += coutEntry(e);
    parCat[u.cat] += (Number(e.qty) || 0);
  });
  return { total, parCat };
}

// Règles : min 1 commandant + 5 base ; max 1 cmd/100, 1 soutien/50, 1 spécial/150.
function validation(state) {
  const { total, parCat } = totaux(state);
  const maxCmd = Math.floor(total / 100);
  const maxSout = Math.floor(total / 50);
  const maxSpe = Math.floor(total / 150);
  const items = [];
  if (parCat.commandant < 1) items.push({ ok: false, msg: "Au moins 1 Commandant requis." });
  if (parCat.base < 5) items.push({ ok: false, msg: "Au moins 5 unités de Base requises (actuel : " + parCat.base + ")." });
  if (parCat.commandant > maxCmd) items.push({ ok: false, msg: "Trop de Commandants : " + parCat.commandant + " pour " + maxCmd + " autorisé(s) (1 / 100 pts)." });
  if (parCat.soutien > maxSout) items.push({ ok: false, msg: "Trop de Soutiens : " + parCat.soutien + " pour " + maxSout + " autorisé(s) (1 / 50 pts)." });
  if (parCat.special > maxSpe) items.push({ ok: false, msg: "Trop de Spéciaux : " + parCat.special + " pour " + maxSpe + " autorisé(s) (1 / 150 pts)." });
  if (state.target && total > state.target) items.push({ ok: false, msg: "Dépassement : " + total + " pts > cible " + state.target + " pts." });
  return { total, parCat, maxCmd, maxSout, maxSpe, items, valide: items.length === 0 };
}

// Libellé des options sélectionnées d'une entrée (pour le texte)
function libelleOptions(entry) {
  const u = U_BY_ID[entry.unitId];
  if (!u || !u.options) return "";
  const parts = [];
  u.options.forEach((o, i) => {
    if (o.t === "opt") { if ((entry.opts || []).includes(i)) parts.push(o.nom); }
    else if (o.t === "choix") { const ci = (entry.choix && entry.choix[i] != null) ? entry.choix[i] : o.defaut; parts.push(o.choix[ci].nom); }
  });
  return parts.join(", ");
}

// Génère le corps de liste lisible (écrit dans #cp-body)
function genererTexte(state) {
  const v = validation(state);
  const lignes = [];
  const entête = "Vermines de Kaoss — " + v.total + " pts" + (state.target ? " / " + state.target : "");
  lignes.push(entête, "");
  CATS.forEach((cat) => {
    const es = state.entries.filter((e) => { const u = U_BY_ID[e.unitId]; return u && u.cat === cat.id; });
    if (!es.length) return;
    lignes.push(cat.label);
    es.forEach((e) => {
      const u = U_BY_ID[e.unitId];
      const q = (Number(e.qty) || 1);
      const opt = libelleOptions(e);
      const txt = (q > 1 ? q + "× " : "") + u.nom + (opt ? " + " + opt : "");
      lignes.push("- " + txt + " — " + coutEntry(e) + " pts");
    });
    lignes.push("");
  });
  lignes.push("Total : " + v.total + " pts");
  if (!v.valide) {
    lignes.push("", "⚠ Composition incomplète :");
    v.items.forEach((it) => lignes.push("  - " + it.msg));
  }
  return lignes.join("\n");
}

// ============================================================
//  Intégration DOM
// ============================================================
const state = { actif: false, target: 0, entries: [], seq: 1, pris: false };

function $(id) { return document.getElementById(id); }
function esc(s) {
  return (s || "").toString().replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function normFaction(s) {
  return (s || "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
function estVermines(val) { return normFaction(val) === normFaction(FACTION_NOM); }

// Synchronise le formulaire existant (corps + points)
function sync() {
  // Tant que l'utilisateur n'a rien construit, ne JAMAIS écraser le corps existant
  // (cas de l'édition d'une liste déjà saisie : on préserve son contenu).
  if (!state.pris) return;
  const body = $("cp-body");
  const points = $("cp-points");
  const v = validation(state);
  if (body) { body.value = genererTexte(state); body.dispatchEvent(new Event("input", { bubbles: true })); }
  if (points) { points.value = v.total; points.dispatchEvent(new Event("input", { bubbles: true })); }
}

function optionSelect() {
  // <select> groupé par catégorie
  let html = '<select id="cp-ab-pick"><option value="">— ajouter une unité —</option>';
  CATS.forEach((cat) => {
    html += '<optgroup label="' + esc(cat.label) + '">';
    UNITES.filter((u) => u.cat === cat.id).forEach((u) => {
      const p = (u.pts == null) ? "spé" : u.pts + " pts";
      html += '<option value="' + u.id + '">' + esc(u.nom) + " (" + p + ")</option>";
    });
    html += "</optgroup>";
  });
  return html + "</select>";
}

function ligneEntree(e) {
  const u = U_BY_ID[e.unitId];
  if (!u) return "";
  const cat = CATS.find((c) => c.id === u.cat);
  // options
  let optsHtml = "";
  (u.options || []).forEach((o, i) => {
    if (o.t === "opt") {
      const on = (e.opts || []).includes(i);
      optsHtml += '<label class="cp-ab-opt"><input type="checkbox" data-opt="' + i + '"' + (on ? " checked" : "") +
        '> ' + esc(o.nom) + " (+" + o.cout + ")</label>";
    } else if (o.t === "choix") {
      const sel = (e.choix && e.choix[i] != null) ? e.choix[i] : o.defaut;
      optsHtml += '<label class="cp-ab-opt cp-ab-choix">' + esc(o.nom) + ' <select data-choix="' + i + '">' +
        o.choix.map((ch, ci) => '<option value="' + ci + '"' + (ci === sel ? " selected" : "") + ">" +
          esc(ch.nom) + (ch.cout ? " (+" + ch.cout + ")" : "") + "</option>").join("") +
        "</select></label>";
    }
  });
  const manuel = (u.pts == null)
    ? '<label class="cp-ab-opt">Coût unitaire <input type="number" min="0" step="1" class="cp-ab-manuel" value="' + (e.manuel || 0) + '" title="' + esc(u.manuel || "") + '"></label>'
    : "";
  return '<div class="cp-ab-entry" data-uid="' + e.uid + '">' +
    '<div class="cp-ab-entry-head">' +
      '<span class="cp-ab-cat cp-ab-cat-' + u.cat + '">' + esc(cat ? cat.label : "") + "</span>" +
      '<span class="cp-ab-nom">' + esc(u.nom) + "</span>" +
      '<span class="cp-ab-qty"><input type="number" min="1" step="1" class="cp-ab-qtyn" value="' + (e.qty || 1) + '"></span>' +
      '<span class="cp-ab-sub">' + coutEntry(e) + " pts</span>" +
      '<button class="cp-ab-del" title="Retirer">✕</button>' +
    "</div>" +
    (optsHtml || manuel ? '<div class="cp-ab-opts">' + manuel + optsHtml + "</div>" : "") +
  "</div>";
}

function render() {
  const host = $("cp-ab-host");
  if (!host) return;
  const v = validation(state);
  const entries = state.entries.length
    ? state.entries.map(ligneEntree).join("")
    : '<p class="cp-ab-empty">Aucune unité. Ajoute-en avec le menu ci-dessus.</p>';
  const warns = v.items.length
    ? '<ul class="cp-ab-warns">' + v.items.map((it) => "<li>" + esc(it.msg) + "</li>").join("") + "</ul>"
    : '<p class="cp-ab-ok">✓ Composition valide.</p>';
  host.innerHTML =
    '<div class="cp-ab-bar">' +
      '<div class="cp-ab-add">' + optionSelect() + '<button class="cp-ab-addbtn" id="cp-ab-add">+ Ajouter</button></div>' +
      '<div class="cp-ab-total">' +
        '<label class="cp-ab-targetlbl">Cible <input type="number" min="0" step="50" id="cp-ab-target" value="' + (state.target || "") + '" placeholder="ex. 1000"></label>' +
        '<span class="cp-ab-totalnum' + (v.valide ? "" : " cp-ab-bad") + '">' + v.total + (state.target ? " / " + state.target : "") + ' pts</span>' +
      "</div>" +
    "</div>" +
    '<div class="cp-ab-entries">' + entries + "</div>" +
    warns;
  sync();
}

function ajouter(unitId) {
  const u = U_BY_ID[unitId];
  if (!u) return;
  state.pris = true; // le builder gère désormais le corps de la liste
  state.entries.push({ uid: state.seq++, unitId, qty: 1, opts: [], choix: {}, manuel: 0 });
  render();
}
function entryByUid(uid) { return state.entries.find((e) => String(e.uid) === String(uid)); }

// Affiche/masque le builder selon la faction
function appliquerVisibilite() {
  const fac = $("cp-faction");
  const body = $("cp-body");
  if (!fac || !body) return;
  const lbl = document.querySelector('label[for="cp-body"]');
  const doitActiver = estVermines(fac.value);

  if (doitActiver && !state.actif) {
    state.actif = true;
    // masque la zone de texte libre
    body.style.display = "none";
    if (lbl) lbl.style.display = "none";
    // injecte le host juste après le textarea s'il n'existe pas
    if (!$("cp-ab-host")) {
      const wrap = document.createElement("div");
      wrap.id = "cp-ab-host";
      wrap.className = "cp-ab";
      body.parentNode.insertBefore(wrap, body.nextSibling);
      // libellé dédié
      const l = document.createElement("label");
      l.id = "cp-ab-label";
      l.textContent = "Liste (constructeur Vermines de Kaoss)";
      body.parentNode.insertBefore(l, wrap);
    } else { $("cp-ab-host").style.display = ""; const l = $("cp-ab-label"); if (l) l.style.display = ""; }
    // tente de restaurer depuis le corps existant (édition) — sinon part de zéro
    restaurerDepuisCorps(body.value);
    render();
  } else if (!doitActiver && state.actif) {
    state.actif = false;
    body.style.display = "";
    if (lbl) lbl.style.display = "";
    const host = $("cp-ab-host"); if (host) host.style.display = "none";
    const l = $("cp-ab-label"); if (l) l.style.display = "none";
  }
}

// v1 : pas de reconstruction structurée depuis le texte. Si le corps contient
// déjà une liste (édition d'une liste existante), on laisse l'état vide et on
// n'écrase PAS tant que l'utilisateur n'a rien ajouté (voir garde dans sync via render).
function restaurerDepuisCorps(txt) {
  // Réinitialise pour une nouvelle saisie ; le builder ne reprendra la main
  // (et donc n'écrira dans le corps) qu'au premier ajout d'unité.
  state.entries = [];
  state.pris = false;
}

// ---------- Démarrage robuste (SPA Quartz) ----------
let lastFaction = null;
let wired = false;
function wireOnce() {
  if (wired) return;
  wired = true;

  // clics
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
  });

  // changements (quantité, options, choix, cible, coût manuel)
  document.addEventListener("change", (e) => {
    if (e.target.id === "cp-faction") { setTimeout(appliquerVisibilite, 0); return; }
    if (!state.actif) return;
    const card = e.target.closest(".cp-ab-entry");
    if (card) {
      const en = entryByUid(card.dataset.uid);
      if (!en) return;
      if (e.target.classList.contains("cp-ab-qtyn")) { en.qty = Math.max(1, parseInt(e.target.value, 10) || 1); render(); return; }
      if (e.target.classList.contains("cp-ab-manuel")) { en.manuel = Math.max(0, parseInt(e.target.value, 10) || 0); render(); return; }
      if (e.target.dataset.opt != null) {
        const i = parseInt(e.target.dataset.opt, 10);
        en.opts = en.opts || [];
        if (e.target.checked) { if (!en.opts.includes(i)) en.opts.push(i); }
        else { en.opts = en.opts.filter((x) => x !== i); }
        render(); return;
      }
      if (e.target.dataset.choix != null) {
        const i = parseInt(e.target.dataset.choix, 10);
        en.choix = en.choix || {}; en.choix[i] = parseInt(e.target.value, 10) || 0; render(); return;
      }
    }
    if (e.target.id === "cp-ab-target") { state.target = Math.max(0, parseInt(e.target.value, 10) || 0); render(); return; }
  });

  // saisie directe (quantité/cible au clavier) — réactif sans perdre le focus serait mieux,
  // mais on garde simple : on recalcule sur 'change' (blur). Le total live suffit ici.
}

function bootstrap() {
  wireOnce();
  appliquerVisibilite();
  // suit les changements programmatiques de faction (mode édition qui set .value sans event)
  const fac = $("cp-faction");
  if (fac && fac.value !== lastFaction) { lastFaction = fac.value; appliquerVisibilite(); }
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
document.addEventListener("nav", () => { state.actif = false; lastFaction = null; bootstrap(); startPoll(); });
window.addEventListener("pageshow", bootstrap);
startPoll();

// Exports pour test (no-op dans le navigateur)
export { coutEntry, totaux, validation, genererTexte, UNITES, state };
