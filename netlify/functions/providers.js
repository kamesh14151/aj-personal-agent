// AI Provider configurations
const providers = {
  claude: {
    name: 'Claude',
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-sonnet-4-20250514', // Updated model name
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    }),
    formatRequest: (messages, options) => {
      // Filter out empty messages
      const validMessages = messages.filter(msg => msg.content && msg.content.trim() !== '');
      
      return {
        model: 'claude-sonnet-4-20250514', // Updated model name
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
  free: {
    name: 'Free API',
    apiKey: null, // No API key needed
    model: 'free',
    headers: () => ({}),
    formatRequest: (messages, options) => {
      return { messages: messages };
    },
    formatResponse: (data) => ({
      content: data.content
    }),
    // Custom handler for the free API
    handler: async (messages, options) => {
      // Get the last message
      const lastMessage = messages.length > 0 ? messages[messages.length - 1].content : '';
      
      // Simple response based on the input
      let response = "";
      
      if (lastMessage.toLowerCase().includes("hello") || lastMessage.toLowerCase().includes("hi")) {
        response = "Hello! I'm a simple AI assistant. How can I help you today?";
      } else if (lastMessage.toLowerCase().includes("help")) {
        response = "I'm here to help! Please let me know what you need assistance with.";
      } else if (lastMessage.toLowerCase().includes("thank")) {
        response = "You're welcome! Is there anything else I can help with?";
      } else if (lastMessage.toLowerCase().includes("weather")) {
        response = "I don't have access to real-time weather data, but I hope it's nice where you are!";
      } else if (lastMessage.toLowerCase().includes("time")) {
        response = `The current time is ${new Date().toLocaleTimeString()}.`;
      } else if (lastMessage.toLowerCase().includes("date")) {
        response = `Today's date is ${new Date().toLocaleDateString()}.`;
      } else {
        response = `I understand you said: "${lastMessage}". This is a simple response from a free API. For more advanced AI capabilities, please configure API keys for services like Claude, Gemini, or Groq in your Netlify environment variables.`;
      }
      
      return { content: response };
    }
  },
  local: {
    name: 'Local Mock',
    apiKey: null, // No API key needed
    model: 'mock',
    headers: () => ({}),
    formatRequest: (messages, options) => {
      // Just return the last message
      const lastMessage = messages.length > 0 ? messages[messages.length - 1].content : '';
      return { message: lastMessage };
    },
    formatResponse: (data) => {
      // Return a mock response
      const responses = [
        "I understand you're asking about: ",
        "That's an interesting question. Based on what you've told me, ",
        "I can help you with that. Here's what I think: ",
        "Thanks for your message. I believe you're looking for information about ",
        "I'd be happy to assist with your request regarding "
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      return { 
        content: randomResponse + data.message + ".\n\nThis is a mock response since no AI provider API keys are configured. Please add API keys for Claude, Gemini, Groq, XAI, or Z.AI in your Netlify environment variables to use real AI models." 
      };
    }
  }
};

module.exports = providers;
