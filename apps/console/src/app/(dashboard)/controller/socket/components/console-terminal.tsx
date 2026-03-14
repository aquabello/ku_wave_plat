'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SocketLogEntry } from '@/lib/api/controller-socket';

interface ConsoleTerminalProps {
  logs: SocketLogEntry[];
  onClear: () => void;
}

const DIRECTION_CONFIG = {
  TX:  { prefix: '>>', color: 'text-blue-400',   bg: 'border-l-blue-500' },
  RX:  { prefix: '<<', color: 'text-green-400',  bg: 'border-l-green-500' },
  SYS: { prefix: '--', color: 'text-yellow-400', bg: 'border-l-yellow-500' },
};

export function ConsoleTerminal({ logs, onClear }: ConsoleTerminalProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    if (logs.length === 0) return;
    const last = logs[logs.length - 1];

    if (last.direction === 'TX' && last.label?.includes('NFC 페이지 전환')) {
      setCountdown(30);
      if (countdownRef.current) clearInterval(countdownRef.current);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownRef.current!);
            countdownRef.current = null;
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }

    if (
      (last.direction === 'RX') ||
      (last.direction === 'SYS' && last.ascii?.includes('Connection closed'))
    ) {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      setCountdown(null);
    }
  }, [logs]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('ko-KR', {
      hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
    });

  return (
    <Card className="bg-gray-950 border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-gray-300 text-sm font-mono">
          Console
          <span className="ml-2 text-gray-500">({logs.length})</span>
          {countdown !== null && (
            <span className="ml-3 text-orange-400 animate-pulse">
              응답 대기 {countdown}초
            </span>
          )}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-300"
          onClick={onClear}
        >
          Clear
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[480px] px-4 pb-4">
          <div className="font-mono text-xs space-y-0.5">
            {logs.length === 0 && (
              <p className="text-gray-600 py-4 text-center">
                호실을 선택하고 명령어를 전송하면 로그가 표시됩니다
              </p>
            )}
            {logs.map((log, i) => {
              const cfg = DIRECTION_CONFIG[log.direction];
              return (
                <div
                  key={i}
                  className={`flex gap-2 py-0.5 pl-2 border-l-2 ${cfg.bg}`}
                >
                  <span className="text-gray-600 shrink-0">
                    {formatTime(log.timestamp)}
                  </span>
                  <span className={`shrink-0 font-bold ${cfg.color}`}>
                    {cfg.prefix} {log.direction}
                  </span>
                  <span className="text-gray-300 break-all">
                    {log.label && (
                      <span className="text-purple-400 font-semibold">
                        [{log.label}]{' '}
                      </span>
                    )}
                    {log.hex && (
                      <span className="text-gray-400">{log.hex} </span>
                    )}
                    {log.ascii && (
                      <span className="text-white">({log.ascii})</span>
                    )}
                    {log.direction === 'RX' && (
                      <span className="text-green-500 ml-1">&#10003;</span>
                    )}
                  </span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
