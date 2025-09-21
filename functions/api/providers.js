exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const providers = [
      { id: 'groq', name: 'Groq', status: await testProvider('groq', process.env.GROQ_API_KEY) },
      { id: 'gemini', name: 'Gemini', status: await testProvider('gemini', process.env.GEMINI_API_KEY) },
      { id: 'claude', name: 'Claude', status: await testProvider('claude', process.env.ANTHROPIC_API_KEY) },
      { id: 'xai', name: 'xAI', status: await testProvider('xai', process.env.XAI_API_KEY) },
    ];

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(providers)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// [Include testProvider function]
