export interface SocketLogEntry {
  direction: 'TX' | 'RX' | 'SYS';
  timestamp: string;
  hex: string;
  ascii: string;
  label?: string;
}

export interface TcpServerStatus {
  listening: boolean;
  port: number;
  connectedClients: number;
}
