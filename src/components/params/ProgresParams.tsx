// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — extrait de ConfigTables.tsx.
//  Table « Arbres de progrès » : éditeur des arbres par âge (branches
//  A/B + tech C optionnelle) avec l'éditeur d'effets d'aide de jeu
//  (EffetsTechEditor — aucun effet moteur, tout s'applique au plateau).
// ══════════════════════════════════════════════════════════════════════

import { Card, TextInput, NumberInput, Button } from '../ui'
import type { TableProps } from './logiqueParams'
import { EffetsTechEditor } from './EditeursEffets'

export function ProgresParams({ config, setCfg }: TableProps) {
  return (
    <Card title={`Arbres de progrès (${config.progres.length})`}>
      <p className="muted small">
        Tech 2 exige la tech 1 de sa branche ; tech C exige les 2 techs d'une même branche ;
        arbre terminé à 3 technologies ; 3 arbres de l'âge N-1 ouvrent l'âge N. Coût en
        Science débité au déblocage ; effets à appliquer au plateau.
      </p>
      {[1, 2, 3].map((age) => (
        <div key={age} className="mb">
          <h4>Âge {age}</h4>
          {config.progres.every((a) => a.age !== age) && (
            <p className="muted small">Aucun arbre à cet âge.</p>
          )}
          {config.progres.map((arbre, i) => arbre.age !== age ? null : (
            <div key={i} className="mini mb">
              <div className="row">
                <TextInput value={arbre.nom} onChange={(v) => setCfg((c) => { c.progres[i].nom = v })} />
                <NumberInput value={arbre.age} step={1} min={1} max={3} onChange={(v) => setCfg((c) => { c.progres[i].age = v })} />
                <TextInput value={arbre.tags ?? ''} placeholder="Tags (ex. C, PV, Aurore N)" onChange={(v) => setCfg((c) => { c.progres[i].tags = v })} />
                <Button tone="danger" onClick={() => setCfg((c) => { c.progres.splice(i, 1) })}>Supprimer l'arbre</Button>
              </div>
              <div className="table-wrap">
                <table className="tbl small">
                  <thead><tr><th>Emplacement</th><th>Technologie</th><th>Coût (Science)</th><th>Description (effet)</th><th>Effets (aide de jeu — au plateau)</th></tr></thead>
                  <tbody>
                    {([['A.1', 'brancheA', 0], ['A.2', 'brancheA', 1], ['B.1', 'brancheB', 0], ['B.2', 'brancheB', 1]] as [string, 'brancheA' | 'brancheB', number][]).map(([label, br, idx]) => (
                      <tr key={label}>
                        <td>{label}</td>
                        <td><TextInput value={arbre[br][idx]?.nom ?? ''} onChange={(v) => setCfg((c) => { c.progres[i][br][idx].nom = v })} /></td>
                        <td><TextInput value={arbre[br][idx]?.cout ?? ''} onChange={(v) => setCfg((c) => { c.progres[i][br][idx].cout = v })} /></td>
                        <td><TextInput value={arbre[br][idx]?.description ?? ''} onChange={(v) => setCfg((c) => { c.progres[i][br][idx].description = v })} /></td>
                        <td>
                          <EffetsTechEditor
                            tech={arbre[br][idx]}
                            ressources={config.ressources}
                            metiers={config.metiers.map((t) => t.metier)}
                            set={(fn) => setCfg((c) => {
                              const t = c.progres[i][br][idx]
                              if (!t) return
                              if (!t.effets) t.effets = []
                              fn(t.effets)
                            })}
                          />
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td>C (optionnelle)</td>
                      <td><TextInput value={arbre.techC?.nom ?? ''} onChange={(v) => setCfg((c) => { c.progres[i].techC.nom = v })} /></td>
                      <td><TextInput value={arbre.techC?.cout ?? ''} onChange={(v) => setCfg((c) => { c.progres[i].techC.cout = v })} /></td>
                      <td><TextInput value={arbre.techC?.description ?? ''} onChange={(v) => setCfg((c) => { c.progres[i].techC.description = v })} /></td>
                      <td>
                        <EffetsTechEditor
                          tech={arbre.techC}
                          ressources={config.ressources}
                          metiers={config.metiers.map((t) => t.metier)}
                          set={(fn) => setCfg((c) => {
                            const t = c.progres[i].techC
                            if (!t) return
                            if (!t.effets) t.effets = []
                            fn(t.effets)
                          })}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ))}
      <Button onClick={() => setCfg((c) => {
        c.progres.push({
          nom: 'Nouvel arbre de progrès', age: 1, tags: '',
          brancheA: [{ nom: '', cout: '', description: '' }, { nom: '', cout: '', description: '' }],
          brancheB: [{ nom: '', cout: '', description: '' }, { nom: '', cout: '', description: '' }],
          techC: { nom: '', cout: '', description: '' },
        })
      })}>+ Ajouter un arbre de progrès</Button>
    </Card>
  )
}
