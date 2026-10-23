// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — extrait de ReferenceDataPanel.tsx.
//  Onglet « Aide-mémoire » : résumé compact des référentiels
//  (ressources, orientations, genres, régimes, cultures, banques de
//  noms, événements, cartes dynastie, init, conditions de victoire).
// ══════════════════════════════════════════════════════════════════════

import type { Cfg } from '../../engine/gameData'
import { VICTORY_TEXT } from '../../engine/gameData2'
import { Card } from '../ui'

export function OngletAideMemoire({ C }: { C: Cfg }) {
  const cfg = C.config
  return (
    <Card title="Aide-mémoire">
      <div className="grid-2 small">
        <div><strong>Ressources ({C.ressources.length}) :</strong> {C.ressources.join(', ')}</div>
        <div><strong>Orientations (pondérées) :</strong> {C.orientations.map((o) => `${o.nom} ×${o.poids}`).join(' · ')}</div>
        <div><strong>Genres :</strong> {C.genres.map((o) => `${o.nom} ×${o.poids}`).join(' · ')}</div>
        <div><strong>Régimes :</strong> {C.regimes.map((r) => r.nom).join(', ')}</div>
        <div><strong>Cultures :</strong> {C.cultures.map((c) => c.nom).join(', ')}</div>
        <div><strong>Banques de noms :</strong> {cfg.banquesNoms.map((b) => `${b.nom} (${b.noms.length} noms, ${b.prenomsM.length}/${b.prenomsF.length} prénoms)`).join(' · ')}</div>
        <div><strong>Événements :</strong> {C.events.length} ({C.events.filter((e) => e.saison === 'Été').length} été, {C.events.filter((e) => e.saison === 'Hiver').length} hiver)</div>
        <div><strong>Cartes dynastie :</strong> {C.dynasties.length}</div>
        <div><strong>Init (classeur) :</strong> {cfg.init.nbPerso} personnages, {Math.round(cfg.init.pourcentageMarie * 100)}% mariés, {cfg.init.nbNoble} noble, âge par défaut {cfg.init.ageDefaut}</div>
        <div><strong>Conditions de victoire :</strong><ul>{VICTORY_TEXT.map((v) => <li key={v.nom}>{v.nom} — {v.texte}</li>)}</ul></div>
      </div>
    </Card>
  )
}
