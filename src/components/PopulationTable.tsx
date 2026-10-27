// ══════════════════════════════════════════════════════════════════════
//  Table de population : récapitulatif des métiers (royaume puis par
//  ville), ajout manuel d'habitants (roturiers ou nouvelle famille
//  noble, culture pondérée par celles présentes dans la ville),
//  filtres, tri, édition des métiers — seuls les métiers accessibles.
//  Vague 2 UI (rework habitants 2026-10-20) : colonne Domicile (vague 3 :
//  bâtiments de logement — null = « — » pour l'instant) et écran
//  « Métiers et places par ville » (en poste / cap / places libres,
//  helper moteur occupationsMetierVille).
//  sont proposés (Chasseur, Gouverneur) — et arbre généalogique de la
//  famille dirigeante (déplacé ici depuis la page Royaume).
//  Retour Thibaut (2026-10-14) : la population est séparée en deux
//  tableaux — « La cour » (personnages selon leur RANG social —
//  retour Thibaut 2026-10-26 : des nobles DÈS LE DÉPART, le rang
//  suit la dynastie de naissance + l'ascension par prestige)
//  affichés AU-DESSUS et la population « classique ». Chaque
//  personnage peut être DONNÉ à un autre joueur ; deux nobles
//  peuvent être MARIÉS manuellement (y compris de joueurs
//  différents — ex. la fille du joueur 1 avec le fils du joueur 2).
//  Retour Thibaut (2026-10-14, suite) : la section Population affiche
//  AUSSI les CITÉS LIBRES comme des onglets « comme si c'étaient des
//  joueurs » (joueur négatif = index de la cité) — mêmes tableaux
//  « La cour » / « Population », ajout de roturiers ou de familles
//  nobles, métiers, dons et mariages. Seules différences : pas de
//  Ministres ni d'arbre dynastique, et le STATUT reste éditable
//  (les cités libres ne passent pas au moteur démographique).
//  ── VAGUE QUALITÉ (2026-10-24) : la vue est découpée en sous-modules
//  population/ — logique pure (logiquePopulation.ts), ligne de
//  personnage (LignePersonnage.tsx), cartes autonomes (récap tour,
//  métiers et places par ville, ajout d'habitants). Ce fichier garde
//  l'ORCHESTRATION : filtres, callbacks du moteur, tableaux cour /
//  population, dynasties cliquables, arbre généalogique.
// ══════════════════════════════════════════════════════════════════════

import { useMemo, useState } from 'react'
import { useGame } from '../state/store'
import type { Character, CiteLibre } from '../engine/types'
import { cfgOf } from '../engine/gameData'
import { validateMetierAssignment } from '../engine/validation'
import { ajouterHabitant } from '../engine/setup'
import { metiersAccessibles } from '../engine/metiers'
import { fullName, deplacerPersonnage, toutesLesPopulations } from '../engine/shared'
import { rangDe } from '../engine/statutSocial'
import { marierPersonnages } from '../engine/cour'
import { metiersAccessiblesCite, pseudoJoueurDeCite, ajouterHabitantsCiteLibre, ajouterFamilleNobleCiteLibre } from '../engine/citesLibres'
import { GenealogyTree } from './GenealogyTree'
import { Card, Select, TextInput, Button, fmt } from './ui'
import { filtrerEtTrier, detenteurDeCle, optionsDon, eligibleMariage, type SortKey } from './population/logiquePopulation'
import { LignePersonnage } from './population/LignePersonnage'
import { CarteRecapTour } from './population/CarteRecapTour'
import { CarteMetiersPlaces } from './population/CarteMetiersPlaces'
import { CarteAjoutHabitants } from './population/CarteAjoutHabitants'

