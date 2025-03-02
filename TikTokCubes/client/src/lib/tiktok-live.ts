export interface TikTokEvent {
  type: 'join' | 'like' | 'follow' | 'share';
  username: string;
  timestamp: number;
}

export class TikTokLiveConnection {
  private ws: WebSocket | null = null;
  private eventHandlers: ((event: TikTokEvent) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  async connect(username: string) {
    if (this.ws) {
      await this.disconnect();
    }

    return new Promise<void>((resolve, reject) => {
      try {
        // Connect to WebSocket server with specific path
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        this.ws = new WebSocket(`${protocol}//${window.location.host}/tiktok-live`);

        this.ws.onopen = () => {
          console.log('WebSocket connection established');
          if (!this.ws) return;

          // Reset reconnect attempts on successful connection
          this.reconnectAttempts = 0;

          // Request connection to TikTok live stream
          this.ws.send(JSON.stringify({ type: 'connect', username }));
        };

        this.ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);

          if (data.type === 'connected') {
            resolve();
          } else if (data.type === 'error') {
            reject(new Error(data.message));
          } else {
            // Handle TikTok events
            this.notifyHandlers(data);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.connect(username), 1000 * this.reconnectAttempts);
          } else {
            reject(new Error('WebSocket connection failed after multiple attempts'));
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket connection closed');
        };

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  async disconnect() {
    if (this.ws) {
      try {
        this.ws.send(JSON.stringify({ type: 'disconnect' }));
        this.ws.close();
      } catch (error) {
        console.error('Error during disconnect:', error);
      } finally {
        this.ws = null;
        this.eventHandlers = [];
      }
    }
  }

  onEvent(handler: (event: TikTokEvent) => void) {
    this.eventHandlers.push(handler);
    return () => {
      this.eventHandlers = this.eventHandlers.filter(h => h !== handler);
    };
  }

  private notifyHandlers(event: TikTokEvent) {
    this.eventHandlers.forEach(handler => handler(event));
  }
}

export const tiktokLive = new TikTokLiveConnection();