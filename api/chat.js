export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, model = 'llama-3.3-70b-versatile' } = req.body;

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages are required and must be an array' });
    }

    // Validate message roles
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      if (!message.role || !['system', 'user', 'assistant'].includes(message.role)) {
        return res.status(400).json({ 
          error: `Invalid role at messages[${i}]: '${message.role}'. Role must be one of: system, user, assistant` 
        });
      }
      if (!message.content || typeof message.content !== 'string') {
        return res.status(400).json({ 
          error: `Invalid content at messages[${i}]: Content must be a non-empty string` 
        });
      }
    }

    // Get API key from environment variables
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Prepare request to Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ 
        error: errorData.error?.message || 'API request failed' 
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in chat API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
