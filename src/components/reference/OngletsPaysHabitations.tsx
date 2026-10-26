// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — extrait de ReferenceDataPanel.tsx.
//  Onglets « Pays & rangs » (échelle féodale, montée par sacre) et
//  « Habitations » (types & rangs).
// ══════════════════════════════════════════════════════════════════════

import type { Cfg } from '../../engine/gameData'
import { Card } from '../ui'

export function OngletPaysRangs({ C }: { C: Cfg }) {
  const cfg = C.config
  return (
    <Card title="Wiki — rangs de pays (échelle féodale)">
      <p className="muted small">
        Montée par <strong>sacre</strong> : payer Or + Nourriture et posséder les
        <strong> serments</strong> requis.
      </p>
      <div className="table-wrap">
        <table className="tbl small">
          <thead><tr><th>Rang</th><th>Sacre (Or)</th><th>Sacre (Nourriture)</th><th>Serments</th><th>Bonus (plateau)</th></tr></thead>
          <tbody>
            {(cfg.paysRangs ?? []).map((r, i) => (
              <tr key={i}>
                <td><strong>{r.nom}</strong></td>
                <td>{r.coutOr}</td>
                <td>{r.coutNourriture}</td>
                <td>{r.serments}</td>
                <td className="muted">{r.bonus || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export function OngletHabitations({ C }: { C: Cfg }) {
  const cfg = C.config
  return (
    <>
    <Card title="Wiki — types & rangs d'habitation">
      <div className="table-wrap">
        <table className="tbl small">
          <thead><tr><th>Type</th><th>Rang</th><th>Coût d'amélioration</th><th>Habitants requis</th><th>Métiers disponibles</th><th>Domiciles disponibles</th></tr></thead>
          <tbody>
            {cfg.typesHabitation.map((h, i) => (
              <tr key={i}>
                <td><strong>{h.type}</strong></td>
                <td>{h.rang}</td>
                <td>{h.cout || '—'}</td>
                <td>{h.habitantsRequis}</td>
                <td>{(h.metiersBase ?? []).map((e) => `${e.places} ${e.metier}`).join(', ') || '—'}</td>
                <td>{h.domicilesDisponibles || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
    {/* (retour Thibaut 2026-10-26 : « ajoute les différents types de
        logement dans les référentiels ») — fiche des TYPES DE
        LOGEMENT (table domiciles) : la qualité 0-4 d'un logement
        EST son gain de prestige par tour (habitant logé), et
        l'attribution sert les habitants par prestige décroissant. */}
    <Card title="Wiki — types de logement (domiciles)">
      <p className="muted small">
        La qualité d'un logement (échelle 0-4) est aussi son <strong>gain de prestige
        par tour</strong> pour l'habitant logé. Attribution en fin de tour par
        <strong> prestige décroissant</strong> : le haut rang est servi en premier,
        un logement = un habitant, sans délogement.
      </p>
      <div className="table-wrap">
        <table className="tbl small">
          <thead><tr><th>Logement</th><th>Qualité</th><th>Gain de prestige / tour</th></tr></thead>
          <tbody>
            {cfg.domiciles.map((d, i) => (
              <tr key={i}>
                <td><strong>{d.domicile}</strong></td>
                <td>{d.qualite}</td>
                <td>+{d.qualite}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
    </>
  )
}
