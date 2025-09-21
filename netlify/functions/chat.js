exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { messages, provider, options = {} } = JSON.parse(event.body);
    
    if (!messages || !provider) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    let response;
    switch (provider) {
      case 'groq':
        response = await callGroqAPI(messages, options, process.env.GROQ_API_KEY);
        break;
      case 'gemini':
        response = await callGeminiAPI(messages, options, process.env.GEMINI_API_KEY);
        break;
      case 'claude':
        response = await callClaudeAPI(messages, options, process.env.ANTHROPIC_API_KEY);
        break;
      case 'xai':
        response = await callXaiAPI(messages, options, process.env.XAI_API_KEY);
        break;
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Unsupported provider' })
        };
    }

    if (options.streaming) {
      return handleStreamingResponse(response, headers);
    } else {
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(response)
      };
    }

  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// [Include all the API helper functions from previous implementation]
