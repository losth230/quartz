/* ============================================================
   Chasse & Pêche — Fiches de personnage (JdR)
   Liste des personnages + fiche éditable, persistance Supabase.
   Même philosophie que cp-army-builder.js : module autonome,
   aucune dépendance de build, se monte dans #jdr-fiches-app.
   ============================================================ */

/* ------------------------------------------------------------
   CONFIGURATION
   Le client Supabase (et donc les clés API) est réutilisé depuis
   ton client partagé cp-supabase.js — on ne redéclare rien ici.
   Les deux fichiers sont à plat dans quartz/static/.
------------------------------------------------------------ */
import { sb as supabase } from "./cp-supabase.js";

const TABLE = "jdr_personnages";

/* ------------------------------------------------------------
   Modèle de données (calqué sur le template papier)
------------------------------------------------------------ */
const COMPETENCES = {
  physique: [
    "Agilité", "Brute", "Crochetage / Larcin", "Discrétion",
    "Intimidation", "Résilience", "Vigilance",
  ],
  mental: [
    "Arcane", "Exploration", "Fabrication", "Histoire",
    "Nature", "Premiers secours", "Religion",
  ],
  social: [
    "Etiquette", "Dressage", "Manipulation", "Négociation",
    "Présence / Volonté", "Perspicacité", "Spectacle",
  ],
};

const CATEGORIES = [
  { key: "physique", label: "Physique" },
  { key: "mental", label: "Mental" },
  { key: "social", label: "Social" },
];

const IDENTITE = [
  ["classe", "Classe"], ["race", "Race"], ["age", "Âge"],
  ["taille", "Taille"], ["poids", "Poids"], ["peau", "Peau"],
  ["yeux", "Yeux"], ["cheveux", "Cheveux"],
];

function defaultDonnees() {
  const comps = {};
  for (const cat of Object.keys(COMPETENCES)) {
    comps[cat] = {};
    for (const c of COMPETENCES[cat]) comps[cat][c] = 0;
  }
  return {
    niveau: 1,
    talents: 0,
    pv: 9,
    reserve_magie: "",
    vitesse: '5"',
    melee: "",
    tir: "",
    armure: "",
    identite: Object.fromEntries(IDENTITE.map(([k]) => [k, ""])),
    des: { physique: "3d6", mental: "3d6", social: "3d6" },
    competences: comps,
    armes: [],
    domaines_magie: ["", "", ""],
    capacites: "",
    inventaire: "",
    florins: 0,
  };
}

/* Fusionne les données stockées avec le modèle par défaut
   (robuste si le schéma évolue) */
function normaliseDonnees(d) {
  const base = defaultDonnees();
  if (!d || typeof d !== "object") return base;
  const out = { ...base, ...d };
  out.identite = { ...base.identite, ...(d.identite || {}) };
  out.des = { ...base.des, ...(d.des || {}) };
  out.competences = {};
  for (const cat of Object.keys(COMPETENCES)) {
    out.competences[cat] = {
      ...base.competences[cat],
      ...((d.competences || {})[cat] || {}),
    };
  }
  out.armes = Array.isArray(d.armes) ? d.armes : [];
  out.domaines_magie = Array.isArray(d.domaines_magie)
    ? [0, 1, 2].map((i) => d.domaines_magie[i] || "")
    : ["", "", ""];
  return out;
}

/* Seuil dérivé du niveau : niv 1 → 5+, niv 2 → 4+, etc. (plancher 2+) */
function seuil(niv) {
  const n = parseInt(niv, 10);
  if (!n || n <= 0) return "—";
  return Math.max(2, 6 - n) + "+";
}

/* ------------------------------------------------------------
   État
------------------------------------------------------------ */
const state = {
  view: "liste",        // "liste" | "fiche"
  personnages: [],
  courant: null,        // { id, nom, donnees, updated_at }
  dirty: false,
  chargement: true,
  erreur: null,
};

/* ------------------------------------------------------------
   Utilitaires
------------------------------------------------------------ */
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

function dateFr(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/* ------------------------------------------------------------
   Accès Supabase
------------------------------------------------------------ */
async function chargerListe() {
  state.chargement = true;
  state.erreur = null;
  render();
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, nom, donnees, updated_at")
    .order("nom", { ascending: true });
  state.chargement = false;
  if (error) {
    state.erreur = "Impossible de charger les personnages : " + error.message;
  } else {
    state.personnages = data || [];
  }
  render();
}

async function creerPersonnage() {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ nom: "Nouveau personnage", donnees: defaultDonnees() })
    .select()
    .single();
  if (error) {
    alert("Création impossible : " + error.message);
    return;
  }
  data.donnees = normaliseDonnees(data.donnees);
  state.courant = data;
  state.view = "fiche";
  state.dirty = false;
  render();
}

