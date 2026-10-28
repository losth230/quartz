// ══════════════════════════════════════════════════════════════════════
//  Armées : lever, renommer, nommer un commandant, définir la cible,
//  dissoudre (portage de LeverArmee / NommerCommandant / RetirerArmee).
//  Puissances et âges lus sur les LIGNES DE MÉTIER du référentiel
//  (arbitrage Thibaut 2026-10-28 : « général et soldat sont des
//  métiers, ils doivent donc vivre dans la banque »).
// ══════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import { useGame } from '../state/store'
import type { GameState, Player } from '../engine/types'
import { cfgOf } from '../engine/gameData'
import { prixArmee, infligerPertes, libererSoldats, puissanceArmeeMetier, agesRecrutementSoldat } from '../engine/armees'
import { isNobleDyn } from '../engine/shared'
import { Card, NumberInput, Select, TextInput, Button, fmt } from './ui'

export function ArmiesPanel({ joueur }: { joueur: number }) {
  const { state, update } = useGame()
  const [nom, setNom] = useState('')
  const [cible] = useState<number | null>(null)
  const [commandant, setCommandant] = useState('')
  const [puissance, setPuissance] = useState(90)
  // Revue Thibaut 2026-10-15 : la levée se passe DANS une habitation
  //  — le joueur choisit la ville, les RÉDUCTIONS DE LEVÉE portées
  //  par ses bâtiments s'appliquent (arbitrage Thibaut 2026-10-28 :
  //  elles vivent sur les fiches de construction et passent par la
  //  banque, canal reductionLeveeArmee — plus aucune liste codée en
  //  dur, cf. Référentiels).
  const [villeLevee, setVilleLevee] = useState('')
  // Pertes par armée (revue 2026-10-17) : saisie locale du nombre de
  //  soldats à tuer (l'ordre d'engagement = ordre du tableau).
  const [pertesParArmee, setPertesParArmee] = useState<Record<number, number>>({})
  const [tuerCmdParArmee, setTuerCmdParArmee] = useState<Record<number, boolean>>({})

  if (!state) return null
  const C = cfgOf(state.config)
  const ages = agesRecrutementSoldat(C)
  const p = state.players.find((x) => x.n === joueur)
  if (!p) return null
  const pop = state.population[joueur] ?? []
  const vivants = pop.filter((c) => c.statut !== 'Décédé')

  // Nobles adultes vivants, pas déjà engagés dans une armée
  const commandantsDispo = vivants.filter(
    (c) => c.age >= C.p.adultAge && isNobleDyn(c.dynastie, C) && !c.armee,
  )

  // Le mutateur reçoit (joueur, état) : la population vit dans
  // state.population[joueur], PAS dans le Player (sinon crash « reading »).
  const setPlayer = (fn: (p: Player, s: GameState) => void) =>
    update((s) => {
      const target = s.players.find((x) => x.n === joueur)
      if (target) fn(target, s)
    })

  // Prix avec les RÉDUCTIONS DE LEVÉE des bâtiments de la ville de
  //  levée (arbitrage Thibaut 2026-10-28 : elles vivent dans la
  //  banque, canal reductionLeveeArmee).
  const villeLeveeObj = p.villes.find((v) => v.nom === villeLevee)
  const prix = prixArmee(puissance, C, villeLeveeObj)
  // Prix SANS les réductions de la ville (pour afficher l'économie)
  const prixBrut = prixArmee(puissance, C)
  const orDispo = p.resources['Or']?.stock ?? 0
  const leverArmee = () => {
    const cmd = commandantsDispo.find((c) => c.id === commandant)
    if (!cmd) return
    const nomArmee = nom.trim() || `Armée ${p.armees.length + 1}`
    update((s) => {
      const target = s.players.find((x) => x.n === joueur)
      if (!target) return
      // Prix de levée (classeur : 1 Or tous les 2 points de force) :
      // débité UNE FOIS à la levée — pas d'entretien par tour.
      const prix2 = prixArmee(puissance, C, villeLeveeObj)
      const rs = target.resources['Or']
      if (rs && rs.stock < prix2) return
      if (rs && prix2 > 0) rs.stock -= prix2
      // (RETRAIT 2026-10-28, arbitrage Thibaut « les armées rejoignent
      //  la banque » : le flag one-shot prochaineArmeeReduite
      //  « Stratégies militaires I » est mort depuis la purge du
      //  système de progrès (2026-10-24) — il n'est plus consommé ni
      //  lu ; un champ résiduel de vieille sauvegarde est ignoré.)
      target.armees.push({
        nom: nomArmee,
        puissanceCible: puissance,
        puissance: puissanceArmeeMetier(C.p.metierCommandant, C, C.p.puissanceGeneral),
        commandant: cmd.id,
        soldats: [],
        cible: cible ? state.players.find((q) => q.n === cible)?.nom ?? null : null,
      })
      const pers = (s.population[joueur] ?? []).find((c) => c.id === cmd.id)
      if (pers) {
        pers.metier = C.p.metierCommandant
        pers.armee = nomArmee
      }
      s.log.push({
        turn: s.turn, type: 'Armée', joueur,
        texte: `⚔ ${target.nom} lève l'armée « ${nomArmee} » (cible ${fmt(puissance)} pts) — prix de levée : −${prix2} Or (1 Or tous les ${C.p.armeePriXPuissance} pts de force).`,
      })
    })
    setNom('')
    setCommandant('')
    setPuissance(90)
  }

  return (
    <div className="stack">
      <Card title={`Armées de ${p.nom} — ${C.p.metierSoldat} ${puissanceArmeeMetier(C.p.metierSoldat, C, C.p.puissanceSoldat)} pts, ${C.p.metierCommandant} ${puissanceArmeeMetier(C.p.metierCommandant, C, C.p.puissanceGeneral)} pts`}>
        {p.armees.length === 0 && <p className="muted">Aucune armée en lice.</p>}
        {p.armees.map((a, idx) => {
          const cmd = a.commandant ? vivants.find((c) => c.id === a.commandant) : undefined
          const cmdMort = a.commandant && (!cmd || cmd.statut === 'Décédé')
          return (
            <div key={idx} className={`mini ${cmdMort ? 'warn-box' : ''}`}>
              <div className="mini-title">
                <TextInput value={a.nom} onChange={(v) => setPlayer((x, s) => {
                  const ancien = x.armees[idx].nom
                  x.armees[idx].nom = v
                  // renommer chez les soldats et le commandant
                  for (const c of s.population[joueur] ?? []) {
                    if (c.armee === ancien) c.armee = v
                  }
                })} />
              </div>
              <div className="small">
                Puissance : <strong>{fmt(a.puissance)}</strong> / cible {fmt(a.puissanceCible)} ·
                soldats : {a.soldats.length}
                {cmd && <span> · commandant : <strong>{cmd.prenom} {cmd.nom}</strong></span>}
                {cmdMort && <span className="neg"> · ⚠ commandant tombé, à remplacer !</span>}
              </div>
              <div className="grid-2">
                <Select
                  value={a.commandant ?? ''}
                  options={[
                    ...(cmd ? [{ value: cmd.id, label: `${cmd.prenom} ${cmd.nom}` }] : []),
                    { value: '', label: '(sans commandant)' },
                    ...commandantsDispo
                      .filter((c) => c.id !== a.commandant)
                      .map((c) => ({ value: c.id, label: `${c.prenom} ${c.nom} (${c.dynastie})` })),
                  ]}
                  onChange={(v) => setPlayer((x, s) => {
                    const pers = (s.population[joueur] ?? [])
                    const ancien = x.armees[idx].commandant
                    if (ancien) {
                      const ancienPers = pers.find((c) => c.id === ancien)
                      if (ancienPers) {
                        ancienPers.metier = null
                        ancienPers.armee = null
                      }
                    }
                    x.armees[idx].commandant = v || null
                    if (v) {
                      const nouveau = pers.find((c) => c.id === v)
                      if (nouveau) {
                        nouveau.metier = C.p.metierCommandant
                        nouveau.armee = x.armees[idx].nom
                      }
                    }
                  })}
                />
                <Select
                  value={a.cible ?? ''}
                  options={[
                    { value: '', label: 'Pas de cible' },
                    ...state.players.filter((q) => q.n !== p.n).map((q) => ({ value: q.nom, label: `Cible : ${q.nom}` })),
                  ]}
                  onChange={(v) => setPlayer((x) => { x.armees[idx].cible = v || null })}
                />
              </div>
              <Button tone="danger" onClick={() => setPlayer((x, s) => {
                const armee = x.armees[idx]
                const pers = s.population[joueur] ?? []
                for (const c of pers) {
                  if (c.armee === armee.nom) {
                    c.armee = null
                    c.metier = 'Chasseur' // re-titré comme RetirerArmee
                  }
                }
                x.armees.splice(idx, 1)
              })}>Dissoudre l'armée</Button>
              {/* ── Infliger des pertes (revue 2026-10-17) : tuer N soldats
                  de l'armée — batailles au plateau, saisie des pertes ici. */}
              <div className="row" style={{ alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                <span className="muted small">⚔ Pertes :</span>
                <NumberInput
                  value={pertesParArmee[idx] ?? 1}
                  step={1} min={0} max={999}
                  onChange={(v) => setPertesParArmee((m) => ({ ...m, [idx]: Math.round(v) }))}
                />
                <label className="small" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="checkbox"
                    checked={!!tuerCmdParArmee[idx]}
                    onChange={(e) => setTuerCmdParArmee((m) => ({ ...m, [idx]: e.target.checked }))}
                  />
                  commandant aussi
                </label>
                <Button tone="danger" onClick={() => {
                  const nb = Math.round(pertesParArmee[idx] ?? 0)
                  if (nb <= 0) return
                  if (!window.confirm(`Infliger ${nb} perte(s) à « ${a.nom} » ? Les soldats correspondants seront tués (statut « Décédé »).`)) return
                  setPlayer((x, s2) => { infligerPertes(s2, x, idx, nb, !!tuerCmdParArmee[idx]) })
                }}>⚔ Infliger {Math.round(pertesParArmee[idx] ?? 0)} perte(s)</Button>
                {/* ── Fin de service (revue 2026-10-17) : N soldats
                    quittent l'armée, redeviennent Chasseurs. */}
                <Button onClick={() => {
                  const nb = Math.round(pertesParArmee[idx] ?? 0)
                  if (nb <= 0) return
                  if (!window.confirm(`Libérer ${nb} soldat(s) de « ${a.nom} » ? Ils quittent l'armée et redeviennent Chasseurs (vivants et productifs).`)) return
                  setPlayer((x, s2) => { libererSoldats(s2, x, idx, nb, !!tuerCmdParArmee[idx]) })
                }}>🕊 Libérer {Math.round(pertesParArmee[idx] ?? 0)} en fin de service</Button>
              </div>
            </div>
          )
        })}
      </Card>

      <Card title="Lever une armée (LeverArmee)">
        <div className="grid-3">
          <label className="field">
            <span className="field-label">Nom de l'armée</span>
            <TextInput value={nom} onChange={setNom} placeholder="Garde royale…" />
          </label>
          <label className="field">
            <span className="field-label">Commandant (noble adulte libre)</span>
            <Select
              value={commandant}
              options={[
                { value: '', label: '(choisir…)' },
                ...commandantsDispo.map((c) => ({ value: c.id, label: `${c.prenom} ${c.nom} (${c.dynastie})` })),
              ]}
              onChange={setCommandant}
            />
          </label>
          <label className="field">
            <span className="field-label">Puissance cible (45-300)</span>
            <NumberInput value={puissance} onChange={setPuissance} step={15} min={45} max={300} />
          </label>
          <label className="field">
            <span className="field-label">Ville de levée (bonus de ses bâtiments)</span>
            <Select
              value={villeLevee}
              options={[
                { value: '', label: '(hors habitation — aucun bonus)' },
                ...p.villes.map((v) => ({ value: v.nom, label: v.nom })),
              ]}
              onChange={setVilleLevee}
            />
          </label>
        </div>
        <p className="small" style={{ margin: '4px 0' }}>
          Prix de levée : <strong>{fmt(prix)} Or</strong>{' '}
          <span className="muted">
            ({C.p.armeePrixOr} Or tous les {C.p.armeePriXPuissance} points de force — payé une fois, pas d'entretien)
          </span>
          {prixBrut > prix && (
            <span className="muted"> · réductions : −{fmt(prixBrut - prix)} Or (bâtiments de la ville de levée)</span>
          )}
          {orDispo < prix && <span className="neg"> ⚠ Or insuffisant ({fmt(orDispo)} disponible)</span>}
        </p>
        <Button tone="primary" disabled={!commandant || orDispo < prix} onClick={leverArmee}>⚔ Lever l'armée</Button>
        <p className="muted small" style={{ margin: '4px 0 0' }}>
          Armées : {p.armees.length} (aucun plafond).
        </p>
        <p className="muted small">
          Chaque tour, l'armée recrute automatiquement des soldats (adultes {ages.min}-{ages.max} ans)
          jusqu'à atteindre la puissance cible. Le prix de levée
          ({C.p.armeePrixOr} Or tous les {C.p.armeePriXPuissance} points de force) est débité une seule fois, à la création de
          l'armée. Choisir une VILLE DE LEVÉE applique les RÉDUCTIONS DE LEVÉE portées
          par ses bâtiments (arbitrage 2026-10-28 : elles vivent sur les fiches de
          construction du référentiel — cf. Référentiels).
        </p>
      </Card>
    </div>
  )
}
