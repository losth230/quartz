// ══════════════════════════════════════════════════════════════════════
//  DIAGNOSTIQUE MOTEUR (CI uniquement — n'est pas importé par le jeu).
//
//  R2 RÉSOLU (2026-10-24) : ce script n'embarque PLUS de copie du
//  moteur. Il importe src/engine/* tel quel — plus aucune dérive
//  possible entre le diagnostic et le moteur (l'ancien miroir de
//  ~2 400 lignes devait être re-patché à la main à chaque
//  simplification ; il avait déjà dérivé sur l'API : c.titre,
//  config.titres, config.batiments… renommés depuis en metier /
//  metiers / constructions). Le référentiel est lu par le moteur
//  lui-même (referentiels.json via le loader).
//
//  Contenu (inchangé en esprit, réaligné sur l'API réelle) :
//    · partie saine : createGame + 4 tours + levée d'armées + tour ;
//    · registre de règles PAR CANAL (type d'effet — retour Thibaut
//      2026-10-27 : vue de débogage du registre ~90 règles) ;
//    · scénarios de DÉGRADATION : un champ supprimé/vidé sur un état
//      cloné, puis runTurn — chaque [ÉCHEC] est un état dégradé que
//      le moteur n'a pas à gérer (informatif, jamais bloquant :
//      normaliserEtat répare les états à l'ingestion côté jeu) ;
//    · mutateurs de dissolution/renommage d'armée (ArmiesPanel) sur
//      états dégradés.
//
//  Lancement (cf. .github/workflows/diag.yaml) :
//    node --experimental-strip-types \
//         --import ./scripts/diag-loader.mjs scripts/diag.ts
//  Le loader résout les imports sans extension (.ts/.tsx/.json) et
//  sert les .json en modules ES — le moteur fait le reste.
// ══════════════════════════════════════════════════════════════════════

import { runTurn } from '../src/engine/tour'
import { createGame, defaultSetups } from '../src/engine/setup'
import { cfgOf } from '../src/engine/gameData'
import { isNobleDyn } from '../src/engine/shared'
import { registreComplet } from '../src/rules/registry'
import type { Effet, RegleBanque } from '../src/rules/types'

// ── Harnais de sortie ──────────────────────────────────────────────────
const __out: string[] = []
function dlog(...a: any[]) { __out.push(a.map(String).join(' ')) }
function clone<T>(x: T): T { return JSON.parse(JSON.stringify(x)) as T }

