import { runMemoryEvaluation } from './memory-evaluation/runner.mjs'

// No key reads, imports of live providers, or network capability in this runner.
globalThis.fetch = () => { throw new Error('Offline memory evaluation forbids all network traffic.') }
const args = process.argv.slice(2)
if (args.some(arg => !['--json', '--review-rows'].includes(arg))) {
  console.error('Use npm run eval:memory -- [--json] [--review-rows]')
  process.exitCode = 1
} else {
  const result = runMemoryEvaluation()
  if (args.includes('--json')) console.log(JSON.stringify(result, null, 2))
  else {
    console.log(result.mode)
    console.log('A:', result.baseline)
    console.log('B:', result.candidate)
    console.log('C:', result.providerComparison)
    console.table(result.rows.map(row => ({ case: row.id,
      'A required': row.expectedIds.length ? row.A.checks.required : 'N/A', 'A scope safe': row.A.checks.scopeSafe,
      'A fact integrity': row.A.checks.factIntegrity, 'A fits B cap': row.A.checks.budget,
      'A records': row.A.ids.length, 'B/C records': row.B.ids.length,
      'B checks': row.B.checks.pass ? 'PASS' : 'FAIL', 'B=C packet': row.identicalBC,
      'B ids': row.B.ids.join(', ') || '(none)' })))
    if (args.includes('--review-rows')) {
      console.table(result.rows.flatMap(row => ['A', 'B', 'C'].map(lane => ({ case: row.id, lane,
        reply: 'UNSCORED - mock capture only', blindedReply: '', latencyMs: 'N/A', tokens: 'N/A', cost: 'N/A', reviewerWouldContinue: 'UNSCORED' }))))
    }
    console.log('Mock outputs are packet-capture receipts, not dialogue. No latency/token/cost/conversion or reviewer-continuation result was measured.')
    console.log('Use --json for captured final serialized packets and selector rejection reasons. No report file or story state is written.')
  }
}
