'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  HoverCard, HoverCardContent, HoverCardTrigger,
} from '@/components/ui/hover-card';
import type { SocketCommand } from '@/lib/api/controller-socket';

interface CommandPanelProps {
  disabled: boolean;
  commands: SocketCommand[];
  onSend: (socketCmdSeq: number, isTest?: boolean) => void;
}

function isTxCommand(cmd: SocketCommand): boolean {
  return cmd.cmdDescription?.startsWith('TX') ?? false;
}

export function CommandPanel({ disabled, commands, onSend }: CommandPanelProps) {
  const categories = commands.reduce<Record<string, SocketCommand[]>>((acc, cmd) => {
    (acc[cmd.cmdCategory] ??= []).push(cmd);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>명령어 패널</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(categories).map(([category, cmds]) => (
          <div key={category}>
            <p className="text-sm font-medium mb-2">{category}</p>
            <div className="grid grid-cols-1 gap-2">
              {cmds.map((cmd) => {
                const isTx = isTxCommand(cmd);
                return (
                  <HoverCard key={cmd.socketCmdSeq}>
                    <HoverCardTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-between text-left w-full"
                        disabled={disabled}
                        onClick={() => onSend(cmd.socketCmdSeq, !isTx)}
                      >
                        <span>{cmd.cmdLabel}</span>
                        <Badge
                          variant={isTx ? 'default' : 'secondary'}
                          className={`ml-2 text-[10px] px-1.5 ${
                            isTx ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {isTx ? 'TX' : 'RX'}
                        </Badge>
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent side="right" className="w-80">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{cmd.cmdLabel}</p>
                        <p className="text-xs text-muted-foreground">{cmd.cmdDescription}</p>
                        <p className="font-mono text-xs text-gray-500 break-all">
                          HEX: {cmd.cmdHex.match(/.{2}/g)?.join(' ')}
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                );
              })}
            </div>
          </div>
        ))}
        {commands.length === 0 && (
          <p className="text-sm text-muted-foreground text-center">
            등록된 명령어가 없습니다
          </p>
        )}
      </CardContent>
    </Card>
  );
}
