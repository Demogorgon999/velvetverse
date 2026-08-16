type OllamaChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type OllamaChatResponse = {
  message?: {
    role?: string
    content?: string
  }
}

export async function sendOllamaMessage(
  messages: OllamaChatMessage[],
): Promise<string> {
  const response = await fetch(
    '/ollama/api/chat',
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',
      },

      body: JSON.stringify({
        model: 'llama3:8b',

        messages,

        stream: false,
      }),
    },
  )

  if (!response.ok) {
    throw new Error(
      `Ollama request failed: ${response.status}`,
    )
  }

  const data =
    (await response.json()) as
      OllamaChatResponse

  const content =
    data.message?.content?.trim()

  if (!content) {
    throw new Error(
      'Ollama returned an empty response.',
    )
  }

  return content
}