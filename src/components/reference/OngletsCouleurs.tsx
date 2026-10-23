// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — extrait de ReferenceDataPanel.tsx.
//  Onglet « Couleurs » : couleurs des joueurs, des ressources (avec
//  le canal « Nourr - été » dupliqué pour l'affichage) et
//  transparence des lignes de tableaux (page Pays).
// ══════════════════════════════════════════════════════════════════════

import type { Cfg } from '../../engine/gameData'
import {
  COULEURS_JOUEURS_DEFAUT, COULEURS_RESSOURCES_DEFAUT, TRANSPARENCE_LIGNES_DEFAUT,
} from '../../config/defaultConfig'
import { Card } from '../ui'

export function OngletCouleurs({ C }: { C: Cfg }) {
  const cfg = C.config
  return (
    <>
      <Card title="Wiki — couleurs des joueurs">
        <div className="grid-4">
          {Array.from({ length: 8 }, (_, i) => {
            const cur = cfg.couleurs?.joueurs?.[i] ?? COULEURS_JOUEURS_DEFAUT[i]
            return (
              <div key={i} className="mini">
                <div className="row" style={{ alignItems: 'center', gap: 8 }}>
                  <span className="mini" style={{ width: 22, height: 22, padding: 0, background: cur }} />
                  <strong>J{i + 1}</strong>
                  <span className="muted small">{cur}</span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
      <Card title="Wiki — couleurs des ressources">
        <div className="grid-4">
          {cfg.ressources
            .flatMap((r) => (r === 'Nourriture' ? [r, 'Nourr - été'] : [r]))
            .map((r) => {
              const cur = cfg.couleurs?.ressources?.[r] ?? COULEURS_RESSOURCES_DEFAUT[r] ?? '#9aa4ad'
              return (
                <div key={r} className="mini">
                  <div className="row" style={{ alignItems: 'center', gap: 8 }}>
                    <span className="mini" style={{ width: 22, height: 22, padding: 0, background: cur }} />
                    <strong>{r}</strong>
                    <span className="muted small">{cur}</span>
                  </div>
                </div>
              )
            })}
        </div>
      </Card>
      <Card title="Wiki — transparence des lignes de tableaux (page Pays)">
        {(() => {
          const t = cfg.couleurs?.transparenceLignes ?? TRANSPARENCE_LIGNES_DEFAUT
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <strong>{t} %</strong>
              <span
                className="mini"
                style={{ padding: '2px 12px', background: `color-mix(in srgb, ${cfg.couleurs?.ressources?.['Or'] ?? COULEURS_RESSOURCES_DEFAUT['Or']} ${100 - t}%, transparent)` }}
              >
                aperçu (Or)
              </span>
            </div>
          )
        })()}
      </Card>
    </>
  )
}
