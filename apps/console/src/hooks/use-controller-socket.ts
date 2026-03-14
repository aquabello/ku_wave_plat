'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerStatus, SocketLogEntry } from '@/lib/api/controller-socket';

export function useControllerSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    listening: false,
    port: 9090,
    connectedClients: 0,
  });
  const [logs, setLogs] = useState<SocketLogEntry[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

  const addLog = useCallback((log: SocketLogEntry) => {
    setLogs((prev) => [...prev, log].slice(-500));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
    const origin = new URL(apiUrl).origin;

    const socket = io(`${origin}/controller-socket`, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => setWsConnected(true));
    socket.on('disconnect', () => setWsConnected(false));

    socket.on('socket:server-status', (data: ServerStatus) => {
      setServerStatus(data);
    });

    socket.on('socket:data', (log: SocketLogEntry) => addLog(log));

    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, [addLog]);

  const sendCommand = useCallback(
    (ip: string, port: number, socketCmdSeq: number, isTest?: boolean) => {
      socketRef.current?.emit('socket:send-command', {
        ip,
        port,
        socketCmdSeq,
        format: 'HEX',
        isTest,
      });
    },
    [],
  );

  const sendManual = useCallback(
    (ip: string, port: number, command: string, format: 'HEX' | 'TEXT') => {
      socketRef.current?.emit('socket:send', {
        ip,
        port,
        manualCommand: command,
        format,
      });
    },
    [],
  );

  const clearLogs = useCallback(() => setLogs([]), []);

  return {
    wsConnected,
    serverStatus,
    logs,
    sendCommand,
    sendManual,
    clearLogs,
  };
}
