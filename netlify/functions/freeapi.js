exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { messages } = JSON.parse(event.body);
    
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
    
    return {
      statusCode: 200,
      body: JSON.stringify({ content: response })
    };
    
  } catch (error) {
    console.error('Error in free API:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }) 
    };
  }
};
