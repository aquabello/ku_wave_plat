'use client';

import { useState } from 'react';
import { Crosshair } from 'lucide-react';
import { RecorderSelector } from './components/recorder-selector';
import { ControlPanel } from './components/control-panel';
import { useRecordersQuery } from '@/hooks/use-recorders';
import type { RecorderListItem } from '@ku/types';

export default function RecorderControlPage() {
  const [selectedRecorder, setSelectedRecorder] =
    useState<RecorderListItem | null>(null);
  const { data, isLoading } = useRecordersQuery({ limit: 100 });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Crosshair className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">녹화기 제어</h1>
      </div>

      <RecorderSelector
        recorders={data?.items || []}
        isLoading={isLoading}
        selectedRecorder={selectedRecorder}
        onSelect={setSelectedRecorder}
      />

      {selectedRecorder && (
        <ControlPanel recorderSeq={selectedRecorder.recorderSeq} />
      )}
    </div>
  );
}
