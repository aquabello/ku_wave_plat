'use client';

import { useState } from 'react';
import { Edit, Trash2, Wifi, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useTestFtpConnectionMutation } from '@/hooks/use-ftp-configs';
import { FtpTestResult } from './ftp-test-result';
import type { FtpConfigListItem, FtpTestResponse } from '@ku/types';

interface FtpConfigCardProps {
  config: FtpConfigListItem;
  onEdit: (config: FtpConfigListItem) => void;
  onDelete: (config: FtpConfigListItem) => void;
}

const protocolColorMap: Record<string, string> = {
  FTP: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  SFTP: 'bg-green-100 text-green-800 hover:bg-green-100',
  FTPS: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
};

export function FtpConfigCard({ config, onEdit, onDelete }: FtpConfigCardProps) {
  const [testResult, setTestResult] = useState<FtpTestResponse | null>(null);
  const { mutate: testConnection, isPending: isTesting } = useTestFtpConnectionMutation();

  const handleTest = () => {
    testConnection(config.ftpConfigSeq, {
      onSuccess: (data) => setTestResult(data),
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{config.ftpName}</CardTitle>
          <div className="flex gap-1">
            {config.isDefault === 'Y' && (
              <Badge variant="outline" className="text-xs">
                기본
              </Badge>
            )}
            <Badge className={protocolColorMap[config.ftpProtocol] ?? ''}>
              {config.ftpProtocol}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono">
            {config.ftpHost}:{config.ftpPort}
          </span>
        </div>
        <div className="text-muted-foreground">경로: {config.ftpPath}</div>
        <div className="text-muted-foreground">
          패시브 모드: {config.ftpPassiveMode === 'Y' ? '사용' : '미사용'}
        </div>
        <div className="text-muted-foreground">
          연결 녹화기: {config.recorderName ?? '글로벌 설정'}
        </div>
        {testResult && <FtpTestResult result={testResult} />}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(config)}>
          <Edit className="h-4 w-4 mr-1" />
          수정
        </Button>
        <Button variant="outline" size="sm" onClick={handleTest} disabled={isTesting}>
          <Wifi className="h-4 w-4 mr-1" />
          {isTesting ? '테스트 중...' : '연결 테스트'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => onDelete(config)}>
          <Trash2 className="h-4 w-4 mr-1 text-red-600" />
          삭제
        </Button>
      </CardFooter>
    </Card>
  );
}