async function sauvegarder() {
  if (!state.courant) return;
  lireFicheDepuisDom();
  const p = state.courant;
  const bouton = document.querySelector("[data-action='sauver']");
  if (bouton) bouton.textContent = "Enregistrement…";
  const { error } = await supabase
    .from(TABLE)
    .update({ nom: p.nom, donnees: p.donnees })
    .eq("id", p.id);
  if (error) {
    alert("Enregistrement impossible : " + error.message);
    if (bouton) bouton.textContent = "Enregistrer";
    return;
  }
  state.dirty = false;
  render();
}

async function supprimerPersonnage() {
  if (!state.courant) return;
  if (!confirm(`Supprimer définitivement « ${state.courant.nom} » ?`)) return;
  const { error } = await supabase.from(TABLE).delete().eq("id", state.courant.id);
  if (error) {
    alert("Suppression impossible : " + error.message);
    return;
  }
  state.courant = null;
  state.view = "liste";
  state.dirty = false;
  await chargerListe();
}

/* ------------------------------------------------------------
   Lecture de la fiche depuis le DOM (avant sauvegarde)
------------------------------------------------------------ */
function lireFicheDepuisDom() {
  const p = state.courant;
  if (!p) return;
  const root = document.getElementById("jdr-fiches-app");
  const val = (sel) => root.querySelector(sel)?.value ?? "";
  const num = (sel) => {
    const n = parseInt(val(sel), 10);
    return Number.isFinite(n) ? n : 0;
  };

  p.nom = val("[data-champ='nom']").trim() || "Sans nom";
  const d = p.donnees;
  d.niveau = num("[data-champ='niveau']");
  d.talents = num("[data-champ='talents']");
  d.pv = num("[data-champ='pv']");
  d.reserve_magie = val("[data-champ='reserve_magie']").trim();
  d.vitesse = val("[data-champ='vitesse']").trim();
  d.melee = val("[data-champ='melee']").trim();
  d.tir = val("[data-champ='tir']").trim();
  d.armure = val("[data-champ='armure']").trim();
  for (const [k] of IDENTITE) d.identite[k] = val(`[data-identite='${k}']`).trim();
  for (const cat of Object.keys(COMPETENCES)) {
    d.des[cat] = val(`[data-de='${cat}']`).trim();
    for (const c of COMPETENCES[cat]) {
      const input = root.querySelector(
        `[data-comp='${cat}'][data-nom='${CSS.escape(c)}']`
      );
      d.competences[cat][c] = input ? parseInt(input.value, 10) || 0 : 0;
    }
  }
  d.armes = [...root.querySelectorAll("[data-arme-ligne]")].map((tr) => ({
    nom: tr.querySelector("[data-arme='nom']").value.trim(),
    maniement: tr.querySelector("[data-arme='maniement']").value.trim(),
    attaques: tr.querySelector("[data-arme='attaques']").value.trim(),
    proprietes: tr.querySelector("[data-arme='proprietes']").value.trim(),
  })).filter((a) => a.nom || a.maniement || a.attaques || a.proprietes);
  d.domaines_magie = [0, 1, 2].map((i) => val(`[data-magie='${i}']`).trim());
  d.capacites = val("[data-champ='capacites']");
  d.inventaire = val("[data-champ='inventaire']");
  d.florins = num("[data-champ='florins']");
}

