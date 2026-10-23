// ══════════════════════════════════════════════════════════════════════
//  Commerce (marqueur (t)) : routes commerciales DISSOCIÉES (sous-vague
//  3b, arbitrage Thibaut 2026-10-24) — une route relie une de tes villes
//  à la ville d'un autre joueur ou à une cité libre, SANS personnage :
//  copie de l'aménagement ENTIER choisi (marqueur (u)) dans la ville
//  d'ORIGINE, plus d'Or passif (marchandOrTour retiré). Le métier de
//  Marchand a été RETIRÉ du jeu le 2026-10-24 (arbitrage Thibaut) :
//  une route vers une CITÉ LIBRE octroie +1 émissaire auprès de la
//  cité tant que la route est active (citesLibres.ts,
//  emissairesEffectifsCite). Ouverture gratuite ; fermeture par
//  la seule ville d'origine. Le formulaire d'ouverture et son état
//  vivent ici. (Extrait de PlayerView.tsx — un fichier par UI.)
// ══════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import type { Player } from '../../engine/types'
import { useGame } from '../../state/store'
import {
  routesCommerceDe, routesCommerceVers, maxRoutesJoueur,
  amenagementsCopiables, ressourcesCopiables,
  changerCopieRoute, supprimerRouteCommerce, creerRouteCommerce,
} from '../../engine/commerce'
import type { Cfg } from '../../engine/gameData'
import { Card, Badge, Select, Button, fmt } from '../ui'
import { Field } from './pays-utils'

