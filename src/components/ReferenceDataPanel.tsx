// ══════════════════════════════════════════════════════════════════════
//  Référentiels : WIKI DE RÈGLES EN LECTURE SEULE (marqueur (s)).
//  La page affiche les valeurs actuelles des PARAMÈTRES (configuration
//  commune) sous forme de wiki : tables, fiches et résumés d'effets.
//  TOUT ce qui est éditable vit désormais dans l'onglet « 🎛 Paramètres ».
//
//  VAGUE QUALITÉ (2026-10-24) : découpage mécanique — l'orchestrateur
//  ne garde que la barre d'onglets et l'aiguillage ; le contenu de
//  chaque onglet vit dans src/components/reference/ (une carte =
//  un composant, docblocks d'arbitrage déplacés avec leur code).
//  Sémantique strictement identique.
// ══════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import { useGame } from '../state/store'
import { cfgOf } from '../engine/gameData'
import { Card } from './ui'
import { ONGLETS } from './reference/logiqueReference'
import { OngletsMetiers } from './reference/OngletsMetiers'
import { OngletTraitsGen, OngletPeuples } from './reference/OngletsTraitsPeuples'
import { OngletBatiments, OngletAmenagements } from './reference/OngletsBatiments'
import { OngletProgres } from './reference/OngletsProgres'
import { OngletPaysRangs, OngletHabitations } from './reference/OngletsPaysHabitations'
import { OngletsCulturesRegimes, OngletsTourismeDogmes, OngletCitesLibres } from './reference/OngletsCultures'
import { OngletVictoires, OngletCrises, OngletRappelsRegles, OngletOffrandes } from './reference/OngletsVictoires'
import { OngletCouleurs } from './reference/OngletsCouleurs'
import { OngletAideMemoire } from './reference/OngletsAideMemoire'

export function ReferenceDataPanel() {
  const { globalConfig } = useGame()
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number]>('Métiers')
  // Wiki : on affiche les VALEURS DES PARAMÈTRES (configuration commune,
  // mémorisée par le navigateur) — modifiables dans « 🎛 Paramètres ».
  const C = cfgOf(globalConfig)

  return (
    <div className="stack">
      <Card title="Référentiels du jeu (données du classeur d'origine)">
        <p className="muted small">
          <strong>📖 Wiki de règles — lecture seule.</strong> Les tables ci-dessous affichent
          les valeurs actuelles des <strong>paramètres</strong> : pour les modifier, ouvrez
          l'onglet « 🎛 Paramètres ».
        </p>
        <div className="tabs">
          {ONGLETS.map((o) => (
            <button key={o} className={`tab ${onglet === o ? 'tab-active' : ''}`} onClick={() => setOnglet(o)}>{o}</button>
          ))}
        </div>
      </Card>

      {onglet === 'Métiers' && <OngletsMetiers C={C} />}
      {onglet === 'Traits gén.' && <OngletTraitsGen C={C} />}
      {onglet === 'Peuples' && <OngletPeuples C={C} />}
      {onglet === 'Bâtiments' && <OngletBatiments C={C} />}
      {onglet === 'Aménagements' && <OngletAmenagements C={C} />}
      {onglet === 'Progrès' && <OngletProgres C={C} />}
      {onglet === 'Pays & rangs' && <OngletPaysRangs C={C} />}
      {onglet === 'Habitations' && <OngletHabitations C={C} />}
      {onglet === 'Cultures & régimes' && <OngletsCulturesRegimes C={C} />}
      {onglet === 'Tourisme & dogmes' && <OngletsTourismeDogmes C={C} />}
      {onglet === 'Cités libres' && <OngletCitesLibres C={C} />}
      {onglet === 'Victoires' && <OngletVictoires C={C} />}
      {onglet === 'Crises' && <OngletCrises C={C} />}
      {onglet === 'Rappels règles' && <OngletRappelsRegles C={C} />}
      {onglet === 'Offrandes' && <OngletOffrandes C={C} />}
      {onglet === 'Couleurs' && <OngletCouleurs C={C} />}
      {onglet === 'Aide-mémoire' && <OngletAideMemoire C={C} />}

    </div>
  )
}
