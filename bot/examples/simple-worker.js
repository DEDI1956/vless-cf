// Example Cloudflare Worker
// This is a simple "Hello World" worker that you can use to test the bot

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Simple routing
  if (url.pathname === '/') {
    return new Response(getHomePage(), {
      headers: { 'content-type': 'text/html' }
    })
  }
  
  if (url.pathname === '/api/hello') {
    return new Response(JSON.stringify({
      message: 'Hello from Cloudflare Worker!',
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url
    }), {
      headers: { 'content-type': 'application/json' }
    })
  }
  
  if (url.pathname === '/api/ip') {
    const ip = request.headers.get('CF-Connecting-IP') || 'Unknown'
    const country = request.headers.get('CF-IPCountry') || 'Unknown'
    
    return new Response(JSON.stringify({
      ip: ip,
      country: country,
      userAgent: request.headers.get('User-Agent')
    }), {
      headers: { 'content-type': 'application/json' }
    })
  }
  
  // 404 for other routes
  return new Response('Not Found', { status: 404 })
}

function getHomePage() {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Cloudflare Worker - Test Bot</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; background: #f97316; color: white; padding: 20px; border-radius: 8px; }
        .endpoint { background: #f3f4f6; padding: 15px; margin: 10px 0; border-radius: 8px; }
        .method { background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        code { background: #e5e7eb; padding: 2px 6px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Cloudflare Worker</h1>
        <p>Deployed via Telegram Bot</p>
    </div>
    
    <h2>Available Endpoints:</h2>
    
    <div class="endpoint">
        <span class="method">GET</span>
        <strong>/</strong> - This homepage
    </div>
    
    <div class="endpoint">
        <span class="method">GET</span>
        <strong>/api/hello</strong> - Simple JSON response
        <br><small>Returns: <code>{"message": "Hello from Cloudflare Worker!", ...}</code></small>
    </div>
    
    <div class="endpoint">
        <span class="method">GET</span>
        <strong>/api/ip</strong> - Get visitor IP and country
        <br><small>Returns: <code>{"ip": "1.2.3.4", "country": "US", ...}</code></small>
    </div>
    
    <hr>
    <p><small>Worker deployed at: ${new Date().toISOString()}</small></p>
</body>
</html>
  `
}