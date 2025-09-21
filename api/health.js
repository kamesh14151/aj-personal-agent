module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests for health check
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Check environment variables for API keys
  const providers = {
    claude: {
      name: 'Claude',
      configured: !!process.env.ANTHROPIC_API_KEY
    },
    gemini: {
      name: 'Gemini',
      configured: !!process.env.GOOGLE_API_KEY
    },
    groq: {
      name: 'Groq',
      configured: !!process.env.GROQ_API_KEY
    },
    mock: {
      name: 'Mock AI (Free)',
      configured: true
    }
  };

  return res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    providers: providers
  });
};
