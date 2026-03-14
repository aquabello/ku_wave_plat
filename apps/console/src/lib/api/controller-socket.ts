import { apiClient } from './client';

export interface SocketCommand {
  socketCmdSeq: number;
  cmdLabel: string;
  cmdHex: string;
  cmdCategory: string;
  cmdDescription: string | null;
  cmdOrder: number;
}

export interface ServerStatus {
  listening: boolean;
  port: number;
  connectedClients: number;
}

export interface SocketLogEntry {
  direction: 'TX' | 'RX' | 'SYS';
  timestamp: string;
  hex: string;
  ascii: string | null;
  label?: string;
}

export async function getSocketCommands(): Promise<SocketCommand[]> {
  return apiClient<SocketCommand[]>('/controller/socket-commands');
}
