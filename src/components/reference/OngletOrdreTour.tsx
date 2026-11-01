// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ — onglet « Ordre du tour » du wiki de référentiels
//  (demande Thibaut 2026-11-01 : « dans la page du référentiel,
//  ajoute une table qui précise l'ordre de calcul des effets de
//  tour »).
//  R3 (source = MOTEUR) : la table n'est PAS un texte statique —
//  elle est LUE depuis ETAPES_TOUR, le registre exporté du module
//  d'orchestration (engine/tour.ts), dont le contenu est verrouillé
//  par engine/tour.test.ts. L'ordre affiché est l'ordre appliqué.
//  Les valeurs chiffrées citées (tribut vassal, dîme du pèlerinage)
//  sont les valeurs ACTUELLES des paramètres (page « 🎛 Paramètres »).
// ══════════════════════════════════════════════════════════════════════

import type { Cfg } from '../../engine/gameData'
import { ETAPES_TOUR } from '../../engine/tour'
import { Card } from '../ui'

export function OngletOrdreTour({ C }: { C: Cfg }) {
  const pct = (v: number) => `${Math.round(v * 100)} %`
  return (
    <Card title={`Ordre du tour — calcul des effets (${ETAPES_TOUR.length} étapes)`}>
      <p className="muted small">
        Chaque fin de tour applique ces étapes DANS CET ORDRE, pour chaque joueur
        là où c'est indiqué — l'ordre compte : les gains servent de base au tribut
        vassal, la dîme du pèlerinage porte sur la production RÉELLEMENT créditée
        ce tour, le Tourisme est re-synchronisé au fil des apports directs, et la
        migration suit les moteurs de population (un migrant n'est jamais retraité
        deux fois). Source : moteur du jeu (étapes de FinDeTour) — une étape
        retirée disparaît de la table, son historique vit dans le journal technique.
      </p>
      <div className="table-wrap">
        <table className="tbl small">
          <thead>
            <tr>
              <th>N°</th>
              <th>Étape</th>
              <th>Ce qui se calcule</th>
            </tr>
          </thead>
          <tbody>
            {ETAPES_TOUR.map((e) => (
              <tr key={e.numero}>
                <td><strong>{e.numero}</strong></td>
                <td><strong>{e.nom}</strong></td>
                <td>{e.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted small">
        <strong>Valeurs actuelles des prélèvements :</strong> tribut de vassalité{' '}
        {pct(C.p.vassalPrelevement)} des gains d'Or des habitants du vassal · dîme du
        pèlerinage {pct(C.p.pelerinageTaux)} de la production (Or, Nourriture,
        Science) des habitations des cultures ayant un dogme — modifiables dans
        l'onglet « 🎛 Paramètres ».
      </p>
    </Card>
  )
}
