/**
 * Security & Data Sanitization Utilities
 * Prevents Cross-Site Scripting (XSS) and malformed inputs.
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Telemetry Simulation Logger
 * Emits telemetry events to console and logs telemetry feed.
 */
export function sendTelemetry(action, payload = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[Analytics] User interacted with React Expense Tracker: ${action}`, {
    timestamp,
    payload,
    userRole: 'Freelancer / Contractor',
    ticket: 'ENG-58218'
  });
  return `[${timestamp.split('T')[1].slice(0, 8)}] ${action}`;
}
