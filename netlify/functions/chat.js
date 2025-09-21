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
  huggingface: {
    name: 'Hugging Face',
    apiEndpoint: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
    apiKey: null, // No API key needed for this free model
    model: 'microsoft/DialoGPT-medium',
    headers: () => ({
      'Content-Type': 'application/json'
    }),
    formatRequest: (messages, options) => {
      // For DialoGPT, we only use the last message
      const lastMessage = messages.length > 0 ? messages[messages.length - 1].content : '';
      return {
        inputs: lastMessage,
        parameters: {
          max_length: options.length || 100,
          temperature: options.creativity / 100
        }
      };
    },
    formatResponse: (data) => {
      // Handle different response formats
      if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
        return { content: data[0].generated_text };
      }
      return { content: "I'm sorry, I couldn't generate a response. Please try again." };
    }
  }
};

module.exports = providers;
