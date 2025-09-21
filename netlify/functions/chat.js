const fetch = require('node-fetch');
const providers = require('./providers');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { messages, provider, options } = JSON.parse(event.body);
    
    // Check if provider is supported
    if (!providers[provider]) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: `Unsupported provider: ${provider}` }) 
      };
    }
    
    const providerConfig = providers[provider];
    
    // Check if API key is required and available
    if (providerConfig.apiKey && !providerConfig.apiKey) {
      return { 
        statusCode: 401, 
        body: JSON.stringify({ 
          error: `API key required for ${providerConfig.name}. Please set the environment variable.` 
        }) 
      };
    }
    
    // Format the request
    const requestBody = providerConfig.formatRequest(messages, options);
    
    // Special handling for local mock provider
    if (provider === 'local') {
      const formattedResponse = providerConfig.formatResponse(requestBody);
      return {
        statusCode: 200,
        body: JSON.stringify(formattedResponse)
      };
    }
    
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
