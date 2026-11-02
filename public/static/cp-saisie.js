// ============================================================
//  C&P — Module partagé de saisie d'une partie (modale)
//  À placer dans : quartz/static/cp-saisie.js
//
//  Module RÉUTILISABLE : ouvre une modale en surcouche contenant
//  le formulaire de saisie/édition d'une partie. Utilisable depuis
//  n'importe quelle page (préparation de bataille, résultats...).
//
//  API publique (exposée sur window.cpSaisie) :
//    cpSaisie.open({ refs, prefill, editPartie, onSaved })
//      - refs       : { refPeuples, refScenarios, refDeploiements, refVersions, armyLists }
//                     (fournis par la page appelante)
//      - prefill    : { version, scenario, deploiement, saisiPar, camps:[{joueur,faction}] }
//                     (optionnel — pré-remplissage en mode création)
//      - editPartie : { partie, participations } (optionnel — mode édition)
//      - onSaved    : function(partieId, etaitEdition) appelée après enregistrement réussi
//
//  Le module est autonome (rendu, câblage, validation, enregistrement)
//  et scopé à sa modale (#cp-saisie-overlay) pour ne pas interférer
//  avec le reste de la page.
// ============================================================

import { sb } from "/quartz/static/cp-supabase.js";

// État interne de la modale (réinitialisé à chaque ouverture)
let S = null; // { refs, prefill, editPartie, onSaved, nbJoueurs }
let saisieWired = false;