try {
  // ── Partie saine ─────────────────────────────────────────────────────
  const st = createGame(defaultSetups(), 20261011, 'local')
  dlog('createGame OK —', st.players.length, 'joueurs')
  for (let t = 0; t < 4; t++) runTurn(st)
  dlog('4 tours OK — turn', st.turn, '· saison', st.saison, '· log', st.log.length, 'entrées')
  const C = cfgOf(st.config)
  const p1 = st.players[0]
  const pop1 = st.population[1] ?? []
  let cands = pop1.filter((c: any) => c.statut !== 'Décédé' && c.age >= C.p.adultAge && isNobleDyn(c.dynastie, C) && !c.armee)
  if (cands.length < 2) {
    cands = pop1.filter((c: any) => c.statut !== 'Décédé' && c.age >= C.p.adultAge && !c.armee)
    cands.forEach((c: any) => { c.dynastie = c.nom + '-nob' })
  }
  dlog('commandants disponibles pour J1 :', cands.length)
  for (let i = 0; i < 2 && i < cands.length; i++) {
    const cmd = cands[i]
    const nomA = 'Armée ' + (i + 1)
    p1.armees.push({ nom: nomA, puissanceCible: 90, puissance: C.p.puissanceGeneral, commandant: cmd.id, soldats: [], cible: null })
    cmd.metier = C.p.metierCommandant
    cmd.armee = nomA
  }
  runTurn(st)
  dlog('levée + recrutement OK —', p1.armees.map((a: any) => a.nom + ':' + a.soldats.length + ' soldats').join(', '))

  // dissolution idx=1 (mutateur exact d'ArmiesPanel)
  {
    const s: any = clone(st)
    const x: any = s.players.find((q: any) => q.n === 1)
    const idx = 1
    const armee = x.armees[idx]
    const pers = s.population[1] ?? []
    for (const c of pers) { if (c.armee === armee.nom) { c.armee = null; c.metier = C.p.metierChasseur } }
    x.armees.splice(idx, 1)
    dlog('dissolution armée idx=1 : OK')
  }
  // renommage idx=0 (mutateur exact d'ArmiesPanel)
  {
    const s: any = clone(st)
    const x: any = s.players.find((q: any) => q.n === 1)
    const ancien = x.armees[0].nom
    x.armees[0].nom = 'Garde royale'
    for (const c of s.population[1] ?? []) { if (c.armee === ancien) c.armee = 'Garde royale' }
    dlog('renommage armée idx=0 : OK')
  }
  runTurn(st)
  dlog('tour suivant (armées en place) : OK — turn', st.turn)

  // ── Registre de règles, FILTRÉ PAR CANAL (retour Thibaut 2026-10-27) ──
  //  Le registre portait ~15 règles manuscrites avant la migration « tout
  //  par la banque » ; il en porte ~90 depuis (une règle par construction
  //  qui a un effet QUELCONQUE, générée par reglesConstructions) : pour
  //  arbitrer un effet bizarre en partie, la vue PAR CANAL (type d'effet)
  //  remplace la lecture séquentielle. Une règle multi-canaux apparaît
  //  dans CHAQUE canal concerné (le canal est un filtre, pas un tri).
  dlog('')
  dlog('═══ REGISTRE DE RÈGLES PAR CANAL ═══')
  const regles = registreComplet(C)
  const parSource: Record<string, number> = {}
  for (const r of regles) parSource[r.source] = (parSource[r.source] ?? 0) + 1
  dlog(`total : ${regles.length} règles — sources : ${Object.entries(parSource).map(([s, n]) => `${s} ${n}`).join(', ')}`)
  const signe = (v: number) => `${v > 0 ? '+' : ''}${v}`
  const effetCourt = (e: Effet): string => {
    switch (e.type) {
      case 'fluxVille': return `${e.ressource} ${signe(e.valeur)}${e.ete ? ' (été)' : ''}`
      case 'garnisonVille': return `Garnison ${signe(e.valeur)}`
      case 'placesMetier': return `${e.metier} ${signe(e.valeur)}`
      case 'logements': return `${e.logement} ${signe(e.valeur)}`
      // (Retour Thibaut 2026-10-28 : « les armées, et surtout les
      //  réductions de levée, rejoignent la banque » — canal de
      //  réduction de levée d'armée porté par les fiches de
      //  construction (champ reductionLeveeArmee).)
      case 'reductionLeveeArmee': return `levée d'armée −${e.valeur} Or`
      case 'fluxParAmenagement': return `${e.ressource} ${signe(e.valeur)} par ${e.noms.join(' / ')}`
      // (RETRAIT 2026-10-29, refonte « 12 lois » : canal
      //  fluxParVilleCultureMonde supprimé avec la source 'culture'.)
      default: return JSON.stringify(e)
    }
  }
  const decrireRegle = (r: RegleBanque): string =>
    `${r.id} — ${r.nom}${r.groupe ? ` (${r.groupe})` : ''}` +
    (r.conditions ? ` [si ${Object.entries(r.conditions).map(([k, v]) => `${k}=${v}`).join(', ')}]` : '') +
    ` : ${r.effets.map(effetCourt).join(' · ')}`
  // (Canal reductionLeveeArmee ajouté le 2026-10-28 — cf. effetCourt.)
  // (RETRAIT 2026-10-29, refonte « 12 lois » : le canal
  //  fluxParVilleCultureMonde est retiré avec la source 'culture'.)
  const CANAUX_CONNUS = ['placesMetier', 'logements', 'reductionLeveeArmee', 'fluxVille', 'garnisonVille', 'fluxParAmenagement']
  const canaux: string[] = []
  for (const r of regles) for (const e of r.effets) if (!canaux.includes(e.type)) canaux.push(e.type)
  const inconnus = canaux.filter((c) => !CANAUX_CONNUS.includes(c)).sort()
  if (inconnus.length) dlog(`⚠ canaux inconnus : ${inconnus.join(', ')}`)
  for (const canal of [...CANAUX_CONNUS.filter((c) => canaux.includes(c)), ...inconnus]) {
    const rs = regles.filter((r) => r.effets.some((e) => e.type === canal))
    dlog(`── canal ${canal} : ${rs.length} règle${rs.length > 1 ? 's' : ''} ──`)
    for (const r of rs) dlog('  ' + decrireRegle(r))
  }

  // ── Scénarios de dégradation (runTurn sur état cloné puis dégradé) ──
  dlog('')
  dlog('═══ SCÉNARIOS DE DÉGRADATION (runTurn sur état cloné puis dégradé) ═══')
  const scen: { nom: string; apply: (s: any) => void }[] = [
    { nom: 'population supprimée', apply: (s) => { delete s.population } },
    { nom: 'population = {}', apply: (s) => { s.population = {} } },
    { nom: 'player.armees supprimé', apply: (s) => { s.players.forEach((p: any) => delete p.armees) } },
    { nom: 'player.villes supprimé', apply: (s) => { s.players.forEach((p: any) => delete p.villes) } },
    { nom: 'ville.batiments supprimé', apply: (s) => { s.players.forEach((p: any) => p.villes.forEach((v: any) => delete v.batiments)) } },
    { nom: 'ville.amenagements supprimé', apply: (s) => { s.players.forEach((p: any) => p.villes.forEach((v: any) => delete v.amenagements)) } },
    { nom: 'ville.autres supprimé', apply: (s) => { s.players.forEach((p: any) => p.villes.forEach((v: any) => delete v.autres)) } },
    { nom: 'ville.taxes supprimé', apply: (s) => { s.players.forEach((p: any) => p.villes.forEach((v: any) => delete v.taxes)) } },
    { nom: 'citesLibres supprimées', apply: (s) => { delete s.citesLibres } },
    { nom: 'cite.population supprimée', apply: (s) => { (s.citesLibres ?? []).forEach((c: any) => delete c.population) } },
    { nom: 'routesCommerce supprimées', apply: (s) => { delete s.routesCommerce } },
    { nom: 'char.traits supprimé (tous J1)', apply: (s) => { (s.population[1] ?? []).forEach((c: any) => delete c.traits) } },
    { nom: 'char.statut supprimé (tous J1)', apply: (s) => { (s.population[1] ?? []).forEach((c: any) => delete c.statut) } },
    { nom: 'char.ageMax supprimé (tous J1)', apply: (s) => { (s.population[1] ?? []).forEach((c: any) => delete c.ageMax) } },
    { nom: 'char.dynastie supprimé (tous J1)', apply: (s) => { (s.population[1] ?? []).forEach((c: any) => delete c.dynastie) } },
    { nom: 'char.metier supprimé (tous J1)', apply: (s) => { (s.population[1] ?? []).forEach((c: any) => delete c.metier) } },
    { nom: 'char.ville supprimée (tous J1)', apply: (s) => { (s.population[1] ?? []).forEach((c: any) => delete c.ville) } },
    { nom: 'char.orientation supprimée (tous J1)', apply: (s) => { (s.population[1] ?? []).forEach((c: any) => delete c.orientation) } },
    { nom: 'char.id supprimé (tous J1)', apply: (s) => { (s.population[1] ?? []).forEach((c: any) => delete c.id) } },
    { nom: 'char.mariage supprimé (tous J1)', apply: (s) => { (s.population[1] ?? []).forEach((c: any) => delete c.mariage) } },
    { nom: 'state.log supprimé', apply: (s) => { delete s.log } },
    { nom: 'state.history supprimé', apply: (s) => { delete s.history } },
    { nom: 'state.rngState supprimé', apply: (s) => { delete s.rngState } },
    { nom: 'player.resources supprimé', apply: (s) => { s.players.forEach((p: any) => delete p.resources) } },
    { nom: 'config supprimée', apply: (s) => { delete s.config } },
    { nom: 'config.cultures = []', apply: (s) => { s.config.cultures = [] } },
    { nom: 'config.genres = []', apply: (s) => { s.config.genres = [] } },
    { nom: 'config.orientations = []', apply: (s) => { s.config.orientations = [] } },
    { nom: 'config.metiers = []', apply: (s) => { s.config.metiers = [] } },
    { nom: 'config.traits = []', apply: (s) => { s.config.traits = [] } },
    { nom: 'config.ressources = []', apply: (s) => { s.config.ressources = [] } },
    { nom: 'config.banquesNoms = []', apply: (s) => { s.config.banquesNoms = [] } },
    { nom: 'config.peuples = []', apply: (s) => { s.config.peuples = [] } },
    { nom: 'config.constructions = []', apply: (s) => { s.config.constructions = [] } },
    { nom: 'config.typesHabitation = []', apply: (s) => { s.config.typesHabitation = [] } },
    { nom: 'config.victoires = []', apply: (s) => { s.config.victoires = [] } },
    { nom: 'player.n décalés (+8)', apply: (s) => { s.players.forEach((p: any) => { p.n = p.n + 8 }) } },
    { nom: 'vassalDe = 99 (suzerain fantôme)', apply: (s) => { s.players[0].vassalDe = 99 } },
    { nom: 'armee.soldats supprimé', apply: (s) => { s.players.forEach((p: any) => (p.armees ?? []).forEach((a: any) => delete a.soldats)) } },
    { nom: 'armee.commandant supprimé', apply: (s) => { s.players.forEach((p: any) => (p.armees ?? []).forEach((a: any) => delete a.commandant)) } },
    { nom: 'armee.nom supprimé', apply: (s) => { s.players.forEach((p: any) => (p.armees ?? []).forEach((a: any) => delete a.nom)) } },
    { nom: 'armee.puissanceCible supprimé', apply: (s) => { s.players.forEach((p: any) => (p.armees ?? []).forEach((a: any) => delete a.puissanceCible)) } },
    { nom: 'player.recap corrompu (=  {})', apply: (s) => { s.players.forEach((p: any) => { p.recap = {} }) } },
  ]
  for (const sc of scen) {
    const s = clone(st)
    try { sc.apply(s) } catch (e: any) { dlog('  (setup scénario échoué)', sc.nom, String(e?.message).slice(0, 80)); continue }
    try { runTurn(s); dlog('  [OK sans erreur] ', sc.nom) }
    catch (e: any) { dlog('  [ÉCHEC runTurn]', sc.nom, '→', String(e?.message ?? e).slice(0, 130)) }
  }

  // ── Mutateurs ArmiesPanel sur états dégradés ─────────────────────────
  dlog('')
  dlog('═══ DISSOLUTION / RENOMMAGE (mutators ArmiesPanel) sur états dégradés ═══')
  const scen2: { nom: string; apply: (s: any) => void }[] = [
    { nom: 'population supprimée', apply: (s) => { delete s.population } },
    { nom: 'player.armees supprimé', apply: (s) => { s.players.forEach((p: any) => delete p.armees) } },
    { nom: 'état sain (témoin)', apply: () => {} },
  ]
  for (const sc of scen2) {
    const s: any = clone(st)
    sc.apply(s)
    try {
      const x: any = s.players.find((q: any) => q.n === 1)
      const idx = 1
      const armee = x.armees[idx]
      const pers = s.population[1] ?? []
      for (const c of pers) { if (c.armee === armee.nom) { c.armee = null; c.metier = C.p.metierChasseur } }
      x.armees.splice(idx, 1)
      const ancien = x.armees[0].nom
      x.armees[0].nom = 'Garde royale'
      for (const c of s.population[1] ?? []) { if (c.armee === ancien) c.armee = 'Garde royale' }
      dlog('  [OK sans erreur] ', sc.nom)
    } catch (e: any) { dlog('  [ÉCHEC mutator]', sc.nom, '→', String(e?.message ?? e).slice(0, 130)) }
  }
} catch (e: any) {
  dlog('FATAL :', String(e?.stack ?? e).slice(0, 2000))
}
console.log(__out.join('\n'))
