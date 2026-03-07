'use client';

import { CheckCircle, XCircle } from 'lucide-react';
import type { FtpTestResponse } from '@ku/types';

interface FtpTestResultProps {
  result: FtpTestResponse;
}

export function FtpTestResult({ result }: FtpTestResultProps) {
  const isSuccess = result.result === 'SUCCESS';

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-md text-sm ${
        isSuccess ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
      }`}
    >
      {isSuccess ? (
        <CheckCircle className="h-4 w-4 flex-shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 flex-shrink-0" />
      )}
      <div>
        <p>{result.message}</p>
        {result.serverInfo && (
          <p className="text-xs opacity-70">{result.serverInfo}</p>
        )}
      </div>
    </div>
  );
}
