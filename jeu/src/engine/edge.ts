// ══════════════════════════════════════════════════════════════════════
//  POINT D'ENTRÉE DU BUNDLE EDGE FUNCTION (vague 2, suppression de la
//  façade engine.ts) : scripts/build-function.mjs bundlait engine.ts
//  (30 blocs de ré-exports) — esbuild suit désormais CE module
//  minimal. Consommateurs du bundle _engine.mjs :
//    · supabase/functions/resoudre-tour/index.ts — runTurn,
//      fusionnerSections, rejouerEvenementsPartages, migrerEtat,
//      appliquerConfigMondiale, etatReseau ;
//    · scripts/test-function.mjs — runTurn, normaliserEtat,
//      etatReseau.
//  Toute évolution du handler passe par UNE ligne ici (le reste
//  du moteur n'est JAMAIS embarqué — le graphe suit les imports).
// ════════════════════════════════════════════════════════════════════

export { runTurn } from './tour'
export { normaliserEtat } from './villes'
export { fusionnerSections, rejouerEvenementsPartages, appliquerConfigMondiale, etatReseau } from './fusion'
export { migrerEtat } from './migrations'
