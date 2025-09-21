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

  // Only allow GET requests for debug
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Check environment variables for API keys (masked for security)
  const debugInfo = {
    anthropic: {
      configured: !!process.env.ANTHROPIC_API_KEY,
      keyPreview: process.env.ANTHROPIC_API_KEY ? 
        `${process.env.ANTHROPIC_API_KEY.substring(0, 8)}...${process.env.ANTHROPIC_API_KEY.substring(process.env.ANTHROPIC_API_KEY.length - 4)}` : 
        null
    },
    google: {
      configured: !!process.env.GOOGLE_API_KEY,
      keyPreview: process.env.GOOGLE_API_KEY ? 
        `${process.env.GOOGLE_API_KEY.substring(0, 8)}...${process.env.GOOGLE_API_KEY.substring(process.env.GOOGLE_API_KEY.length - 4)}` : 
        null
    },
    groq: {
      configured: !!process.env.GROQ_API_KEY,
      keyPreview: process.env.GROQ_API_KEY ? 
        `${process.env.GROQ_API_KEY.substring(0, 8)}...${process.env.GROQ_API_KEY.substring(process.env.GROQ_API_KEY.length - 4)}` : 
        null
    },
    envVars: process.env
  };

  return res.status(200).json(debugInfo);
};
