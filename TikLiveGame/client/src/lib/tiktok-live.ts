import { useState, useEffect, useCallback } from 'react';

interface TikTokLiveOptions {
  onChat: (data: any) => void;
  onGift: (data: any) => void;
  onLike: (data: any) => void;
  onConnect: () => void;
  onError: (error: string) => void;
}

export function useTikTokLive(options: TikTokLiveOptions) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const connect = useCallback((username: string) => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'connect', username }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'connected':
          options.onConnect();
          break;
        case 'chat':
          options.onChat(message.data);
          break;
        case 'gift':
          options.onGift(message.data);
          break;
        case 'like':
          options.onLike(message.data);
          break;
        case 'error':
          options.onError(message.error);
          break;
      }
    };

    ws.onerror = () => {
      options.onError('WebSocket connection error');
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [options]);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  return { connect };
}
