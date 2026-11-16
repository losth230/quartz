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
    <Card title="Voies de victoire — Lauriers I à V (chapitre XII, refonte 2026-10-14, Laurier V ajouté le 2026-11-16)">
      <p className="muted small">
        5 <strong>Lauriers</strong> par voie en <strong>ordre strict</strong> (cochage manuel au radar de
        l'accueil). Les Lauriers <strong>I et III</strong> validés déclenchent une <strong>crise</strong> ; bonus seulement si
        complété pendant l'âge de même numéro ; <strong>Laurier V = Victoire</strong>. Le Laurier IV est
        commun à toutes les voies : améliorer une habitation au rang 3 (Grande Cité ou Forteresse).
      </p>
      {/* (2026-11-16 : les TEXTES de conditions, retirés le 2026-10-24, sont
          RESTAURÉS et étendus à 5 Lauriers — arbitrage Thibaut : Laurier IV
          commun « habitation de rang 3 », ancien triomphe de chaque voie
          en Laurier V, crises aux Lauriers I et III uniquement. La voie
          Scientifique reste VIDE, à arbitrer.) */}
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
      <p className="muted small">
        (Arbitrage Thibaut 2026-11-14 : les crises sont de PURE NARRATION —
        les effets mécaniques autrefois annoncés n’ont jamais existé dans le
        moteur et ne s’appliquent pas.)
      </p>
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
