import { runStressEvaluation } from './memory-evaluation/stress.mjs'
globalThis.fetch = () => { throw new Error('Offline stress run forbids network.') }
try {
  const result = runStressEvaluation()
  if (process.argv.slice(2).includes('--json')) console.log(JSON.stringify(result, null, 2))
  else {
    console.log(result.mode)
    console.table(result.rows.map(({ id, status, selectedIds, baselineIds, perturbations }) => ({
      case: id, status, B: selectedIds?.join(', ') || '(none/blocked)', A: baselineIds?.join(', ') || 'N/A', shuffledRuns: perturbations,
    })))
    console.log(`PASS=${result.passed}; EXPECTED_BLOCK=${result.expectedBlocked}; FAIL=${result.failures}; simulated sequence packets=${result.simulatedSequence.length}`)
    console.log('No browser/model quality, latency, tokens, cost or conversion measured. Baseline IDs are observations, not pass requirements.')
  }
} catch (error) {
  console.error('OFFLINE STRESS FAILURE:', error.message)
  process.exitCode = 1
}
