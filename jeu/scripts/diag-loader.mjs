// Loader Node pour le diagnostic (scripts/diag.ts) :
//  - resolve (SYNC) : ajoute .ts/.tsx/.json aux imports SANS extension
//    (le moteur importe './types', './rng'… et le référentiel
//    './referentiels.json' — ESM exige sinon des extensions) ;
//  - load : les .json sont servis comme modules ES (export default),
//    sans attribut d'import — même rôle que tsx pour les tests.
// Utilisé par .github/workflows/diag.yaml :
//   node --experimental-strip-types --import ./scripts/diag-loader.mjs scripts/diag.ts
import { registerHooks } from 'node:module'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context)
    } catch (err) {
      if (specifier.startsWith('.') || specifier.startsWith('/')) {
        for (const ext of ['.ts', '.tsx', '.json']) {
          try { return nextResolve(specifier + ext, context) } catch { /* essai suivant */ }
        }
      }
      throw err
    }
  },
  load(url, context, nextLoad) {
    if (url.endsWith('.json')) {
      const data = readFileSync(fileURLToPath(url), 'utf8')
      return { format: 'module', shortCircuit: true, source: 'export default ' + data }
    }
    return nextLoad(url, context)
  },
})
