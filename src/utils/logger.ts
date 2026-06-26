export async function logErrorToBackend(error: unknown, context?: string) {
  try {
    const message = error instanceof Error 
      ? error.message 
      : (typeof error === 'string' ? error : JSON.stringify(error));
    
    const stack = error instanceof Error 
      ? error.stack 
      : new Error().stack;

    const payload = {
      message: context ? `[${context}] ${message}` : message,
      stack: stack,
      url: window.location.href
    };

    // Send the error payload asynchronously without blocking the UI
    fetch((import.meta.env.VITE_API_URL || '') + '/api/logs/frontend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(e => console.error('Failed to send error log to backend:', e));
  } catch (e) {
    console.error('Error logging utility failed:', e);
  }
}

export function setupFetchInterceptor() {
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const input = args[0];
    let init = args[1];
    const token = localStorage.getItem('token');
    if (token) {
      if (typeof input === 'string') {
        init = init || {};
        const headers = new Headers(init.headers);
        if (!headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        init.headers = headers;
        args[1] = init;
      } else if (input && typeof input === 'object' && 'headers' in input) {
        try {
          const req = input as Request;
          if (!req.headers.has('Authorization')) {
            req.headers.set('Authorization', `Bearer ${token}`);
          }
        } catch {
          try {
            const req = input as Request;
            const newHeaders = new Headers(req.headers);
            newHeaders.set('Authorization', `Bearer ${token}`);
            args[0] = new Request(req, { headers: newHeaders });
          } catch (err) {
            console.error('Failed to inject auth token to Request object:', err);
          }
        }
      }
    }

    try {
      const response = await originalFetch(...args);
      
      // If unauthorized, clear token and notify App
      if (response.status === 401) {
        const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
        if (!url.includes('/api/auth/')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('unauthorized'));
        }
      }

      // If the response is not OK and is a server error (500+), log it
      if (!response.ok && response.status >= 500) {
        try {
          const clone = response.clone();
          const text = await clone.text();
          const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
          
          // Avoid infinite logging loops if the logging request itself fails with 5xx
          if (!url.includes('/api/logs/frontend')) {
            logErrorToBackend(
              new Error(`API Error ${response.status} on ${url}: ${text}`),
              'GlobalFetchInterceptor'
            );
          }
        } catch {
          // Fail silently during extraction of response text
        }
      }
      return response;
    } catch (error) {
      // Intercept network/connection errors
      logErrorToBackend(error, 'GlobalFetchNetworkError');
      throw error;
    }
  };
}
