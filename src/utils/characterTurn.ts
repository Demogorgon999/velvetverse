const statePrefixes = [
  'velvetverse-memory',
  'velvetverse-mood',
  'velvetverse-life',
  'velvetverse-presence',
  'velvetverse-relationship',
]

// The existing engines persist state during generation. Restore their state
// when a turn fails, so retrying does not apply the same interaction twice.
export function beginCharacterTurn(
  characterId: number,
  storage: Storage,
  timeoutMs = 60_000,
) {
  const snapshot = statePrefixes.map(prefix => {
    const key = `${prefix}-${characterId}`
    return { key, value: storage.getItem(key) }
  })
  const controller = new AbortController()
  let settled = false

  const deadline = setTimeout(() => {
    controller.abort(new DOMException('The reply took too long.', 'TimeoutError'))
  }, timeoutMs)

  function rollback() {
    if (settled) return
    settled = true
    clearTimeout(deadline)
    for (const { key, value } of snapshot) {
      if (value === null) storage.removeItem(key)
      else storage.setItem(key, value)
    }
  }

  return {
    signal: controller.signal,
    rollback,
    commit() {
      controller.signal.throwIfAborted()
      settled = true
      clearTimeout(deadline)
    },
    cancel() {
      if (settled) return
      controller.abort(new DOMException('The conversation changed.', 'AbortError'))
      rollback()
    },
  }
}
