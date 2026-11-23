import { ModelRequestError } from '../../shared/fetchModelJson'

export type DialogueMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type DialogueRequest = {
  messages: DialogueMessage[]
  signal?: AbortSignal
  temperature: number
  topP: number
  repeatPenalty: number
}

// Only final dialogue and its perspective rewrites use this optional seam.
// No endpoint, credentials, or network implementation is provided here.
export type DialogueTransport = (request: DialogueRequest) => Promise<string>

let configuredTransport: DialogueTransport | undefined

export function configureDialogueTransport(transport?: DialogueTransport) {
  configuredTransport = transport
}

export function getDialogueTransport() {
  return configuredTransport
}

export async function requestInjectedDialogue(transport: DialogueTransport, request: DialogueRequest) {
  request.signal?.throwIfAborted()
  const controller = new AbortController()
  const cancel = () => controller.abort(request.signal?.reason)
  request.signal?.addEventListener('abort', cancel, { once: true })
  const deadline = setTimeout(() => controller.abort(
    new DOMException('The dialogue model took too long to reply.', 'TimeoutError'),
  ), 30_000)
  let onAbort: () => void = () => {}
  const aborted = new Promise<never>((_, reject) => {
    onAbort = () => reject(controller.signal.reason)
    controller.signal.addEventListener('abort', onAbort, { once: true })
  })
  try {
    const text = await Promise.race([
      Promise.resolve().then(() => {
        controller.signal.throwIfAborted()
        return transport({ ...request, signal: controller.signal })
      }),
      aborted,
    ])
    controller.signal.throwIfAborted()
    if (typeof text !== 'string' || !text.trim()) {
      throw new ModelRequestError('The dialogue transport returned an empty or invalid response.')
    }
    return text.trim()
  } catch (error) {
    if (controller.signal.aborted) throw controller.signal.reason
    if (error instanceof ModelRequestError) throw error
    throw new ModelRequestError('The dialogue transport could not complete the request.', undefined, { cause: error })
  } finally {
    clearTimeout(deadline)
    controller.signal.removeEventListener('abort', onAbort)
    request.signal?.removeEventListener('abort', cancel)
  }
}

// Deterministic, in-memory fixture. Exhaustion fails; it never falls back to fetch.
export function createFixtureDialogueTransport(replies: readonly (string | Error)[]): DialogueTransport {
  let next = 0
  return async ({ signal }) => {
    signal?.throwIfAborted()
    const reply = replies[next++]
    if (reply instanceof Error) throw reply
    if (reply === undefined) throw new Error('Dialogue fixture exhausted.')
    return reply
  }
}
