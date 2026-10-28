// ══════════════════════════════════════════════════════════════════════
//  UNE VILLE de la page Pays — structure PAR BLOCS (retour arbitre
//  Thibaut 2026-10-25 « regrouper par blocs ») : (1) TÊTE : nom /
//  taxes / proximité en 3 colonnes égales PUIS rang d'habitation /
//  type de ville en 2 colonnes égales sur la rangée 2 + ligne
//  habitants requis (retour Thibaut 2026-10-26, capture n°3 :
//  rang & type comblent l'espace vide sous les trois cases) + BLOC
//  BONHEUR en HAUT DROITE (moyenne + 5 mini-jauges) — ni la culture
//  NI le compte de vivants ne vivent en tête (retours Thibaut
//  2026-10-26 : le tableau « Cultures présentes » porte la culture
//  ET le total des vivants) ; (2) POPULATION, GARNISON, LOGEMENTS
//  & MÉTIERS en DEUX COLONNES (retour Thibaut 2026-10-28 : damier
//  2×2 « ils ne rentrent pas » — SUPERSEDÉ le même jour, 3e
//  retour : colonne gauche culture + logements + garnison
//  EMPILÉS, colonne droite les métiers)
//  (retour Thibaut 2026-10-26 : tableau des cultures présentes —
//  majoritaire en gras avec liseré, part en %, total des vivants
//  — ET tableau détaillé de la garnison, origine par origine avec
//  plancher et total — arbitre : le détail reste TOUJOURS visible,
//  relooké en classes CSS dédiées) ; (2bis) MÉTIERS (retour
//  Thibaut 2026-10-27 : « un nouveau tableau avec les 3 tableaux
//  de logement, culture et garnison, qui recense tous les métiers
//  disponibles et occupés » — même données que le panneau
//  Population ; retour 2026-10-28 : format N/M « en poste /
//  capacité » comme les logements, et SEULS les métiers PRÉSENTS
//  (occupés) de la ville s'affichent ; retour 2026-10-28 bis :
//  les ENFANTS ne sont pas des sans-emplois — ligne « Enfant »
//  à part qui devient Sans-emploi à l'âge adulte ; retour
//  2026-10-28 ter : métiers DISPONIBLES seuls — SUPERSEDÉ par
//  le 4e retour : métiers PRÉSENTS ET DISPONIBLES sans
//  distinction (occupés OU offerts cap ≥ 1)) ; (3) CONSTRUCTIONS :
//  aménagements et bâtiments (choix à catégories — marqueur (y)) —
//  les COÛTS des aménagements vivent dans le POPUP de fabrication
//  , plus dans le titre (retour Thibaut 2026-10-26) ; (4) AUTRES ;
//  (5) PRODUCTION : par défaut SEULEMENT les ressources produites,
//  toggle « tout afficher » (retour Thibaut 2026-10-26 — supersede
//  le marqueur (r) « toutes les ressources même à 0 » du
//  2026-10-15) ; (6) ACTIONS RARES en BAS de carte (transfert,
//  suppression, cité libre) — elles ne cannibalisent plus la tête.
//  (RETRAIT 2026-10-19, retour arbitre : la heatmap d'attrait migratoire
//   a été retirée avec la migration spontanée par Tourisme — à refaire.)
//  (Extrait de PlayerView.tsx — un fichier par UI.)
// ══════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import type { AutreDef, City, GameState, Player } from '../../engine/types'
import { useGame } from '../../state/store'
import * as remote from '../../supabase/client'
import { effetsTourBatiment, garnisonBatiment } from '../../engine/batiments'
import { constructionsRefs, coutConstructionRef, resumeConstruction } from '../../engine/constructions'
import { amenagementRef, aCampDeBatisseurs, effetsNourrEteAmenagementsVille } from '../../engine/amenagements'
import { garnisonHabitationVille, detailGarnisonVille, rangNiveau } from '../../engine/regimes'
import { scoresVille, bonheurVille } from '../../engine/bonheur'
import { initStockVille, stockRang, vivantsVille, domicilesApportesVille } from '../../engine/domiciles'
import { occupationsMetierVille } from '../../engine/metiers'
import { typeVille, habitationDef, rangsDisponibles, debiterCoutHabitation, coutRang } from '../../engine/habitations'
import { productionVille } from '../../engine/production'
import { effetsNourrEteAutresVille } from '../../engine/autres'
import { supprimerVille, transfererVille } from '../../engine/villes'
import { couleurRessource, fondRessource, type Cfg } from '../../engine/gameData'
import { villeDevientCiteLibre } from '../../engine/citesLibres'
import { NumberInput, Select, TextInput, Button, fmt, TAX_OPTIONS } from '../ui'
import { ChoicePicker } from '../Picker'
import { faireConstruire, faireBatParFamille } from './Constructions'
import {
  Field, ORIGINE_LABEL, RESSOURCES_FLUX, FAM_BADGES,
  fmtEffets, fmtCout, fmtNum, titreAmenagement,
} from './pays-utils'