export function CommerceRoutes({ p, C }: { p: Player; C: Cfg }) {
  const { state, update } = useGame()
  // ── Commerce (marqueur (t)) : formulaire d'ouverture d'une route
  //    commerciale dissociée — ville d'origine, cible (joueur OU cité
  //    libre), ville ciblée, aménagement copié (marqueur (u) :
  //    aménagement ENTIER ; une cité libre n'a rien à copier).
  const [rcOrigine, setRcOrigine] = useState('')
  const [rcType, setRcType] = useState<'joueur' | 'cite'>('joueur')
  const [rcJoueur, setRcJoueur] = useState('')
  const [rcVille, setRcVille] = useState('')
  const [rcAmen, setRcAmen] = useState('')
  const [rcErr, setRcErr] = useState<string | null>(null)
  // Garde-fou type : PlayerView ne rend cette carte QUE si une partie
  //  est chargée (state non-null côté App).
  if (!state) return null
  return (
    <Card title="Commerce — routes commerciales">
      {(() => {
        const mes = routesCommerceDe(state, p.n)
        const entrantes = routesCommerceVers(state, p.n)
        // Options du formulaire (cascade origine → type de cible →
        //  joueur/ville ou cité libre → aménagement copiable) +
        //  VALEURS EFFECTIVES : l'état OU la première option —
        //  correctif du bug des Selects contrôlés jamais touchés qui
        //  gardaient '' comme valeur.
        const autresJoueurs = state.players.filter((q) => q.n !== p.n)
        const cites = state.citesLibres ?? []
        const oEff = rcOrigine || p.villes[0]?.nom || ''
        const jEff = rcJoueur || String(autresJoueurs[0]?.n ?? '')
        const joueurCibleForm = state.players.find((q) => String(q.n) === jEff)
        const cEff = rcVille || joueurCibleForm?.villes[0]?.nom || ''
        const villeCibleForm = joueurCibleForm?.villes.find((v) => v.nom === cEff)
        const amenForm = villeCibleForm ? amenagementsCopiables(villeCibleForm, C.config) : []
        const aEff = rcAmen || amenForm[0] || ''
        const cap = maxRoutesJoueur(p, C)
        return (
          <>
            <p className="small">
              <Badge tone={mes.length > cap ? 'warn' : 'good'}>
                {mes.length} route(s) ouverte(s) · cap conseillé : {cap}
              </Badge>{' '}
              <span className="muted small">
                Chaque route vers une ville copie la production d'un
                aménagement de la ville ciblée dans ta ville d'origine ; une
                route vers une cité libre octroie +1 émissaire auprès de la
                cité tant que la route est active. Le cap est indicatif — tu
                peux ouvrir autant de routes que tu veux (dépassement annoncé
                au journal).
              </span>
            </p>
            {mes.length === 0 && entrantes.length === 0 && (
              <p className="muted">
                Aucune route commerciale. Ouvre une route gratuite depuis une de
                tes villes vers la ville d'un autre joueur (copie d'un
                aménagement) ou vers une cité libre (+1 émissaire auprès de la
                cité tant que la route est active).
              </p>
            )}
            {mes.length > 0 && (
              <div className="table-wrap">
                <table className="tbl small">
                  <thead>
                    <tr>
                      <th>Ville d'origine</th>
                      <th>Cible</th>
                      <th>Aménagement copié</th>
                      <th>Production copiée / tour</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {mes.map((route) => {
                      const cible = state.players.find((q) => q.n === route.joueurCible)
                      const villeCible = cible?.villes.find((v) => v.nom === route.villeCible)
                      const amenList = villeCible ? amenagementsCopiables(villeCible, C.config) : []
                      const copList = route.amenagement ? ressourcesCopiables(route.amenagement, C.config) : []
                      return (
                        <tr key={route.id}>
                          <td><strong>{route.villeOrigine}</strong></td>
                          <td>
                            {route.joueurCible === null
                              ? <>↔ <strong>{route.citeCible}</strong> <span className="muted small">(cité libre)</span></>
                              : <>↔ <strong>{route.villeCible}</strong><br /><span className="muted small">{cible?.nom ?? '?'}</span></>}
                          </td>
                          <td>
                            {route.joueurCible === null
                              ? <span className="muted">— (rien à copier · +1 émissaire tant que la route est active)</span>
                              : <Select
                                  value={route.amenagement ?? ''}
                                  options={amenList.map((a) => ({ value: a, label: a }))}
                                  onChange={(v) => {
                                    let err: string | null = null
                                    update((s) => { err = changerCopieRoute(s, route.id, v) })
                                    setRcErr(err)
                                  }}
                                />}
                          </td>
                          <td className="small">
                            {copList.length === 0 && <span className="muted">—</span>}
                            {copList.map((x, i) => (
                              (!x.ete || state.saison === 'Été')
                                ? <div key={i}>+{fmt(x.valeur)} {x.ressource}</div>
                                : <div key={i} className="muted">+{fmt(x.valeur)} {x.ressource} (uniquement en été — rien en hiver)</div>
                            ))}
                          </td>
                          <td>
                            <Button tone="danger" title="Fermer la route (ville d'origine seule)" onClick={() => {
                              let err: string | null = null
                              update((s) => { err = supprimerRouteCommerce(s, route.id) })
                              setRcErr(err)
                            }}>✕</Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {entrantes.length > 0 && (
              <p className="small">
                <strong>Routes entrantes</strong> — d'autres joueurs ont ouvert
                une route vers tes villes (aucun effet pour toi, aucune
                fermeture possible : tu n'es pas à l'origine) :{' '}
                {entrantes.map((route) => {
                  const prop = state.players.find((q) => q.n === route.joueur)
                  return `${route.villeOrigine} (${prop?.nom ?? '?'}) → ${route.villeCible}`
                }).join(' · ')}
              </p>
            )}
            <div className="filters" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <Field label="Ville d'origine">
                <Select
                  value={oEff}
                  options={p.villes.map((v) => ({ value: v.nom, label: v.nom }))}
                  onChange={setRcOrigine}
                />
              </Field>
              <Field label="Type de cible">
                <Select
                  value={rcType}
                  options={[
                    { value: 'joueur', label: 'Ville d\u2019un autre joueur' },
                    { value: 'cite', label: 'Cité libre' },
                  ]}
                  onChange={(v) => { setRcType(v === 'cite' ? 'cite' : 'joueur'); setRcVille(''); setRcAmen('') }}
                />
              </Field>
              {rcType === 'joueur' ? (
                <>
                  <Field label="Joueur ciblé">
                    <Select value={jEff} options={autresJoueurs.map((q) => ({ value: String(q.n), label: q.nom }))} onChange={(v) => { setRcJoueur(v); setRcVille(''); setRcAmen('') }} />
                  </Field>
                  <Field label="Ville ciblée">
                    <Select value={cEff} options={(joueurCibleForm?.villes ?? []).map((v) => ({ value: v.nom, label: v.nom }))} onChange={(v) => { setRcVille(v); setRcAmen('') }} />
                  </Field>
                  <Field label="Aménagement copié (production entière)">
                    <Select value={aEff} options={amenForm.map((a) => ({ value: a, label: a }))} onChange={setRcAmen} />
                  </Field>
                </>
              ) : (
                <Field label="Cité libre ciblée">
                  <Select
                    value={rcVille || cites[0]?.nom || ''}
                    options={cites.map((c) => ({ value: c.nom, label: c.nom }))}
                    onChange={setRcVille}
                  />
                </Field>
              )}
              <Button onClick={() => {
                let err: string | null = null
                if (rcType === 'joueur') {
                  update((s) => { err = creerRouteCommerce(s, p.n, oEff, Number(jEff), null, cEff, aEff) })
                } else {
                  const cite = rcVille || cites[0]?.nom || ''
                  update((s) => { err = creerRouteCommerce(s, p.n, oEff, null, cite, cite, null) })
                }
                setRcErr(err)
                if (!err) { setRcOrigine(''); setRcJoueur(''); setRcVille(''); setRcAmen('') }
              }}>Ouvrir la route (gratuit)</Button>
            </div>
            {rcErr && <p className="small" style={{ color: '#E74C3C', marginBottom: 0 }}>{rcErr}</p>}
          </>
        )
      })()}
    </Card>
  )
}
