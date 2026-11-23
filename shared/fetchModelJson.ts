export class ModelRequestError extends Error {
  status?: number

  constructor(message: string, status?: number, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ModelRequestError'
    this.status = status
  }
}

// Keep the deadline active until the response body has also been read.
// Race the abort so an unresponsive transport cannot keep the caller waiting.
export async function fetchModelJson(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 30_000,
): Promise<unknown> {
  init.signal?.throwIfAborted()

  const controller = new AbortController()
  const cancel = () => controller.abort(init.signal?.reason)
  init.signal?.addEventListener('abort', cancel, { once: true })

  const deadline = setTimeout(() => {
    controller.abort(new DOMException('The model took too long to reply.', 'TimeoutError'))
  }, timeoutMs)

  let onAbort: () => void = () => {}
  const aborted = new Promise<never>((_, reject) => {
    onAbort = () => reject(controller.signal.reason)
    controller.signal.addEventListener('abort', onAbort, { once: true })
  })

  try {
    return await Promise.race([
      (async () => {
        const response = await fetch(input, { ...init, signal: controller.signal })
        controller.signal.throwIfAborted()

        if (!response.ok) {
          throw new ModelRequestError(`The model request failed (${response.status}).`, response.status)
        }

        const data: unknown = await response.json()
        controller.signal.throwIfAborted()
        return data
      })(),
      aborted,
    ])
  } catch (error) {
    if (controller.signal.aborted) throw controller.signal.reason
    if (error instanceof ModelRequestError) throw error
    throw new ModelRequestError('The model could not complete the request.', undefined, { cause: error })
  } finally {
    clearTimeout(deadline)
    controller.signal.removeEventListener('abort', onAbort)
    init.signal?.removeEventListener('abort', cancel)
  }
}
