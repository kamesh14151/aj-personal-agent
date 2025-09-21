const fetch = require('node-fetch');

// Simple mock responses for when no API keys are available
const getMockResponse = (message) => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! I'm AJ Personal Agent powered by AJ Studioz. How can I help you with your website project today?";
  } else if (lowerMessage.includes('help')) {
    return "I'm here to help you create amazing websites! I can assist with portfolio sites, e-commerce stores, blogs, and SaaS landing pages. What would you like to build?";
  } else if (lowerMessage.includes('thank')) {
    return "You're welcome! Is there anything else I can help you with your website project?";
  } else if (lowerMessage.includes('weather')) {
    return "I don't have access to real-time weather data, but I hope it's nice where you are! Let's focus on building your website.";
  } else if (lowerMessage.includes('time')) {
    return `The current time is ${new Date().toLocaleTimeString()}. Perfect time to work on your website!`;
  } else if (lowerMessage.includes('date')) {
    return `Today's date is ${new Date().toLocaleDateString()}. A great day to launch a new website!`;
  } else if (lowerMessage.includes('portfolio')) {
    return "I can help you create an impressive portfolio website! A good portfolio should include: 1) Hero section with your introduction, 2) About me section, 3) Skills/technologies you master, 4) Projects showcase with descriptions, and 5) Contact section. Would you like me to generate HTML/CSS code for any of these sections?";
  } else if (lowerMessage.includes('ecommerce')) {
    return "For an e-commerce website, you'll need: 1) Product listings with images and prices, 2) Shopping cart functionality, 3) Checkout process, and 4) User accounts. I can help you design a modern, user-friendly interface with these components. What specific help do you need?";
  } else if (lowerMessage.includes('blog')) {
    return "A tech blog should have: 1) Clean layout with article listings, 2) Categories/tags for organization, 3) Search functionality, 4) Comment system, and 5) Social sharing buttons. Dark mode toggle is also a nice addition. Shall I create a blog template for you?";
  } else if (lowerMessage.includes('saas')) {
    return "A SaaS landing page needs: 1) Compelling hero section with value proposition, 2) Features showcase, 3) Pricing plans, 4) Testimonials, and 5) Clear call-to-action. Let me know if you need help with any specific section or want me to generate the complete HTML/CSS code.";
  } else {
    return `I understand you're asking about: "${message}". As your personal website assistant, I can help you create portfolio sites, e-commerce stores, blogs, and SaaS landing pages. For more advanced AI capabilities, please add API keys for services like Claude, Gemini, or Groq in your Vercel environment variables.`;
  }
};

// Provider configurations
const providers = {
  claude: {
    name: 'Claude',
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-sonnet-20240229',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    }),
    formatRequest: (messages, options) => {
      const validMessages = messages.filter(msg => msg.content && msg.content.trim() !== '');
      const lastMessage = validMessages[validMessages.length - 1];
      
      return {
        model: 'claude-3-sonnet-20240229',
        max_tokens: options.length || 1000,
        temperature: options.creativity / 100,
        messages: validMessages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      };
    },
    formatResponse: (data) => ({
      content: data.content[0].text
    })
  },
  gemini: {
    name: 'Gemini',
    apiEndpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`,
    model: 'gemini-pro',
    headers: () => ({
      'Content-Type': 'application/json'
    }),
    formatRequest: (messages, options) => {
      const lastMessage = messages[messages.length - 1];
      
      return {
        contents: [{
          parts: [{
            text: lastMessage.content
          }]
        }],
        generationConfig: {
          maxOutputTokens: options.length || 1000,
          temperature: options.creativity / 100
        }
      };
    },
    formatResponse: (data) => ({
      content: data.candidates[0].content.parts[0].text
    })
  },
  groq: {
    name: 'Groq',
    apiEndpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama3-8b-8192',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }),
    formatRequest: (messages, options) => ({
      model: 'llama3-8b-8192',
      messages: messages,
      max_tokens: options.length || 1000,
      temperature: options.creativity / 100
    }),
    formatResponse: (data) => ({
      content: data.choices[0].message.content
    })
  },
  mock: {
    name: 'Mock AI (Free)',
    model: 'mock',
    headers: () => ({}),
    formatRequest: (messages, options) => ({}),
    formatResponse: (data) => ({}),
    handler: async (messages, options) => {
      const lastMessage = messages.length > 0 ? messages[messages.length - 1].content : 'Hello';
      return { content: getMockResponse(lastMessage) };
    }
  }
};

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

  // Only allow POST requests for chat
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Parse the request body
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    
    const { messages, provider, options } = JSON.parse(body);
    
    // Default to mock provider if invalid provider is specified
    const providerId = providers[provider] ? provider : 'mock';
    const providerConfig = providers[providerId];
    
    // Get API key directly from environment variables
    let apiKey = null;
    if (providerId === 'claude') {
      apiKey = process.env.ANTHROPIC_API_KEY;
    } else if (providerId === 'gemini') {
      apiKey = process.env.GOOGLE_API_KEY;
    } else if (providerId === 'groq') {
      apiKey = process.env.GROQ_API_KEY;
    }
    
    // Check if API key is required and available
    if (providerId !== 'mock' && !apiKey) {
      return res.status(401).json({ 
        error: `API key required for ${providerConfig.name}. Please set the ${providerId.toUpperCase()}_API_KEY environment variable in Vercel.`,
        provider: providerId
      });
    }
    
    // Check if provider has a custom handler (like the mock provider)
    if (providerConfig.handler) {
      const result = await providerConfig.handler(messages, options);
      return res.status(200).json(result);
    }
    
    // Format the request
    const requestBody = providerConfig.formatRequest(messages, options);
    
    // Add API key to endpoint if needed (for Gemini)
    let apiEndpoint = providerConfig.apiEndpoint;
    if (providerId === 'gemini' && apiKey) {
      apiEndpoint += `?key=${apiKey}`;
    }
    
    // Make the API call
    let response;
    try {
      response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: providerConfig.headers(apiKey),
        body: JSON.stringify(requestBody)
      });
    } catch (fetchError) {
      console.error(`Network error with ${providerConfig.name}:`, fetchError);
      return res.status(503).json({ 
        error: `Network error with ${providerConfig.name}`,
        details: fetchError.message,
        provider: providerId
      });
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${providerConfig.name} API error:`, response.status, errorText);
      
      // For 401 errors, provide a helpful message
      if (response.status === 401) {
        return res.status(401).json({ 
          error: `Authentication failed for ${providerConfig.name}. Please check your API key.`,
          details: errorText,
          provider: providerId
        });
      }
      
      return res.status(response.status).json({ 
        error: `${providerConfig.name} API error: ${response.status}`,
        details: errorText,
        provider: providerId
      });
    }
    
    const data = await response.json();
    const formattedResponse = providerConfig.formatResponse(data);
    
    return res.status(200).json(formattedResponse);
    
  } catch (error) {
    console.error('Error in chat function:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};
