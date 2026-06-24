import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { logErrorToBackend, setupFetchInterceptor } from './utils/logger.ts'

// Setup global fetch interceptor to capture network errors and 500+ responses
setupFetchInterceptor();

// Global JS error listener
window.addEventListener('error', (event) => {
  logErrorToBackend(event.error || new Error(event.message), 'WindowGlobalError');
});

// Global Promise rejection listener
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const error = reason instanceof Error ? reason : new Error(String(reason));
  logErrorToBackend(error, 'UnhandledPromiseRejection');
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
