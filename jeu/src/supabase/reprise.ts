// ════════════════════════════════════════════════════════════════════
//  Reprise automatique des appels réseau (m1, arbitrage Thibaut
//  2026-10-27) — module PUR, testé sans réseau (reprise.test.ts).
//
//  CONTRAT : `operation` est tentée jusqu'à 2 fois (une reprise
//  automatique). Un essai échoue soit en LEVANT une exception
//  (timeout du AbortSignal, réseau KO, réponse non-JSON), soit en
//  RÉPONDANT un résultat que `estDefinitif` juge non définitif
//  (échec fonctionnel, ex. ok:false sans dejaPublie). Au 2e échec,
//  l'erreur remonte EXPLICITE — le store la journalise avant le
//  repli local (le joueur n'est jamais bloqué, mais il SAIT ce qui
//  s'est passé).
// ════════════════════════════════════════════════════════════════════

export type ResultatReprise<T> = { ok: true; valeur: T } | { ok: false; erreur: string }

export async function avecReprise<T>(
  operation: () => Promise<T>,
  /** true = réponse définitive : inutile de retenter (succès OU
   *  verdict définitif, ex. dejaPublie = idempotence du tour). */
  estDefinitif: (r: T) => boolean,
  /** Libellé du message d'erreur final (ex. « Résolution serveur »). */
  libelle: string,
): Promise<ResultatReprise<T>> {
  let dernierEchec = 'échec inexpliqué'
  for (let essai = 1; essai <= 2; essai++) {
    try {
      const res = await operation()
      if (estDefinitif(res)) return { ok: true, valeur: res }
      dernierEchec = (res as { error?: string }).error ?? dernierEchec
    } catch (e) {
      dernierEchec = String(e)
    }
  }
  return { ok: false, erreur: `${libelle} en échec après 2 essais — ${dernierEchec}` }
}
