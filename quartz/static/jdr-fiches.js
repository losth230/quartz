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
   Modèle de données
------------------------------------------------------------ */
const COMPETENCES = {
  physique: [
    "Agilité", "Brute", "Crochetage / Larcin", "Discrétion",
    "Intimidation", "Résilience", "Vigilance",
  ],
  mental: [
    "Arcane", "Exploration", "Fabrication", "Érudition",
    "Nature", "Premiers secours", "Volonté",
  ],
  social: [
    "Etiquette", "Dressage", "Persuasion", "Présence",
    "Perspicacité", "Spectacle", "Réseautage",
  ],
};

const CATEGORIES = [
  { key: "physique", label: "Physique" },
  { key: "mental", label: "Mental" },
  { key: "social", label: "Social" },
];

/* Identité : Race/Classe sous le nom, le reste dans le bloc physique */
const IDENTITE_TITRE = [["race", "Race"], ["classe", "Classe"]];
const IDENTITE_PHYSIQUE = [
  ["taille", "Taille"], ["peau", "Peau"],
  ["cheveux", "Cheveux"], ["yeux", "Yeux"],
  ["poids", "Poids"], ["age", "Âge"],
];
const IDENTITE = [...IDENTITE_TITRE, ...IDENTITE_PHYSIQUE];

/* Panneaux repliables, et leur état par défaut (true = replié au chargement).
   Tout est dépliable/repliable ; seuls Histoire et Notes démarrent fermés. */
const REPLIABLES = {
  identite: false, valeurs: false,
  physique: false, mental: false, social: false,
  armes: false, domaines: false,
  capacites: false, inventaire: false, description: false,
  histoire: true, notes: true,
};

