import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

// Two fresh, bounded processes running the same CLI behind npm run eval:memory.
const entry = fileURLToPath(new URL('./run-memory-evaluation.mjs', import.meta.url))
const runs = Array.from({ length: 2 }, () => {
  const child = spawnSync(process.execPath, [entry, '--json'], { encoding: 'utf8', timeout: 20_000, maxBuffer: 2_000_000 })
  assert.equal(child.status, 0, 'Offline memory runner did not complete successfully.')
  return JSON.parse(child.stdout)
})
assert.equal(runs[0].rows.length, 8)
const rows = runs[0].rows.map(first => {
  const second = runs[1].rows.find(row => row.id === first.id)
  assert.ok(second)
  const normalized = JSON.stringify(first.packets)
  assert.equal(JSON.stringify(second.packets), normalized, `Packets differ: ${first.id}`)
  return { case: first.id, packetSetsMatch: true, sha256: createHash('sha256').update(normalized).digest('hex') }
})
console.table(rows)
console.log('Runs=2; cases/run=8; identical A/B/C packet sets=8; failures=0. No model or browser quality tested.')
