// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — extrait de RoyaumeView.tsx.
//  Carte « 🏰 Royaume de X » : culture du pays (celle de la capitale),
//  régime politique (loi chiffrée appliquée automatiquement à chaque
//  fin de tour), rang de pays avec SACRE (Or + Nourriture + serments).
//  (Le mini « Événement de dynastie » a été retiré le 2026-10-24 avec
//  les cartes dynastie, retour arbitre Thibaut.)
// ══════════════════════════════════════════════════════════════════════

import type { GameState, Player } from '../../engine/types'
import type { Cfg } from '../../engine/gameData'
import { cultureDef } from '../../engine/gameData'
import { rangParDefaut } from '../../engine/setup'
import { sermentsPossedes } from '../../engine/tour'
import { Card, Select, Button, Badge } from '../ui'

export function CarteRoyaume({ state, p, C, joueur, setPlayer, update }: {
  state: GameState
  p: Player
  C: Cfg
  joueur: number
  setPlayer: (fn: (p: Player) => void) => void
  update: (fn: (s: GameState) => void) => void
}) {
  const cult = cultureDef(p.culture, C.config)
  const regimeDef = C.regimes.find((r) => r.nom === p.regime)
  const rangs = C.config.paysRangs ?? []
  const rangActuel = rangs.some((r) => r.nom === p.rang)
    ? (p.rang as string)
    : rangParDefaut(p.regime, C)
  const rangDef = rangs.find((r) => r.nom === rangActuel)
  // Lois chiffrées du régime (lues automatiquement par le moteur,
  // refonte « 8 lois » des régimes, 2026-10-29) ?
  const loiChiffree = (regimeDef?.leveeOrParRangPays ?? 0) !== 0
    || (regimeDef?.departHabitantsMult ?? 1) !== 1
    || (regimeDef?.orParMigrant ?? 0) !== 0
    || (regimeDef?.consoNourrBourgeoisRegime ?? 0) !== 0
    || (regimeDef?.consoNourrNobleRegime ?? 0) !== 0
    || (regimeDef?.bonheurParHabitation ?? 0) !== 0
    || (regimeDef?.tributVassalMult ?? 1) !== 1

  return (
    <Card title={`🏰 Royaume de ${p.nom}`}>
      <div className="grid-2">
        <div className="mini">
          <div className="mini-title">Culture du pays (capitale)</div>
          <div><strong>{p.culture}</strong></div>
          {cult && (
            <>
              <div className="muted small">
                Hérédité {String(cult.heredite).toLowerCase()} ·
                mariage homosexuel {cult.homoAutorisee ? 'autorisé' : 'interdit'}
              </div>
              {cult.regleVille && <div className="small muted">Loi de ville : {cult.regleVille}</div>}
              {cult.regleHabitant && <div className="small muted">Loi d'habitant : {cult.regleHabitant}</div>}
              <div className="muted small">
                Ce que fait la culture : l'hérédité conditionne l'accès aux métiers
                héréditaires ; la fécondité influe sur les
                naissances ; les mariages homosexuels (si autorisés) permettent des
                unions de même sexe (sans conception) ; les lois de ville (culture
                majoritaire de la cité) et les lois d'habitant (culture propre de
                chacun, refonte « 12 lois » 2026-10-29) sont appliquées
                automatiquement par le moteur à chaque fin de tour.
              </div>
            </>
          )}
        </div>
        <div className="mini">
          <div className="mini-title">Régime politique</div>
          <div><strong>{p.regime}</strong></div>
          {regimeDef && (
            <>
              <div className="muted small">Loi : {regimeDef.loi}</div>
              {loiChiffree && (
                <div className="small">
                  <Badge tone="good">lois chiffrées appliquées automatiquement</Badge>{' '}
                  <span className="muted small">
                    (lues par le moteur là où elles agissent — refonte « 8 lois »)
                  </span>
                </div>
              )}
            </>
          )}
        </div>
        <div className="mini">
          <div className="mini-title">Rang de pays</div>
          <Select
            value={rangActuel}
            options={rangs.map((r) => ({ value: r.nom, label: r.nom }))}
            onChange={(v) => setPlayer((x) => { x.rang = v })}
          />
          <div className="muted small">
            Correction manuelle (arbitre) — pour une montée réglée, utilisez le sacre.
          </div>
          {rangDef && (
            <div className="muted small">
              {rangDef.bonus ? <>Bonus : {rangDef.bonus}</> : null}
            </div>
          )}
          {(() => {
            const idxRang = rangs.findIndex((r) => r.nom === rangActuel)
            const next = rangs[idxRang + 1]
            if (!next) {
              return <div className="muted small">Rang maximal de l'échelle atteint.</div>
            }
            const nbSer = sermentsPossedes(state, p)
            const orDispo = p.resources['Or']?.stock ?? 0
            const nourrDispo = p.resources['Nourriture']?.stock ?? 0
            const okSer = nbSer >= (next.serments ?? 0)
            const orSacre = next.coutOr ?? 0
            const nourrSacre = next.coutNourriture ?? 0
            const okOr = orDispo >= orSacre
            const okN = nourrDispo >= nourrSacre
            return (
              <div style={{ marginTop: 8 }}>
                <div className="muted small">
                  Prochain rang : <strong>{next.nom}</strong> — sacre {orSacre} Or + {nourrSacre} Nourriture ·
                  {' '}{next.serments} serment(s) requis (vous en possédez {nbSer}).
                </div>
                {!okSer && (
                  <div className="muted small">
                    ⚠ Un serment = un vassal ou une cité libre sous votre suzeraineté.
                  </div>
                )}
                <Button
                  disabled={!okSer || !okOr || !okN}
                  onClick={() => update((s) => {
                    const t = s.players.find((x) => x.n === joueur)
                    if (!t) return
                    const or = t.resources['Or']
                    if (or) or.stock -= orSacre
                    const nourr = t.resources['Nourriture']
                    if (nourr) nourr.stock -= nourrSacre
                    t.rang = next.nom
                    s.log.push({
                      turn: s.turn, type: 'Système', joueur: t.n,
                      texte: `👑 Sacre : ${t.nom} devient ${next.nom} (sacre payé : ${orSacre} Or + ${nourrSacre} Nourriture).`,
                    })
                  })}
                >
                  ⬆ Sacre : devenir {next.nom}
                </Button>
                {(!okOr || !okN) && (
                  <div className="muted small">
                    Trésor insuffisant ({orDispo} Or, {nourrDispo} Nourriture).
                  </div>
                )}
              </div>
            )
          })()}
        </div>
        {/* Mini « Événement de dynastie » RETIRÉ le 2026-10-24 (retour
            arbitre Thibaut) : plus de carte tirée à chaque tour — les
            tables events/dynasties ont disparu du référentiel ; le
            champ Player.dynastie est conservé optionnel dans les types
            pour les vieilles sauvegardes. */}
      </div>
    </Card>
  )
}
