// AI Provider configurations
const providers = {
  claude: {
    name: 'Claude',
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-sonnet-20240229',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    }),
    formatRequest: (messages, options) => ({
      model: 'claude-3-sonnet-20240229',
      max_tokens: options.length || 1000,
      temperature: options.creativity / 100,
      messages: messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    }),
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
  ollama: {
    name: 'Ollama (Free)',
    apiEndpoint: 'https://ollama.ai/api/generate',
    apiKey: null, // No API key needed
    model: 'llama3',
    headers: () => ({
      'Content-Type': 'application/json'
    }),
    formatRequest: (messages, options) => {
      // For Ollama, we only use the last message
      const lastMessage = messages.length > 0 ? messages[messages.length - 1].content : '';
      return {
        model: 'llama3',
        prompt: lastMessage,
        stream: false,
        options: {
          temperature: options.creativity / 100,
          num_predict: Math.min(options.length || 100, 2048)
        }
      };
    },
    formatResponse: (data) => {
      // Handle different response formats
      if (data.response) {
        return { content: data.response };
      }
      return { content: "I'm sorry, I couldn't generate a response. Please try again." };
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
    formatResponse: () => {
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
        content: randomResponse + "This is a mock response since no AI provider API keys are configured. Please add API keys for Claude, Gemini, Groq, XAI, or Z.AI in your Netlify environment variables to use real AI models." 
      };
    }
  }
};

module.exports = providers;
