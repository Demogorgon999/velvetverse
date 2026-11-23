import { Worker } from 'node:worker_threads'
import { GateError } from './gate.mjs'
const bytes = value => new TextEncoder().encode(typeof value === 'string' ? value : JSON.stringify(value)).byteLength

export function validateFictionalInput(input) {
  if (!input || Object.keys(input).some(key => !['spoken', 'visibleAction', 'privateThought', 'shareObserved'].includes(key)) ||
    input.shareObserved !== true || !['spoken', 'visibleAction', 'privateThought'].every(key => typeof input[key] === 'string' && input[key].length <= 2000) ||
    !(input.spoken.trim() || input.visibleAction.trim() || input.privateThought.trim())) throw new GateError('explicit_fictional_observed_channels_required', 400)
  return input
}
export async function fakeFinalTransport(packet) {
  return { text: 'The character considers the scene. "[MOCK] The fictional moment can continue."',
    usage: { inputUnits: bytes(packet), outputUnits: bytes('The character considers the scene. "[MOCK] The fictional moment can continue."') } }
}

export function runIsolatedRoleplay({ scope, input, save, signal, guestMemoryCore }, policy, fakeTransport = fakeFinalTransport) {
  validateFictionalInput(input)
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./worker.mjs', import.meta.url), { workerData: { scope, input, save, ...(guestMemoryCore?{guestMemoryCore}:{}) } })
    let dispatched = false, settled = false, capture = null, usageKnown = false, usage = { inputUnits: 0, outputUnits: 0 }, measurement
    const finish = (error, result) => {
      if (settled) return
      settled = true; signal.removeEventListener('abort', abort); void worker.terminate()
      if (error) { if (!dispatched) error.knownNoDispatch = true; else if (usageKnown) error.knownUsage = usage; if (measurement) error.measurement = measurement; reject(error) } else resolve(result)
    }
    const abort = () => finish(new GateError(dispatched ? 'ambiguous_worker_timeout_held' : 'worker_cancelled_before_dispatch', 504))
    signal.addEventListener('abort', abort, { once: true })
    if (signal.aborted) { abort(); return }
    worker.on('message', async message => {
      if (settled) return
      if (message.kind === 'dispatch') {
        if (dispatched || bytes(message.packet) > policy.maxInputBytes) { finish(new GateError('invalid_final_dispatch', 502)); return }
        dispatched = true; capture = JSON.stringify(message.packet)
        try {
          const result = await fakeTransport(message.packet, signal)
          if (settled || signal.aborted) return
          if (typeof result.text !== 'string' || bytes(result.text) > policy.maxOutputBytes) throw new Error('Oversized fake response')
          usage = result.usage; usageKnown = true
          measurement = result.measurement
          worker.postMessage({ kind: 'fake-result', text: result.text })
        } catch (error) {
          const safe = new GateError('final_transport_failure_no_retry', 502)
          if (error?.knownUsage) { usage = error.knownUsage; usageKnown = true }
          if (error?.measurement) measurement = error.measurement
          if (error?.knownNoDispatch === true) safe.knownNoDispatch = true
          finish(safe)
        }
      } else if (message.kind === 'done') {
        if (bytes(message.reply) > policy.maxOutputBytes) { finish(new GateError('oversized_reply', 502)); return }
        const next = { ...save, state: message.state, transcript: [...save.transcript,
          { spoken: input.spoken, visibleAction: input.visibleAction, privateThought: input.privateThought, reply: message.reply }].slice(-40) }
        if (bytes(next) > 262144) { finish(new GateError('save_bound_exceeded', 502)); return }
        finish(null, { reply: message.reply, usage, capture, measurement, engineReceipt: message.engineReceipt, save: next })
      } else finish(new GateError('isolated_engine_failure', 502))
    })
    worker.on('error', () => finish(new GateError('worker_failed', 502)))
    worker.on('exit', code => { if (!settled) finish(new GateError('worker_exited_' + code, 502)) })
  })
}
