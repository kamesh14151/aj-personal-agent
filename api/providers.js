module.exports = async (req, res) => {
  // Only allow GET requests for providers
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Check environment variables for API keys
  const providers = [
    {
      id: 'mock',
      name: 'Mock AI (Free)',
      status: 'online',
      configured: true
    },
    {
      id: 'claude',
      name: 'Claude',
      status: process.env.ANTHROPIC_API_KEY ? 'online' : 'offline',
      configured: !!process.env.ANTHROPIC_API_KEY
    },
    {
      id: 'gemini',
      name: 'Gemini',
      status: process.env.GOOGLE_API_KEY ? 'online' : 'offline',
      configured: !!process.env.GOOGLE_API_KEY
    },
    {
      id: 'groq',
      name: 'Groq',
      status: process.env.GROQ_API_KEY ? 'online' : 'offline',
      configured: !!process.env.GROQ_API_KEY
    }
  ];

  return res.status(200).json(providers);
};
