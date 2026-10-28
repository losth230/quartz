// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — extrait de CitesLibresView.tsx.
//  Fiche d'UNE cité libre : identité éditable (nom, type, culture,
//  habitation, taxes), émissaires & suzerain (ressource du joueur —
//  revue 2026-10-15), annexion « → Ville » (retour Thibaut
//  2026-10-15 : les habitants vont à l'acquéreur, les émissaires
//  placés sont restitués aux réserves), résumé population (la
//  gestion vit dans l'onglet « 👥 Population ») et production &
//  taxes versées au suzerain.
// ══════════════════════════════════════════════════════════════════════

import type { GameState, CiteLibre, TaxeNiveau } from '../../engine/types'
import type { Cfg } from '../../engine/gameData'
import { detailCiteLibre, emissairesDe, emissairesEffectifsCite, citeLibreDevientVille, taxesCite } from '../../engine/citesLibres'
import { routesCommerceVersCite } from '../../engine/commerce'
import { Card, Select, TextInput, Button, Badge, TAX_OPTIONS } from '../ui'
import { fmtNum } from './logiqueCitesLibres'

/** Résumé des multiplicateurs de taxes PAR RESSOURCE (arbitrage
 *  Thibaut 2026-10-28) : « ×1 » si aucun facteur ou tous uniformes,
 *  sinon la liste par ressource (« Nourriture ×1.25 · Or ×0.75 »). */
function fmtTaxesCite(taxeMult: Record<string, number>): string {
  const facteurs = Object.entries(taxeMult)
  if (facteurs.length === 0 || facteurs.every(([, f]) => f === 1)) return '×1'
  const uniques = new Set(facteurs.map(([, f]) => f))
  if (uniques.size === 1) return `×${facteurs[0][1]}`
  return facteurs.map(([res, f]) => `${res} ×${f}`).join(' · ')
}

