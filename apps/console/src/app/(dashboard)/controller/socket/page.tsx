'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plug } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ConnectionPanel } from './components/connection-panel';
import { CommandPanel } from './components/command-panel';
import { ConsoleTerminal } from './components/console-terminal';
import { ManualInput } from './components/manual-input';
import { useControllerSocket } from '@/hooks/use-controller-socket';
import { getSocketCommands } from '@/lib/api/controller-socket';

export default function ControllerSocketPage() {
  const {
    wsConnected, serverStatus, logs,
    sendCommand, sendManual, clearLogs,
  } = useControllerSocket();

  const [ip, setIp] = useState('');
  const [port, setPort] = useState('9090');

  const portNum = parseInt(port, 10);
  const canSend = !!ip && !isNaN(portNum);

  const { data: commands = [] } = useQuery({
    queryKey: ['socket-commands'],
    queryFn: getSocketCommands,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Plug className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">소켓 연동</h1>
          <p className="text-sm text-muted-foreground">
            컨트롤러 TCP 일회성 연결 및 양방향 통신 테스트
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Badge variant={wsConnected ? 'default' : 'destructive'}>
            WS {wsConnected ? '연결' : '끊김'}
          </Badge>
          <Badge variant={serverStatus.listening ? 'default' : 'destructive'}>
            TCP Server {serverStatus.listening ? 'ON' : 'OFF'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4 space-y-6">
          <ConnectionPanel
            serverStatus={serverStatus}
            ip={ip}
            port={port}
            onIpChange={setIp}
            onPortChange={setPort}
          />
          <CommandPanel
            disabled={!canSend}
            commands={commands}
            onSend={(cmdSeq, isTest) => sendCommand(ip, portNum, cmdSeq, isTest)}
          />
        </div>

        <div className="col-span-8 space-y-4">
          <ConsoleTerminal logs={logs} onClear={clearLogs} />
          <ManualInput
            disabled={!canSend}
            onSend={(cmd, fmt) => sendManual(ip, portNum, cmd, fmt)}
          />
        </div>
      </div>
    </div>
  );
}