export function PopulationTable({ joueur }: { joueur: number }) {
  const { state, update } = useGame()
  // OPTIMISATION RENDU 2026-10-16 : à 16 000+ personnages, rendre
  //  toutes les lignes = DOM énorme (plusieurs secondes). Pagination
  //  simple : 200 lignes par page.
  const [pageCour, setPageCour] = useState(0)
  const PAR_PAGE = 200
  const [filtreDyn, setFiltreDyn] = useState('')
  const [filtreVille, setFiltreVille] = useState('')
  const [filtreMetier, setFiltreMetier] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('Vivants')
  const [tri, setTri] = useState<SortKey>('age')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ── Cible de l'onglet : un JOUEUR (joueur > 0) ou une CITÉ LIBRE
  //  (joueur = -(index+1) — onglets 🗼 de la section Population,
  //  retour Thibaut 2026-10-14 : « comme si c'étaient des joueurs »). */
  const citeIdx = joueur < 0 ? -joueur - 1 : -1
  const cite: CiteLibre | undefined =
    citeIdx >= 0 && state ? (state.citesLibres ?? [])[citeIdx] : undefined
  const p = cite ? undefined : state?.players.find((x) => x.n === joueur)
  const pop = cite ? (cite.population ?? []) : (state?.population[joueur] ?? [])
  const C = cfgOf(state?.config)
  // Description complète d'un métier pour le picker (marqueur (y)) :
  //  gains par habitant/tour + noblesse.
  const descMetier = (t: string): string => {
    const td = (C.config.metiers ?? []).find((x) => x.metier === t)
    if (!td) return ''
    const parts: string[] = []
    if (td.ressource1 && td.valeur1) parts.push(`+${fmt(td.valeur1)} ${td.ressource1}`)
    if (td.ressource2 && td.valeur2) parts.push(`+${fmt(td.valeur2)} ${td.ressource2}`)
    return [
      parts.length ? `${parts.join(' + ')} par habitant et par tour` : '',
      td.nobleSeul ? 'Nobles seulement' : '',
      td.description || '',
    ].filter(Boolean).join('\n')
  }
  const resumeMetier = (t: string): string => {
    const td = (C.config.metiers ?? []).find((x) => x.metier === t)
    if (!td) return ''
    const parts: string[] = []
    if (td.ressource1 && td.valeur1) parts.push(`+${fmt(td.valeur1)} ${td.ressource1}`)
    if (td.ressource2 && td.valeur2) parts.push(`+${fmt(td.valeur2)} ${td.ressource2}`)
    return parts.join(' + ')
  }
  const nomPorteur = p?.nom ?? cite?.nom ?? ''

  // ── Séparation cour / population classique (retours Thibaut
  //  2026-10-26 : « le tableau supérieur montre les personnages
  //  selon leur RANG, pas leur dynastie » PUIS « il faut des nobles
  //  dès le début — la colonne dynastie doit correspondre à la
  //  colonne rang ») : l'appartenance à la cour suit le RANG D'UN
  //  PERSONNAGE (rangDe, cf. statutSocial.ts) — NOBLE DE NAISSANCE
  //  si la dynastie est noble (la famille dirigeante et sa parenté
  //  siègent donc à la cour DÈS LE DÉPART), sinon rang dérivé du
  //  prestige (bourgeois ≥ 100, anobli ≥ 250). Les roturiers de
  //  dynastie gravissent la cour par le prestige.
  const estDeCour = (c: Character) => rangDe(c, C) !== 'roturier'

  const { rowsCour, rowsClassique } = useMemo(() => {
    const filtres = { statut: filtreStatut, ville: filtreVille, metier: filtreMetier, dynastie: filtreDyn }
    return {
      rowsCour: filtrerEtTrier(pop.filter(estDeCour), filtres, tri),
      rowsClassique: filtrerEtTrier(pop.filter((c) => !estDeCour(c)), filtres, tri),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pop, C, filtreDyn, filtreVille, filtreMetier, filtreStatut, tri])

  if (!state || (!p && !cite)) return null

  // ── Portefeuilles ministériels (refonte 2026-10-14) ──────────────────

  // Aucune contrainte bloquante : le métier est TOUJOURS appliqué ;
  // le contrôle de cohérence n'affiche qu'un avertissement (ignorable).
  const changeMetier = (c: Character, metier: string) => {
    // Cité libre : validation via un pseudo-joueur (culture de la cité,
    // mêmes contrôles de cohérence que pour un joueur).
    const porteur = p ?? (cite ? pseudoJoueurDeCite(cite) : undefined)
    const issue = porteur
      ? validateMetierAssignment(state, porteur, c, metier)
      : { ok: true, message: '' }
    setErrors((e) => {
      const copy = { ...e }
      if (issue.ok) delete copy[c.id]
      else copy[c.id] = issue.message
      return copy
    })
    update((s) => {
      const liste = cite
        ? ((s.citesLibres ?? [])[citeIdx]?.population ?? [])
        : (s.population[joueur] ?? [])
      const target = liste.find((x) => x.id === c.id)
      if (target) {
        // Dirigeant / Héritier UNIQUE (retour utilisateur
        //  2026-10-17) : nommer un nouveau porteur relève
        //  automatiquement l'ancien (il redevient sans métier) — la
        //  validation ne fait qu'avertir, jamais bloquer, mais on
        //  garantit l'unicité du métier dans l'état.
        if (metier === C.p.metierDirigeant || metier === C.p.metierHeritierStr) {
          for (const autre of liste) {
            if (autre.id !== target.id && autre.metier === metier) {
              autre.metier = null
              s.log.push({
                turn: s.turn, type: 'Métier', joueur,
                texte: `\u{1F451} ${fullName(autre)} quitte le métier ${metier} — remplacé(e) par ${fullName(target)}.`,
              })
            }
          }
        }
        target.metier = metier
      }
    })
  }

  /** Statut manuel (mode cité libre SEULEMENT — les cités libres ne
   *  passent pas au moteur démographique : décès « au plateau »).
   *  Décès = veuvage du conjoint où qu'il vive (joueur ou cité libre). */
  const changerStatut = (c: Character, v: string) => {
    const nomCite = cite?.nom ?? ''
    update((s) => {
      const tc = ((s.citesLibres ?? [])[citeIdx]?.population ?? []).find((x) => x.id === c.id)
      if (!tc) return
      tc.statut = v as Character['statut']
      if (v === 'Décédé' && tc.mariageId) {
        // M1 (2026-10-19) : veuvage par ID.
        const conjoint = toutesLesPopulations(s).find((x) => x.mariageId === tc.id)
        if (conjoint) { conjoint.mariage = null; conjoint.mariageId = null }
        s.log.push({
          turn: s.turn, type: 'Décès', joueur: null,
          texte: `💀 ${fullName(tc)} est décédé(e) à la cité libre ${nomCite} — le conjoint est libéré.`,
        })
      }
    })
  }

  // ── Don de personnage et mariage manuel (retour Thibaut) ───────────
  //  Dons et mariages couvrent JOUEURS et CITÉS LIBRES (retour
  //  2026-10-14 : la population des cités libres est « semblable en
  //  tout point » à celle des joueurs).
  const lesOptionsDon = optionsDon(state, joueur, cite)
  /** Options « Marier avec… » (marqueur (z), retour Thibaut) : les
   *  nobles du porteur COURANT UNIQUEMENT (joueur ou cité libre
   *  affiché) — on ne cible plus les autres joueurs/cités. Le moteur
   *  (marierPersonnages) reste capable d'unir deux porteurs
   *  différents (c'est l'interface qui restreint). */
  const optionsMariage = (c: Character) =>
    pop
      .filter((x) => eligibleMariage(x, c, C))
      .map((x) => ({ value: x.id, label: `${fullName(x)} (${x.dynastie})` }))
  const donnerA = (c: Character, v: string) => {
    if (!v) return
    const dst = detenteurDeCle(state, v)
    if (!dst) return
    const dstNom = dst.kind === 'joueur'
      ? `${dst.p.nom} (J${dst.p.n})`
      : `la cité libre ${dst.cite.nom}`
    if (p && c.metier === C.p.metierDirigeant
      && !window.confirm(`Donner ${fullName(c)} (${C.p.metierDirigeant} de ${p.nom}) à ${dstNom} ?`)) return
    let errDon: string | null = null
    update((s) => {
      const tc = cite
        ? ((s.citesLibres ?? [])[citeIdx]?.population ?? []).find((x) => x.id === c.id)
        : (s.population[joueur] ?? []).find((x) => x.id === c.id)
      const dstS = detenteurDeCle(s, v)
      if (tc && dstS) errDon = deplacerPersonnage(s, tc, dstS)
    })
    setErrors((e) => {
      const copy = { ...e }
      if (errDon) copy[c.id] = errDon
      else delete copy[c.id]
      return copy
    })
  }
  const marierAvec = (c: Character, v: string) => {
    if (!v) return
    // Retour Thibaut (marqueur (o)) : le mariage DÉMÉNAGE la personne
    //  mariée dans la ville de son conjoint — confirmation avant de
    //  déplacer un Dirigeant (changement de porteur possible).
    if (p && c.metier === C.p.metierDirigeant
      && !window.confirm(`Le mariage déplace la personne mariée dans la ville de son conjoint (${fullName(c)} changera de ville). Marier ${fullName(c)} ?`)) return
    let errMariage: string | null = null
    update((s) => {
      const a = cite
        ? ((s.citesLibres ?? [])[citeIdx]?.population ?? []).find((x) => x.id === c.id)
        : (s.population[joueur] ?? []).find((x) => x.id === c.id)
      if (!a) return
      const b = toutesLesPopulations(s).find((x) => x.id === v)
      if (b) errMariage = marierPersonnages(s, a, b)
    })
    setErrors((e) => {
      const copy = { ...e }
      if (errMariage) copy[c.id] = errMariage
      else delete copy[c.id]
      return copy
    })
  }

  const dynasties = [...new Set(pop.map((c) => c.dynastie))].sort((a, b) => a.localeCompare(b, 'fr'))
  const villes = [...new Set(pop.map((c) => c.ville))]

  // ── Récapitulatif des métiers (royaume entier, puis par ville) ──────
  const vivants = pop.filter((c) => c.statut !== 'Décédé')
  const villesOcc = cite ? [{ nom: cite.nom }] : (p?.villes ?? [])
  const accessibles = p
    ? metiersAccessibles(state)
    : (cite ? metiersAccessiblesCite(state, cite) : [])
  // ── Ajout manuel d'habitants ────────────────────────────────────────
  const villesAjout = cite ? [cite.nom] : (p?.villes.map((v) => v.nom) ?? [])
  const ajouterRoturiers = (addVilleEff: string, nb: number) => {
    update((s) => {
      if (cite) {
        const cc = (s.citesLibres ?? [])[citeIdx]
        if (cc) ajouterHabitantsCiteLibre(s, cc, nb)
        return
      }
      const target = s.players.find((x) => x.n === joueur)
      if (!target) return
      ajouterHabitant(s, target, addVilleEff, false, nb)
    })
  }
  const ajouterNobles = (addVilleEff: string, nb: number) => {
    update((s) => {
      if (cite) {
        const cc = (s.citesLibres ?? [])[citeIdx]
        if (cc) ajouterFamilleNobleCiteLibre(s, cc, nb)
        return
      }
      const target = s.players.find((x) => x.n === joueur)
      if (!target) return
      ajouterHabitant(s, target, addVilleEff, true, nb)
    })
  }

  const propsLigne = {
    estCite: !!cite,
    C,
    accessibles,
    errors,
    descMetier,
    resumeMetier,
    optionsDon: lesOptionsDon,
    optionsMariage,
    changeMetier,
    changerStatut,
    donnerA,
    marierAvec,
  }

  // ── Bloc de filtres (commun aux deux tableaux) ─────────────────────
  const blocFiltres = (
    <div className="filters">
      <Select value={filtreStatut} options={[
        { value: 'Vivants', label: 'Vivants' },
        { value: 'Décédés', label: 'Décédés' },
        { value: 'Enfants', label: 'Enfants (<16)' },
        { value: 'Tous', label: 'Tous' },
      ]} onChange={setFiltreStatut} />
      <Select value={filtreVille} options={[
        { value: '', label: 'Toutes les villes' },
        ...villes.map((v) => ({ value: v, label: v })),
      ]} onChange={setFiltreVille} />
      <Select value={filtreMetier} options={[
        { value: '', label: 'Tous les métiers', },
        ...C.metiers.map((t) => ({ value: t.metier, label: t.metier })),
      ]} onChange={setFiltreMetier} />
      <TextInput value={filtreDyn} onChange={setFiltreDyn} placeholder="Filtrer dynastie…" />
      <Select value={tri} options={[
        { value: 'age', label: 'Trier : âge' },
        { value: 'nom', label: 'Trier : nom' },
        { value: 'dynastie', label: 'Trier : dynastie' },
        { value: 'ville', label: 'Trier : ville' },
        { value: 'metier', label: 'Trier : métier', },
      ]} onChange={(v) => setTri(v as SortKey)} />
    </div>
  )

  const entetes = (
    <thead>
      <tr>
        <th>Nom</th><th>Dynastie · Rang</th><th>Sx</th><th>Âge</th><th>Ville</th>
        <th>Culture</th><th>Métier</th><th>Domicile</th><th>Traits</th>
        <th>Statut</th><th>Mariage</th><th>Fécondité</th><th>Actions</th>
      </tr>
    </thead>
  )

  const courVivants = pop.filter((c) => estDeCour(c) && c.statut !== 'Décédé').length
  const classiqueVivants = vivants.length - courVivants

  return (
    <div className="stack">

      {/* Récap du dernier tour — carte déplacée de la page Pays (retour
          Thibaut 2026-10-14) : elle ne concerne que la population. */}
      {p && <CarteRecapTour recap={p.recap ?? null} />}

      {/* Écran « métiers et places par ville » (vague 2 UI, rework
          habitants 2026-10-20) : par ville, une ligne par métier occupé
          ou plafonné — en poste, capacité, places libres — la ligne
          Sans-emploi (rôle neutre : impôt nul, aucun effet) est toujours
          présente. Helper moteur occupationsMetierVille (testé). */}
      <CarteMetiersPlaces
        vivants={vivants}
        villesOcc={villesOcc}
        villesDuJoueur={p?.villes}
        estCite={!!cite}
        C={C}
        descMetier={descMetier}
        state={!cite ? state : undefined}
        joueur={!cite ? joueur : undefined}
      />

      <CarteAjoutHabitants
        villes={villesAjout}
        onAjouter={ajouterRoturiers}
        onAjouterNobles={ajouterNobles}
      />

      <Card title={`👑 La cour de ${nomPorteur} — ${courVivants} vivants / ${pop.filter(estDeCour).length} au total`}>
        {blocFiltres}
        <p className="muted small">
          Personnages selon leur RANG — nobles de NAISSANCE (dynastie noble) et, par ascension, bourgeois (prestige ≥ 100) et nobles (≥ 250) {cite ? 'de la cité libre' : 'du joueur'} —
          filtres et tri appliqués aussi au tableau « Population » ci-dessous. La cour commence noble : la famille dirigeante y siège dès le départ ;
          le prestige y ajoute les roturiers anoblis (bourgeois à 100, anobli à 250).
        </p>
        <div className="table-wrap">
          <table className="tbl small pop-tbl">
            {entetes}
            <tbody>
              {rowsCour.length
                ? rowsCour.slice(pageCour * PAR_PAGE, (pageCour + 1) * PAR_PAGE)
                    .map((c) => <LignePersonnage key={c.id} c={c} avecMariage {...propsLigne} />)
                : <tr><td colSpan={13} className="muted">aucun personnage de haut rang — ni dynastie noble, ni prestige ≥ 100 (bourgeois à 100, anobli à 250)</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="muted small">
          « ➡ Donner à… » transfère le personnage à un autre porteur (il y est éditable et y produit).
          « 💍 Marier avec… » unit deux personnages DU MÊME porteur : la personne mariée déménage
          dans la ville de son conjoint (confirmation avant de marier un Dirigeant).
          Si un mariage ou un don est refusé, le motif s'affiche en rouge sous le métier
          (déjà marié, mineur… — le mariage manuel unit deux NOBLES : dynastie noble
          de naissance ou anobli à 250 de prestige).
        </p>
      </Card>

      <Card title={`Population de ${nomPorteur} — ${classiqueVivants} vivants / ${pop.filter((c) => !estDeCour(c)).length} au total`}>
        <div className="table-wrap">
          <table className="tbl small pop-tbl">
            {entetes}
            <tbody>
              {rowsClassique.length
                ? rowsClassique.slice(pageCour * PAR_PAGE, (pageCour + 1) * PAR_PAGE)
                    .map((c) => <LignePersonnage key={c.id} c={c} avecMariage={false} {...propsLigne} />)
                : <tr><td colSpan={13} className="muted">aucun habitant</td></tr>}
            </tbody>
          </table>
              {(() => {
                const total = Math.max(rowsCour.length, rowsClassique.length)
                const pages = Math.ceil(total / PAR_PAGE)
                if (pages <= 1) return null
                return (
                  <div className="filters" style={{ alignItems: 'center', marginTop: 8 }}>
                    <Button disabled={pageCour === 0} onClick={() => setPageCour((n) => n - 1)}>◀ Précédent</Button>
                    <span className="small">Page {pageCour + 1} / {pages} — {total} personnage(s)</span>
                    <Button disabled={pageCour + 1 >= pages} onClick={() => setPageCour((n) => n + 1)}>Suivant ▶</Button>
                  </div>
                )
              })()}
        </div>
        <p className="muted small">
          Population « classique » {cite ? 'de la cité libre' : 'du joueur'} (hors cour — roturiers : dynastie roturière ET prestige sous 100){cite
            ? ' — le statut (Sain/Malade/Décédé) y est éditable : les cités libres ne passent pas au moteur démographique'
            : ' ; une ville transférée à un autre joueur emmène ses habitants classiques, la cour reste auprès de son joueur'}.
        </p>
      </Card>

      <Card title="Dynasties de la population">
        <div className="badges-wrap">
          {dynasties.map((d) => {
            const nb = pop.filter((c) => c.dynastie === d && c.statut !== 'Décédé').length
            return (
              <button key={d} className="badge badge-neutral clickable" onClick={() => setFiltreDyn(d)}>
                {d} : {nb}
              </button>
            )
          })}
        </div>
      </Card>

      {p && <GenealogyTree joueur={joueur} />}
    </div>
  )
}
