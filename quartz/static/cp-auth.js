// ============================================================
//  cp-auth.js — Phase 1 : identité (Supabase Auth) + widget de compte
//  À placer dans quartz/static/ et charger via Head.tsx :
//    <script type="module" src="/quartz/static/cp-auth.js?v=1" spa-preserve></script>
//
//  N'impose AUCUNE restriction RLS. Se contente d'établir « qui est connecté »
//  et de l'exposer aux autres modules via window.cpAuth + l'événement "cp-auth".
// ============================================================
import { sb } from "/quartz/static/cp-supabase.js";

let user = null;      // objet auth.users courant (ou null)
let profile = null;   // ligne profiles correspondante (ou null)

function esc(s) {
  return (s == null ? "" : String(s)).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---- API pour les autres modules (cp-army-lists, cp-stats, cp-actus…) ----
window.cpAuth = {
  user: () => user,
  profile: () => profile,
  pseudo: () => (profile && profile.pseudo) || (user && user.email) || null,
  isConnected: () => !!user,
  isAdmin: () => !!(profile && profile.role === "admin"),
  ouvrir: () => ouvrirModal(),
};
function emit() {
  document.dispatchEvent(new CustomEvent("cp-auth", { detail: { user, profile } }));
}

// ---- Session ----
async function chargerProfil() {
  if (!user) { profile = null; return; }
  try {
    const { data } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
    profile = data || null;
  } catch (e) { profile = null; }
}
async function rafraichir() {
  try {
    const { data } = await sb.auth.getSession();
    user = data && data.session ? data.session.user : null;
  } catch (e) { user = null; }
  await chargerProfil();
  renderWidget();
  emit();
}

// ============================================================
//  Widget de compte
// ============================================================
function ensureMount() {
  let el = document.getElementById("cp-auth");
  if (!el) {
    el = document.createElement("div");
    el.id = "cp-auth";
    el.className = "cp-auth-float";
    document.body.appendChild(el);
  }
  return el;
}
function renderWidget() {
  const el = document.getElementById("cp-auth");
  if (!el) return;
  if (user) {
    const nom = (profile && profile.pseudo) || user.email || "Compte";
    el.innerHTML =
      '<span class="cp-auth-pseudo">' + esc(nom) +
        (window.cpAuth.isAdmin() ? ' <span class="cp-auth-admin">admin</span>' : "") + "</span>" +
      '<button class="cp-auth-btn" id="cp-auth-logout">Déconnexion</button>';
  } else {
    el.innerHTML = '<button class="cp-auth-btn" id="cp-auth-login">Se connecter</button>';
  }
}

// ============================================================
//  Modale de connexion / inscription
// ============================================================
let modalMode = "login"; // "login" | "signup"

function ouvrirModal() {
  fermerModal();
  const ov = document.createElement("div");
  ov.id = "cp-auth-ov";
  ov.className = "cp-auth-ov";
  ov.innerHTML = corpsModal();
  document.body.appendChild(ov);
}
function fermerModal() {
  const ov = document.getElementById("cp-auth-ov");
  if (ov) ov.remove();
}
function corpsModal() {
  const estLogin = modalMode === "login";
  return '<div class="cp-auth-modal">' +
    '<button class="cp-auth-x" id="cp-auth-close" title="Fermer">\u2715</button>' +
    '<div class="cp-auth-tabs">' +
      '<button class="cp-auth-tab' + (estLogin ? " on" : "") + '" data-mode="login">Connexion</button>' +
      '<button class="cp-auth-tab' + (!estLogin ? " on" : "") + '" data-mode="signup">Inscription</button>' +
    "</div>" +
    '<button class="cp-auth-discord" id="cp-auth-discord">Continuer avec Discord</button>' +
    '<div class="cp-auth-sep"><span>ou</span></div>' +
    '<div class="cp-auth-form">' +
      (estLogin ? "" :
        '<label>Pseudo<input type="text" id="cp-auth-pseudo" autocomplete="nickname" placeholder="Ton nom de joueur"></label>') +
      '<label>Email<input type="email" id="cp-auth-email" autocomplete="email" placeholder="toi@exemple.fr"></label>' +
      '<label>Mot de passe<input type="password" id="cp-auth-pw" autocomplete="' + (estLogin ? "current-password" : "new-password") + '" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"></label>' +
      '<div class="cp-auth-msg" id="cp-auth-msg"></div>' +
      '<button class="cp-auth-submit" id="cp-auth-submit">' + (estLogin ? "Se connecter" : "Créer mon compte") + "</button>" +
    "</div>" +
  "</div>";
}
function msg(txt, ok) {
  const m = document.getElementById("cp-auth-msg");
  if (m) { m.textContent = txt; m.className = "cp-auth-msg" + (ok ? " ok" : txt ? " err" : ""); }
}

// ---- Actions ----
async function faireLogin() {
  const email = (document.getElementById("cp-auth-email") || {}).value || "";
  const pw = (document.getElementById("cp-auth-pw") || {}).value || "";
  if (!email || !pw) { msg("Email et mot de passe requis."); return; }
  msg("Connexion…");
  const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: pw });
  if (error) { msg(traduire(error.message)); return; }
  fermerModal();
}
async function faireSignup() {
  const pseudo = (document.getElementById("cp-auth-pseudo") || {}).value || "";
  const email = (document.getElementById("cp-auth-email") || {}).value || "";
  const pw = (document.getElementById("cp-auth-pw") || {}).value || "";
  if (!pseudo.trim()) { msg("Choisis un pseudo."); return; }
  if (!email || pw.length < 6) { msg("Email valide et mot de passe d'au moins 6 caractères."); return; }
  msg("Création du compte…");
  const { data, error } = await sb.auth.signUp({
    email: email.trim(),
    password: pw,
    options: { data: { pseudo: pseudo.trim() } },
  });
  if (error) { msg(traduire(error.message)); return; }
  // Si la confirmation d'email est activée, il n'y a pas encore de session.
  if (data && data.session) { fermerModal(); }
  else { msg("Compte créé. Vérifie ta boîte mail pour confirmer, puis connecte-toi.", true); }
}
async function faireDiscord() {
  const redirectTo = location.href.split("#")[0];
  const { error } = await sb.auth.signInWithOAuth({ provider: "discord", options: { redirectTo } });
  if (error) msg(traduire(error.message));
}
async function faireLogout() {
  await sb.auth.signOut();
}

