// ══════════════════════════════════════════════════════════════════════
//  Application principale — navigation 7 sections + sélecteur J1..J8
// ══════════════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { useGame } from './state/store'
import { TurnBar } from './components/TurnBar'
import { Dashboard } from './components/Dashboard'
import { PlayerView } from './components/PlayerView'
import { PopulationTable } from './components/PopulationTable'
import { ArmiesPanel } from './components/ArmiesPanel'
import { EventLogPanel } from './components/EventLogPanel'
import { HistoryPanel } from './components/HistoryPanel'
import { SetupPanel } from './components/SetupPanel'
import { ReferenceDataPanel } from './components/ReferenceDataPanel'

type Section = 'accueil' | 'joueur' | 'population' | 'armees' | 'journal' | 'historique' | 'setup' | 'referentiels'

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'accueil', label: '🏛 Accueil' },
  { key: 'joueur', label: '👑 Pays' },
  { key: 'population', label: '👥 Population' },
  { key: 'armees', label: '⚔ Armées' },
  { key: 'journal', label: '📜 Journal' },
  { key: 'historique', label: '📈 Historique' },
  { key: 'referentiels', label: '📚 Référentiels' },
  { key: 'setup', label: '⚙ Nouvelle partie' },
]

export default function App() {
  const { state } = useGame()
  const [section, setSection] = useState<Section>('accueil')
  const [joueur, setJoueur] = useState(1)

  const joueursBars = state && (
    <div className="players-bar">
      {state.players.map((p) => (
        <button
          key={p.n}
          className={`player-chip ${joueur === p.n ? 'chip-active' : ''}`}
          onClick={() => setJoueur(p.n)}
          title={`${p.peuple} · ${p.culture}`}
        >
          J{p.n} · {p.nom}
        </button>
      ))}
    </div>
  )

  return (
    <div className="app">
      <header className="header">
        <h1>🐗 Chasse &amp; Pêche <span className="thin">— Légendes</span></h1>
        <span className="muted small">portage web du classeur Excel/VBA · 8 joueurs · un tour = 2 ans</span>
      </header>

      {state ? <TurnBar /> : <div className="banner-info">Créez une partie dans « ⚙ Nouvelle partie » pour commencer.</div>}

      <nav className="nav">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            className={`tab ${section === s.key ? 'tab-active' : ''}`}
            onClick={() => setSection(s.key)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {(section === 'joueur' || section === 'population' || section === 'armees') && joueursBars}

      <main className="main">
        {!state && section !== 'setup' && section !== 'referentiels' ? (
          <div className="card">Aucune partie en cours. Allez dans « ⚙ Nouvelle partie ».</div>
        ) : (
          <>
            {section === 'accueil' && <Dashboard />}
            {section === 'joueur' && <PlayerView joueur={joueur} />}
            {section === 'population' && <PopulationTable joueur={joueur} />}
            {section === 'armees' && <ArmiesPanel joueur={joueur} />}
            {section === 'journal' && <EventLogPanel />}
            {section === 'historique' && <HistoryPanel />}
            {section === 'referentiels' && <ReferenceDataPanel />}
            {section === 'setup' && <SetupPanel />}
          </>
        )}
      </main>

      <footer className="footer muted small">
        Chasse &amp; Pêche — Légendes · portage React + TypeScript + Supabase du jeu Excel/VBA.
        Les référentiels (titres, noms, événements) sont des seeds éditables : le classeur d'origine
        n'a pas pu être lu intégralement, corrigez-les dans l'onglet Référentiels ou dans src/engine/gameData.ts.
      </footer>
    </div>
  )
}
