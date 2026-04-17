/**
 * Event Bus Service - Bridges GraphQL mutations to Express event bus
 *
 * This service emits events from GraphQL resolvers to the Express server
 * via HTTP POST. Express then broadcasts these events to all connected SSE clients.
 *
 * Flow: GraphQL mutation → HTTP POST to Express → EventBus.emit() → SSE broadcast → Frontend
 */

interface EventPayload {
  event: string;
  payload: Record<string, any>;
  timestamp: string;
}

/**
 * Emits an event from a GraphQL mutation to the Express event bus.
 * Errors are logged but don't throw—mutations should complete even if event bus fails.
 */
export async function emitEvent(eventName: string, payload: Record<string, any>): Promise<void> {
  const expressEventUrl = process.env.EXPRESS_EVENT_URL || 'http://localhost:5000/events/emit';

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
