// ============================================================
//  C&P — Listes d'armées (logique Supabase)
//  Fichier servi tel quel par Quartz (pas de transformation Markdown).
//  À placer dans : quartz/static/cp-army-lists.js
//  Référencé depuis la page via :
//    <script type="module" src="/static/cp-army-lists.js"></script>
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ⬇️⬇️ REMPLACE CES DEUX VALEURS ⬇️⬇️
const SUPABASE_URL = "https://kucgmmefluwmlobujanc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_YB_VCzZgD2vi4xeFvFT6ZA_BA9Pwn7R";
// ⬆️⬆️ ----------------------------- ⬆️⬆️

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function init() {
  const app = document.getElementById("cp-army-app");
  if (!app) return; // pas sur la bonne page

  // Garde-fou : Quartz peut déclencher init() plusieurs fois
  // (DOMContentLoaded + event "nav" au même chargement). On marque
  // le conteneur pour ne s'initialiser qu'une seule fois par page.
  if (app.dataset.cpInit === "1") return;
  app.dataset.cpInit = "1";

  const $ = (id) => document.getElementById(id);
  const msg = $("cp-msg");
  const listsEl = $("cp-lists");

  function esc(s) {
    return (s || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }

  async function loadLists() {
    const { data, error } = await sb
      .from("army_lists")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      listsEl.innerHTML =
        '<p class="cp-empty">Erreur de chargement : ' + esc(error.message) + "</p>";
      return;
    }
    if (!data.length) {
      listsEl.innerHTML =
        '<p class="cp-empty">Aucune liste pour l\'instant. Sois le premier !</p>';
      return;
    }
    listsEl.innerHTML = data
      .map((l) => {
        const date = new Date(l.created_at).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const fac = l.faction ? " — " + esc(l.faction) : "";
        return (
          '<div class="cp-card">' +
          "<h3>" + esc(l.title) + fac + "</h3>" +
          '<div class="cp-meta">Par ' + esc(l.author) + " · " + date + "</div>" +
          '<div class="cp-body">' + esc(l.body) + "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  $("cp-submit").addEventListener("click", async () => {
    const author = $("cp-author").value.trim() || "Anonyme";
    const faction = $("cp-faction").value.trim() || null;
    const title = $("cp-title").value.trim();
    const body = $("cp-body").value.trim();

    msg.className = "cp-msg";
    msg.textContent = "";

    if (!title || !body) {
      msg.className = "cp-msg err";
      msg.textContent = "Le titre et la liste sont requis.";
      return;
    }

    const btn = $("cp-submit");
    btn.disabled = true;

    const { error } = await sb
      .from("army_lists")
      .insert({ author, faction, title, body });

    btn.disabled = false;

    if (error) {
      msg.className = "cp-msg err";
      msg.textContent = "Échec de publication : " + error.message;
      return;
    }
    msg.className = "cp-msg ok";
    msg.textContent = "Liste publiée !";
    $("cp-title").value = "";
    $("cp-body").value = "";
    loadLists();
  });

  loadLists();
}

// Quartz utilise SPA + navigation; on couvre les deux cas d'entrée.
if (document.readyState !== "loading") {
  init();
} else {
  document.addEventListener("DOMContentLoaded", init);
}
document.addEventListener("nav", init); // ré-init lors de la navigation SPA Quartz