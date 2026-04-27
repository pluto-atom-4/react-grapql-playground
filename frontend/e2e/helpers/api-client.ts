/**
 * GraphQL API Client for E2E tests
 */
interface GraphQLError {
  message: string;
}

export class GraphQLClient {
  private baseURL: string;
  private token: string | undefined;
  private headers: Record<string, string>;

  constructor(baseURL: string, token?: string) {
    this.baseURL = baseURL;
    this.token = token;
    this.headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      this.headers['Authorization'] = `Bearer ${token}`;
    }
  }

  /**
   * Set JWT token for authenticated requests
   */
  setToken(token: string): void {
    this.token = token;
    this.headers['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Clear JWT token
   */
  clearToken(): void {
    this.token = undefined;
    delete this.headers['Authorization'];
  }

  /**
   * Execute GraphQL query
   */
  async query<T>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<{ data?: T; errors?: GraphQLError[] }> {
    return this.execute<T>(query, variables);
  }

  /**
   * Execute GraphQL mutation
   */
  async mutation<T>(
    mutation: string,
    variables?: Record<string, unknown>
  ): Promise<{ data?: T; errors?: GraphQLError[] }> {
    return this.execute<T>(mutation, variables);
  }

  /**
   * Execute GraphQL request
   */
  private async execute<T>(
    document: string,
    variables?: Record<string, unknown>
  ): Promise<{ data?: T; errors?: GraphQLError[] }> {
    const url = `${this.baseURL}/graphql`;

    const body = {
      query: document,
      variables: variables || {},
    };

    try {
      // Log for debugging
      const hasToken = !!this.token;
      console.log(
        `[GraphQLClient] Executing GraphQL request with auth: ${hasToken ? 'YES' : 'NO'}`
      );
      if (!hasToken) {
        console.warn('[GraphQLClient] WARNING: No token provided, request will be unauthorized');
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json() as { data?: T; errors?: GraphQLError[] };

      if (result.errors) {
        throw new Error(`GraphQL Error: ${result.errors.map((e: GraphQLError) => e.message).join(', ')}`);
      }

      return result;
    } catch (error) {
      console.error('[GraphQLClient] Request failed:', {
        url,
        hasAuth: !!this.token,
        variables,
        error,
      });
      throw error;
    }
  }
}

/**
 * REST API Client for Express endpoints
 */
export class ExpressClient {
  private baseURL: string;
  private headers: Record<string, string>;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Upload file to Express server
   */
  async uploadFile(path: string, fileData: Uint8Array, fileName: string): Promise<{ fileId: string }> {
    const formData = new FormData();
    // Convert Uint8Array to ArrayBuffer to ensure compatibility with Blob constructor
    // Slice creates a new ArrayBuffer (not SharedArrayBuffer)
    const arrayBuffer = fileData.buffer.slice(
      fileData.byteOffset,
      fileData.byteOffset + fileData.byteLength
    ) as ArrayBuffer;
    const blob = new Blob([new Uint8Array(arrayBuffer)]);
    formData.append('file', blob, fileName);

    try {
      const response = await fetch(`${this.baseURL}${path}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json() as { fileId: string };
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  /**
   * Get health status
   */
  async getHealth(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json() as { status: string; timestamp: string };
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  /**
   * Send webhook event
   */
  async sendWebhook(path: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(`${this.baseURL}${path}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json() as Record<string, unknown>;
    } catch (error) {
      console.error('Webhook failed:', error);
      throw error;
    }
  }

  /**
   * Get Server-Sent Events stream
   */
  async streamEvents(
    onMessage: (data: unknown) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/events`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Keep the last incomplete line in buffer
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as unknown;
              onMessage(data);
            } catch (error) {
              console.error('Failed to parse SSE data:', error);
            }
          }
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (onError) {
        onError(err);
      } else {
        throw err;
      }
    }
  }
}

/**
 * Combined API Client for both GraphQL and REST endpoints
 */
export class APIClient {
  readonly graphql: GraphQLClient;
  readonly express: ExpressClient;

  constructor(graphqlURL: string, expressURL: string, token?: string) {
    this.graphql = new GraphQLClient(graphqlURL, token);
    this.express = new ExpressClient(expressURL);
  }

  setToken(token: string): void {
    this.graphql.setToken(token);
  }

  clearToken(): void {
    this.graphql.clearToken();
  }
}
