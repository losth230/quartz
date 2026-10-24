// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — extrait de ReferenceDataPanel.tsx.
//  Onglets « Victoires » (Lauriers I-IV, refonte 2026-10-14),
//  « Crises », « Rappels règles » et « Offrandes » — quatre
//  onglets distincts, quatre composants distincts (le wiki n'affiche
//  qu'une carte par onglet, sémantique d'origine conservée).
// ══════════════════════════════════════════════════════════════════════

import type { Cfg } from '../../engine/gameData'
import { Card, Badge } from '../ui'

export function OngletVictoires({ C }: { C: Cfg }) {
  const cfg = C.config
  return (
    <Card title="Voies de victoire — Lauriers I à IV (chapitre XII, refonte 2026-10-14)">
      <p className="muted small">
        4 <strong>Lauriers</strong> par voie en <strong>ordre strict</strong> (cochage manuel au radar de
        l'accueil). Chaque Laurier I-III validé déclenche une <strong>crise</strong> ; bonus seulement si
        complété pendant l'âge de même numéro ; <strong>Laurier IV = Victoire</strong>.
      </p>
      {/* (RETRAIT 2026-10-24, retour arbitre : les TEXTES de conditions et
          de bonus sont supprimés — Lauriers VIDÉS, structure conservée,
          nouvelles conditions à arbitrer. La liste « Victoire (Laurier
          IV) » — VICTORY_TEXT — est retirée avec les textes.) */}
      <p className="muted small">Conditions de victoire retirées le 2026-10-24 (Lauriers vides) — à redéfinir par l'arbitre.</p>
      {cfg.victoires.map((v, i) => (
        <div key={i} className="mb">
          <h4>{v.voie}</h4>
          <ul className="small">
            {v.lauriers.map((l, j) => (
              <li key={j}>
                <strong>{l.laurier}</strong>
                {l.condition ? ` — ${l.condition}` : ''}
                {l.bonus ? <span className="muted"> ({l.bonus})</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </Card>
  )
}

export function OngletCrises({ C }: { C: Cfg }) {
  const cfg = C.config
  return (
    <Card title="Crises">
      <ul className="small">
        {cfg.crises.map((c, i) => <li key={i}>{c}</li>)}
      </ul>
    </Card>
  )
}

export function OngletRappelsRegles({ C }: { C: Cfg }) {
  const cfg = C.config
  return (
    <Card title="Rappels de règles (feuille Accueil)">
      <ul className="small">
        {cfg.rappelsRegles.map((c, i) => <li key={i}>{c}</li>)}
      </ul>
    </Card>
  )
}

export function OngletOffrandes({ C }: { C: Cfg }) {
  const cfg = C.config
  return (
    <Card title={`Offrandes (${cfg.offrandes.length})`}>
      {cfg.offrandes.map((o, i) => (
        <div key={i} className="mini">
          <div className="row"><strong>{o.nom}</strong> <Badge>poids {o.poids}</Badge></div>
          <div className="small muted">{o.description}</div>
        </div>
      ))}
    </Card>
  )
}
