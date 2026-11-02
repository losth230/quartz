// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — extrait de ConfigTables.tsx.
//  Table « Couleurs » : éditeur des couleurs des joueurs et des
//  ressources (avec le canal « Nourr - été » qui suit la Nourriture
//  sauf réglage explicite) et de la transparence des lignes de
//  tableaux de la page Pays.
// ══════════════════════════════════════════════════════════════════════

import type { CouleursConfig } from '../../config/defaultConfig'
import {
  COULEURS_JOUEURS_DEFAUT, COULEURS_RESSOURCES_DEFAUT, TRANSPARENCE_LIGNES_DEFAUT,
} from '../../config/defaultConfig'
import { Card, Button } from '../ui'
import type { TableProps } from './logiqueParams'

export function CouleursParams({ config, setCfg }: TableProps) {
  const mutCouleurs = (fn: (col: CouleursConfig) => void) => {
    setCfg((c) => {
      if (!c.couleurs) c.couleurs = {}
      fn(c.couleurs)
    })
  }
  return (
    <>
      <Card title="Couleurs des joueurs (graphiques, courbes, radar)">
        <p className="muted small">
          Une couleur par joueur, appliquée à tous les graphiques de l'accueil (histogrammes,
          courbe d'évolution, radar de victoire) et à l'historique.
        </p>
        <div className="grid-4">
          {Array.from({ length: 8 }, (_, i) => {
            const cur = config.couleurs?.joueurs?.[i] ?? COULEURS_JOUEURS_DEFAUT[i]
            return (
              <div key={i} className="mini">
                <strong>J{i + 1}</strong>
                <div className="mt" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="color"
                    value={cur}
                    onChange={(e) => mutCouleurs((col) => {
                      const arr = col.joueurs ?? (col.joueurs = [])
                      while (arr.length < 8) arr.push(COULEURS_JOUEURS_DEFAUT[arr.length] ?? '#888888')
                      arr[i] = e.target.value
                    })}
                  />
                  <span className="muted small">{cur}</span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
      <Card title="Couleurs des ressources (pastilles, lignes de tableaux, courbe)">
        <p className="muted small">
          « Nourr - été » suit toujours la Nourriture, sauf réglage explicite ci-dessous.
          Les lignes de ressources des tableaux de la page Pays (récap, taxes, production
          des villes) sont teintées avec ces couleurs.
        </p>
        <div className="grid-4">
          {config.ressources
            .flatMap((r) => (r === 'Nourriture' ? [r, 'Nourr - été'] : [r]))
            .map((r) => {
              const cur = config.couleurs?.ressources?.[r] ?? COULEURS_RESSOURCES_DEFAUT[r] ?? '#9aa4ad'
              return (
                <div key={r} className="mini">
                  <strong>{r}</strong>
                  <div className="mt" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="color"
                      value={cur}
                      onChange={(e) => mutCouleurs((col) => {
                        col.ressources = { ...(col.ressources ?? {}) }
                        col.ressources[r] = e.target.value
                      })}
                    />
                    <span className="muted small">{cur}</span>
                  </div>
                </div>
              )
            })}
        </div>
      </Card>
      <Card title="Transparence des lignes de tableaux (page Pays)">
        <p className="muted small">
          Fond des lignes de ressources des tableaux (récap des ressources par tour, taxes des
          villageois, production des villes) : 0 % = couleur pleine, 100 % = invisible.
          Réglez ici la transparence pour garder les chiffres lisibles.
        </p>
        {(() => {
          const t = config.couleurs?.transparenceLignes ?? TRANSPARENCE_LIGNES_DEFAUT
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="range" min={0} max={100} step={5} value={t}
                onChange={(e) => mutCouleurs((col) => {
                  col.transparenceLignes = Math.max(0, Math.min(100, Number(e.target.value)))
                })}
              />
              <strong>{t} %</strong>
              <span
                className="mini"
                style={{ padding: '2px 12px', background: `color-mix(in srgb, ${config.couleurs?.ressources?.['Or'] ?? COULEURS_RESSOURCES_DEFAUT['Or']} ${100 - t}%, transparent)` }}
              >
                aperçu (Or)
              </span>
            </div>
          )
        })()}
        <div className="mt">
          <Button onClick={() => setCfg((c) => {
            c.couleurs = {
              joueurs: [...COULEURS_JOUEURS_DEFAUT],
              ressources: { ...COULEURS_RESSOURCES_DEFAUT },
              transparenceLignes: TRANSPARENCE_LIGNES_DEFAUT,
            }
          })}>↺ Couleurs par défaut</Button>
        </div>
      </Card>
    </>
  )
}
