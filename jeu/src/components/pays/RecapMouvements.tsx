// ══════════════════════════════════════════════════════════════════════
//  RÉCAP DES ÉVOLUTIONS DE POPULATION PAR HABITATION (retour Thibaut
//  2026-11-12 : « il est difficile de suivre les migrations — ajoute
//  en haut de la page des habitations un récapitulatif rapide des
//  évolutions de population : naissances, migrations, etc. »).
//  Bloc en tête de la carte « Villes » (page Pays) : une ligne par
//  habitation du joueur — naissances 👶, décès ⚰️, arrivées ⬅️ et
//  départs ➡️ du DERNIER tour moteur, plus le solde et le total.
//  Source = p.recap.mouvementsVille (engine/shared.ts bumpMouvement),
//  posé par les modules démographiques du tour (naissances, sante,
//  flux de migration). Les arrivées d'AUTRES joueurs y figurent
//  (l'arrivée est créditée au récap du joueur DESTINATAIRE) ; les
//  villes homonymes de deux joueurs sont bien distinctes puisque le
//  récap est PAR JOUEUR. Les actions manuelles (ajouts d'habitants,
//  dons, pertes militaires) restent au 📜 Journal — note de bas de
//  carte.
// ══════════════════════════════════════════════════════════════════════

import type { Player } from '../../engine/types'
import { totauxMouvements } from '../../engine/shared'

/** Cellule de compteur — « — » à 0 pour alléger la lecture. */
function Cpt({ n, plus }: { n: number; plus?: boolean }) {
  if (n === 0) return <span className="muted">—</span>
  return <>{plus ? `+${n}` : n}</>
}

export function RecapMouvements({ p }: { p: Player }) {
  const mouv = p.recap?.mouvementsVille ?? {}
  const tot = p.recap ? totauxMouvements(p.recap) : null
  // Lignes : les villes du joueur dans l'ordre, puis toute ville du
  //  récap qui n'est plus à ce joueur (ville transférée en cours de
  //  tour — son mouvement reste visible, le journal garde l'histoire).
  const nomsVilles = p.villes.map((v) => v.nom)
  const horsJoueur = Object.keys(mouv).filter((v) => !nomsVilles.includes(v)).sort()
  const lignes = [...nomsVilles, ...horsJoueur]
  const aucun = !p.recap || (tot !== null && tot.arrivees + tot.departs + tot.naissances + tot.deces === 0)
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="small" style={{ marginBottom: 6 }}>
        <strong>Évolutions de population du dernier tour</strong>{' '}
        <span className="muted">— naissances, décès, arrivées et départs par habitation</span>
      </div>
      {aucun ? (
        <p className="muted small" style={{ margin: 0 }}>
          {p.recap
            ? 'Aucun mouvement de population au dernier tour.'
            : 'Lancez un tour pour voir les évolutions de population.'}
        </p>
      ) : (
        <table className="ville-table">
          <thead>
            <tr>
              <th>Habitation</th>
              <th className="num" title="Naissances du tour moteur">👶 Naiss.</th>
              <th className="num" title="Décès (maladie) du tour moteur">⚰️ Décès</th>
              <th className="num" title="Habitants arrivés par le flux de migration (y compris d'autres joueurs)">⬅️ Arrivées</th>
              <th className="num" title="Habitants partis vers une autre ville du monde">➡️ Départs</th>
              <th className="num" title="Arrivées + naissances − départs − décès">Solde</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((nom) => {
              const f = mouv[nom]
              const naiss = f?.naissances ?? 0
              const deces = f?.deces ?? 0
              const arr = f?.arrivees ?? 0
              const dep = f?.departs ?? 0
              const solde = naiss + arr - deces - dep
              return (
                <tr key={nom}>
                  <td>{nom}</td>
                  <td className="num"><Cpt n={naiss} plus /></td>
                  <td className="num"><Cpt n={deces} /></td>
                  <td className="num"><Cpt n={arr} plus /></td>
                  <td className="num"><Cpt n={dep} /></td>
                  <td className="num">
                    {solde === 0 ? <span className="muted">—</span>
                      : solde > 0 ? <strong>+{solde}</strong>
                      : <span className="neg">{solde}</span>}
                  </td>
                </tr>
              )
            })}
            <tr className="ligne-total">
              <td><strong>Total</strong></td>
              <td className="num"><strong>{tot ? `+${tot.naissances}` : '—'}</strong></td>
              <td className="num"><strong>{tot ? tot.deces : '—'}</strong></td>
              <td className="num"><strong>{tot ? `+${tot.arrivees}` : '—'}</strong></td>
              <td className="num"><strong>{tot ? tot.departs : '—'}</strong></td>
              <td className="num">
                {tot ? (tot.naissances + tot.arrivees - tot.deces - tot.departs > 0
                  ? <strong>+{tot.naissances + tot.arrivees - tot.deces - tot.departs}</strong>
                  : <strong>{tot.naissances + tot.arrivees - tot.deces - tot.departs}</strong>) : '—'}
              </td>
            </tr>
          </tbody>
        </table>
      )}
      <p className="muted small" style={{ margin: '4px 0 0' }}>
        Mouvements du moteur de fin de tour uniquement — les actions manuelles
        (ajout d'habitants, dons, pertes militaires) restent au 📜 Journal.
      </p>
    </div>
  )
}
