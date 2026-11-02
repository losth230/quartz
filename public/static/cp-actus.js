// cp-actus.js — Fil d'actualités d'un dossier, lu depuis Supabase.
// Monte dans l'élément #cp-actus s'il est présent sur la page.
// Attributs : data-dossier (défaut "Wargame"), data-limite (défaut 5).
import { sb } from "/quartz/static/cp-supabase.js";

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function fmtDate(d) {
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  } catch (_) { return d; }
}

async function render() {
  const el = document.getElementById("cp-actus");
  if (!el) return; // pas sur une page qui affiche le fil
  const dossier = el.dataset.dossier || "Wargame";
  const limite = parseInt(el.dataset.limite || "5", 10) || 5;
  const titreBloc = '<div class="cp-actus-head">Actualités récentes</div>';
  el.innerHTML = titreBloc + '<div class="cp-actus-loading">Chargement…</div>';

  try {
    const { data, error } = await sb
      .from("wg_actualites")
      .select("*")
      .eq("dossier", dossier)
      .order("date_actu", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limite);
    if (error) throw error;
    if (!data || !data.length) { el.innerHTML = ""; return; } // rien à montrer -> on masque le bloc

    const lignes = data.map((a) => {
      const cat = a.categorie ? '<span class="cp-actu-cat">' + esc(a.categorie) + "</span>" : "";
      const titre = a.lien
        ? '<a class="cp-actu-titre" href="' + esc(a.lien) + '">' + esc(a.titre) + "</a>"
        : '<span class="cp-actu-titre">' + esc(a.titre) + "</span>";
      const desc = a.description ? '<p class="cp-actu-desc">' + esc(a.description) + "</p>" : "";
      return '<li class="cp-actu">' +
        '<span class="cp-actu-date">' + esc(fmtDate(a.date_actu)) + "</span>" +
        '<div class="cp-actu-corps">' + cat + titre + desc + "</div>" +
        "</li>";
    }).join("");

    el.innerHTML = titreBloc + '<ul class="cp-actus-list">' + lignes + "</ul>";
  } catch (e) {
    el.innerHTML = titreBloc + '<div class="cp-actus-err">Impossible de charger les actualités pour le moment.</div>';
  }
}

document.addEventListener("nav", render); // navigation SPA Quartz
render();                                  // au cas où le module charge après l'événement initial