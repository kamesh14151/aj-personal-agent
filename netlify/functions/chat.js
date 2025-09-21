const fetch = require('node-fetch');

// Simple mock responses for when no API keys are available
const getMockResponse = (message) => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! I'm a simple AI assistant. How can I help you today?";
  } else if (lowerMessage.includes('help')) {
    return "I'm here to help! Please let me know what you need assistance with.";
  } else if (lowerMessage.includes('thank')) {
    return "You're welcome! Is there anything else I can help with?";
  } else if (lowerMessage.includes('weather')) {
    return "I don't have access to real-time weather data, but I hope it's nice where you are!";
  } else if (lowerMessage.includes('time')) {
    return `The current time is ${new Date().toLocaleTimeString()}.`;
  } else if (lowerMessage.includes('date')) {
    return `Today's date is ${new Date().toLocaleDateString()}.`;
  } else if (lowerMessage.includes('portfolio')) {
    return "I can help you create a portfolio website! A good portfolio should include a hero section, about me, skills, projects, and contact sections. Would you like me to elaborate on any of these?";
  } else if (lowerMessage.includes('ecommerce')) {
    return "For an e-commerce website, you'll need product listings, shopping cart functionality, and a checkout process. I can help you design a modern, user-friendly interface.";
  } else if (lowerMessage.includes('blog')) {
    return "A tech blog should have a clean layout with article listings, categories, and search functionality. Dark mode toggle and social sharing are nice additions too.";
  } else if (lowerMessage.includes('saas')) {
    return "A SaaS landing page needs a compelling hero section, features showcase, pricing plans, testimonials, and a clear call-to-action. Let me know if you need help with any specific section.";
  } else {
    return `I understand you're asking about: "${message}". This is a simple response. For more advanced AI capabilities, please add API keys for services like Claude, Gemini, or Groq in your Netlify environment variables.`;
  }
};

// Provider configurations
const providers = {
  claude: {
    name: 'Claude',
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-sonnet-4-20250514',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    }),
    formatRequest: (messages, options) => {
      const validMessages = messages.filter(msg => msg.content && msg.content.trim() !== '');
      
      return {
        model: 'claude-sonnet-4-20250514',
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
    apiEndpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_API_KEY}`,
    apiKey: process.env.GOOGLE_API_KEY,
    model: 'gemini-pro',
    headers: () => ({
      'Content-Type': 'application/json'
    }),
    formatRequest: (messages, options) => {
      const geminiMessages = [];
      
      for (const msg of messages) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          geminiMessages.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          });
        }
      }
      
      return {
        contents: geminiMessages,
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
    apiKey: process.env.GROQ_API_KEY,
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
  xai: {
    name: 'XAI',
    apiEndpoint: 'https://api.x.ai/v1/chat/completions',
    apiKey: process.env.XAI_API_KEY,
    model: 'grok-beta',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }),
    formatRequest: (messages, options) => ({
      model: 'grok-beta',
      messages: messages,
      max_tokens: options.length || 1000,
      temperature: options.creativity / 100
    }),
    formatResponse: (data) => ({
      content: data.choices[0].message.content
    })
  },
  zai: {
    name: 'Z.AI',
    apiEndpoint: 'https://api.z.ai/v1/chat/completions',
    apiKey: process.env.ZAI_API_KEY,
    model: 'zai-chat',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }),
    formatRequest: (messages, options) => ({
      model: 'zai-chat',
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
    apiKey: null,
    model: 'mock',
    headers: () => ({}),
    formatRequest: (messages, options) => ({}),
    formatResponse: (data) => ({}),
    handler: async (messages, options) => {
      const lastMessage = messages.length > 0 ? messages[messages.length - 1].content : '';
      return { content: getMockResponse(lastMessage) };
    }
  }
};

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { messages, provider, options } = JSON.parse(event.body);
    
    // Default to mock provider if invalid provider is specified
    const providerId = providers[provider] ? provider : 'mock';
    const providerConfig = providers[providerId];
    
    // Check if API key is required and available
    if (providerConfig.apiKey && !providerConfig.apiKey && providerId !== 'mock') {
      return { 
        statusCode: 401, 
        body: JSON.stringify({ 
          error: `API key required for ${providerConfig.name}. Please set the environment variable.` 
        }) 
      };
    }
    
    // Check if provider has a custom handler (like the mock provider)
    if (providerConfig.handler) {
      const result = await providerConfig.handler(messages, options);
      return {
        statusCode: 200,
        body: JSON.stringify(result)
      };
    }
    
    // Format the request
    const requestBody = providerConfig.formatRequest(messages, options);
    
    // Make the API call
    let response;
    try {
      response = await fetch(providerConfig.apiEndpoint, {
        method: 'POST',
        headers: providerConfig.headers(providerConfig.apiKey),
        body: JSON.stringify(requestBody)
      });
    } catch (fetchError) {
      console.error(`Network error with ${providerConfig.name}:`, fetchError);
      return { 
        statusCode: 503, 
        body: JSON.stringify({ 
          error: `Network error with ${providerConfig.name}`,
          details: fetchError.message 
        }) 
      };
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${providerConfig.name} API error:`, response.status, errorText);
      
      // For 401 errors, provide a helpful message
      if (response.status === 401) {
        return { 
          statusCode: 401, 
          body: JSON.stringify({ 
            error: `Authentication failed for ${providerConfig.name}. Please check your API key.`,
            details: errorText
          }) 
        };
      }
      
      return { 
        statusCode: response.status, 
        body: JSON.stringify({ 
          error: `${providerConfig.name} API error: ${response.status}`,
          details: errorText
        }) 
      };
    }
    
    const data = await response.json();
    const formattedResponse = providerConfig.formatResponse(data);
    
    return {
      statusCode: 200,
      body: JSON.stringify(formattedResponse)
    };
    
  } catch (error) {
    console.error('Error in chat function:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }) 
    };
  }
};
