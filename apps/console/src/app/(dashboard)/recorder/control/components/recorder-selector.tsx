'use client';

import { cn } from '@/lib/utils';
import type { RecorderListItem } from '@ku/types';

interface RecorderSelectorProps {
  recorders: RecorderListItem[];
  isLoading: boolean;
  selectedRecorder: RecorderListItem | null;
  onSelect: (recorder: RecorderListItem) => void;
}

export function RecorderSelector({
  recorders,
  isLoading,
  selectedRecorder,
  onSelect,
}: RecorderSelectorProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[120px]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (recorders.length === 0) {
    return (
      <div className="flex items-center justify-center h-[120px] rounded-md border border-dashed">
        <p className="text-sm text-muted-foreground">
          등록된 녹화기가 없습니다.
        </p>
      </div>
    );
  }

  const statusDotColor: Record<string, string> = {
    ONLINE: 'bg-green-500',
    OFFLINE: 'bg-gray-400',
    ERROR: 'bg-red-500',
  };

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {recorders.map((recorder) => (
        <button
          key={recorder.recorderSeq}
          onClick={() => onSelect(recorder)}
          className={cn(
            'flex flex-col gap-1 p-4 rounded-lg border text-left transition-all',
            'hover:shadow-md hover:border-primary/50',
            selectedRecorder?.recorderSeq === recorder.recorderSeq
              ? 'border-primary bg-primary/5 shadow-md'
              : 'border-border',
          )}
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                statusDotColor[recorder.recorderStatus] || 'bg-gray-400',
              )}
            />
            <span className="font-medium text-sm truncate">
              {recorder.recorderName}
            </span>
          </div>
          <span className="text-xs text-muted-foreground truncate">
            {recorder.buildingName} {recorder.spaceName}
          </span>
          {recorder.currentUserName && (
            <span className="text-xs text-muted-foreground">
              {recorder.currentUserName}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
