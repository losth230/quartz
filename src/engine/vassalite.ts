// ══════════════════════════════════════════════════════════════════════
//  VASSALITÉ — TRIBUT ENTRE JOUEURS (étape 3bis de FinDeTour)
//  Un vassal reverse une part des revenus d'habitants de sa ville à son suzerain.
//  Portage des macros VBA du classeur Chasse & Pêche 7.19.
//  Découpage SOLID du moteur : un module = une responsabilité de domaine.
// ══════════════════════════════════════════════════════════════════════

import type { GameState } from './types'
import type { Cfg } from './gameData'
import { regimeDef } from './gameData'
import { effetsDogmeCulture } from './dogmes'

//  Chaque vassal reverse une part des revenus de ses habitants (gains
//  d'Or, après taxes) à son suzerain. Les chaînes A→B→C fonctionnent :
//  chacun ne reverse que SES propres revenus, jamais l'argent reçu de ses
//  propres vassaux.
export function transfererTributVassal(
  state: GameState,
  gainsParJoueur: Record<number, Record<string, number>>,
  C: Cfg,
): void {
  for (const p of state.players) {
    if (p.vassalDe == null) continue
    const suzerain = state.players.find((x) => x.n === p.vassalDe)
    if (!suzerain || suzerain.vassalDe === p.n) continue // suzerain disparu ou serment croisé
    const gains = gainsParJoueur[p.n] ?? {}
    const part = (gains['Or'] ?? 0) * C.p.vassalPrelevement
    if (part === 0) continue
    gains['Or'] = (gains['Or'] ?? 0) - part
    // (Refonte « 8 lois » des régimes, 2026-10-29, Monarchie
    //  « Vassaux dévoués ») : le tribut REÇU par un suzerain de ce
    //  régime est multiplié (tributVassalMult, défaut ×1,05).
    //  Arbitrage Thibaut : le vassal paie SA part — la différence
    //  est CRÉÉE pour le suzerain.
    // (Dogme de la Mère Patrie, 2026-10-30 : idem sur la CULTURE du
    //  suzerain — ×(1+v) (effet tributVassal, défaut +5 %), cumulé
    //  au multiplicateur du régime. Symétrique du branchement
    //  d'impotsVassaux (impôt manuel) : les deux chemins du tribut
    //  portent le dogme.)
    const recu = part
      * (regimeDef(suzerain.regime, C.config)?.tributVassalMult ?? 1)
      * (1 + effetsDogmeCulture(state, suzerain.culture, 'tributVassal', C))
    const gainsSuz = gainsParJoueur[suzerain.n] ?? (gainsParJoueur[suzerain.n] = {})
    gainsSuz['Or'] = (gainsSuz['Or'] ?? 0) + recu
    state.log.push({
      turn: state.turn + 1, type: 'Système', joueur: p.n,
      texte: `🤝 Vassalité — ${p.nom} verse ${Math.round(part * 10) / 10} Or à ${suzerain.nom} (tribut de vassalité : ${Math.round(C.p.vassalPrelevement * 100)} % des revenus de ses habitants).`,
    })
  }
}
