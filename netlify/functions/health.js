exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      status: 'ok',
      siteId: process.env.SITE_ID || 'unknown',
      timestamp: new Date().toISOString()
    })
  };
};