function esc(s) {
  return (s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
function qs(sel) { const o = document.getElementById("cp-saisie-overlay"); return o ? o.querySelector(sel) : null; }

// ---------- Briques de formulaire ----------
function optionsFrom(list) {
  return '<option value="">—</option>' +
    (list || []).map((x) => '<option value="' + esc(x.nom) + '">' + esc(x.nom) + "</option>").join("");
}
function resultatOptions() {
  return '<option value="">— résultat —</option>' +
    '<option value="victoire">Victoire</option>' +
    '<option value="defaite">Défaite</option>' +
    '<option value="egalite">Égalité</option>';
}
function starRating(cls, label, note) {
  const n = note || 0;
  let stars = "";
  for (let s = 1; s <= 5; s++) {
    stars += '<span class="cp-star' + (s <= n ? " on" : "") + '" data-val="' + s + '">\u2605</span>';
  }
  return '<div class="cp-rating ' + cls + '" data-note="' + n + '">' +
    '<span class="cp-rating-lbl">' + label + "</span>" +
    '<span class="cp-stars">' + stars + "</span>" +
    '<span class="cp-star-clear" title="Effacer la note">\u2715</span>' +
  "</div>";
}
function setRating(rating, val) {
  if (!rating) return;
  rating.dataset.note = String(val);
  [...rating.querySelectorAll(".cp-star")].forEach((s) => {
    s.classList.toggle("on", parseInt(s.dataset.val, 10) <= val);
  });
}
function participantRow(i) {
  return '<div class="cp-part-row" data-idx="' + i + '">' +
    '<span class="cp-part-num">J' + (i + 1) + '</span>' +
    '<input class="cp-p-joueur" placeholder="Joueur" />' +
    '<select class="cp-p-peuple">' + optionsFrom(S.refs.refPeuples) + "</select>" +
    '<select class="cp-p-liste"><option value="">— archétype libre —</option></select>' +
    '<input class="cp-p-archetype" placeholder="Archétype" />' +
    '<input class="cp-p-pertes" type="number" min="0" placeholder="Pertes" />' +
    '<select class="cp-p-resultat">' + resultatOptions() + "</select>" +
    (i >= 2 ? '<button class="cp-part-del" title="Retirer">\u2715</button>' : "") +
    '<div class="cp-part-notes">' +
      starRating("cp-note-scenario", "Scénario", 0) +
      starRating("cp-note-deploiement", "Déploiement", 0) +
    "</div>" +
  "</div>";
}
function normFaction(s) {
  return (s || "").toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function fillListeMenu(row) {
  const sel = row.querySelector(".cp-p-liste");
  const peuple = row.querySelector(".cp-p-peuple").value;
  if (!sel) return;
  const armyLists = S.refs.armyLists || [];
  const np = normFaction(peuple);
  let matching = peuple ? armyLists.filter((l) => normFaction(l.faction) === np) : [];
  if (peuple && matching.length === 0) matching = armyLists;
  if (!peuple) matching = armyLists;
  const current = sel.value;
  sel.innerHTML = '<option value="">— archétype libre —</option>' +
    matching.map((l) => {
      const pts = l.points != null ? " (" + l.points + " pts)" : "";
      const auth = l.author ? " · " + l.author : "";
      return '<option value="' + l.id + '">' + esc(l.title) + pts + auth + "</option>";
    }).join("");
  if ([...sel.options].some((o) => o.value === current)) sel.value = current;
}

// ---------- Rendu de la modale ----------
function renderModal() {
  const editData = S.editPartie;
  const enEdition = !!editData;
  const nb = enEdition ? editData.participations.length : S.nbJoueurs;
  let rows = "";
  for (let i = 0; i < nb; i++) rows += participantRow(i);

  const titre = enEdition ? "Modifier la partie" : "Enregistrer le résultat";
  const form =
    '<div class="cp-form-grid">' +
      '<div><label>Version</label><select id="cp-f-version">' + optionsFrom(S.refs.refVersions) + "</select></div>" +
      '<div><label>Scénario</label><select id="cp-f-scenario">' + optionsFrom(S.refs.refScenarios) + "</select></div>" +
      '<div><label>Déploiement</label><select id="cp-f-deploiement">' + optionsFrom(S.refs.refDeploiements) + "</select></div>" +
      '<div><label>Saisi par</label><input id="cp-f-saisipar" placeholder="Ton nom" /></div>' +
    "</div>" +
    '<label class="cp-section-label">Participants</label>' +
    '<div id="cp-participants">' + rows + "</div>" +
    '<button class="cp-btn-ghost" id="cp-add-participant">+ Ajouter un joueur</button>' +
    '<label class="cp-section-label">Commentaire sur la partie (optionnel)</label>' +
    '<textarea id="cp-f-commentaire" class="cp-textarea" placeholder="Un mot sur cette partie : ambiance, équilibre, moment marquant..."></textarea>';

  const footer =
    '<div class="cp-msg" id="cp-save-msg"></div>' +
    '<div class="cp-form-actions">' +
      '<button class="cp-btn" id="cp-save-partie">' + (enEdition ? "Mettre à jour" : "Enregistrer la partie") + "</button>" +
      '<button class="cp-btn ghost" id="cp-saisie-cancel">Annuler</button>' +
    "</div>";

  let overlay = document.getElementById("cp-saisie-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "cp-saisie-overlay";
    document.body.appendChild(overlay);
  }
  overlay.innerHTML =
    '<div class="cp-saisie-panel" role="dialog" aria-modal="true">' +
      '<div class="cp-saisie-header">' +
        '<span class="cp-saisie-title">' + titre + "</span>" +
        '<button class="cp-saisie-close" id="cp-saisie-x" title="Fermer">\u2715</button>' +
      "</div>" +
      '<div class="cp-saisie-body">' + form + "</div>" +
      '<div class="cp-saisie-footer">' + footer + "</div>" +
    "</div>";
  overlay.classList.add("open");
  document.body.classList.add("cp-saisie-lock");

  applyPrefill();
}

// Pré-remplissage (création avec valeurs tirées) OU édition (partie existante)
function applyPrefill() {
  const editData = S.editPartie;
  if (editData) {
    const pa = editData.partie;
    if (qs("#cp-f-version")) qs("#cp-f-version").value = pa.version || "";
    if (qs("#cp-f-scenario")) qs("#cp-f-scenario").value = pa.scenario || "";
    if (qs("#cp-f-deploiement")) qs("#cp-f-deploiement").value = pa.deploiement || "";
    if (qs("#cp-f-saisipar")) qs("#cp-f-saisipar").value = pa.saisi_par || "";
    if (qs("#cp-f-commentaire")) qs("#cp-f-commentaire").value = pa.commentaire || "";
    const rows = [...qs("#cp-participants").querySelectorAll(".cp-part-row")];
    editData.participations.forEach((p, i) => {
      const row = rows[i];
      if (!row) return;
      row.querySelector(".cp-p-joueur").value = p.joueur || "";
      row.querySelector(".cp-p-peuple").value = p.peuple || "";
      fillListeMenu(row);
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
      if (p.note_scenario) setRating(row.querySelector(".cp-note-scenario"), p.note_scenario);
      if (p.note_deploiement) setRating(row.querySelector(".cp-note-deploiement"), p.note_deploiement);
    });
    return;
  }
  // Mode création avec pré-remplissage (valeurs tirées)
  const pre = S.prefill || {};
  if (pre.version && qs("#cp-f-version")) qs("#cp-f-version").value = pre.version;
  if (pre.scenario && qs("#cp-f-scenario")) qs("#cp-f-scenario").value = pre.scenario;
  if (pre.deploiement && qs("#cp-f-deploiement")) qs("#cp-f-deploiement").value = pre.deploiement;
  if (pre.saisiPar && qs("#cp-f-saisipar")) qs("#cp-f-saisipar").value = pre.saisiPar;
  if (Array.isArray(pre.camps)) {
    const rows = [...qs("#cp-participants").querySelectorAll(".cp-part-row")];
    pre.camps.forEach((c, i) => {
      const row = rows[i];
      if (!row) return;
      if (c.joueur) row.querySelector(".cp-p-joueur").value = c.joueur;
      if (c.faction) {
        const peupleSel = row.querySelector(".cp-p-peuple");
        peupleSel.value = c.faction;
        fillListeMenu(row); // recharge le menu listes selon le peuple pré-rempli
      }
    });
  }
}

async function savePartie() {
  const msg = qs("#cp-save-msg");
  msg.className = "cp-msg"; msg.textContent = "";

  const version = qs("#cp-f-version").value.trim() || null;
  const scenario = qs("#cp-f-scenario").value || null;
  const deploiement = qs("#cp-f-deploiement").value || null;
  const saisi_par = qs("#cp-f-saisipar").value.trim() || "Anonyme";
  const commentaire = qs("#cp-f-commentaire") ? (qs("#cp-f-commentaire").value.trim() || null) : null;

  const rows = [...qs("#cp-participants").querySelectorAll(".cp-part-row")];
  const parts = [];
  for (const r of rows) {
    const joueur = r.querySelector(".cp-p-joueur").value.trim();
    const peuple = r.querySelector(".cp-p-peuple").value;
    const archetype = r.querySelector(".cp-p-archetype").value.trim() || null;
    const pertesRaw = r.querySelector(".cp-p-pertes").value.trim();
    const pertes = pertesRaw === "" ? null : parseInt(pertesRaw, 10);
    const resultat = r.querySelector(".cp-p-resultat").value;
    const army_list_id = r.querySelector(".cp-p-liste").value || null;
    const noteScEl = r.querySelector(".cp-note-scenario");
    const noteDpEl = r.querySelector(".cp-note-deploiement");
    const note_scenario = noteScEl && +noteScEl.dataset.note ? +noteScEl.dataset.note : null;
    const note_deploiement = noteDpEl && +noteDpEl.dataset.note ? +noteDpEl.dataset.note : null;
    if (!joueur && !peuple) continue;
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
    parts.push({ joueur, peuple, archetype, pertes, resultat, army_list_id, note_scenario, note_deploiement });
  }
  if (parts.length < 2) {
    msg.className = "cp-msg err";
    msg.textContent = "Une partie nécessite au moins 2 participants.";
    return;
  }

  const btn = qs("#cp-save-partie");
  btn.disabled = true;

  const editData = S.editPartie;
  let partieId;
  if (editData) {
    const { error: upErr } = await sb.from("parties")
      .update({ version, scenario, deploiement, saisi_par, commentaire })
      .eq("id", editData.partie.id);
    if (upErr) { btn.disabled = false; msg.className = "cp-msg err"; msg.textContent = "Échec (mise à jour partie) : " + upErr.message; return; }
    partieId = editData.partie.id;
    const { error: delErr } = await sb.from("participations").delete().eq("partie_id", partieId);
    if (delErr) { btn.disabled = false; msg.className = "cp-msg err"; msg.textContent = "Échec (nettoyage participations) : " + delErr.message; return; }
  } else {
    const { data: pData, error: pErr } = await sb.from("parties")
      .insert({ version, scenario, deploiement, saisi_par, commentaire }).select();
    if (pErr || !pData || !pData.length) { btn.disabled = false; msg.className = "cp-msg err"; msg.textContent = "Échec (partie) : " + (pErr ? pErr.message : "aucune ligne créée"); return; }
    partieId = pData[0].id;
  }

  const rowsToInsert = parts.map((p) => ({ ...p, partie_id: partieId }));
  const { error: ppErr } = await sb.from("participations").insert(rowsToInsert);
  if (ppErr) { btn.disabled = false; msg.className = "cp-msg err"; msg.textContent = "Échec (participations) : " + ppErr.message; return; }

  btn.disabled = false;
  const etaitEdition = !!editData;
  const cb = S.onSaved;
  close();
  if (typeof cb === "function") cb(partieId, etaitEdition);
}

function close() {
  const overlay = document.getElementById("cp-saisie-overlay");
  if (overlay) { overlay.classList.remove("open"); overlay.innerHTML = ""; }
  document.body.classList.remove("cp-saisie-lock");
  S = null;
}

// ---------- Câblage délégué (une seule fois) ----------
function wireOnce() {
  if (saisieWired) return;
  saisieWired = true;

  document.addEventListener("click", (e) => {
    const overlay = document.getElementById("cp-saisie-overlay");
    if (!overlay || !overlay.classList.contains("open")) return;

    // fermeture (croix, bouton annuler, ou clic sur le fond)
    if (e.target.closest("#cp-saisie-x") || e.target.closest("#cp-saisie-cancel")) { close(); return; }
    if (e.target === overlay) { close(); return; }

    if (e.target.closest("#cp-save-partie")) { savePartie(); return; }

    if (e.target.closest("#cp-add-participant")) {
      S.nbJoueurs = (S.nbJoueurs || 2) + 1;
      const cont = qs("#cp-participants");
      if (cont) cont.insertAdjacentHTML("beforeend", participantRow(S.nbJoueurs - 1));
      return;
    }
    const delP = e.target.closest(".cp-part-del");
    if (delP && overlay.contains(delP)) {
      const row = delP.closest(".cp-part-row");
      if (row) { row.remove(); S.nbJoueurs = Math.max(2, qs("#cp-participants").querySelectorAll(".cp-part-row").length); }
      return;
    }
    const star = e.target.closest(".cp-star");
    if (star && overlay.contains(star)) {
      setRating(star.closest(".cp-rating"), parseInt(star.dataset.val, 10)); return;
    }
    const clr = e.target.closest(".cp-star-clear");
    if (clr && overlay.contains(clr)) { setRating(clr.closest(".cp-rating"), 0); return; }
  });

  document.addEventListener("change", (e) => {
    const overlay = document.getElementById("cp-saisie-overlay");
    if (!overlay || !overlay.classList.contains("open")) return;

    const pe = e.target.closest(".cp-p-peuple");
    if (pe && overlay.contains(pe)) { const row = pe.closest(".cp-part-row"); if (row) fillListeMenu(row); return; }

    const li = e.target.closest(".cp-p-liste");
    if (li && overlay.contains(li)) {
      const row = li.closest(".cp-part-row");
      const arch = row && row.querySelector(".cp-p-archetype");
      if (arch) {
        if (li.value) { arch.value = ""; arch.disabled = true; arch.placeholder = "(liste choisie)"; }
        else { arch.disabled = false; arch.placeholder = "Archétype"; }
      }
      return;
    }
    const res = e.target.closest(".cp-p-resultat");
    if (res && overlay.contains(res)) {
      const allRes = [...overlay.querySelectorAll(".cp-p-resultat")];
      if (res.value === "victoire") { allRes.forEach((s) => { if (s !== res) s.value = "defaite"; }); }
      else if (res.value === "egalite") { allRes.forEach((s) => { s.value = "egalite"; }); }
      return;
    }
  });

  // Échap ferme la modale
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const overlay = document.getElementById("cp-saisie-overlay");
    if (overlay && overlay.classList.contains("open")) close();
  });
}

// ---------- API publique ----------
function open(opts) {
  opts = opts || {};
  if (!opts.refs) { console.error("[cp-saisie] refs manquants"); return; }
  S = {
    refs: opts.refs,
    prefill: opts.prefill || null,
    editPartie: opts.editPartie || null,
    onSaved: opts.onSaved || null,
    nbJoueurs: opts.editPartie ? opts.editPartie.participations.length : Math.max(2, (opts.prefill && Array.isArray(opts.prefill.camps)) ? opts.prefill.camps.length : 2),
  };
  wireOnce();
  renderModal();
}

window.cpSaisie = { open, close };