/* ------------------------------------------------------------
   Icônes SVG inline — currentColor partout, donc elles suivent
   automatiquement la couleur d'encre du thème (clair/sombre).
------------------------------------------------------------ */
const ICONES = {
  physique: `<svg class="jdr-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M6.5 10.2V7.6a1.9 1.9 0 1 1 3.8 0v2M10.3 9.6V6.4a1.9 1.9 0 1 1 3.8 0v3.4M14.1 10V7.6a1.7 1.7 0 1 1 3.4 0V13a4.6 4.6 0 0 1-4.6 4.6h-1.8A4.6 4.6 0 0 1 7 15.1L5.3 11.9c-.4-.8 0-1.7.9-2 .7-.2 1.4.1 1.8.8l.7 1.2"/>
  </svg>`,
  mental: `<svg class="jdr-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 3 2.7 19.2h18.6L12 3Z"/>
    <circle cx="12" cy="14.4" r="2.4"/>
    <circle cx="12" cy="14.4" r=".5" fill="currentColor" stroke="none"/>
  </svg>`,
  social: `<svg class="jdr-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M4 6.5h12.5a1.8 1.8 0 0 1 1.8 1.8v5.4a1.8 1.8 0 0 1-1.8 1.8H10l-3.6 2.7v-2.7H4a1.8 1.8 0 0 1-1.8-1.8V8.3A1.8 1.8 0 0 1 4 6.5Z"/>
    <path d="M6.5 10.3h8M6.5 13h5.2"/>
  </svg>`,
  armes: `<svg class="jdr-filigrane-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M3 21 12.5 11.5M14 10l6.5-6.5.9 2.6L19 8.5l-2.6-.9L14 10Z"/>
    <path d="M21 21 11.5 11.5M10 14l-6.5 6.5-.9-2.6L5 15.5l2.6.9L10 14Z"/>
  </svg>`,
  capacites: `<svg class="jdr-filigrane-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 2.5c.9 3 2 4.6 4.7 5.7-2.7 1.1-3.8 2.7-4.7 5.7-.9-3-2-4.6-4.7-5.7 2.7-1.1 3.8-2.7 4.7-5.7Z"/>
    <path d="M18.5 14.5c.5 1.7 1.1 2.6 2.7 3.2-1.6.6-2.2 1.5-2.7 3.2-.5-1.7-1.1-2.6-2.7-3.2 1.6-.6 2.2-1.5 2.7-3.2Z"/>
  </svg>`,
  magie: `<svg class="jdr-filigrane-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 2 5 8.5 12 22l7-13.5L12 2Z"/>
    <path d="M5 8.5h14M9 8.5 12 2l3 6.5M9.5 8.5 12 22M14.5 8.5 12 22"/>
  </svg>`,
  inventaire: `<svg class="jdr-filigrane-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M8 8V6.5a4 4 0 0 1 8 0V8"/>
    <path d="M5.5 8h13l1 12.5a1.6 1.6 0 0 1-1.6 1.5H6.1A1.6 1.6 0 0 1 4.5 20.5L5.5 8Z"/>
  </svg>`,
  portrait: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="3.5" y="4.5" width="17" height="14" rx="1.6"/>
    <circle cx="9" cy="10" r="1.6"/>
    <path d="M4 16.5 8.5 12l3 3 3.5-4L20 15.5"/>
  </svg>`,
  valeurs: `<svg class="jdr-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="8.2"/>
    <path d="M12 7.2 13.4 12 12 16.8 10.6 12 12 7.2Z" fill="currentColor" stroke="none"/>
  </svg>`,
  histoire: `<svg class="jdr-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 5.5c-1.8-1.3-4-1.8-6.2-1.5v13c2.2-.3 4.4.2 6.2 1.5 1.8-1.3 4-1.8 6.2-1.5v-13c-2.2-.3-4.4.2-6.2 1.5Z"/>
    <path d="M12 5.5v13"/>
  </svg>`,
  description: `<svg class="jdr-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="8.3" r="3.3"/>
    <path d="M5 19.5c1.2-3.4 4-5 7-5s5.8 1.6 7 5"/>
  </svg>`,
  notes: `<svg class="jdr-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M4 20 14.5 9.5"/>
    <path d="M13 7l4 4-1.8 1.8-4-4L13 7Z"/>
    <path d="M4 20l1-4.2 3.2 3.2L4 20Z"/>
  </svg>`,
  chevron: `<svg class="jdr-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M6 9.5 12 15.5 18 9.5"/>
  </svg>`,
};

function defaultDonnees() {
  const comps = {};
  for (const cat of Object.keys(COMPETENCES)) {
    comps[cat] = {};
    for (const c of COMPETENCES[cat]) comps[cat][c] = 0;
  }
  return {
    campagne: "",
    niveau: 1,
    talents: 0,
    pv: 9,
    reserve_magie: "",
    vitesse: '5"',
    melee: "",
    tir: "",
    armure: "",
    portrait: "",
    identite: Object.fromEntries(IDENTITE.map(([k]) => [k, ""])),
    des: { physique: "3d6", mental: "3d6", social: "3d6" },
    valeurs: [],
    competences: comps,
    armes: [],
    domaines_magie: [],
    capacites: "",
    inventaire: "",
    florins: 0,
    histoire: "",
    description_physique: "",
    notes: "",
  };
}

/* Liste de chaînes simples ({nom}) — tolère l'ancien format tableau
   de chaînes brutes aussi bien que le nouveau format objet. */
function normaliseListeNoms(v) {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (typeof x === "string" ? { nom: x } : { nom: (x && x.nom) || "" }))
    .filter((x) => x.nom);
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
  // Valeurs et expériences ont fusionné en une seule liste : on récupère
  // les anciennes "experiences" enregistrées à part, sans rien perdre.
  out.valeurs = [...normaliseListeNoms(d.valeurs), ...normaliseListeNoms(d.experiences)];
  // Domaines : l'ancien format était ["Cataclysme", "Givre", ""] —
  // on le convertit en objets {nom, passif1, passif2} sans rien perdre.
  out.domaines_magie = Array.isArray(d.domaines_magie)
    ? d.domaines_magie
        .map((x) =>
          typeof x === "string"
            ? { nom: x, passif1: "", passif2: "" }
            : {
                nom: (x && x.nom) || "",
                passif1: (x && x.passif1) || "",
                passif2: (x && x.passif2) || "",
              }
        )
        .filter((x) => x.nom || x.passif1 || x.passif2)
    : [];
  return out;
}

/* Seuil dérivé du niveau : niv 1 → 5+, niv 2 → 4+, etc. (plancher 2+) */
function seuil(niv) {
  const n = parseInt(niv, 10);
  if (!n || n <= 0) return "—";
  return Math.max(2, 6 - n) + "+";
}

/* Nombre de dés d'un arbre = somme des niveaux de ses compétences.
   Règle : chaque arbre doit totaliser au moins 2 niveaux. */
function sommeArbre(catKey) {
  const comp = state.courant?.donnees?.competences?.[catKey];
  if (!comp) return 0;
  return Object.values(comp).reduce((tot, n) => tot + (parseInt(n, 10) || 0), 0);
}

const SEUIL_MIN_ARBRE = 2;

/* ------------------------------------------------------------
   État
------------------------------------------------------------ */
const state = {
  view: "liste",
  personnages: [],
  tri: { cle: "nom", sens: 1 },
  courant: null,
  dirty: false,
  chargement: true,
  erreur: null,
  replie: { ...REPLIABLES },
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

/* Les panneaux s'adaptent à leur contenu : chaque textarea grandit
   à la hauteur de son texte, sans barre de défilement interne. */
function ajusterTextarea(ta) {
  ta.style.height = "auto";
  ta.style.height = ta.scrollHeight + "px";
}

function ajusterTousTextareas(root) {
  root.querySelectorAll("textarea").forEach(ajusterTextarea);
}

/* Redimensionne et recompresse une image côté client avant stockage
   en base64 dans le JSONB — évite d'alourdir la table Supabase. */
function comprimerImage(fichier, tailleMax = 480, qualite = 0.75) {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onerror = () => reject(new Error("lecture du fichier impossible"));
    lecteur.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("fichier image invalide"));
      img.onload = () => {
        let { width, height } = img;
        if (width >= height && width > tailleMax) {
          height = Math.round(height * (tailleMax / width));
          width = tailleMax;
        } else if (height > width && height > tailleMax) {
          width = Math.round(width * (tailleMax / height));
          height = tailleMax;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", qualite));
      };
      img.src = lecteur.result;
    };
    lecteur.readAsDataURL(fichier);
  });
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
  state.replie = { ...REPLIABLES };
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
  if (!root || state.view !== "fiche") return;
  const val = (sel) => root.querySelector(sel)?.value ?? "";
  const num = (sel) => {
    const n = parseInt(val(sel), 10);
    return Number.isFinite(n) ? n : 0;
  };

  p.nom = val("[data-champ='nom']").trim() || "Sans nom";
  const d = p.donnees;
  d.campagne = val("[data-champ='campagne']").trim().toUpperCase().slice(0, 3);
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
    for (const c of COMPETENCES[cat]) {
      const input = root.querySelector(
        `[data-comp='${cat}'][data-nom='${CSS.escape(c)}']`
      );
      d.competences[cat][c] = input ? parseInt(input.value, 10) || 0 : 0;
    }
    d.des[cat] = sommeArbre(cat) + "d6";
  }
  d.armes = [...root.querySelectorAll("[data-arme-ligne]")].map((tr) => ({
    nom: tr.querySelector("[data-arme='nom']").value.trim(),
    maniement: tr.querySelector("[data-arme='maniement']").value.trim(),
    attaques: tr.querySelector("[data-arme='attaques']").value.trim(),
    proprietes: tr.querySelector("[data-arme='proprietes']").value.trim(),
  })).filter((a) => a.nom || a.maniement || a.attaques || a.proprietes);
  d.domaines_magie = [...root.querySelectorAll("[data-domaine-ligne]")].map((el) => ({
    nom: el.querySelector("[data-domaine='nom']").value.trim(),
    passif1: el.querySelector("[data-domaine='passif1']").value.trim(),
    passif2: el.querySelector("[data-domaine='passif2']").value.trim(),
  })).filter((x) => x.nom || x.passif1 || x.passif2);
  d.valeurs = [...root.querySelectorAll("[data-valeur-ligne]")]
    .map((el) => ({ nom: el.querySelector("[data-valeur='nom']").value.trim() }))
    .filter((v) => v.nom);
  d.capacites = val("[data-champ='capacites']");
  d.inventaire = val("[data-champ='inventaire']");
  d.florins = num("[data-champ='florins']");
  d.histoire = val("[data-champ='histoire']");
  d.description_physique = val("[data-champ='description_physique']");
  d.notes = val("[data-champ='notes']");
}

/* ------------------------------------------------------------
   Rendu — vue liste
------------------------------------------------------------ */
const COLONNES_LISTE = [
  ["campagne", "ID"],
  ["nom", "Nom"],
  ["classe", "Classe"],
  ["race", "Race"],
  ["niveau", "Niv."],
  ["pv", "PV"],
  ["updated_at", "Modifié"],
];

function cleTri(cle, d, p) {
  if (cle === "nom") return (p.nom || "").toLowerCase();
  if (cle === "updated_at") return p.updated_at || "";
  if (cle === "niveau" || cle === "pv") return d[cle] || 0;
  return ((d.identite || {})[cle] || "").toLowerCase();
}

function personnagesTries() {
  const { cle, sens } = state.tri;
  const avecDonnees = state.personnages.map((p) => ({ p, d: normaliseDonnees(p.donnees) }));
  avecDonnees.sort((a, b) => {
    const va = cleTri(cle, a.d, a.p);
    const vb = cleTri(cle, b.d, b.p);
    if (va < vb) return -1 * sens;
    if (va > vb) return 1 * sens;
    return (a.p.nom || "").localeCompare(b.p.nom || "");
  });
  return avecDonnees;
}

function enteteTri(cle, label) {
  const actif = state.tri.cle === cle;
  return `<th data-tri="${cle}" class="jdr-th-tri${actif ? " est-actif" : ""}" title="Trier par ${label.toLowerCase()}">${label}${actif ? `<span class="jdr-fleche" data-sens>${state.tri.sens === 1 ? "▾" : "▴"}</span>` : ""}</th>`;
}

function renderListe() {
  if (state.chargement) {
    return `<div class="jdr-vide">Chargement des personnages…</div>`;
  }
  if (state.erreur) {
    return `<div class="jdr-erreur">${esc(state.erreur)}</div>`;
  }
  const lignes = personnagesTries().map(({ p, d }) => `
    <tr class="jdr-ligne" data-ouvrir="${p.id}">
      <td class="jdr-cell-campagne">${esc(d.campagne) || "—"}</td>
      <td class="jdr-cell-nom">${esc(p.nom)}</td>
      <td>${esc(d.identite.classe) || "—"}</td>
      <td>${esc(d.identite.race) || "—"}</td>
      <td class="jdr-centre">${d.niveau || "—"}</td>
      <td class="jdr-centre">${d.pv || "—"}</td>
      <td class="jdr-cell-date">${dateFr(p.updated_at)}</td>
    </tr>`).join("");

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
              <tr>${COLONNES_LISTE.map(([cle, label]) => enteteTri(cle, label)).join("")}</tr>
            </thead>
            <tbody>${lignes}</tbody>
          </table>`
    }`;
}

/* ------------------------------------------------------------
   Rendu — briques réutilisables
------------------------------------------------------------ */
function bandeau(icone, label, cle) {
  if (!cle) return `<div class="jdr-bandeau">${icone || ""}<span>${label}</span></div>`;
  const replie = state.replie[cle];
  return `
    <button type="button" class="jdr-bandeau jdr-bandeau-repliable${replie ? " est-replie" : ""}"
            data-action="replier" data-panneau="${cle}"
            aria-expanded="${replie ? "false" : "true"}">
      ${icone || ""}<span>${label}</span>${ICONES.chevron}
    </button>`;
}

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
  const total = sommeArbre(catKey);
  const insuffisant = total < SEUIL_MIN_ARBRE;
  return `
    <section class="jdr-bloc jdr-attributs${state.replie[catKey] ? " est-replie" : ""}">
      ${bandeau(ICONES[catKey], catLabel, catKey)}
      <div class="jdr-de${insuffisant ? " jdr-de-insuffisant" : ""}"
           data-de-badge="${catKey}"
           title="${insuffisant ? `Minimum ${SEUIL_MIN_ARBRE} niveaux requis dans cet arbre` : "Nombre de dés = somme des niveaux"}">
        ${total}d6
      </div>
      <div class="jdr-repliable">
        <div class="jdr-comp-entetes"><span>Niv</span><span>Seuil</span><span></span></div>
        ${lignes}
      </div>
    </section>`;
}

/* Valeurs et expériences : une seule et même liste — ce à quoi croit
   le personnage et d'où il vient, sans distinction mécanique. */
function renderValeurs() {
  const items = state.courant.donnees.valeurs;
  const lignes = (items.length ? items : [{}]).map((v) => `
    <div class="jdr-puce" data-valeur-ligne>
      <input type="text" data-valeur="nom" value="${esc(v.nom || "")}" aria-label="Valeur ou expérience">
      <button type="button" class="jdr-btn-icone" data-action="retirer-valeur" title="Retirer">×</button>
    </div>`).join("");
  return `
    <section class="jdr-bloc jdr-valeurs${state.replie.valeurs ? " est-replie" : ""}">
      ${bandeau(ICONES.valeurs, "Valeurs et expériences", "valeurs")}
      <div class="jdr-repliable">
        <div class="jdr-liste-valeurs">${lignes}</div>
        <button class="jdr-btn jdr-btn-secondaire jdr-btn-ajout" data-action="ajouter-valeur">+ Ajouter</button>
      </div>
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
      <td class="jdr-centre"><button type="button" class="jdr-btn-icone" data-action="retirer-arme" title="Retirer">×</button></td>
    </tr>`).join("");
  return `
    <section class="jdr-bloc jdr-bloc-filigrane${state.replie.armes ? " est-replie" : ""}">
      <div class="jdr-filigrane">${ICONES.armes}</div>
      ${bandeau("", "Armes", "armes")}
      <div class="jdr-repliable">
      <table class="jdr-table-armes">
        <colgroup>
          <col style="width:26%"><col style="width:16%"><col style="width:14%">
          <col style="width:38%"><col style="width:6%">
        </colgroup>
        <thead><tr><th>Arme</th><th>Maniement</th><th>Attaques</th><th>Propriétés</th><th></th></tr></thead>
        <tbody>${lignes}</tbody>
      </table>
      <button class="jdr-btn jdr-btn-secondaire" data-action="ajouter-arme">+ Ajouter une arme</button>
      </div>
    </section>`;
}

function renderDomaines() {
  const doms = state.courant.donnees.domaines_magie;
  const lignes = (doms.length ? doms : [{}]).map((x) => `
    <div class="jdr-domaine" data-domaine-ligne>
      <div class="jdr-domaine-entete">
        <input type="text" class="jdr-domaine-nom" data-domaine="nom"
               value="${esc(x.nom || "")}" placeholder="Domaine">
        <button type="button" class="jdr-btn-icone" data-action="retirer-domaine" title="Retirer">×</button>
      </div>
      <input type="text" data-domaine="passif1" value="${esc(x.passif1 || "")}" placeholder="Passif 1">
      <input type="text" data-domaine="passif2" value="${esc(x.passif2 || "")}" placeholder="Passif 2">
    </div>`).join("");
  return `
    <section class="jdr-bloc jdr-bloc-filigrane${state.replie.domaines ? " est-replie" : ""}">
      <div class="jdr-filigrane">${ICONES.magie}</div>
      ${bandeau("", "Domaines de magie", "domaines")}
      <div class="jdr-repliable">
        <div class="jdr-domaines">${lignes}</div>
        <button class="jdr-btn jdr-btn-secondaire" data-action="ajouter-domaine">+ Ajouter un domaine</button>
      </div>
    </section>`;
}

/* ------------------------------------------------------------
   Rendu — fiche de personnage
------------------------------------------------------------ */
function renderFiche() {
  const p = state.courant;
  const d = p.donnees;

  // Le libellé sert de texte indicatif DANS la case : pas de colonne
  // d'étiquettes à côté, donc des blocs nettement plus compacts.
  const champIdentite = ([k, label]) => `
    <input type="text" class="jdr-champ-identite" data-identite="${k}"
           value="${esc(d.identite[k])}" placeholder="${label}" aria-label="${label}">`;

  const idTitre = IDENTITE_TITRE.map(champIdentite).join("");
  const idPhysique = IDENTITE_PHYSIQUE.map(champIdentite).join("");

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

  return `
    <div class="jdr-barre">
      <button class="jdr-btn jdr-btn-secondaire" data-action="retour">← Personnages</button>
      <div class="jdr-barre-etat">${state.dirty ? "Modifications non enregistrées" : "À jour"}</div>
      <div class="jdr-barre-actions">
        <button class="jdr-btn jdr-btn-principal" data-action="sauver"${state.dirty ? "" : " disabled"}>Enregistrer</button>
        <button class="jdr-btn jdr-btn-danger" data-action="supprimer">Supprimer</button>
      </div>
    </div>

    <div class="jdr-cadre">

      <div class="jdr-entete-fiche">

        <div class="jdr-col-gauche">
          <div class="jdr-haut-gauche">
            <div class="jdr-portrait" data-action="portrait-clic" title="Cliquer pour changer le portrait">
              ${
                d.portrait
                  ? `<img src="${esc(d.portrait)}" alt="Portrait de ${esc(p.nom)}">
                     <button type="button" class="jdr-portrait-suppr" data-action="portrait-suppr" title="Retirer le portrait">×</button>`
                  : `<div class="jdr-portrait-vide">${ICONES.portrait}<span>Portrait</span></div>`
              }
              <input type="file" accept="image/*" data-champ="portrait-fichier" hidden>
            </div>
            <div class="jdr-entete-gauche">
              <input type="text" class="jdr-nom" data-champ="nom" value="${esc(p.nom)}"
                     placeholder="Nom + prénom" aria-label="Nom et prénom">
              <div class="jdr-id-titre">${idTitre}</div>
              <div class="jdr-niveau-talents">
                <label><span>ID</span><input type="text" class="jdr-champ-campagne" data-champ="campagne" value="${esc(d.campagne)}" maxlength="3" placeholder="—" aria-label="ID de campagne" title="ID de campagne (3 caractères)"></label>
                <label><span>Niveau</span><input type="number" min="1" data-champ="niveau" value="${d.niveau || ""}"></label>
                <label><span>Talents</span><input type="number" min="0" data-champ="talents" value="${d.talents || ""}"></label>
              </div>
            </div>
          </div>

          <div class="jdr-stats-gauche">
            <div class="jdr-jauges">
              <div class="jdr-coeur" title="Points de vie">
                <input type="number" min="0" data-champ="pv" value="${d.pv || ""}" aria-label="Points de vie">
              </div>
              <div class="jdr-fiole" title="Réserve de magie">
                <input type="text" data-champ="reserve_magie" value="${esc(d.reserve_magie)}"
                       aria-label="Réserve de magie" placeholder="7d6">
              </div>
            </div>
            <div class="jdr-fanions">${fanions}</div>
          </div>
        </div>

        <div class="jdr-col-droite">
          <section class="jdr-bloc jdr-identite${state.replie.identite ? " est-replie" : ""}">
            ${bandeau(ICONES.description, "Identité", "identite")}
            <div class="jdr-repliable">
              <div class="jdr-identite-grille">${idPhysique}</div>
            </div>
          </section>
          ${renderValeurs()}
        </div>
      </div>

      <div class="jdr-grille-attributs">
        ${CATEGORIES.map((c) => renderCompetences(c.key, c.label)).join("")}
      </div>

      <div class="jdr-colonnes-bas">
        <div class="jdr-pile">
          ${renderArmes()}
          <section class="jdr-bloc jdr-bloc-filigrane${state.replie.capacites ? " est-replie" : ""}">
            <div class="jdr-filigrane">${ICONES.capacites}</div>
            ${bandeau("", "Capacités", "capacites")}
            <div class="jdr-repliable">
              <textarea data-champ="capacites" rows="4">${esc(d.capacites)}</textarea>
            </div>
          </section>
          <section class="jdr-bloc${state.replie.histoire ? " est-replie" : ""}">
            ${bandeau(ICONES.histoire, "Histoire", "histoire")}
            <div class="jdr-repliable">
              <textarea data-champ="histoire" rows="5">${esc(d.histoire)}</textarea>
            </div>
          </section>
        </div>

        <div class="jdr-pile">
          ${renderDomaines()}
          <section class="jdr-bloc jdr-bloc-filigrane${state.replie.inventaire ? " est-replie" : ""}">
            <div class="jdr-filigrane">${ICONES.inventaire}</div>
            ${bandeau("", "Florins + Inventaire", "inventaire")}
            <div class="jdr-repliable">
              <label class="jdr-id-ligne jdr-florins">
                <span>Florins</span>
                <input type="number" min="0" data-champ="florins" value="${d.florins || ""}">
              </label>
              <textarea data-champ="inventaire" rows="4">${esc(d.inventaire)}</textarea>
            </div>
          </section>
          <section class="jdr-bloc${state.replie.description ? " est-replie" : ""}">
            ${bandeau(ICONES.description, "Description physique", "description")}
            <div class="jdr-repliable">
              <textarea data-champ="description_physique" rows="5">${esc(d.description_physique)}</textarea>
            </div>
          </section>
        </div>
      </div>

      <section class="jdr-bloc${state.replie.notes ? " est-replie" : ""}">
        ${bandeau(ICONES.notes, "Notes", "notes")}
        <div class="jdr-repliable">
          <textarea data-champ="notes" rows="6">${esc(d.notes)}</textarea>
        </div>
      </section>
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
  ajusterTousTextareas(root);
}