export function CarteCite({ cite, state, C, garnison, typeOptions, typesConfig, cultures, annexions, setAnnexions, mutCite, supprimerCite, changerEmissaires, changerSuzerain, update }: {
  cite: CiteLibre
  state: GameState
  C: Cfg
  garnison: number
  typeOptions: { value: string; label: string }[]
  typesConfig: { type: string; effet?: string }[]
  cultures: string[]
  annexions: Record<string, string>
  setAnnexions: (fn: (a: Record<string, string>) => Record<string, string>) => void
  mutCite: (nom: string, fn: (c: CiteLibre) => void) => void
  supprimerCite: (nom: string) => void
  changerEmissaires: (nom: string, joueur: number, delta: number) => void
  changerSuzerain: (nom: string, v: string) => void
  update: (fn: (s: GameState) => void) => void
}) {
  const d = detailCiteLibre(cite, C)
  const suz = cite.suzerain != null ? state.players.find((p) => p.n === cite.suzerain) : undefined
  const routesEntrantes = routesCommerceVersCite(state, cite.nom)
  const pop = cite.population ?? []
  const vivants = pop.filter((h) => h.statut !== 'Décédé')
  const typeEffectif = typeOptions.some((o) => o.value === cite.type)
    ? cite.type
    : (cite.type || '—')
  return (
    <Card
      key={cite.nom}
      title={`🗼 ${cite.nom}`}
      right={
        <span className="badges-wrap">
          <Badge tone="info">{typeEffectif.split('\n')[0]}</Badge>
          {cite.habitation && <Badge tone="neutral">🏰 {cite.habitation}</Badge>}
          <Badge tone="neutral">⚔ {fmtNum(garnison)} de garnison</Badge>
          {suz
            ? <Badge tone="good">Suzerain : {suz.nom}</Badge>
            : <Badge tone="warn">Sans suzerain</Badge>}
          <Button tone="danger" onClick={() => supprimerCite(cite.nom)}>Supprimer</Button>
          {/* ── Cité libre → VILLE d'un joueur (retour Thibaut
              2026-10-15) : annexion/conquête — les habitants vont à
              l'acquéreur, les émissaires placés sont restitués aux
              réserves. */}
          <span className="cl-annex">
            <Select
              value={annexions[cite.nom] ?? ''}
              options={[
                { value: '', label: 'Devenir une ville de…' },
                ...state.players.map((q) => ({ value: String(q.n), label: `${q.nom} (J${q.n})` })),
              ]}
              onChange={(v) => setAnnexions((a) => ({ ...a, [cite.nom]: v }))}
            />
            <Button
              disabled={!annexions[cite.nom]}
              onClick={() => {
                const n = Number(annexions[cite.nom])
                const q = state.players.find((x) => x.n === n)
                if (!q) return
                if (!window.confirm(`La cité libre « ${cite.nom} » devient une ville de ${q.nom} ? Ses habitants lui appartiennent désormais ; les émissaires placés sont restitués à leurs réserves.`)) return
                update((st) => {
                  const acquereur = st.players.find((x) => x.n === n)
                  if (acquereur) citeLibreDevientVille(st, cite.nom, acquereur)
                })
              }}
            >🏠 Annexer</Button>
          </span>
        </span>
      }
    >
      <div className="grid-2">
        {/* ── Identité de la cité ── */}
        <div className="mini">
          <div className="mini-title">Identité</div>
          <TextInput
            value={cite.nom}
            onChange={(v) => mutCite(cite.nom, (c) => { c.nom = v })}
          />
          <Select
            value={cite.type}
            options={typeOptions.some((o) => o.value === cite.type)
              ? typeOptions
              : [{ value: cite.type, label: cite.type.split('\n')[0] || '—' }, ...typeOptions]}
            onChange={(v) => mutCite(cite.nom, (c) => { c.type = v })}
          />
          <Select
            value={cite.culture ?? ''}
            options={cultures.includes(cite.culture ?? '')
              ? cultures.map((c) => ({ value: c, label: c }))
              : [{ value: cite.culture ?? '', label: cite.culture ?? '—' }, ...cultures.map((c) => ({ value: c, label: c }))]}
            onChange={(v) => mutCite(cite.nom, (c) => { c.culture = v })}
          />
          <Select
            value={cite.habitation ?? ''}
            options={[
              { value: '', label: 'Habitation : —' },
              { value: 'Hameau', label: 'Habitation : Hameau' },
              { value: 'Château', label: 'Habitation : Château' },
            ]}
            onChange={(v) => mutCite(cite.nom, (c) => {
              c.habitation = (v || null) as CiteLibre['habitation']
            })}
          />
          <Select
            value={taxesCite(cite)}
            options={TAX_OPTIONS}
            onChange={(v) => mutCite(cite.nom, (c) => { c.taxes = v as TaxeNiveau })}
          />
          <p className="muted small">
            Garnison : <strong>{fmtNum(garnison)}</strong> (100 + 40 × rang de pays le
            plus haut). Effet du type (référentiel) :{' '}
            {typesConfig.find((t) => t.type === cite.type)?.effet ?? '—'}
          </p>
        </div>

        {/* ── Émissaires & suzerain ── */}
        <div className="mini">
          <div className="mini-title">Émissaires & suzerain</div>
          {state.players.map((p) => {
            const e = emissairesDe(cite, p.n)
            const reserve = p.emissaires ?? 0
            // 2026-10-24 (arbitrage Thibaut « suppression du métier de
            //  Marchand ») : une route commerciale du joueur vers la
            //  cité octroie +1 émissaire TANT QUE la route est active
            //  (emissairesEffectifsCite). Les boutons +/- ne touchent
            //  QUE les émissaires placés (suivi manuel du plateau).
            const effectifs = emissairesEffectifsCite(state, cite, p.n)
            const bonusRoutes = effectifs - e
            return (
              <div key={p.n} className="cl-emiss">
                <span className={`player-chip ${effectifs >= 3 ? 'chip-active' : ''}`}>
                  J{p.n} · {p.nom}
                </span>
                <span className="badge badge-neutral">{e} placé(s)</span>
                {bonusRoutes > 0 && (
                  <span className="badge badge-info" title="Bonus des routes commerciales actives vers cette cité">
                    +{bonusRoutes} par route(s)
                  </span>
                )}
                <span className="badge badge-info" title="Émissaires disponibles (ressource du joueur)">
                  {reserve} en réserve
                </span>
                <Button onClick={() => changerEmissaires(cite.nom, p.n, -1)}>−</Button>
                <Button disabled={reserve <= 0} onClick={() => changerEmissaires(cite.nom, p.n, +1)}>+</Button>
                {effectifs >= 3 && <Badge tone="good">suzerain possible</Badge>}
              </div>
            )
          })}
          <Select
            value={cite.suzerain != null ? String(cite.suzerain) : ''}
            options={[
              { value: '', label: 'Sans suzerain' },
              ...state.players.map((p) => ({
                value: String(p.n),
                label: `${p.nom} (J${p.n})`,
              })),
            ]}
            onChange={(v) => changerSuzerain(cite.nom, v)}
          />
          {(cite.suzerain == null || emissairesEffectifsCite(state, cite, cite.suzerain) < 3) && (
            <p className="muted small">
              Règle : le suzerain s'obtient à 3 émissaires placés — une route
              commerciale active vers la cité compte comme un émissaire
              (2026-10-24, arbitrage Thibaut). Aucune contrainte bloquante
              ici — le suivi reflète le plateau.
            </p>
          )}
        </div>
      </div>

      {/* ── Population : résumé seul — la gestion vit dans le
          panneau séparé « Population des cités libres » en bas de
          page (comme les habitants des joueurs). ── */}
      <div className="mini-title">
        Population — {vivants.length} vivant(s) / {pop.length} au total
        <span className="muted small">
          {' '}· gestion dans l'onglet « 👥 Population » (sélectionnez la cité en haut de la page)
        </span>
      </div>

      {/* ── Routes commerciales entrantes (sous-vague 3b « routes
          dissociées », arbitrage Thibaut 2026-10-24 ; arbitrage
          « suppression du métier de Marchand » du 2026-10-24) :
          chaque route octroie +1 émissaire au joueur à l'origine
          TANT QUE la route est active (emissairesEffectifsCite —
          le métier de Marchand n'existe plus, les routes n'ouvrent
          plus aucun emplacement). Une cité ne peut PAS fermer ces
          routes (origine seule). ── */}
      {routesEntrantes.length > 0 && (
        <p className="small" style={{ marginTop: 0 }}>
          <Badge tone="info">🛒 {routesEntrantes.length} route(s) commerciale(s) entrante(s)</Badge>{' '}
          <span className="muted">
            +1 émissaire par route tant qu'elle est active — {routesEntrantes.map((r) => {
              const prop = state.players.find((q) => q.n === r.joueur)
              return `${r.villeOrigine} (${prop?.nom ?? '?'})`
            }).join(' · ')}
          </span>
        </p>
      )}

      {/* ── Production & taxes ── */}
      <div className="mini-title">
        Ce que la cité produit — et verse à son suzerain
      </div>
      <div className="small">
        <span className="muted">
          {d.habitants} vivant(s) — {d.adultes} adulte(s), {d.enfants} enfant(s){d.enfants > 0 ? ' (ne produisent pas, consomment)' : ''}, dont {d.chasseurs} chasseur(s)
          {d.chasseurs > 0 && <> — <strong>Nourriture ×1,1</strong> (règle des cités libres)</>}
          {' '}· taxes {fmtTaxesCite(d.taxeMult)}
        </span>
        <div className="badges-wrap">
          {Object.entries(d.metiers).map(([res, v]) => (
            <span key={res} className="badge badge-info">métiers : +{fmtNum(v)} {res}</span>
          ))}
          {Object.entries(d.conso).map(([res, v]) => (
            <span key={res} className="badge badge-neutral">conso : {fmtNum(v)} {res}</span>
          ))}
        </div>
        {suz ? (
          <p className="small">
            <strong>Taxes versées à {suz.nom} à chaque fin de tour :</strong>{' '}
            {Object.entries(d.transfert).length === 0
              ? <span className="muted">rien (production nette nulle ou négative)</span>
              : Object.entries(d.transfert)
                  .map(([res, v]) => `+${fmtNum(v)} ${res}`)
                  .join(', ')}
            {' '}(canal « Cités libres » du récap ressources).
          </p>
        ) : (
          <p className="muted small">
            Sans suzerain, la production de la cité n'est versée à personne —
            désignez un suzerain pour qu'il perçoive ces taxes.
          </p>
        )}
      </div>
    </Card>
  )
}