// Traduction succincte des messages d'erreur Supabase les plus fréquents.
function traduire(m) {
  m = m || "Erreur.";
  if (/Invalid login credentials/i.test(m)) return "Identifiants incorrects.";
  if (/already registered|already exists/i.test(m)) return "Un compte existe déjà avec cet email.";
  if (/Email not confirmed/i.test(m)) return "Email non confirmé — vérifie ta boîte mail.";
  if (/rate limit|too many/i.test(m)) return "Trop de tentatives, réessaie dans un moment.";
  return m;
}

// ============================================================
//  Câblage
// ============================================================
let wired = false;
function wireOnce() {
  if (wired) return; wired = true;

  document.addEventListener("click", (e) => {
    if (e.target.closest("#cp-auth-login")) { ouvrirModal(); return; }
    if (e.target.closest("#cp-auth-logout")) { faireLogout(); return; }
    if (e.target.closest("#cp-auth-close")) { fermerModal(); return; }
    if (e.target.id === "cp-auth-ov") { fermerModal(); return; } // clic sur le fond
    if (e.target.closest("#cp-auth-discord")) { faireDiscord(); return; }
    const tab = e.target.closest(".cp-auth-tab");
    if (tab) { modalMode = tab.dataset.mode; const ov = document.getElementById("cp-auth-ov"); if (ov) ov.innerHTML = corpsModal(); return; }
    if (e.target.closest("#cp-auth-submit")) { (modalMode === "login" ? faireLogin() : faireSignup()); return; }
  });
  // Entrée = valider dans la modale
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && document.getElementById("cp-auth-ov")) {
      e.preventDefault();
      (modalMode === "login" ? faireLogin() : faireSignup());
    }
    if (e.key === "Escape") fermerModal();
  });

  // Réagit aux changements de session (connexion, déconnexion, retour d'OAuth).
  sb.auth.onAuthStateChange((_ev, session) => {
    user = session ? session.user : null;
    chargerProfil().then(() => { renderWidget(); emit(); });
  });
}

