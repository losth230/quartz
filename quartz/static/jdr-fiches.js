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

/* ------------------------------------------------------------
   Icônes SVG inline — currentColor partout, donc elles suivent
   automatiquement la couleur d'encre du thème (clair/sombre).
------------------------------------------------------------ */
const ICONES = {
  // Icônes de catégorie, affichées dans les bandeaux Physique/Mental/Social
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
  // Filigranes en fond des sections équipement / capacités
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
  // Ornement de coin, réutilisé aux 4 angles de la fiche via des rotations CSS
  coin: `<svg class="jdr-coin" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
    <path d="M2 14V2h12"/>
    <path d="M2 2q11 0 11 11"/>
    <circle cx="13.5" cy="13.5" r="1.3" fill="currentColor" stroke="none"/>
  </svg>`,
};

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

/* Nombre de dés d'un arbre = somme des niveaux de ses compétences.
   Règle : chaque arbre (physique/mental/social) doit totaliser au
   moins 2 niveaux répartis entre ses compétences. */
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
  const total = sommeArbre(catKey);
  const insuffisant = total < SEUIL_MIN_ARBRE;
  return `
    <section class="jdr-bloc jdr-attributs">
      <div class="jdr-bandeau">${ICONES[catKey]}<span>${catLabel}</span></div>
      <div class="jdr-de${insuffisant ? " jdr-de-insuffisant" : ""}"
           data-de-badge="${catKey}"
           title="${insuffisant ? `Minimum ${SEUIL_MIN_ARBRE} niveaux requis dans cet arbre` : "Nombre de dés = somme des niveaux"}">
        ${total}d6
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
    <section class="jdr-bloc jdr-bloc-filigrane">
      <div class="jdr-filigrane">${ICONES.armes}</div>
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

    <div class="jdr-cadre">
      ${ICONES.coin.replace('class="jdr-coin"', 'class="jdr-coin jdr-coin-hg"')}
      ${ICONES.coin.replace('class="jdr-coin"', 'class="jdr-coin jdr-coin-hd"')}
      ${ICONES.coin.replace('class="jdr-coin"', 'class="jdr-coin jdr-coin-bg"')}
      ${ICONES.coin.replace('class="jdr-coin"', 'class="jdr-coin jdr-coin-bd"')}

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
          <section class="jdr-bloc jdr-bloc-filigrane">
            <div class="jdr-filigrane">${ICONES.capacites}</div>
            <div class="jdr-bandeau">Capacités</div>
            <textarea data-champ="capacites" rows="7">${esc(d.capacites)}</textarea>
          </section>
        </div>
        <div class="jdr-colonne">
          <section class="jdr-bloc jdr-bloc-filigrane">
            <div class="jdr-filigrane">${ICONES.magie}</div>
            <div class="jdr-bandeau">Domaines de magie</div>
            ${magie}
          </section>
          <section class="jdr-bloc jdr-bloc-filigrane">
            <div class="jdr-filigrane">${ICONES.inventaire}</div>
            <div class="jdr-bandeau">Inventaire</div>
            <label class="jdr-id-ligne jdr-florins">
              <span>Florins</span>
              <input type="number" min="0" data-champ="florins" value="${d.florins || ""}">
            </label>
            <textarea data-champ="inventaire" rows="9">${esc(d.inventaire)}</textarea>
          </section>
        </div>
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
    if (e.target.matches("[data-comp]")) {
      const cat = e.target.dataset.comp;
      const nom = e.target.dataset.nom;
      const niv = parseInt(e.target.value, 10) || 0;

      // Seuil recalculé en direct pour la compétence modifiée
      const span = e.target.parentElement.querySelector("[data-seuil]");
      if (span) span.textContent = seuil(niv);

      // État synchronisé avant de recalculer la somme de l'arbre
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

  // Garde-fou avant fermeture d'onglet — posé une seule fois, hors de
  // attacherEvenements, car le module n'est chargé qu'une fois par
  // Quartz (spa-preserve) même si init() s'exécute à chaque navigation.
}

let beforeUnloadArme = false;
function armerGardeFou() {
  if (beforeUnloadArme) return;
  beforeUnloadArme = true;
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
   `document` à chaque changement de page (y compris le tout
   premier chargement) : c'est le bon endroit pour (ré)agir.
------------------------------------------------------------ */
function init() {
  const root = document.getElementById("jdr-fiches-app");
  if (!root) return; // pas sur la page des fiches, rien à faire

  armerGardeFou();
  // Réinitialise l'état à chaque arrivée sur la page (ex. retour
  // depuis une autre page du site sans rechargement complet).
  state.view = "liste";
  state.courant = null;
  state.dirty = false;

  attacherEvenements(root);
  chargerListe();
}

document.addEventListener("nav", init);