export function VilleCarte({ idx, ville, joueur, p, C, setPlayer }: {
  idx: number
  ville: City
  joueur: number
  p: Player
  C: Cfg
  setPlayer: (fn: (p: Player, s: GameState) => void) => void
}) {
  const { state, update, salon } = useGame()
  // (Retour Thibaut 2026-10-26 « cache par défaut les ressources
  //  non produites » : la vue repliée n'affiche que les ressources
  //  produites ; le toggle déplie le tableau complet. État local à
  //  la carte — pas persisté, pas poussé.)
  const [voirToutProd, setVoirToutProd] = useState(false)
  // Garde-fou type : PlayerView ne rend cette carte QUE si une partie
  //  est chargée (state non-null côté App).
  if (!state) return null
  // ── Référentiel des constructions (coût / production / description exacts) ──
  const refs = constructionsRefs(C.config)
  // Vague 3c (arbitrage Thibaut 2026-10-22) : les aménagements se
  //  répartissent en BASE (tier 1, coût propre, terrain) et
  //  AMÉLIORATIONS (tiers 2/3 — coût uniforme, rangMinHabitation,
  //  remplaceAmenagement : l'action REMPLACE une instance du tier
  //  inférieur, qui doit être présent dans la ville).
  const amRefsBase = refs.filter((r) => r.categorie === 'Aménagement' && !r.remplaceAmenagement)
  const amRefsTier = refs.filter((r) => r.categorie === 'Aménagement' && r.remplaceAmenagement)
  // Améliorations proposées : uniquement celles dont le tier inférieur
  //  est présent à la ville (et masquées si le rang d'habitation est
  //  insuffisant — la catégorie vide est de toute façon masquée par
  //  le picker, ce filtre évite les ⚠ de rang).
  const ameliorationsTier = (tier: number) => {
    if (rangNiveau(ville, C) < tier) return []
    return amRefsTier
      .filter((a) => (a.rangMinHabitation ?? 0) === tier)
      .filter((a) => (ville.amenagements ?? []).includes(a.remplaceAmenagement ?? ''))
  }
  const reducBatisseurs = aCampDeBatisseurs(p)
  // Mutateurs (fabriques de Constructions.ts) :
  const construire = faireConstruire({ update, joueur, C })
  const batParFamillePour = faireBatParFamille({ state, p, C })
    const nbVivants = (state.population[p.n] ?? [])
      .filter((c) => c.statut !== 'Décédé' && c.ville === ville.nom).length
    // Toutes les cultures présentes dans la ville (nombre d'habitants)
    const cultures: Record<string, number> = {}
    for (const c of state.population[p.n] ?? []) {
      if (c.statut === 'Décédé' || c.ville !== ville.nom) continue
      cultures[c.culture] = (cultures[c.culture] ?? 0) + 1
    }
    const culturesTriees = Object.entries(cultures).sort(
      (a, b) => (a[0] === ville.culture ? -1 : b[0] === ville.culture ? 1 : b[1] - a[1]),
    )
    return (
      <div key={idx} className="mini">
        {/* Ligne de tête densifiée (retour Thibaut 2026-10-14) :
            nom de la ville EN GRAS + niveau de taxes sur la
            même ligne. */}
        <div className="ville-tete-wrap">
        {/* Colonne GAUCHE de la zone de tête (retour Thibaut
            2026-10-26, capture n°3) : les 5 cases sur 2 rangées +
            la ligne habitants requis — le bloc bonheur (colonne
            droite) borde l'ensemble, plus d'espace vide dessous. */}
        <div>
        <div className="ville-tete">
        <Field label="Nom">
          <TextInput
            value={ville.nom}
            onChange={(v) => setPlayer((x, s) => {
              const ancien = x.villes[idx].nom
              x.villes[idx].nom = v
              // mettre à jour la ville des habitants
              for (const c of s.population[joueur] ?? []) {
                if (c.ville === ancien) c.ville = v
              }
            })}
          />
        </Field>
        <Field label="Taxes">
          <Select
            value={ville.taxes}
            options={TAX_OPTIONS}
            onChange={(v) => setPlayer((x) => { x.villes[idx].taxes = v })}
          />
        </Field>
        {/* Proximité (marqueur (y), retour Thibaut) : plaine /
            bord de rivière / bord de mer — bonus de Nourriture
            par tour crédité automatiquement, montants dans
            Paramètres → Formules → Villes. */}
        <Field label="Proximité">
          <Select
            value={ville.proximite ?? 'Plaine'}
            options={[
              { value: 'Plaine', label: 'Plaine (aucun bonus)' },
              { value: 'Rivière', label: `Rivière (+${fmt(C.p.proxRiviereNourriture)} Nourriture/tour)` },
              { value: 'Mer', label: `Mer (+${fmt(C.p.proxMerNourriture)} Nourriture/tour)` },
            ]}
            onChange={(v) => setPlayer((x) => { x.villes[idx].proximite = v })}
          />
        </Field>
        {/* Rang d'habitation et type de ville (Ville / Château) sur
            la RANGÉE 2 de la zone de tête — retour Thibaut 2026-10-26
            (capture n°3) : ils comblent l'espace vide sous les trois
            cases (le bloc bonheur est plus haut que la seule rangée
            de cases). Échelles de rangs différentes : Hameau → Cité
            → Grande Cité ou Motte → Donjon → Forteresse. */}
        <Field label="Rang d'habitation">
          <Select
            value={ville.rang ?? rangsDisponibles(typeVille(ville), C)[0]}
            options={rangsDisponibles(typeVille(ville), C).map((r) => {
              const def = (C.config.typesHabitation ?? []).find(
                (d) => d.type === typeVille(ville) && d.rang === r)
              // (Retour Thibaut 2026-10-27 « idem bâtiments/aménagements ») :
              //  le coût du rang vient des DONNÉES `couts` (agrégées par
              //  coutRang), plus du texte.
              const parts = Object.entries(coutRang(def)).filter(([, v]) => v > 0)
              return {
                value: r,
                label: parts.length
                  ? `${r} (${parts.map(([res, v]) => `${fmt(v)} ${res}`).join(' + ')})`
                  : r,
              }
            })}
            onChange={(v) => setPlayer((x, s) => {
              const ville = x.villes[idx]
              ville.rang = v
              debiterCoutHabitation(s, x, ville, C)
              // VAGUE C (2026-10-24) : le rang DÉFINIT l'offre de
              //  domiciles — le stock suit le changement de rang.
              initStockVille(ville, C)
            })}
          />
        </Field>
        <Field label="Type de ville">
          <Select
            value={typeVille(ville)}
            options={[{ value: 'Ville', label: 'Ville (Hameau → Cité → Grande Cité)' }, { value: 'Château', label: 'Château (Motte → Donjon → Forteresse)' }]}
            onChange={(v) => setPlayer((x, s) => {
              const ville = x.villes[idx]
              ville.type = v
              // le rang doit appartenir à l'échelle du nouveau type
              const rangs = rangsDisponibles(v, C)
              if (!rangs.includes(ville.rang ?? '')) ville.rang = rangs[0]
              debiterCoutHabitation(s, x, ville, C)
            })}
          />
        </Field>
        </div>
        {/* Habitants requis par le rang courant, en dessous du rang.
            (La consommation par tour des rangs d'habitation est
            supprimée — arbitrage vague 3b, code retiré 2026-10-22.) */}
        {(() => {
          const requis = habitationDef(ville, C)?.habitantsRequis ?? 0
          return (
            <div className="small">
              {requis > 0 && (
                <span className={`small ${nbVivants < requis ? 'neg' : 'muted'}`}>
                  · {fmt(requis)} habitants requis ({nbVivants} vivant(s){nbVivants < requis ? ' — insuffisant' : ''})
                </span>
              )}
            </div>
          )
        })()}
        </div>
        {/* BONHEUR (retour arbitre Thibaut 2026-10-25) : HAUT DROITE
            de la carte — moyenne + les 5 axes en MINI-JAUGES (label +
            barre colorée + valeur), plus seulement une info-bulle.
            Vague E design bonheur 2026-10-24 : moyenne simple des 5
            facteurs, indicateur PUR à ce jour. */}
        {(() => {
          const s = scoresVille(state, p, ville, C)
          const b = bonheurVille(s)
          const axes: Array<[string, number]> = [
            ['Emploi', s.emploi],
            ['Logement', s.logement],
            ['Sécurité', s.securite],
            ['Tourisme', s.tourisme],
            ['Santé', s.sante],
          ]
          const coul = (v: number) =>
            v >= 70 ? 'var(--green, green)' : v >= 40 ? 'var(--yellow, #b8860b)' : 'var(--red, #b22222)'
          return (
            <div
              className="bonheur-bloc"
              title="Bonheur : moyenne simple des 5 facteurs (emploi, logement, sécurité, tourisme, santé) — indicateur pur à ce jour (aucun effet natalité/impôts arbitré)"
            >
              <div className="bonheur-moyen">
                Bonheur <strong style={{ color: coul(b) }}>{b}</strong>
                <span className="muted">/100</span>
              </div>
              {axes.map(([label, v]) => (
                <div key={label} className="bonheur-axe" title={`${label} : ${v}/100`}>
                  <span className="bonheur-axe-label">{label}</span>
                  <span className="bonheur-axe-barre"><span style={{ width: `${v}%`, background: coul(v) }} /></span>
                  <span className="bonheur-axe-val">{v}</span>
                </div>
              ))}
            </div>
          )
        })()}
        </div>
        {/* (Retours Thibaut 2026-10-26 : « on voit deux fois la
            culture » puis capture suivante « la mention N habitant(s)
            vivant(s) est inutile au-dessus de Cultures présentes » —
            la tête ne rend NI la culture NI le compte de vivants :
            le tableau « Cultures présentes » du bloc POPULATION &
            GARNISON est LA place de la culture (majoritaire en gras
            avec liseré) ET du total des vivants (pied du tableau).) */}
        {/* (Bonheur déplacé en HAUT DROITE de la tête — retour
            arbitre 2026-10-25 ; l'ancienne ligne d'info est retirée.) */}

        {/* POPULATION, GARNISON, LOGEMENTS & MÉTIERS en DEUX
            COLONNES (retour Thibaut 2026-10-28, 3e retour du
            jour : « deux colonnes, une avec 3 tableaux :
            culture, logement et garnison, et une deuxième avec
            les métiers » — SUPERSEDÉ le damier 2×2 du matin) :
            colonne gauche les 3 tableaux empilés, colonne
            droite les métiers.
            La garnison est une VALEUR D'ÉTAT (pas un flux) : base
            du rang + bâtiments + loi éventuelle du régime ; ne
            change pas à chaque tour. Arbitre : le tableau détaillé
            reste TOUJOURS visible — relooké en classes CSS dédiées
            (.ville-table), plus de styles inline ni de titre
            verbeux. */}
        {(() => {
          const g = garnisonHabitationVille(p, ville, C, state)
          const lignes = detailGarnisonVille(p, ville, C, state)
          const sousTotal = lignes.reduce((n, l) => n + l.valeur, 0)
          const plancher = g - sousTotal
          const part = (nb: number) =>
            nbVivants > 0 ? `${Math.round((100 * nb) / nbVivants)} %` : '—'
          // ── LOGEMENTS (retour Thibaut 2026-10-26 : 3e tableau —
          //  2026-10-28 : colonne gauche, SOUS les cultures) : parc
          //  par type de domicile, meilleure qualité
          //  d'abord — capacité du rang (City.domiciles, repli
          //  stockRang pour un état non normalisé) + apports des
          //  constructions (domicilesApportesVille : Poste de garde,
          //  quartiers…) ; occupés = habitants attribués (retour
          //  Thibaut 2026-10-26 : 1 logement = 1 HABITANT, plus de
          //  foyers — les bâtiments les plus qualitatifs servent
          //  d'abord les personnages de haut rang). Maison de
          //  notable et Palais RÉSERVÉS aux nobles (retour Thibaut
          //  2026-10-28, 5e retour du jour).
          const stockLog = Array.isArray(ville.domiciles)
            ? ville.domiciles
            : stockRang(ville.type ?? 'Ville', ville.rang ?? 'Hameau', C)
          const capLog = new Map<string, number>()
          for (const e of stockLog) capLog.set(e.domicile, (capLog.get(e.domicile) ?? 0) + e.nombre)
          for (const e of domicilesApportesVille(ville, C)) {
            capLog.set(e.domicile, (capLog.get(e.domicile) ?? 0) + e.nombre)
          }
          const habitantsLog = vivantsVille(state, p.n, ville)
          const occLog = new Map<string, number>()
          for (const c of habitantsLog) {
            if (c.domicile) occLog.set(c.domicile, (occLog.get(c.domicile) ?? 0) + 1)
          }
          const sansLogement = habitantsLog.filter((c) => !c.domicile).length
          const lignesLog = C.config.domiciles
            .filter((d) => (capLog.get(d.domicile) ?? 0) > 0)
            .sort((a, z) => z.qualite - a.qualite)
            .map((d) => {
              const cap = capLog.get(d.domicile) ?? 0
              const occ = occLog.get(d.domicile) ?? 0
              return { nom: d.domicile, cap, occ }
            })
          const capTotale = lignesLog.reduce((n, l) => n + l.cap, 0)
          const habitantsLoges = habitantsLog.length - sansLogement
          // ── MÉTIERS (retour Thibaut 2026-10-27 : « un nouveau
          //  tableau […] qui recense tous les métiers disponibles
          //  et occupés ») : colonne DROITE, à côté des 3
          //  tableaux empilés (retour 2026-10-28), mêmes données que le
          //  panneau Population (helper moteur
          //  occupationsMetierVille, testé). Retour Thibaut
          //  2026-10-28 « n'affiche que les métiers présents dans
          //  la ville » (filtre occupés, SUPERSEDÉ ci-dessous) ;
          //  même retour : les ENFANTS ne sont pas des
          //  sans-emplois — ligne neutre « Enfant » à part (cap
          //  illimitée), le Sans-emploi ne compte que les adultes.
          //  Retour Thibaut 2026-10-28 (2e retour du jour) « les
          //  métiers disponibles » (SUPERSEDÉ ci-dessous), puis 4e
          //  retour : PRÉSENTS ET DISPONIBLES SANS DISTINCTION —
          //  un métier s'affiche s'il est OCCUPÉ (enPoste > 0,
          //  même non plafonné : Dirigeant, Héritier, Ministre,
          //  armée, Banquier…, cap illimitée → N/—) OU OFFERT
          //  (cap finie ≥ 1 : base du rang + emplacements des
          //  constructions, un poste libre se lit N/M — ex. 0/4).
          //  Ne restent masqués que les métiers NI occupés NI
          //  offerts (0/0). Les lignes neutres restent
          //  (Enfant, Sans-emploi).
          const lignesMet = occupationsMetierVille(
            habitantsLog, ville, C, { state, joueur },
          )
          const enPosteTotal = lignesMet.reduce(
            (n, l) => n + (l.metier ? l.enPoste : 0), 0,
          )
          const metiersAffiches = lignesMet.filter(
            (l) => l.metier === null || l.enPoste > 0 || (Number.isFinite(l.cap) && l.cap >= 1),
          )
          return (
            <div className="ville-duo-cols">
              <div className="ville-col-stack">
                <div>
                  <div className="ville-duo-titre">Cultures présentes</div>
                  {culturesTriees.length === 0 ? (
                    <div className="muted small">
                      aucun habitant — culture de la ville : <strong>{ville.culture}</strong>
                    </div>
                  ) : (
                    <table className="ville-table">
                      <tbody>
                        {culturesTriees.map(([cult, nb]) => (
                          <tr key={cult} className={cult === ville.culture ? 'ligne-major' : ''}>
                            <td>
                              {cult === ville.culture
                                ? <strong>{cult}</strong>
                                : <span className="muted">{cult}</span>}
                            </td>
                            <td className="num">{nb}</td>
                            <td className="num muted">{part(nb)}</td>
                          </tr>
                        ))}
                        <tr className="ligne-total">
                          <td><strong>Habitants vivants</strong></td>
                          <td className="num"><strong>{nbVivants}</strong></td>
                          <td className="num muted">{nbVivants > 0 ? '100 %' : '—'}</td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>
                {/* ── LOGEMENTS (retour Thibaut 2026-10-26 — puis
                    damier 2×2, retour 2026-10-28 — SUPERSEDÉ le
                    même jour : 2e tableau de la colonne gauche,
                    empilé sous les cultures).
                    Colonnes : type · occupés/capacité (retour Thibaut
                    2026-10-27 : la colonne « places libres » est
                    retirée — redondante, cap − occupés se lit déjà
                    dans occ/cap) ; le total rend habitants logés /
                    capacité totale. */}
                <div>
                  <div
                    className="ville-duo-titre"
                    title="Par type de domicile, meilleure qualité d'abord : habitants/capacité. 1 logement = 1 habitant ; capacité = offre du rang + apports des constructions (Poste de garde, quartiers, Tour de sorcier…) ; les bâtiments les plus qualitatifs servent d'abord les personnages de haut rang (prestige décroissant). Maisons de notable et Palais RÉSERVÉS aux nobles (retour 2026-10-28) : un roturier ou un bourgeois ne peut ni les recevoir ni les garder."
                  >
                    Logements : <strong>{fmt(capTotale)}</strong>
                  </div>
                  {lignesLog.length === 0 ? (
                    <div className="muted small">aucun logement</div>
                  ) : (
                    <table className="ville-table">
                      <tbody>
                        {lignesLog.map((l) => (
                          <tr key={l.nom}>
                            <td>{l.nom}</td>
                            <td className="num">{fmt(l.occ)}/{fmt(l.cap)}</td>
                          </tr>
                        ))}
                        {sansLogement > 0 && (
                          <tr>
                            <td className="neg">sans logement</td>
                            <td className="num neg">{fmt(sansLogement)}</td>
                          </tr>
                        )}
                        <tr className="ligne-total">
                          <td><strong>Habitants logés</strong></td>
                          <td className="num"><strong>{fmt(habitantsLoges)}/{fmt(capTotale)}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>
                <div>
                  <div className="ville-duo-titre">
                    Garnison des habitations : <strong>{fmt(g)}</strong>
                  </div>
                  <table className="ville-table">
                    <tbody>
                      {lignes.map((l, i) => (
                        <tr key={i}>
                          <td className="muted">{ORIGINE_LABEL[l.origine] ?? l.origine}</td>
                          <td>{l.label}</td>
                          <td className={l.valeur < 0 ? 'num neg' : 'num'}>
                            {l.valeur > 0 ? '+' : ''}{fmt(l.valeur)}
                          </td>
                        </tr>
                      ))}
                      {plancher > 0 && (
                        <tr>
                          <td className="muted">plancher</td>
                          <td>« Combler les lacunes » : minimum 30</td>
                          <td className="num">+{fmt(plancher)}</td>
                        </tr>
                      )}
                      <tr className="ligne-total">
                        <td />
                        <td><strong>Total</strong></td>
                        <td className="num"><strong>{fmt(g)}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              {/* ── MÉTIERS (retours Thibaut 2026-10-27, 2026-10-28
                  « présents » puis « disponibles » — tous deux
                  SUPERSEDÉS par le 4e retour du jour) : PRÉSENTS
                  ET DISPONIBLES SANS DISTINCTION — un métier
                  s'affiche s'il est OCCUPÉ (enPoste > 0, même non
                  plafonné : Dirigeant, Héritier, Ministre, armée…,
                  cap illimitée → N/—) OU OFFERT (cap finie ≥ 1 :
                  base du rang + emplacements des constructions —
                  un poste libre se lit N/M, ex. 0/4) ; ne restent
                  masqués que les métiers ni occupés ni offerts
                  (0/0). Avec les lignes neutres Enfant (les
                  enfants ne sont pas des sans-emplois — retour
                  2026-10-28 : ligne à part, ils deviennent
                  Sans-emploi à l'âge adulte) et Sans-emploi
                  (adultes, rôle neutre), et le total en poste /
                  vivants.
                  Format N/M COMME LES
                  LOGEMENTS (retour Thibaut 2026-10-28) : en poste /
                  capacité — « — » en dénominateur pour les métiers
                  non plafonnés (rôles de cour, armée, Banquier,
                  Troubadour…). Surnombre en rouge (cap baissée,
                  aménagement perdu — cf. reaffecterMetiers). */}
              <div>
                <div
                  className="ville-duo-titre"
                  title="Les métiers PRÉSENTS ET DISPONIBLES dans la ville, sans distinction : un métier s'affiche s'il est occupé (même non plafonné — Dirigeant, Héritier, Ministre… : capacité illimitée notée « — ») ou offert par la ville (cap finie d'au moins 1 place : base du rang d'habitation + emplacements des bâtiments et aménagements — ex. Poste de garde : +4 Garde) ; un poste libre se lit N/M. Ne restent masqués que les métiers ni occupés ni offerts. Ligne Enfant : les enfants ne sont pas des sans-emplois — ils deviennent Sans-emploi à l'âge adulte."
                >
                  Métiers : <strong>{fmt(enPosteTotal)}</strong> en poste
                </div>
                <table className="ville-table">
                  <tbody>
                    {metiersAffiches.map((l) => (
                      <tr key={l.metier ?? (l.enfants ? 'enfants' : 'sans')}>
                        <td>
                          {l.metier
                            ? l.metier
                            : l.enfants
                              ? <span className="muted" title="Enfant : pas un sans-emploi — devient Sans-emploi à l'âge adulte (un métier lui est attribué si un poste est libre)">Enfant</span>
                              : <span className="muted" title="Sans-emploi : rôle neutre — impôt nul, aucun effet">Sans-emploi</span>}
                        </td>
                        <td className={
                          Number.isFinite(l.cap) && l.enPoste > l.cap
                            ? 'num neg'
                            : 'num'
                        }>
                          {fmt(l.enPoste)}/{
                            Number.isFinite(l.cap)
                              ? fmt(l.cap)
                              : <span className="muted">—</span>
                          }
                        </td>
                      </tr>
                    ))}
                    <tr className="ligne-total">
                      <td><strong>Habitants en poste</strong></td>
                      <td className="num"><strong>{fmt(enPosteTotal)}/{fmt(nbVivants)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )
        })()}
        {/* ── Aménagements et bâtiments CÔTE À CÔTE (densification,
            retour Thibaut 2026-10-14) ── */}
        <div className="ville-constr">
          <div>
        {/* (Retour Thibaut 2026-10-26 : les coûts vivent dans le
            POPUP de fabrication — chaque option du picker affiche
            déjà son coût (tier 1 : référentiel ; tiers 2/3 : coût
            uniforme) — plus de coûts dans le titre.) */}
        <div className="mini-title">
          Aménagements
          {reducBatisseurs && (
            <span className="muted small"> · coûts réduits (Camp de bâtisseurs)</span>
          )}
        </div>
        {(ville.amenagements ?? []).length === 0 && <div className="muted small">aucun</div>}
        {(ville.amenagements ?? []).map((a, ai) => {
          const ref = amenagementRef(a, C.config)
          return (
            <div key={ai} className="ligne-construction">
              <span className="badge badge-good">
                {/* (Retour Thibaut 2026-10-27 : la case requise vit
                    entre parenthèses dans le TITRE.) */}
                {titreAmenagement(a, ref?.terrain)}
                <button
                  className="badge-x"
                  title="Retirer"
                  onClick={() => setPlayer((x) => {
                    const list = x.villes[idx].amenagements ?? (x.villes[idx].amenagements = [])
                    list.splice(ai, 1)
                  })}
                >×</button>
              </span>
              <span className="muted small">
                {ref ? (resumeConstruction(ref, C.config) || '—') : '—'}
              </span>
            </div>
          )
        })}
        <div className="add-bat">
          {/* Marqueur (y) : choix à CATÉGORIES + DESCRIPTIONS.
              (RETRAIT 2026-10-19, retour arbitre : les aménagements
              de faction ont été retirés avec le système de faction.)
              Vague 3c : la catégorie « Aménagements » ne propose que
              le TIER 1 ; les catégories « Améliorations » ne
              proposent que les tiers dont le tier inférieur est
              présent à la ville (remplacement, pas ajout). */}
          <ChoicePicker
            bouton="+ Aménager une case…"
            categories={[
              {
                label: 'Aménagements',
                options: amRefsBase.map((a) => ({
                  value: a.nom,
                  // (Retour Thibaut 2026-10-27 : la case requise vit
                  //  entre parenthèses dans le TITRE — plus besoin du
                  //  suffixe « · terrain » à droite du coût.)
                  metier: titreAmenagement(a.nom, a.terrain),
                  droite: fmtCout(coutConstructionRef(a)),
                  description: [
                    resumeConstruction(a, C.config),
                  ].filter(Boolean).join('\n'),
                })),
              },
              {
                label: 'Améliorations · tier 2',
                options: ameliorationsTier(2).map((a) => ({
                  value: a.nom,
                  metier: titreAmenagement(a.nom, a.terrain),
                  droite: `${fmtCout(coutConstructionRef(a))} · améliore ${a.remplaceAmenagement}`,
                  description: [
                    resumeConstruction(a, C.config),
                    `Remplace un « ${a.remplaceAmenagement} » de ${ville.nom} (habitation de rang 2 minimum).`,
                  ].filter(Boolean).join('\n'),
                })),
              },
              {
                label: 'Améliorations · tier 3',
                options: ameliorationsTier(3).map((a) => ({
                  value: a.nom,
                  metier: titreAmenagement(a.nom, a.terrain),
                  droite: `${fmtCout(coutConstructionRef(a))} · améliore ${a.remplaceAmenagement}`,
                  description: [
                    resumeConstruction(a, C.config),
                    `Remplace un « ${a.remplaceAmenagement} » de ${ville.nom} (habitation de rang 3 minimum).`,
                  ].filter(Boolean).join('\n'),
                })),
              },
            ]}
            onPick={(v) => construire(idx, v, 'amenagement')}
          />
        </div>
          </div>
          <div>
        <div className="mini-title">Bâtiments</div>
        {/* Marqueur (a) : garde-fou — une ville sans tableau
            batiments (donnée ancienne) ne doit pas crasher l'affichage. */}
        {(ville.batiments ?? []).length === 0 && <div className="muted small">aucun</div>}
        {(ville.batiments ?? []).map((b, bi) => {
          const ref = refs.find((r) => r.categorie === 'Bâtiment' && r.nom === b)
          const effets = effetsTourBatiment(b, C)
          const garnison = garnisonBatiment(b, C)
          // Pastille colorée par FAMILLE (retour Thibaut, marqueur
          // (r)) : rouge Militaire, jaune Economique, bleu Capitale,
          // blanc Faction, violet Guilde (choix arbitré), défaut
          // gris-bleu pour les bâtiments sans famille.
          const clFam = FAM_BADGES[ref?.famille ?? ''] ?? 'badge-info'
          const resume = [
            resumeConstruction(ref, C.config),
            // Garnison déjà incluse dans le résumé structuré ; repli :
            !ref?.effets && garnison > 0 ? `Garnison +${garnison}` : '',
            !ref && Object.keys(effets).length > 0 ? fmtEffets(effets, C) : '',
          ].filter(Boolean).join(' · ')
          return (
            <div key={bi} className="ligne-construction">
              <span className={`badge ${clFam}`} title={ref?.famille ? `Famille : ${ref.famille}` : undefined}>
                {b}
                <button
                  className="badge-x"
                  title="Démolir"
                  onClick={() => setPlayer((x) => { x.villes[idx].batiments.splice(bi, 1) })}
                >×</button>
              </span>
              <span className="muted small">
                {resume || '—'}
              </span>
            </div>
          )
        })}
        <div className="add-bat">
          {/* Marqueur (y) : un BOUTON PAR TYPE de bâtiment
              (militaire, économique, guilde, capitale —
              arbitrage Thibaut : les 5 familles existantes) +
              résumé des effets de chaque bâtiment AVANT le choix.
              (Retour Thibaut 2026-10-26 : la description du
              classeur, périmée, n'est plus affichée — le panneau
              rend comme celui des aménagements : résumé structuré
              dérivé du moteur + prérequis éventuel.) */}
          <ChoicePicker
            bouton="+ Construire…"
            categories={batParFamillePour(ville)}
            onPick={(v) => {
              const [groupe, nom] = v.split('|')
              construire(idx, nom, 'batiment', groupe)
            }}
          />
        </div>
          </div>
        </div>

        {/* ── AUTRES (ressource, source, nombre, bonus) ── */}
        <div className="mini-title">
          Autres
        </div>
        {(ville.autres ?? []).length === 0 && <div className="muted small">aucune</div>}
        {(ville.autres ?? []).map((l, li) => (
          <div key={li} className="autre-ligne">
            <Select
              value={l.ressource}
              options={C.ressources.map((r) => ({ value: r, label: r }))}
              onChange={(v) => setPlayer((x) => { (x.villes[idx].autres ?? (x.villes[idx].autres = []))[li].ressource = v })}
            />
            <TextInput
              value={l.source}
              placeholder="Source (Rivière, Régime…)"
              onChange={(v) => setPlayer((x) => { (x.villes[idx].autres ?? (x.villes[idx].autres = []))[li].source = v })}
            />
            <NumberInput
              value={l.nombre} step={1} min={0}
              onChange={(v) => setPlayer((x) => { (x.villes[idx].autres ?? (x.villes[idx].autres = []))[li].nombre = v })}
            />
            <span className="muted">×</span>
            <NumberInput
              value={l.bonus} step={1}
              onChange={(v) => setPlayer((x) => { (x.villes[idx].autres ?? (x.villes[idx].autres = []))[li].bonus = v })}
            />
            <span className="muted small">= {fmt((l.nombre ?? 0) * (l.bonus ?? 0))} / tour</span>
            <button
              className="badge-x"
              title="Retirer"
              onClick={() => setPlayer((x) => {
                const list = x.villes[idx].autres ?? (x.villes[idx].autres = [])
                list.splice(li, 1)
              })}
            >×</button>
          </div>
        ))}
        <div className="add-bat">
          <Button onClick={() => setPlayer((x) => {
            const list = x.villes[idx].autres ?? (x.villes[idx].autres = [])
            list.push({ ressource: 'Nourriture', source: '', nombre: 1, bonus: 1 } as AutreDef)
          })}>+ Ajouter une ligne « Autre »</Button>
        </div>

        {/* Retour Thibaut 2026-10-15 : le tableau récapitulatif des
            taxes (métiers × taxes / conso / net) est retiré — le net
            reste visible dans « Production de la ville » ci-dessous et
            dans le récap par tour de la page. */}
        {/* ── Production de la ville : ce qu'elle produit en
            ressources, tous canaux confondus (bâtiments,
            aménagements, autres, villageois, consommation de
            l'habitation) — bas du cadre de chaque ville. ── */}
        {(() => {
          const pv = productionVille(state, p, ville, C)
          // « Nourr - été » (ligne du classeur) : production d'été
          // de la ville, SOURCES SÉPARÉES — aménagements qui ne
          // produisent qu'en été (Champ, Rizière) et lignes
          // « Autres » de ressource « Nourr - été ». Affichée
          // comme LIGNE sous la nourriture, POTENTIEL visible en
          // toute saison (pour planifier), mais créditée au stock
          // de Nourriture UNIQUEMENT en été par le moteur.
          const nEteAm = effetsNourrEteAmenagementsVille(ville, C.config)['Nourriture'] ?? 0
          const nEteAut = effetsNourrEteAutresVille(ville)['Nourriture'] ?? 0
          // ÉTÉ pour TOUTE ressource (revue 2026-10-16) : les effets
          //  marqués été d'une autre ressource sont affichés comme
          //  lignes « <Ressource> - été » au même endroit.
          const eteAutres = (() => {
            const am = effetsNourrEteAmenagementsVille(ville, C.config)
            const au = effetsNourrEteAutresVille(ville)
            const out: Array<[string, number]> = []
            const vus = new Set(['Nourriture'])
            for (const src2 of [am, au]) {
              for (const [res, v] of Object.entries(src2)) {
                if (vus.has(res) || !v) continue
                vus.add(res)
                out.push([res, v])
              }
            }
            return out
          })()
          const nEteTot = nEteAm + nEteAut
          // (RETRAIT du marqueur (r) — retour Thibaut 2026-10-26 :
          //  par défaut SEULEMENT les ressources PRODUITES sont
          //  listées ; le toggle « tout afficher » redonne toutes
          //  les lignes. « produite » = au moins un canal non nul
          //  (bâtiments, aménagements, autres, villageois).)
          const estProduite = (r: string) =>
            [pv.batiments, pv.amenagements, pv.autres, pv.habitants]
              .some((d) => (d[r] ?? 0) !== 0)
          const resV = RESSOURCES_FLUX(C)
          // Lignes du tableau : chaque ressource + la ligne
          // « Nourr - été » juste après la Nourriture (ou en
          // première ligne s'il n'y a pas de nourriture générale).
          // (Retour Thibaut 2026-10-26 : la ligne été à 0 est
          //  CACHÉE en vue repliée, comme les autres lignes vides —
          //  supersede le retour 2026-10-15 « toujours visible ».)
          const lignesV: Array<{ kind: 'res'; r: string } | { kind: 'ete' } | { kind: 'eteAutre'; r: string }> = []
          let eteInsere = false
          const montreEte = () => voirToutProd || nEteTot !== 0
          for (const r of resV) {
            if (!voirToutProd && !estProduite(r)) continue
            lignesV.push({ kind: 'res', r })
            if (r === 'Nourriture') { if (montreEte()) lignesV.push({ kind: 'ete' }); eteInsere = true }
          }
          if (!eteInsere && montreEte()) lignesV.unshift({ kind: 'ete' })
          // Vue repliée d'une ville sans production : message court
          // + le toggle (le tableau complet reste à un clic).
          if (lignesV.length === 0) {
            return (
              <div>
                <div className="mini-title">
                  Production de la ville
                  <button className="prod-toggle" onClick={() => setVoirToutProd(true)}>tout afficher</button>
                </div>
                <div className="muted small">
                  Cette ville ne produit rien par tour (ressources non produites cachées par défaut).
                </div>
              </div>
            )
          }
          // ÉTÉ d'autres ressources (revue 2026-10-16) : une ligne
          //  « <Ressource> - été » après la ressource concernée.
          for (const [res, v] of eteAutres) {
            if (v === 0) continue
            const idx = lignesV.findIndex((l) => l.kind === 'res' && l.r === res)
            if (idx >= 0) lignesV.splice(idx + 1, 0, { kind: 'eteAutre', r: res })
            else lignesV.push({ kind: 'eteAutre', r: res })
          }
          return (
            <div>
              <div className="mini-title">
                Production de la ville
                {/* (Retour Thibaut 2026-10-26 : toggle discret à
                    côté du titre — vue repliée par défaut.) */}
                {voirToutProd ? (
                  <button className="prod-toggle" onClick={() => setVoirToutProd(false)}>produites seulement</button>
                ) : (
                  <button className="prod-toggle" onClick={() => setVoirToutProd(true)}>tout afficher</button>
                )}
              </div>
              <div className="table-wrap">
                <table className="tbl small ville-prod">
                  {/* (Retour Thibaut 2026-10-26 « colonnes inégales »
                      : largeurs FIXES — colonne ressource plus large
                      , les 5 colonnes de valeurs égales.) */}
                  <colgroup>
                    <col style={{ width: '22%' }} />
                    <col span={5} style={{ width: '15.6%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Ressource</th>
                      <th>Bâtiments</th>
                      <th>Aménagements</th>
                      <th>Autres</th>
                      <th>Villageois</th>
                      <th>Total / tour</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignesV.map((l) => {
                      if (l.kind === 'ete') {
                        return (
                          <tr key="nourr-ete" className="ligne-ete"
                            style={{ background: fondRessource('Nourr - été', C) }}>
                            <td>
                              <span className="dot-res dot-ete" style={{ background: couleurRessource('Nourr - été', C) }} />
                              <strong>Nourr - été</strong>{' '}
                              <span className="badge-ete">☀ été</span>
                            </td>
                            <td>—</td>
                            <td>{nEteAm !== 0 ? fmtNum(nEteAm) : '—'}</td>
                            <td>{nEteAut !== 0 ? fmtNum(nEteAut) : '—'}</td>
                            <td>—</td>
                            <td>
                              <strong>{fmtNum(nEteTot)}</strong>{' '}
                              <span className="muted small">(créditée en été seulement)</span>
                            </td>
                          </tr>
                        )
                      }
                      if (l.kind === 'eteAutre') {
                        const vEte = eteAutres.find(([res2]) => res2 === l.r)?.[1] ?? 0
                        return (
                          <tr key={`ete-${l.r}`} className="ligne-ete"
                            style={{ background: fondRessource(`${l.r} - été`, C) }}>
                            <td>
                              <span className="dot-res dot-ete" style={{ background: couleurRessource(l.r, C) }} />
                              <strong>{l.r} - été</strong>{' '}
                              <span className="badge-ete">☀ été</span>
                            </td>
                            <td>—</td>
                            <td>—</td>
                            <td>—</td>
                            <td>—</td>
                            <td>
                              <strong>{fmtNum(vEte)}</strong>{' '}
                              <span className="muted small">(créditée en été seulement)</span>
                            </td>
                          </tr>
                        )
                      }
                      const r = l.r
                      const col = (d: Record<string, number>) =>
                        (d[r] ?? 0) === 0 ? '—' : fmtNum(d[r] ?? 0)
                      const t = pv.total[r] ?? 0
                      return (
                        <tr key={r} className="ligne-prod" style={{ background: fondRessource(r, C) }}>
                          <td>
                            <span className="dot-res" style={{ background: couleurRessource(r, C) }} />
                            <strong>{r}</strong>
                          </td>
                          <td>{col(pv.batiments)}</td>
                          <td>{col(pv.amenagements)}</td>
                          <td>{col(pv.autres)}</td>
                          <td>{col(pv.habitants)}</td>
                          <td className={t < 0 ? 'neg' : ''}><strong>{fmtNum(t)}</strong></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })()}

        {/* ACTIONS RARES — BAS de carte (retour arbitre Thibaut
            2026-10-25 « regrouper par blocs » : elles ne
            cannibalisent plus la tête de lecture) : transfert à un
            autre joueur (capture, vente, cadeau — la ville ET ses
            habitants suivent) et suppression (les habitants restent
            inscrits dans la population). Retour Thibaut. */}
        <div className="badges-wrap">
          <Select
            value=""
            options={[
              { value: '' as const, label: '⇄ Transférer la ville à…' },
              ...state.players
                .filter((x) => x.n !== p.n)
                .map((x) => ({ value: String(x.n), label: `${x.nom} (J${x.n})` })),
            ]}
            onChange={(v) => v && update((st) => {
              const src = st.players.find((x) => x.n === joueur)
              const dst = st.players.find((x) => x.n === parseInt(v, 10))
              if (src && dst) {
                const nomAvant = src.villes[idx]?.nom ?? ''
                transfererVille(st, src, idx, dst)
                // PROTOCOLE v2 (bug 2026-10-17 : ville transférée
                //  perdue en fin de tour) : le transfert est une
                //  mutation INTER-JOUEURS — la section du
                //  RECEVEUR, poussée avant, l'écraserait à la
                //  fusion. Il part donc aussi en ÉVÉNEMENT
                //  PARTAGÉ (cp_events, type 'transfert_ville'),
                //  rejoué par la résolution APRÈS la fusion des
                //  sections (idempotent). best effort : si
                //  l'insert échoue, le transfert reste visible
                //  localement chez l'émetteur.
                void remote.pousserEvenementPartage(
                  salon, st.turn, joueur, 'transfert_ville',
                  { ville: nomAvant, src: joueur, dst: parseInt(v, 10) },
                )
              }
            })}
          />
          <Button
            tone="danger"
            onClick={() => {
              if (!window.confirm(`Supprimer « ${ville.nom} » ? Sa population classique sera DÉFINITIVEMENT supprimée avec elle (la cour reste inscrite ; l'arbitre la reloge).`)) return
              update((st) => {
                const src = st.players.find((x) => x.n === joueur)
                if (src) supprimerVille(st, src, idx)
              })
            }}
          >
            🗑 Supprimer
          </Button>
          <Button
            title="La ville quitte le joueur et devient une cité libre — il reçoit 1 émissaire placé dans cette cité"
            onClick={() => {
              if (!window.confirm(`« ${ville.nom} » devient une CITÉ LIBRE ? ${p.nom} reçoit 1 émissaire placé dans cette cité.`)) return
              update((st) => {
                const src = st.players.find((x) => x.n === joueur)
                if (src) villeDevientCiteLibre(st, src, idx)
              })
            }}
          >
            🏼 Devenir cité libre
          </Button>
        </div>

      </div>
  )
}
