// ══════════════════════════════════════════════════════════════════════
//  🧪 Carte labo — copie d'expérimentation du générateur de carte du
//  Wargame, embarquée dans le gestionnaire de campagne (retour Thibaut
//  2026-11-13 : « la version labo se trouve dans la partie jeux de
//  campagne, avec les onglets royaume, pays, population, etc. »).
//
//  C'est le bac à essai de la génération : on y teste les remaniements
//  (ressources, tuiles) et on les compare à la version officielle AVANT
//  toute promotion. La version officielle reste la référence (site
//  Wargame → Générateur de carte) ; la copie labo propose notamment le
//  sélecteur « MODE RESSOURCES » : Bruit v1 (officiel) vs Quantile v2
//  (test — la densité en ‰ devient le vrai taux de tuiles éligibles).
//
//  La copie labo vit dans /static/generateur-carte-labo.html (le site
//  est servi sous /quartz/, l'appli sous /quartz/jeu/ → chemin relatif
//  « ../static/… »). Aucune dépendance d'état de partie : l'onglet est
//  consultable sans partie en cours.
// ══════════════════════════════════════════════════════════════════════

export function CarteLaboView() {
  return (
    <div className="card" style={{ padding: '12px' }}>
      <h2>🧪 Carte labo — bac à essai de génération</h2>
      <p className="muted small" style={{ marginBottom: 8 }}>
        Copie d'expérimentation du générateur de carte : les cartes produites ici ne sont pas
        officielles. Les remaniements de génération s'y testent — groupe « RESSOURCES » →
        sélecteur « MODE RESSOURCES » (Bruit v1 officiel vs Quantile v2, seed identique) —
        avant promotion éventuelle dans la version de référence.
      </p>
      <iframe
        src="../static/generateur-carte-labo.html?v=8"
        title="Générateur de carte — version labo"
        style={{ width: '100%', height: 'calc(100vh - 220px)', minHeight: 520, border: '1px solid var(--border)', borderRadius: 8 }}
        allowFullScreen
      />
    </div>
  )
}
