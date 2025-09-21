// Cloudflare Functions middleware for API routes
export const onRequest = async (context) => {
  const { request, next } = context;
  const url = new URL(request.url);
  
  // Handle API routes
  if (url.pathname.startsWith('/api/')) {
    return handleApiRequest(context);
  }
  
  // Serve static files for all other requests
  return next();
};

async function handleApiRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
  };
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders
    });
  }
  
  try {
    if (path === '/api/chat' && request.method === 'POST') {
      return handleChatRequest(request, env);
    }
    
    if (path === '/api/providers' && request.method === 'GET') {
      return handleProvidersRequest(env);
    }
    
    if (path === '/api/health' && request.method === 'GET') {
      return handleHealthCheck(env);
    }
    
    return new Response('Not found', { 
      status: 404,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

async function handleChatRequest(request, env) {
  const { messages, provider, options = {} } = await request.json();
  
  if (!messages || !provider) {
    return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
      status: 400,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }

  let response;
  switch (provider) {
    case 'groq':
      response = await callGroqAPI(messages, options, env.GROQ_API_KEY);
      break;
    case 'gemini':
      response = await callGeminiAPI(messages, options, env.GEMINI_API_KEY);
      break;
    case 'claude':
      response = await callClaudeAPI(messages, options, env.ANTHROPIC_API_KEY);
      break;
    case 'xai':
      response = await callXaiAPI(messages, options, env.XAI_API_KEY);
      break;
    default:
      return new Response(JSON.stringify({ error: 'Unsupported provider' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
  }

  if (options.streaming) {
    return handleStreamingResponse(response);
  } else {
    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}

async function handleProvidersRequest(env) {
  // Test all providers to see which are available
  const providers = [
    { id: 'groq', name: 'Groq', status: await testProvider('groq', env.GROQ_API_KEY) },
    { id: 'gemini', name: 'Gemini', status: await testProvider('gemini', env.GEMINI_API_KEY) },
    { id: 'claude', name: 'Claude', status: await testProvider('claude', env.ANTHROPIC_API_KEY) },
    { id: 'xai', name: 'xAI', status: await testProvider('xai', env.XAI_API_KEY) },
  ];

  return new Response(JSON.stringify(providers), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
}

async function handleHealthCheck(env) {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV || 'development',
    providers: {
      groq: !!env.GROQ_API_KEY,
      gemini: !!env.GEMINI_API_KEY,
      claude: !!env.ANTHROPIC_API_KEY,
      xai: !!env.XAI_API_KEY,
    }
  };

  return new Response(JSON.stringify(health), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
}

function handleStreamingResponse(response) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send response in chunks with typing effect
        const chunks = response.content.match(/.{1,5}/g) || [];
        
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const data = {
            content: chunk
          };
        
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          
          // Wait for typing effect (30 characters per second)
          await new Promise(resolve => setTimeout(resolve, 1000 / 30));
        }
        
        // Send end signal
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        console.error('Streaming error:', error);
        controller.error(error);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    }
  });
}

async function testProvider(provider, apiKey) {
  if (!apiKey) return 'offline';
  
  try {
    // Simple test to check if provider is working
    const testMessage = [{ role: 'user', content: 'Hello' }];
    
    switch (provider) {
      case 'groq':
        await callGroqAPI(testMessage, { length: 10 }, apiKey);
        break;
      case 'gemini':
        await callGeminiAPI(testMessage, { length: 10 }, apiKey);
        break;
      case 'claude':
        await callClaudeAPI(testMessage, { length: 10 }, apiKey);
        break;
      case 'xai':
        await callXaiAPI(testMessage, { length: 10 }, apiKey);
        break;
    }
    
    return 'online';
  } catch (error) {
    console.error(`Error testing ${provider}:`, error);
    return 'offline';
  }
}

// Helper functions for each API provider
async function callGroqAPI(messages, options, apiKey) {
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama3-70b-8192',
      messages: messages,
      temperature: options.creativity ? options.creativity / 100 : 0.7,
      max_tokens: options.length || 2000,
      top_p: options.focus ? options.focus / 100 : 0.5,
      stream: false
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Groq API Error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    provider: 'groq'
  };
}

async function callGeminiAPI(messages, options, apiKey) {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  // Convert messages to Gemini format
  const geminiMessages = messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: geminiMessages,
      generationConfig: {
        temperature: options.creativity ? options.creativity / 100 : 0.7,
        topP: options.focus ? options.focus / 100 : 0.5,
        maxOutputTokens: options.length || 2000,
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Gemini API Error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.candidates[0].content.parts[0].text,
    provider: 'gemini'
  };
}

async function callClaudeAPI(messages, options, apiKey) {
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: options.length || 2000,
      temperature: options.creativity ? options.creativity / 100 : 0.7,
      top_p: options.focus ? options.focus / 100 : 0.5,
      messages: messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Claude API Error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.content[0].text,
    provider: 'claude'
  };
}

async function callXaiAPI(messages, options, apiKey) {
  if (!apiKey) {
    throw new Error('XAI_API_KEY not configured');
  }

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-beta',
      messages: messages,
      temperature: options.creativity ? options.creativity / 100 : 0.7,
      max_tokens: options.length || 2000,
      top_p: options.focus ? options.focus / 100 : 0.5,
      stream: false
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`XAI API Error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    provider: 'xai'
  };
}
