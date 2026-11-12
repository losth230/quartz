// ══════════════════════════════════════════════════════════════════════
//  CARTE « Récap du dernier tour » (vague qualité 2026-10-24) :
//  extraite de PopulationTable.tsx, sémantique identique. Elle ne
//  concerne que la population (retour Thibaut 2026-10-14 : déplacée
//  de la page Pays vers l'onglet Population).
// ══════════════════════════════════════════════════════════════════════

import type { PlayerRecap } from '../../engine/types'
import { Card } from '../ui'
import { dictToString } from './logiquePopulation'
import { totauxMouvements } from '../../engine/shared'

export function CarteRecapTour({ recap }: { recap: PlayerRecap | null }) {
  // (Retour Thibaut 2026-11-12 — « il est difficile de suivre les
  //  migrations ») : totaux migrations du tour ; le détail PAR
  //  habitation vit en tête de la carte « Villes » (page Pays).
  const mig = recap ? totauxMouvements(recap) : null
  return (
    <Card title="Récap du dernier tour">
      {recap ? (
        <div className="grid-2 small">
          <div>Conceptions : {dictToString(recap.conceptions)}</div>
          <div>Naissances : {dictToString(recap.naissances)}</div>
          <div>Décès : {dictToString(recap.deces)} (dont maladie : {recap.decesMaladie})</div>
          <div>Mariages nobles : {dictToString(recap.mariagesNobles)}</div>
          <div>Conversions : {dictToString(recap.conversions)}</div>
          <div>Métiers attribués : {dictToString(recap.metiersAttribues)}</div>
          {mig && (mig.arrivees > 0 || mig.departs > 0) && (
            <div>Migrations : {mig.arrivees} arrivée(s) / {mig.departs} départ(s) <span className="muted">— détail par ville : carte « Villes », page 👑 Pays</span></div>
          )}
          {(recap.crises.length > 0 || recap.commandantTombe) && (
            <div className="neg">⚠ {recap.crises.join(' ; ')}{recap.commandantTombe ? ` Commandant tombé : ${recap.commandantTombe}` : ''}</div>
          )}
        </div>
      ) : (
        <p className="muted">Lancez un tour pour voir le récapitulatif.</p>
      )}
    </Card>
  )
}
