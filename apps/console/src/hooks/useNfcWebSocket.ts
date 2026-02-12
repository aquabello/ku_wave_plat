'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { NfcWsMessage, NfcWsTagEventData, NfcWsReaderEventData } from '@ku/types';

export type WsStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface UseNfcWebSocketOptions {
  url: string;
  enabled: boolean;
  aid?: string;
  onTagEvent?: (data: NfcWsTagEventData, timestamp: string) => void;
  reconnectInterval?: number;
}

interface UseNfcWebSocketReturn {
  status: WsStatus;
  readerName: string | null;
  sendMessage: (msg: Record<string, unknown>) => void;
  disconnect: () => void;
}

export function useNfcWebSocket({
  url,
  enabled,
  onTagEvent,
  reconnectInterval = 3000,
}: UseNfcWebSocketOptions): UseNfcWebSocketReturn {
  const [status, setStatus] = useState<WsStatus>('disconnected');
  const [readerName, setReaderName] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabledRef = useRef(enabled);
  const onTagEventRef = useRef(onTagEvent);

  enabledRef.current = enabled;
  onTagEventRef.current = onTagEvent;

  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connectWs = useCallback(() => {
    cleanup();
    if (!url) return;

    setStatus('connecting');

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const msg: NfcWsMessage = JSON.parse(event.data);

          if (msg.event === 'tag') {
            const tagData = msg.data as NfcWsTagEventData;
            onTagEventRef.current?.(tagData, msg.timestamp);
          } else if (msg.event === 'reader_connected') {
            const readerData = msg.data as NfcWsReaderEventData;
            setReaderName(readerData.readerName);
          } else if (msg.event === 'reader_disconnected') {
            setReaderName(null);
          }
          // heartbeat는 무시
        } catch {
          // non-JSON 메시지 무시
        }
      };

      ws.onerror = () => {
        setStatus('error');
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (enabledRef.current) {
          setStatus('disconnected');
          reconnectTimerRef.current = setTimeout(connectWs, reconnectInterval);
        } else {
          setStatus('disconnected');
        }
      };
    } catch {
      setStatus('error');
    }
  }, [url, reconnectInterval, cleanup]);

  const disconnect = useCallback(() => {
    cleanup();
    setStatus('disconnected');
    setReaderName(null);
  }, [cleanup]);

  useEffect(() => {
    if (enabled && url) {
      connectWs();
    } else {
      disconnect();
    }
    return cleanup;
  }, [enabled, url, connectWs, disconnect, cleanup]);

  const sendMessage = useCallback((msg: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { status, readerName, sendMessage, disconnect };
}
