// ══════════════════════════════════════════════════════════════════════
//  Paramètres : éditeur INTÉGRAL de la configuration du jeu.
//  Accessible EN PERMANENCE — même sans partie en cours.
//  La configuration est COMMUNE à toutes les parties : chaque
//  modification est mémorisée (navigateur) et propagée à la partie
//  en cours + aux nouvelles parties. Toutes les variables (constantes
//  et formules du moteur VBA) et toutes les tables de référentiels du
//  classeur sont modifiables à chaud, sans aucune validation bloquante :
//  les stocks peuvent être négatifs, les poids nuls, les textes vides.
// ══════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import { useGame } from '../state/store'
import { cfgOf, cloneDefaultConfig, validerFormeConfig } from '../config/defaultConfig'
import type { GameConfig } from '../config/defaultConfig'
import { PARAM_META, PARAM_STRINGS_META } from '../config/params'
import { Card, NumberInput, TextInput, Button } from './ui'
import {
  BatimentsParams, AmenagementsParams, PaysRangsParams,
  HabitationsParams, DomicilesParams, CouleursParams,
} from './ConfigTables'

const ONGLETS = [
  'Formules', 'Métiers', 'Traits', 'Cultures', 'Régimes',
  'Bâtiments', 'Aménagements', 'Pays & rangs', 'Habitations',
  'Couleurs',
  // (Onglets « Événements », « Effets évts », « Dynasties », « Cartes »
  //  retirés le 2026-10-24 avec les tables events/dynasties, retour
  //  arbitre Thibaut — l'ancien contenu vit dans git et le journal.)
  'Offrandes',
  'Probabilités', 'Peuples & noms', 'Ressources', 'JSON',
] as const