function majEtatBarre() {
  const etat = document.querySelector(".jdr-barre-etat");
  const btn = document.querySelector("[data-action='sauver']");
  if (etat) etat.textContent = state.dirty ? "Modifications non enregistrées" : "À jour";
  if (btn) btn.disabled = !state.dirty;
}

function attacherEvenements(root) {
  root.addEventListener("click", async (e) => {
    const cible = e.target.closest("[data-action]");
    const action = cible?.dataset.action;
    const ligne = e.target.closest("[data-ouvrir]");

    const tri = e.target.closest("[data-tri]");
    if (tri) {
      const cle = tri.dataset.tri;
      if (state.tri.cle === cle) state.tri.sens *= -1;
      else state.tri = { cle, sens: 1 };
      render();
      return;
    }

    if (ligne) {
      const p = state.personnages.find((x) => x.id === ligne.dataset.ouvrir);
      if (p) {
        state.courant = { ...p, donnees: normaliseDonnees(p.donnees) };
        state.view = "fiche";
        state.dirty = false;
        state.replie = { ...REPLIABLES };
        render();
        window.scrollTo({ top: 0 });
      }
      return;
    }

    /* Replier / déplier : pas de re-rendu, on bascule juste la classe —
       sinon on perdrait le focus et la position de défilement. */
    if (action === "replier") {
      const cle = cible.dataset.panneau;
      state.replie[cle] = !state.replie[cle];
      const section = cible.closest(".jdr-bloc");
      section.classList.toggle("est-replie", state.replie[cle]);
      cible.classList.toggle("est-replie", state.replie[cle]);
      cible.setAttribute("aria-expanded", state.replie[cle] ? "false" : "true");
      if (!state.replie[cle]) {
        section.querySelectorAll("textarea").forEach(ajusterTextarea);
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
      case "ajouter-arme":
        lireFicheDepuisDom();
        state.courant.donnees.armes.push({ nom: "", maniement: "", attaques: "", proprietes: "" });
        state.dirty = true;
        render();
        break;
      case "retirer-arme": {
        const tr = e.target.closest("[data-arme-ligne]");
        if (tr) { tr.remove(); lireFicheDepuisDom(); state.dirty = true; render(); }
        break;
      }
      case "ajouter-domaine":
        lireFicheDepuisDom();
        state.courant.donnees.domaines_magie.push({ nom: "", passif1: "", passif2: "" });
        state.dirty = true;
        render();
        break;
      case "retirer-domaine": {
        const el = e.target.closest("[data-domaine-ligne]");
        if (el) { el.remove(); lireFicheDepuisDom(); state.dirty = true; render(); }
        break;
      }
      case "ajouter-valeur":
        lireFicheDepuisDom();
        state.courant.donnees.valeurs.push({ nom: "" });
        state.dirty = true;
        render();
        break;
      case "retirer-valeur": {
        const el = e.target.closest("[data-valeur-ligne]");
        if (el) { el.remove(); lireFicheDepuisDom(); state.dirty = true; render(); }
        break;
      }
      case "portrait-clic":
        root.querySelector("[data-champ='portrait-fichier']")?.click();
        break;
      case "portrait-suppr":
        lireFicheDepuisDom();
        state.courant.donnees.portrait = "";
        state.dirty = true;
        render();
        break;
    }
  });

  // Upload de portrait : compression côté client avant stockage
  root.addEventListener("change", async (e) => {
    if (!e.target.matches("[data-champ='portrait-fichier']")) return;
    const fichier = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!fichier) return;
    if (!fichier.type.startsWith("image/")) {
      alert("Merci de choisir un fichier image.");
      return;
    }
    if (fichier.size > 15 * 1024 * 1024) {
      alert("Image trop volumineuse (max 15 Mo avant compression).");
      return;
    }
    try {
      const dataUrl = await comprimerImage(fichier);
      lireFicheDepuisDom();
      state.courant.donnees.portrait = dataUrl;
      state.dirty = true;
      render();
    } catch (err) {
      alert("Impossible de traiter cette image : " + err.message);
    }
  });

  // Toute saisie marque la fiche comme modifiée
  root.addEventListener("input", (e) => {
    if (state.view !== "fiche") return;
    state.dirty = true;

    if (e.target.tagName === "TEXTAREA") ajusterTextarea(e.target);

    if (e.target.matches("[data-comp]")) {
      const cat = e.target.dataset.comp;
      const nom = e.target.dataset.nom;
      const niv = parseInt(e.target.value, 10) || 0;

      const span = e.target.parentElement.querySelector("[data-seuil]");
      if (span) span.textContent = seuil(niv);

      state.courant.donnees.competences[cat][nom] = niv;
      const total = sommeArbre(cat);
      const insuffisant = total < SEUIL_MIN_ARBRE;
      const badge = root.querySelector(`[data-de-badge='${cat}']`);
      if (badge) {
        badge.textContent = `${total}d6`;
        badge.classList.toggle("jdr-de-insuffisant", insuffisant);
        badge.title = insuffisant
          ? `Minimum ${SEUIL_MIN_ARBRE} niveaux requis dans cet arbre`
          : "Nombre de dés = somme des niveaux";
      }
    }
    majEtatBarre();
  });
}

let gardeFouArme = false;
function armerGardeFou() {
  if (gardeFouArme) return;
  gardeFouArme = true;
  window.addEventListener("beforeunload", (e) => {
    if (state.dirty) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
}

/* ------------------------------------------------------------
   Démarrage
   Quartz utilise une navigation SPA : ce module n'est chargé
   qu'une fois (spa-preserve), donc on ne peut pas se fier au
   seul DOMContentLoaded. Quartz émet un événement "nav" sur
   `document` à chaque changement de page (premier chargement
   compris) : c'est le bon endroit pour (ré)agir.
------------------------------------------------------------ */
function init() {
  const root = document.getElementById("jdr-fiches-app");
  if (!root) return; // pas sur la page des fiches, rien à faire

  armerGardeFou();
  state.view = "liste";
  state.courant = null;
  state.dirty = false;
  state.tri = { cle: "campagne", sens: 1 };
  state.replie = { ...REPLIABLES };

  attacherEvenements(root);
  chargerListe();
}

document.addEventListener("nav", init);