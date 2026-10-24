// ══════════════════════════════════════════════════════════════════════
//  Aide « QU'EST-CE QUI EST COMPTÉ AUTOMATIQUEMENT ? » (marqueur (a),
//  retour Thibaut : « je ne comprends pas ce qui est compté
//  automatiquement et ce qui ne l'est pas »). Bloc repliable natif,
//  sans état. (Extrait de PlayerView.tsx — un fichier par UI.)
//  (La prop C a été retirée le 2026-10-24, sous-vague 3b : elle ne
//  servait qu'au montant marchandOrTour, supprimé avec l'Or passif
//  des routes dissociées.)
// ══════════════════════════════════════════════════════════════════════

export function AideAuto() {
  return (
    <details className="aide-auto">
      <summary>🧮 Qu'est-ce que l'application compte automatiquement ?</summary>
      <div className="grid-2 aide-auto-grid">
        <div>
          <strong>✅ Compté automatiquement</strong> — à chaque « ▶ Terminer le tour » (une seule pression suffit, TOUT est crédité) :
          <ul className="small">
            <li><strong>Impôts des habitants</strong> : métiers × taxes de chaque ville, sur toutes les ressources, moins leur consommation.</li>
            <li><strong>Production</strong> des bâtiments, aménagements et lignes « Autres » — la « Nourr - été » n'est créditée qu'en été.</li>
            <li><strong>Consommation des habitations</strong> (rang de chaque ville) et <strong>bonus de proximité</strong> (Rivière / Mer).</li>
            <li><strong>Règles de pays & culture</strong> (ex. +N par ville de ta culture dans le monde) et <strong>lois de régime</strong>.</li>
            <li><strong>Tribut des vassaux</strong> et <strong>taxes des cités libres</strong> sous ta suzeraineté.</li>
            <li><strong>Routes commerciales</strong> (dissociées, sous-vague 3b) : copie de l'aménagement dans la ville d'origine, y compris ses emplacements de métier (une production d'été n'est copiée qu'en été) ; vers une cité libre, +1 émissaire auprès de la cité tant que la route est active — plus d'Or passif, plus de métier de Marchand (retiré du jeu le 2026-10-24).</li>
            <li><strong>Gouverneur</strong> : le noble le plus âgé est nommé automatiquement, +10 % d'impôts sur sa ville.</li>
            <li><strong>Tourisme = comme le Bois, sauf qu'il ne s'accumule pas</strong> : sa production est affichée et comptée partout (récaps de ville et de tour, canaux, tableaux) — bâtiments (Chapelle +35), Artistes, lois de culture, vassalité — mais à chaque fin de tour le stock est RECALCULÉ pour égaler la production courante (stock = prod, jamais cumulé). Garnison : valeur d'état.</li>
            <li><strong>Démographie des joueurs</strong> : naissances (modulées par les taxes), vieillissement, décès, migrations scolaires (vers un Professeur).</li>
            <li><strong>Coûts débités automatiquement</strong> : constructions, habitations (fondation / changement de rang), sacre d'avènement (moitié du prix — gratuit avec la loi Démocratie).
            (RETRAIT 2026-10-24 : les technologies — Science déduite au déblocage, remboursée à la reprise — n'existent plus, système de progrès supprimé.)</li>
          </ul>
        </div>
        <div>
          <strong>✍️ Manuel — jamais compté automatiquement</strong> (à faire au plateau ou à saisir dans l'app) :
          <ul className="small">
            <li><strong>Émissaires & suzeraineté</strong> : saisie manuelle page « 🗼 Cités libres » (1 tentative par saison).</li>
            <li><strong>Population des cités libres</strong> : statut (Sain / Malade / Décédé), naissances et vieillissement manuels.</li>
            <li><strong>Voies de victoire</strong> : Lauriers — cases à cocher sur l'Accueil (textes de conditions retirés du référentiel le 2026-10-24, Lauriers vides).</li>
            <li><strong>Levées d'armées et dés du plateau.</strong></li>
          </ul>
          <p className="muted small" style={{ marginBottom: 0 }}>
            NB : les boutons « 💰 / 🤝 Générer l'impôt » de cette page AJOUTENT l'impôt d'un
            tour en cours de partie — le fin de tour crédite ensuite son propre impôt
            PAR-DESSUS. Ne les utilise que pour rattraper un impôt oublié.
          </p>
        </div>
      </div>
    </details>
  )
}
