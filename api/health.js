module.exports = async (req, res) => {
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