/* ------------------------------------------------------------
   Rendu — vue liste
------------------------------------------------------------ */
function renderListe() {
  if (state.chargement) {
    return `<div class="jdr-vide">Chargement des personnages…</div>`;
  }
  if (state.erreur) {
    return `<div class="jdr-erreur">${esc(state.erreur)}</div>`;
  }
  const lignes = state.personnages.map((p) => {
    const d = normaliseDonnees(p.donnees);
    return `
      <tr class="jdr-ligne" data-ouvrir="${p.id}">
        <td class="jdr-cell-nom">${esc(p.nom)}</td>
        <td>${esc(d.identite.classe) || "—"}</td>
        <td>${esc(d.identite.race) || "—"}</td>
        <td class="jdr-centre">${d.niveau || "—"}</td>
        <td class="jdr-centre">${d.pv || "—"}</td>
        <td class="jdr-cell-date">${dateFr(p.updated_at)}</td>
      </tr>`;
  }).join("");

  return `
    <div class="jdr-entete-liste">
      <h2 class="jdr-titre">Personnages</h2>
      <button class="jdr-btn jdr-btn-principal" data-action="creer">+ Nouveau personnage</button>
    </div>
    ${
      state.personnages.length === 0
        ? `<div class="jdr-vide">Aucun personnage pour l'instant. Crée la première fiche pour commencer la partie.</div>`
        : `<table class="jdr-table-liste">
            <thead>
              <tr><th>Nom</th><th>Classe</th><th>Race</th><th>Niv.</th><th>PV</th><th>Modifié</th></tr>
            </thead>
            <tbody>${lignes}</tbody>
          </table>`
    }`;
}

/* ------------------------------------------------------------
   Rendu — fiche de personnage
------------------------------------------------------------ */
function renderCompetences(catKey, catLabel) {
  const d = state.courant.donnees;
  const lignes = COMPETENCES[catKey].map((c) => {
    const niv = d.competences[catKey][c] || 0;
    return `
      <div class="jdr-comp">
        <input type="number" min="0" max="4" class="jdr-comp-niv"
               data-comp="${catKey}" data-nom="${esc(c)}" value="${niv || ""}"
               aria-label="Niveau ${esc(c)}">
        <span class="jdr-comp-seuil" data-seuil>${seuil(niv)}</span>
        <span class="jdr-comp-nom">${esc(c)}</span>
      </div>`;
  }).join("");
  return `
    <section class="jdr-bloc jdr-attributs">
      <div class="jdr-bandeau">${catLabel}</div>
      <div class="jdr-de">
        <input type="text" data-de="${catKey}" value="${esc(d.des[catKey])}"
               aria-label="Dé ${catLabel}">
      </div>
      <div class="jdr-comp-entetes"><span>Niv</span><span>Seuil</span><span></span></div>
      ${lignes}
    </section>`;
}

function renderArmes() {
  const armes = state.courant.donnees.armes;
  const lignes = (armes.length ? armes : [{}]).map((a) => `
    <tr data-arme-ligne>
      <td><input type="text" data-arme="nom" value="${esc(a.nom || "")}"></td>
      <td><input type="text" data-arme="maniement" value="${esc(a.maniement || "")}"></td>
      <td><input type="text" data-arme="attaques" value="${esc(a.attaques || "")}"></td>
      <td><input type="text" data-arme="proprietes" value="${esc(a.proprietes || "")}"></td>
      <td class="jdr-centre"><button class="jdr-btn-icone" data-action="retirer-arme" title="Retirer">×</button></td>
    </tr>`).join("");
  return `
    <section class="jdr-bloc">
      <div class="jdr-bandeau">Armes</div>
      <table class="jdr-table-armes">
        <thead><tr><th>Arme</th><th>Maniement</th><th>Attaques</th><th>Propriétés</th><th></th></tr></thead>
        <tbody id="jdr-armes-corps">${lignes}</tbody>
      </table>
      <button class="jdr-btn jdr-btn-secondaire" data-action="ajouter-arme">+ Ajouter une arme</button>
    </section>`;
}

function renderFiche() {
  const p = state.courant;
  const d = p.donnees;

  const identite = IDENTITE.map(([k, label]) => `
    <label class="jdr-id-ligne">
      <span>${label}</span>
      <input type="text" data-identite="${k}" value="${esc(d.identite[k])}">
    </label>`).join("");

  const fanions = [
    ["vitesse", "Vitesse", d.vitesse],
    ["melee", "Mêlée", d.melee],
    ["tir", "Tir", d.tir],
    ["armure", "Ar / RM", d.armure],
  ].map(([k, label, v]) => `
    <div class="jdr-fanion">
      <div class="jdr-fanion-titre">${label}</div>
      <div class="jdr-fanion-corps">
        <input type="text" data-champ="${k}" value="${esc(v)}" aria-label="${label}">
      </div>
    </div>`).join("");

  const magie = [0, 1, 2].map((i) => `
    <label class="jdr-id-ligne">
      <span>Domaine ${i + 1}</span>
      <input type="text" data-magie="${i}" value="${esc(d.domaines_magie[i])}">
    </label>`).join("");

  return `
    <div class="jdr-barre">
      <button class="jdr-btn jdr-btn-secondaire" data-action="retour">← Personnages</button>
      <div class="jdr-barre-etat">${state.dirty ? "Modifications non enregistrées" : "À jour"}</div>
      <div class="jdr-barre-actions">
        <button class="jdr-btn jdr-btn-principal" data-action="sauver"${state.dirty ? "" : " disabled"}>Enregistrer</button>
        <button class="jdr-btn jdr-btn-danger" data-action="supprimer">Supprimer</button>
      </div>
    </div>

    <div class="jdr-entete-fiche">
      <div class="jdr-entete-gauche">
        <input type="text" class="jdr-nom" data-champ="nom" value="${esc(p.nom)}" aria-label="Nom du personnage">
        <div class="jdr-niveau-talents">
          <label>Niveau <input type="number" min="1" data-champ="niveau" value="${d.niveau || ""}"></label>
          <label>Talents <input type="number" min="0" data-champ="talents" value="${d.talents || ""}"></label>
        </div>
      </div>
      <div class="jdr-jauges">
        <div class="jdr-coeur" title="Points de vie">
          <input type="number" min="0" data-champ="pv" value="${d.pv || ""}" aria-label="Points de vie">
        </div>
        <div class="jdr-fiole" title="Réserve de magie">
          <input type="text" data-champ="reserve_magie" value="${esc(d.reserve_magie)}" aria-label="Réserve de magie" placeholder="7d6">
        </div>
      </div>
      <section class="jdr-bloc jdr-identite">
        ${identite}
      </section>
    </div>

    <div class="jdr-rang-fanions">${fanions}</div>

    <div class="jdr-grille-attributs">
      ${CATEGORIES.map((c) => renderCompetences(c.key, c.label)).join("")}
    </div>

    <div class="jdr-grille-bas">
      <div class="jdr-colonne">
        ${renderArmes()}
        <section class="jdr-bloc">
          <div class="jdr-bandeau">Capacités</div>
          <textarea data-champ="capacites" rows="7">${esc(d.capacites)}</textarea>
        </section>
      </div>
      <div class="jdr-colonne">
        <section class="jdr-bloc">
          <div class="jdr-bandeau">Domaines de magie</div>
          ${magie}
        </section>
        <section class="jdr-bloc">
          <div class="jdr-bandeau">Inventaire</div>
          <label class="jdr-id-ligne jdr-florins">
            <span>Florins</span>
            <input type="number" min="0" data-champ="florins" value="${d.florins || ""}">
          </label>
          <textarea data-champ="inventaire" rows="9">${esc(d.inventaire)}</textarea>
        </section>
      </div>
    </div>`;
}

/* ------------------------------------------------------------
   Rendu principal + événements
------------------------------------------------------------ */
function render() {
  const root = document.getElementById("jdr-fiches-app");
  if (!root) return;
  root.innerHTML = `<div class="jdr-app">${
    state.view === "fiche" && state.courant ? renderFiche() : renderListe()
  }</div>`;
}

function majEtatBarre() {
  const etat = document.querySelector(".jdr-barre-etat");
  const btn = document.querySelector("[data-action='sauver']");
  if (etat) etat.textContent = state.dirty ? "Modifications non enregistrées" : "À jour";
  if (btn) btn.disabled = !state.dirty;
}

function attacherEvenements(root) {
  root.addEventListener("click", async (e) => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    const ligne = e.target.closest("[data-ouvrir]");

    if (ligne) {
      const p = state.personnages.find((x) => x.id === ligne.dataset.ouvrir);
      if (p) {
        state.courant = { ...p, donnees: normaliseDonnees(p.donnees) };
        state.view = "fiche";
        state.dirty = false;
        render();
        window.scrollTo({ top: 0 });
      }
      return;
    }

    switch (action) {
      case "creer":
        await creerPersonnage();
        break;
      case "retour":
        if (state.dirty && !confirm("Des modifications ne sont pas enregistrées. Quitter quand même ?")) return;
        state.view = "liste";
        state.courant = null;
        state.dirty = false;
        await chargerListe();
        break;
      case "sauver":
        await sauvegarder();
        break;
      case "supprimer":
        await supprimerPersonnage();
        break;
      case "ajouter-arme": {
        lireFicheDepuisDom();
        state.courant.donnees.armes.push({ nom: "", maniement: "", attaques: "", proprietes: "" });
        state.dirty = true;
        render();
        break;
      }
      case "retirer-arme": {
        const tr = e.target.closest("[data-arme-ligne]");
        if (tr) {
          tr.remove();
          lireFicheDepuisDom();
          state.dirty = true;
          render();
        }
        break;
      }
    }
  });

  // Toute saisie marque la fiche comme modifiée
  root.addEventListener("input", (e) => {
    if (state.view !== "fiche") return;
    state.dirty = true;
    // Seuil recalculé en direct quand un niveau de compétence change
    if (e.target.matches("[data-comp]")) {
      const span = e.target.parentElement.querySelector("[data-seuil]");
      if (span) span.textContent = seuil(e.target.value);
    }
    majEtatBarre();
  });

  // Garde-fou avant fermeture d'onglet
  window.addEventListener("beforeunload", (e) => {
    if (state.dirty) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
}

/* ------------------------------------------------------------
   Démarrage
------------------------------------------------------------ */
function init() {
  const root = document.getElementById("jdr-fiches-app");
  if (!root) {
    console.error("jdr-fiches : élément #jdr-fiches-app introuvable.");
    return;
  }
  attacherEvenements(root);
  chargerListe();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
