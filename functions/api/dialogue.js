function jsonResponse(body, status = 200) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        'Content-Type':
          'application/json; charset=UTF-8',
      },
    },
  )
}

function extractOutputText(responseData) {
  if (!Array.isArray(responseData?.output)) {
    return ''
  }

  const textParts = []

  for (const outputItem of responseData.output) {
    if (
      outputItem?.type !== 'message' ||
      !Array.isArray(outputItem.content)
    ) {
      continue
    }

    for (const contentItem of outputItem.content) {
      if (
        contentItem?.type === 'output_text' &&
        typeof contentItem.text === 'string'
      ) {
        textParts.push(
          contentItem.text.trim(),
        )
      }
    }
  }

  return textParts
    .filter(Boolean)
    .join('\n')
    .trim()
}

export async function onRequestPost({
  request,
  env,
}) {
  try {
    if (!env.OPENAI_API_KEY) {
      return jsonResponse(
        {
          error:
            'OPENAI_API_KEY is not configured.',
        },
        500,
      )
    }

    let requestBody

    try {
      requestBody = await request.json()
    } catch {
      return jsonResponse(
        {
          error:
            'The request body must be valid JSON.',
        },
        400,
      )
    }

    const prompt =
      typeof requestBody?.prompt === 'string'
        ? requestBody.prompt.trim()
        : ''

    if (!prompt) {
      return jsonResponse(
        {
          error:
            'A dialogue prompt is required.',
        },
        400,
      )
    }

    if (prompt.length > 30000) {
      return jsonResponse(
        {
          error:
            'The dialogue prompt is too large.',
        },
        413,
      )
    }

    const openAIResponse = await fetch(
      'https://api.openai.com/v1/responses',
      {
        method: 'POST',

        headers: {
          Authorization:
            `Bearer ${env.OPENAI_API_KEY}`,

          'Content-Type':
            'application/json',
        },

        body: JSON.stringify({
          model: 'gpt-5.6-luna',

          reasoning: {
            effort: 'none',
          },

          input: prompt,

          max_output_tokens: 450,
        }),
      },
    )

    const openAIData =
      await openAIResponse.json()

    if (!openAIResponse.ok) {
      console.error(
        'OpenAI dialogue request failed:',
        {
          status: openAIResponse.status,
          error: openAIData?.error,
        },
      )

      return jsonResponse(
        {
          error:
            openAIData?.error?.message ??
            'The dialogue model could not generate a reply.',
        },
        502,
      )
    }

    const outputText =
      extractOutputText(openAIData)

    if (!outputText) {
      console.error(
        'OpenAI returned no dialogue text:',
        {
          status: openAIData?.status,
          incompleteDetails:
            openAIData?.incomplete_details,
        },
      )

      return jsonResponse(
        {
          error:
            'The dialogue model returned no text.',
        },
        502,
      )
    }

    return jsonResponse({
      text: outputText,
    })
  } catch (error) {
    console.error(
      'Dialogue function failed:',
      error,
    )

    return jsonResponse(
      {
        error:
          'An unexpected dialogue error occurred.',
      },
      500,
    )
  }
}

export function onRequest() {
  return jsonResponse(
    {
      error:
        'Only POST requests are supported.',
    },
    405,
  )
}