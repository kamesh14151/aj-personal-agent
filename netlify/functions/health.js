exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    providers: {
      groq: !!process.env.GROQ_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
      claude: !!process.env.ANTHROPIC_API_KEY,
      xai: !!process.env.XAI_API_KEY,
    }
  };

  return {
    statusCode: 200,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(health)
  };
};
