exports.handler = async (event, context) => {
  // Set up CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }

  try {
    // Return list of available providers
    const providers = [
      { id: 'claude', name: 'Claude', color: '#8B5CF6', status: 'online' },
      { id: 'gemini', name: 'Gemini', color: '#4285F4', status: 'online' },
      { id: 'groq', name: 'Groq', color: '#FF6B35', status: 'online' },
      { id: 'xai', name: 'XAI', color: '#10B981', status: 'online' }
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(providers)
    };
  } catch (error) {
    console.error('Error in providers function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};