// ============================================================
//  Styles (injectés — pas de fichier CSS à déployer)
// ============================================================
function injecterStyles() {
  if (document.getElementById("cp-auth-css")) return;
  const st = document.createElement("style");
  st.id = "cp-auth-css";
  st.textContent =
    ".cp-auth-float{position:fixed;top:.6rem;right:.6rem;z-index:900;display:flex;align-items:center;gap:.5rem;" +
      "background:var(--light);border:1px solid var(--lightgray);border-radius:999px;padding:.25rem .35rem .25rem .7rem;" +
      "font-size:.82rem;box-shadow:0 1px 4px rgba(0,0,0,.12)}" +
    ".cp-auth-pseudo{color:var(--darkgray);font-weight:600;white-space:nowrap}" +
    ".cp-auth-admin{font-size:.62rem;text-transform:uppercase;letter-spacing:.04em;color:var(--secondary);" +
      "border:1px solid var(--secondary);border-radius:999px;padding:0 .35em;margin-left:.15em}" +
    ".cp-auth-btn{cursor:pointer;border:1px solid var(--secondary);background:var(--secondary);color:var(--light);" +
      "border-radius:999px;padding:.2rem .7rem;font-size:.8rem;font-family:inherit}" +
    ".cp-auth-btn:hover{opacity:.9}" +
    ".cp-auth-ov{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:1rem}" +
    ".cp-auth-modal{position:relative;width:min(360px,100%);background:var(--light);color:var(--dark);" +
      "border:1px solid var(--lightgray);border-radius:10px;padding:1.4rem 1.2rem 1.2rem;box-shadow:0 8px 30px rgba(0,0,0,.3)}" +
    ".cp-auth-x{position:absolute;top:.5rem;right:.6rem;border:none;background:none;color:var(--gray);font-size:1rem;cursor:pointer}" +
    ".cp-auth-tabs{display:flex;gap:.3rem;margin-bottom:1rem}" +
    ".cp-auth-tab{flex:1;cursor:pointer;border:1px solid var(--lightgray);background:transparent;color:var(--gray);" +
      "border-radius:6px;padding:.4rem;font-family:inherit;font-size:.85rem}" +
    ".cp-auth-tab.on{color:var(--secondary);border-color:var(--secondary);font-weight:700}" +
    ".cp-auth-discord{width:100%;cursor:pointer;border:none;border-radius:6px;padding:.55rem;color:#fff;background:#5865F2;" +
      "font-family:inherit;font-size:.9rem;font-weight:600}" +
    ".cp-auth-discord:hover{opacity:.92}" +
    ".cp-auth-sep{display:flex;align-items:center;gap:.6rem;color:var(--gray);font-size:.75rem;margin:.9rem 0}" +
    ".cp-auth-sep::before,.cp-auth-sep::after{content:'';flex:1;height:1px;background:var(--lightgray)}" +
    ".cp-auth-form{display:flex;flex-direction:column;gap:.6rem}" +
    ".cp-auth-form label{display:flex;flex-direction:column;gap:.2rem;font-size:.78rem;color:var(--darkgray)}" +
    ".cp-auth-form input{background:var(--light);border:1px solid var(--lightgray);border-radius:6px;padding:.5rem;" +
      "color:var(--dark);font-family:inherit;font-size:.9rem}" +
    ".cp-auth-form input:focus{outline:none;border-color:var(--secondary)}" +
    ".cp-auth-msg{min-height:1em;font-size:.8rem}" +
    ".cp-auth-msg.err{color:#b3453b}.cp-auth-msg.ok{color:#3c8a4e}" +
    ".cp-auth-submit{cursor:pointer;border:1px solid var(--secondary);background:var(--secondary);color:var(--light);" +
      "border-radius:6px;padding:.55rem;font-family:inherit;font-size:.9rem;font-weight:600}" +
    ".cp-auth-submit:hover{opacity:.9}";
  document.head.appendChild(st);
}

// ============================================================
//  Init
// ============================================================
function bootstrap() {
  injecterStyles();
  wireOnce();
  ensureMount();
  rafraichir();
}
if (document.readyState !== "loading") bootstrap();
else document.addEventListener("DOMContentLoaded", bootstrap);
document.addEventListener("nav", () => { injecterStyles(); ensureMount(); renderWidget(); });
