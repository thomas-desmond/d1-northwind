export default {
  async fetch(request: Request) {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    
    try {
      // Read and log request body if present
      let requestBody = null;
      let bodyText = null;
      
      if (request.body && (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
        const clonedRequest = request.clone();
        bodyText = await clonedRequest.text();
        
        // Try to parse as JSON for better logging
        try {
          requestBody = JSON.parse(bodyText);
        } catch {
          requestBody = bodyText; // Keep as string if not valid JSON
        }
      }

      // Log incoming request details
      console.log(`[${requestId}] Incoming request:`, {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
        timestamp: new Date().toISOString()
      });
      
      // Log body separately with full JSON serialization for better readability
      if (requestBody) {
        console.log(`[${requestId}] Request body:`, JSON.stringify(requestBody, null, 2));
      }

      const url = new URL(request.url);
      const originalPath = url.pathname;
      
      // Construct the proper Mistral API URL
      url.protocol = 'https:';
      url.hostname = 'api.mistral.ai';
      url.port = ''; // Remove any port from the original request
      url.pathname = '/v1' + url.pathname; // Prepend /v1 to the existing path

      console.log(`[${requestId}] Proxying to:`, {
        originalUrl: request.url,
        proxyUrl: url.toString(),
        pathTransform: `${originalPath} -> ${url.pathname}`
      });

      const newRequest = new Request(url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: 'manual',
      });

      const response = await fetch(newRequest);
      const duration = Date.now() - startTime;

      // Log response details
      console.log(`[${requestId}] Response received:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });

      // Log successful completion
      console.log(`[${requestId}] Request completed successfully in ${duration}ms`);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log error details
      console.error(`[${requestId}] Request failed:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });

      // Return a proper error response
      return new Response(
        JSON.stringify({
          error: 'Proxy request failed',
          message: error instanceof Error ? error.message : 'Unknown error',
          requestId
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId
          }
        }
      );
    }
  },
};