export function ParamsPanel() {
  const { globalConfig, setGlobalCfg, peutEditerConfig, replaceState, exportState, importState } = useGame()
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number]>('Formules')

  // Configuration commune, fusionnée sur les défauts (clés manquantes, etc.)
  const config: GameConfig = cfgOf(globalConfig).config

  /** Mutation de la configuration commune — propagée à la partie en cours.
   *  RÈGLE CRÉATEUR : neutralisée en lecture seule (le garde-fou du store
   *  bloque de toute façon en profondeur — ici on rend l'UI cohérente). */
  const setCfg = (fn: (c: GameConfig) => void) => {
    if (!peutEditerConfig) return
    setGlobalCfg(fn)
  }

  const setParam = (key: string, v: number | string) =>
    setCfg((c) => {
      if (!c.params) c.params = {} as GameConfig['params']
      ;(c.params as unknown as Record<string, unknown>)[key] = v
    })

  return (
    <div className="stack">
      <Card title="Paramètres communs à toutes les parties — modifiables à tout moment">
        {!peutEditerConfig && (
          <div className="banner-warn">
            🔒 Lecture seule — la configuration ne se modifie plus pendant une partie.
            Retournez à l'accueil (finissez ou supprimez la partie) pour l'éditer ; les
            changements s'appliquent à tout le monde après un simple rafraîchissement de la page.
          </div>
        )}
        <p className="muted small">
          Réglages <strong>communs à toutes les parties</strong>, mémorisés par le navigateur —
          export/import JSON dans le dernier onglet.
        </p>
        <div className="tabs">
          {ONGLETS.map((o) => (
            <button key={o} className={`tab ${onglet === o ? 'tab-active' : ''}`} onClick={() => setOnglet(o)}>{o}</button>
          ))}
        </div>
      </Card>

      {onglet === 'Formules' && (
        <Card title="Constantes des formules (portage VBA)">
          {groupesFormules().map((g) => (
            <div key={g} className="mb">
              <h4>{g}</h4>
              <div className="grid-3">
                {PARAM_META.filter((m) => m.groupe === g).map((m) => (
                  <label key={m.key} className="field">
                    <span className="field-label">{m.label}{m.unite ? ` (${m.unite})` : ''}</span>
                    <NumberInput
                      value={Number((config.params as unknown as Record<string, number>)[m.key] ?? 0)}
                      step={0.01}
                      onChange={(v) => setParam(m.key, v)}
                    />
                    {m.aide && <span className="field-hint">{m.aide}</span>}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <h4>Noms système (chaînes libres)</h4>
          <div className="grid-3">
            {PARAM_STRINGS_META.map((m) => (
              <label key={m.key} className="field">
                <span className="field-label">{m.label}</span>
                <TextInput
                  value={String((config.params as unknown as Record<string, string>)[m.key] ?? '')}
                  onChange={(v) => setParam(m.key, v)}
                />
              </label>
            ))}
            {(['metierDirigeant', 'metierGouverneur', 'metierProfesseur', 'metierChasseur', 'metierSoldat', 'metierCommandant', 'metierGarde', 'metierBanquier', 'metierTroubadour', 'traitBatard', 'traitConsanguin', 'dynastieRoturier'] as const).map((k) => (
              <label key={k} className="field">
                <span className="field-label">{k}</span>
                <TextInput
                  value={String((config.params as unknown as Record<string, string>)[k] ?? '')}
                  onChange={(v) => setParam(k, v)}
                />
              </label>
            ))}
          </div>
        </Card>
      )}

      {onglet === 'Métiers' && (
        <Card title="Métiers du classeur (24) — gains par tour, règles (vague 3a : sans éducation)">
          <div className="table-wrap">
            <table className="tbl small">
              <thead>
                <tr><th>Métier</th><th>Valeur 1</th><th>Ressource 1</th><th>Valeur 2</th><th>Ressource 2</th><th>Été</th><th>Noble seul</th><th>Genre</th><th>Attribution</th><th>Description</th></tr>
              </thead>
              <tbody>
                {config.metiers.map((t, i) => (
                  <tr key={i}>
                    <td><TextInput value={t.metier} onChange={(v) => setCfg((c) => { c.metiers[i].metier = v })} /></td>
                    <td><NumberInput value={t.valeur1} step={0.1} onChange={(v) => setCfg((c) => { c.metiers[i].valeur1 = v })} /></td>
                    <td><TextInput value={t.ressource1} onChange={(v) => setCfg((c) => { c.metiers[i].ressource1 = v })} /></td>
                    <td><NumberInput value={t.valeur2} step={0.1} onChange={(v) => setCfg((c) => { c.metiers[i].valeur2 = v })} /></td>
                    <td><TextInput value={t.ressource2} onChange={(v) => setCfg((c) => { c.metiers[i].ressource2 = v })} /></td>
                    <td><input type="checkbox" checked={!!t.ete} title="Ne produit qu'en été (ex. Fermier)" onChange={(e) => setCfg((c) => { c.metiers[i].ete = e.target.checked })} /></td>
                    <td><input type="checkbox" checked={t.nobleSeul} onChange={(e) => setCfg((c) => { c.metiers[i].nobleSeul = e.target.checked })} /></td>
                    <td><TextInput value={t.regleGenre} onChange={(v) => setCfg((c) => { c.metiers[i].regleGenre = v })} /></td>
                    <td><TextInput value={t.attribution} onChange={(v) => setCfg((c) => { c.metiers[i].attribution = v })} /></td>
                    <td><TextInput value={t.description} onChange={(v) => setCfg((c) => { c.metiers[i].description = v })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button onClick={() => setCfg((c) => { c.metiers.push({ metier: 'Nouveau métier', valeur1: 0, ressource1: '', valeur2: 0, ressource2: '', description: '', nobleSeul: false, regleGenre: '', attribution: 'Manuelle' }) })}>+ Ajouter un métier</Button>
        </Card>
      )}

      {onglet === 'Traits' && (
        <Card title="Traits génétiques (poids de tirage, effets)">
          <div className="table-wrap">
            <table className="tbl small">
              <thead>
                <tr><th>Trait</th><th>Poids</th><th>Vie ±</th><th>Résurrection (1d6 ≥)</th><th>Fécondité ±</th><th>Héritable</th><th>Mariage ±</th><th>Description</th></tr>
              </thead>
              <tbody>
                {config.traits.map((t, i) => (
                  <tr key={i}>
                    <td><TextInput value={t.name} onChange={(v) => setCfg((c) => { c.traits[i].name = v })} /></td>
                    <td><NumberInput value={t.weight} step={0.5} onChange={(v) => setCfg((c) => { c.traits[i].weight = v })} /></td>
                    <td><NumberInput value={t.life_delta} onChange={(v) => setCfg((c) => { c.traits[i].life_delta = v })} /></td>
                    <td><NumberInput value={t.resurrection_min_roll} onChange={(v) => setCfg((c) => { c.traits[i].resurrection_min_roll = v })} /></td>
                    <td><NumberInput value={t.fert_add} step={0.05} onChange={(v) => setCfg((c) => { c.traits[i].fert_add = v })} /></td>
                    <td><input type="checkbox" checked={t.heritable} onChange={(e) => setCfg((c) => { c.traits[i].heritable = e.target.checked })} /></td>
                    <td><NumberInput value={t.marriage_mod} step={0.05} onChange={(v) => setCfg((c) => { c.traits[i].marriage_mod = v })} /></td>
                    <td><TextInput value={t.description} onChange={(v) => setCfg((c) => { c.traits[i].description = v })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button onClick={() => setCfg((c) => { c.traits.push({ name: 'Nouveau trait', weight: 0, description: '', life_delta: 0, resurrection_min_roll: 0, fert_add: 0, heritable: true, marriage_mod: 0 }) })}>+ Ajouter un trait</Button>
        </Card>
      )}

      {onglet === 'Cultures' && (
        <Card title="Cultures (hérédité, fécondité, 12 lois)">
          <p className="muted small">Refonte « 12 lois » (2026-10-29) : loi de VILLE (culture majoritaire de la cité) et loi d'HABITANT (culture propre de chacun). Colonnes chiffrées = lois appliquées par le moteur. 0 = désactivé.</p>
          <div className="table-wrap">
            <table className="tbl small">
              <thead>
                <tr><th>Culture</th><th>Hérédité</th><th>Homo autorisée</th><th>Fécondité</th><th>Taudis/hab. (ville)</th><th>Palais/hab. (ville)</th><th>Seuil bourgeois</th><th>Scient./bât. faction</th><th>Maladie (habit.)</th><th>Tourisme/noble (habit.)</th><th>Nourr. été/fermier (ville)</th><th>Amén. requis (caravane)</th><th>Routes/caravane (ville)</th><th>Science/noble (habit.)</th><th>Garnison hors cult./rang</th><th>Garnison/garde cult.</th><th>Or/garde (habit.)</th><th>Loi de ville</th><th>Loi d'habitant</th></tr>
              </thead>
              <tbody>
                {config.cultures.map((t, i) => (
                  <tr key={i}>
                    <td><TextInput value={t.nom} onChange={(v) => setCfg((c) => { c.cultures[i].nom = v })} /></td>
                    <td><TextInput value={t.heredite} onChange={(v) => setCfg((c) => { c.cultures[i].heredite = v })} /></td>
                    <td><input type="checkbox" checked={t.homoAutorisee} onChange={(e) => setCfg((c) => { c.cultures[i].homoAutorisee = e.target.checked })} /></td>
                    <td><NumberInput value={t.fertFactor} step={0.05} onChange={(v) => setCfg((c) => { c.cultures[i].fertFactor = v })} /></td>
                    <td><NumberInput value={t.taudisParHabitation ?? 0} onChange={(v) => setCfg((c) => { c.cultures[i].taudisParHabitation = v })} /></td>
                    <td><NumberInput value={t.palaisParHabitation ?? 0} onChange={(v) => setCfg((c) => { c.cultures[i].palaisParHabitation = v })} /></td>
                    <td><NumberInput value={t.prestigeSeuilBourgeois ?? 100} onChange={(v) => setCfg((c) => { c.cultures[i].prestigeSeuilBourgeois = v })} /></td>
                    <td><NumberInput value={t.scientifiqueParBatiment ?? 0} onChange={(v) => setCfg((c) => { c.cultures[i].scientifiqueParBatiment = v })} /></td>
                    <td><NumberInput value={t.maladieContractMod ?? 0} step={0.01} onChange={(v) => setCfg((c) => { c.cultures[i].maladieContractMod = v })} /></td>
                    <td><NumberInput value={t.tourismeParNoble ?? 0} step={0.1} onChange={(v) => setCfg((c) => { c.cultures[i].tourismeParNoble = v })} /></td>
                    <td><NumberInput value={t.nourrEteParFermier ?? 0} step={0.1} onChange={(v) => setCfg((c) => { c.cultures[i].nourrEteParFermier = v })} /></td>
                    <td><NumberInput value={t.caravanesSeuilAmenagements ?? 0} onChange={(v) => setCfg((c) => { c.cultures[i].caravanesSeuilAmenagements = v })} /></td>
                    <td><NumberInput value={t.caravanesRoutesBonus ?? 0} onChange={(v) => setCfg((c) => { c.cultures[i].caravanesRoutesBonus = v })} /></td>
                    <td><NumberInput value={t.scienceParNoble ?? 0} step={0.05} onChange={(v) => setCfg((c) => { c.cultures[i].scienceParNoble = v })} /></td>
                    <td><NumberInput value={t.garnisonHorsCultureParRang ?? 0} onChange={(v) => setCfg((c) => { c.cultures[i].garnisonHorsCultureParRang = v })} /></td>
                    <td><NumberInput value={t.garnisonParGardeCulture ?? 0} onChange={(v) => setCfg((c) => { c.cultures[i].garnisonParGardeCulture = v })} /></td>
                    <td><NumberInput value={t.orParGarde ?? 0} step={0.05} onChange={(v) => setCfg((c) => { c.cultures[i].orParGarde = v })} /></td>
                    <td><TextInput value={t.regleVille} onChange={(v) => setCfg((c) => { c.cultures[i].regleVille = v })} /></td>
                    <td><TextInput value={t.regleHabitant} onChange={(v) => setCfg((c) => { c.cultures[i].regleHabitant = v })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {onglet === 'Régimes' && (
        <Card title="Régimes politiques (lois)">
          <p className="muted small">
            Colonnes chiffrées = lois du régime, lues automatiquement par le moteur là où
            elles agissent (refonte « 8 lois », 2026-10-29). 0 = désactivé.
          </p>
          <div className="table-wrap">
            <table className="tbl small">
              <thead>
                <tr>
                  <th>Régime</th><th>Loi (texte)</th>
                  <th>Conscription (−Or/rang du pays)</th>
                  <th>Frontières closes (× départs)</th>
                  <th>Terre d'accueil (Or/migrant)</th>
                  <th>Redistribution (bourgeois)</th>
                  <th>Redistribution (noble)</th>
                  <th>Pouvoir du peuple (+Bonheur/habitation)</th>
                  <th>Vassaux dévoués (× tribut reçu)</th>
                </tr>
              </thead>
              <tbody>
                {config.regimes.map((r, i) => (
                  <tr key={i}>
                    <td><TextInput value={r.nom} onChange={(v) => setCfg((c) => { c.regimes[i].nom = v })} /></td>
                    <td><TextInput value={r.loi} onChange={(v) => setCfg((c) => { c.regimes[i].loi = v })} /></td>
                    <td><NumberInput value={r.leveeOrParRangPays ?? 0} onChange={(v) => setCfg((c) => { c.regimes[i].leveeOrParRangPays = v })} /></td>
                    <td><NumberInput step={0.05} value={r.departHabitantsMult ?? 1} onChange={(v) => setCfg((c) => { c.regimes[i].departHabitantsMult = v })} /></td>
                    <td><NumberInput value={r.orParMigrant ?? 0} onChange={(v) => setCfg((c) => { c.regimes[i].orParMigrant = v })} /></td>
                    <td><NumberInput value={r.consoNourrBourgeoisRegime ?? 0} onChange={(v) => setCfg((c) => { c.regimes[i].consoNourrBourgeoisRegime = v })} /></td>
                    <td><NumberInput value={r.consoNourrNobleRegime ?? 0} onChange={(v) => setCfg((c) => { c.regimes[i].consoNourrNobleRegime = v })} /></td>
                    <td><NumberInput value={r.bonheurParHabitation ?? 0} onChange={(v) => setCfg((c) => { c.regimes[i].bonheurParHabitation = v })} /></td>
                    <td><NumberInput step={0.05} value={r.tributVassalMult ?? 1} onChange={(v) => setCfg((c) => { c.regimes[i].tributVassalMult = v })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {onglet === 'Bâtiments' && <BatimentsParams config={config} setCfg={setCfg} />}

      {onglet === 'Aménagements' && <AmenagementsParams config={config} setCfg={setCfg} />}


      {onglet === 'Pays & rangs' && <PaysRangsParams config={config} setCfg={setCfg} />}

      {onglet === 'Habitations' && (
        <>
          <HabitationsParams config={config} setCfg={setCfg} />
          {/* (retour Thibaut 2026-10-26 : les types de logement dans
              les paramètres — table domiciles : nom + qualité 0-4) */}
          <DomicilesParams config={config} setCfg={setCfg} />
        </>
      )}

      {onglet === 'Couleurs' && <CouleursParams config={config} setCfg={setCfg} />}

      {/* Sections « Événements », « Effets évts », « Dynasties », « Cartes »
          retirées le 2026-10-24 avec les tables events/dynasties du
          référentiel (retour arbitre Thibaut). */}

      {onglet === 'Offrandes' && (
        <Card title="Offrandes">
          {config.offrandes.map((o, i) => (
            <div key={i} className="mini">
              <div className="row">
                <TextInput value={o.nom} onChange={(v) => setCfg((c) => { c.offrandes[i].nom = v })} />
                <NumberInput value={o.poids} onChange={(v) => setCfg((c) => { c.offrandes[i].poids = v })} />
              </div>
              <TextInput value={o.description} onChange={(v) => setCfg((c) => { c.offrandes[i].description = v })} />
            </div>
          ))}
        </Card>
      )}

      {onglet === 'Probabilités' && (
        <Card title="Probabilités pondérées (orientations, genres)">
          <h4>Orientations</h4>
          {config.orientations.map((o, i) => (
            <div key={i} className="row">
              <TextInput value={o.nom} onChange={(v) => setCfg((c) => { c.orientations[i].nom = v })} />
              <NumberInput value={o.poids} onChange={(v) => setCfg((c) => { c.orientations[i].poids = v })} />
            </div>
          ))}
          <h4>Genres</h4>
          {config.genres.map((o, i) => (
            <div key={i} className="row">
              <TextInput value={o.nom} onChange={(v) => setCfg((c) => { c.genres[i].nom = v })} />
              <NumberInput value={o.poids} onChange={(v) => setCfg((c) => { c.genres[i].poids = v })} />
            </div>
          ))}
        </Card>
      )}

      {onglet === 'Peuples & noms' && (
        <Card title="Peuples et banques de noms (Banque 1/2/3, 200 noms chacune)">
          <div className="table-wrap">
            <table className="tbl small">
              <thead><tr><th>Peuple</th><th>Banque de noms</th></tr></thead>
              <tbody>
                {config.peuples.map((nom, i) => (
                  <tr key={i}>
                    <td><TextInput value={nom} onChange={(v) => setCfg((c) => { c.peuples[i] = v; c.peupleBanque[v] = c.peupleBanque[nom] ?? 0; delete c.peupleBanque[nom] })} /></td>
                    <td>
                      <select
                        className="input"
                        value={String(config.peupleBanque[nom] ?? 0)}
                        onChange={(e) => setCfg((c) => { c.peupleBanque[nom] = Number(e.target.value) })}
                      >
                        {config.banquesNoms.map((b, bi) => (
                          <option key={bi} value={bi}>{b.nom} ({b.noms.length} noms, {b.prenomsM.length} prénoms M, {b.prenomsF.length} prénoms F)</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted small">Pour éditer le contenu des banques (noms/prénoms), utilisez l'export/import JSON de la configuration ci-dessous, ou « Référentiels » pour les consulter.</p>
        </Card>
      )}

      {onglet === 'Ressources' && (
        <Card title="Ressources et éducations (listes libres, séparées par des virgules)">
          <label className="field">
            <span className="field-label">Ressources ({config.ressources.length})</span>
            <TextInput
              value={config.ressources.join(', ')}
              onChange={(v) => setCfg((c) => { c.ressources = v.split(',').map((x) => x.trim()).filter(Boolean) })}
            />
          </label>
          <p className="muted small">Attention : les stocks existants des joueurs sont conservés ; renommer une ressource rend son stock orphelin (récupérable à la main dans l'onglet « Pays »).</p>
        </Card>
      )}

      {onglet === 'JSON' && <JsonPanel config={config} setCfg={setCfg} replaceState={replaceState} exportState={exportState} importState={importState} />}
    </div>
  )
}

function JsonPanel({ config, setCfg, replaceState, exportState, importState }: {
  config: GameConfig
  setCfg: (fn: (c: GameConfig) => void) => void
  replaceState: (s: import('../engine/types').GameState) => void
  exportState: () => string
  importState: (json: string) => boolean
}) {
  const { state } = useGame()
  const [text, setText] = useState('')
  const [msg, setMsg] = useState('')
  return (
    <Card title="Export / import de la configuration commune">
      <div className="row mb">
        <Button onClick={() => { setText(JSON.stringify(config, null, 2)); setMsg('Configuration exportée ci-dessous — copiez-la ou collez-en une autre puis « Importer ».') }}>Exporter la config</Button>
        <Button tone="danger" onClick={() => {
          setCfg((c) => {
            const def = cloneDefaultConfig()
            for (const k of Object.keys(def) as (keyof GameConfig)[]) {
              ;(c as unknown as Record<string, unknown>)[k as string] = def[k]
            }
          })
          setMsg('Configuration réinitialisée aux valeurs du classeur.')
        }}>Réinitialiser aux valeurs du classeur</Button>
      </div>
      <textarea
        className="input"
        style={{ width: '100%', minHeight: 240, fontFamily: 'monospace', fontSize: 12 }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Collez ici une configuration JSON (bouton « Exporter la config » pour la récupérer)…"
      />
      <div className="row mt">
        <Button tone="primary" onClick={() => {
          try {
            const parsed = JSON.parse(text) as GameConfig
            // F6 (audit 2026-10-27) : validation de FORME avant import —
            //  un champ au mauvais type (« constructions: 42 ») cassait
            //  l'UI au premier rendu après un import « réussi ».
            const problemes = validerFormeConfig(parsed)
            if (problemes.length) {
              setMsg(`Import refusé — ${problemes.join(' ; ')}`)
              return
            }
            setCfg((c) => {
              for (const k of Object.keys(parsed) as (keyof GameConfig)[]) {
                ;(c as unknown as Record<string, unknown>)[k as string] = parsed[k]
              }
              // Marqueur (x) : le contenu importé peut être d'un ANCIEN
              // format (noms « Colonial », « Culture »…) — on retire le
              // tampon de convergence pour que les migrations le remettent
              // au niveau au prochain passage.
              delete (c as unknown as { schemaVersion?: number }).schemaVersion
            })
            setMsg('Configuration importée ✓')
          } catch (e) {
            setMsg(`JSON invalide : ${String(e)}`)
          }
        }}>Importer la config</Button>
        {state && (
          <>
            <Button onClick={() => {
              const full = exportState()
              setText(full)
              setMsg('Partie complète exportée (état + config). Pour la restaurer, utilisez le bouton « Importer la partie » ci-dessous.')
            }}>Exporter la partie complète</Button>
            <Button onClick={() => {
              try {
                if (importState(text)) setMsg('Partie complète importée ✓')
                else setMsg('Import impossible : partie invalide.')
              } catch (e) {
                setMsg(String(e))
              }
            }}>Importer la partie complète</Button>
            <Button onClick={() => {
              const s2 = JSON.parse(JSON.stringify(state)) as import('../engine/types').GameState
              s2.config = config
              replaceState(s2)
              setMsg('Config fusionnée dans la partie ✓')
            }}>Appliquer</Button>
          </>
        )}
      </div>
      {msg && <p className="small">{msg}</p>}
      {!state && <p className="muted small">Aucune partie en cours : la configuration modifiée ici sera utilisée par votre prochaine partie.</p>}
    </Card>
  )
}

function groupesFormules(): string[] {
  const out: string[] = []
  for (const m of PARAM_META) if (!out.includes(m.groupe)) out.push(m.groupe)
  return out
}
