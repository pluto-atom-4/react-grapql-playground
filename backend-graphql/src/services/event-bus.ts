/**
 * Event Bus Service - Bridges GraphQL mutations to Express event bus
 *
 * This service emits events from GraphQL resolvers to the Express server
 * via HTTP POST with authentication. Express then broadcasts these events 
 * to all connected SSE clients.
 *
 * Security: All requests include Authorization header with shared event secret.
 * This prevents event injection attacks from unauthorized clients.
 * 
 * Flow: GraphQL mutation → HTTP POST (authenticated) → Express → EventBus.emit() → SSE broadcast → Frontend
 */

interface EventPayload {
  event: string;
  payload: Record<string, any>;
  timestamp: string;
}

/**
 * Emits an event from a GraphQL mutation to the Express event bus.
 * 
 * Authentication: Includes Authorization header with shared event secret
 * Errors are logged but don't throw—mutations should complete even if event bus fails.
 * 
 * Manufacturing Security:
 * - Prevents event injection attacks (fake build status, test results)
 * - Ensures only trusted services can trigger real-time updates
 * - Supports manufacturing decision-making with integrity
 */
export async function emitEvent(eventName: string, payload: Record<string, any>): Promise<void> {
  const expressEventUrl = process.env.EXPRESS_EVENT_URL || 'http://localhost:5000/events/emit';
  const eventSecret = process.env.EXPRESS_EVENT_SECRET || 'dev-event-secret-change-in-production';

  const eventPayload: EventPayload = {
    event: eventName,
    payload,
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch(expressEventUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${eventSecret}`,  // ✅ Shared-secret authentication
      },
      body: JSON.stringify(eventPayload),
    });

    if (!response.ok) {
      console.error(
        `[EventBus] Failed to emit event: ${eventName}`,
        `Status: ${response.status}`,
        `Response: ${await response.text()}`
      );
    }
  } catch (error) {
    console.error(`[EventBus] Network error emitting event: ${eventName}`, error);
  }
}
