'use client';

import { useState } from 'react';
import { Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useStartRecordingMutation,
  useStopRecordingMutation,
  useApplyPresetMutation,
} from '@/hooks/use-recorders';
import type { RecorderPreset } from '@ku/types';

interface RecordingControlsProps {
  recorderSeq: number;
  isRecording: boolean;
  currentSession: {
    recSessionSeq: number;
    sessionTitle: string;
    startedAt: string;
    elapsedSec: number;
  } | null;
  presets: RecorderPreset[];
  disabled?: boolean;
}

export function RecordingControls({
  recorderSeq,
  isRecording,
  currentSession,
  presets,
  disabled,
}: RecordingControlsProps) {
  const [sessionTitle, setSessionTitle] = useState('');
  const [selectedPresetSeq, setSelectedPresetSeq] = useState<string>('');

  const { mutate: startRec, isPending: isStarting } =
    useStartRecordingMutation();
  const { mutate: stopRec, isPending: isStopping } =
    useStopRecordingMutation();
  const { mutate: applyPreset } = useApplyPresetMutation();

  const handleStart = () => {
    startRec({
      recorderSeq,
      data: {
        sessionTitle: sessionTitle || undefined,
        recPresetSeq: selectedPresetSeq
          ? Number(selectedPresetSeq)
          : undefined,
      },
    });
  };

  const handleStop = () => {
    stopRec(recorderSeq);
  };

  const handleApplyPreset = (value: string) => {
    setSelectedPresetSeq(value);
    applyPreset({ recorderSeq, recPresetSeq: Number(value) });
  };

  return (
    <div className="space-y-4">
      {/* Current session info */}
      {isRecording && currentSession && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm">
          <p className="font-medium text-red-800">
            녹화 중: {currentSession.sessionTitle || '제목 없음'}
          </p>
          <p className="text-red-600 text-xs mt-1">
            시작:{' '}
            {new Date(currentSession.startedAt).toLocaleString('ko-KR')}
          </p>
        </div>
      )}

      {/* Session title input (only when not recording) */}
      {!isRecording && (
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            강의명 / 메모
          </label>
          <Input
            placeholder="데이터구조론 3주차"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            disabled={disabled}
          />
        </div>
      )}

      {/* Preset selector */}
      {presets.length > 0 && (
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            프리셋
          </label>
          <Select onValueChange={handleApplyPreset} value={selectedPresetSeq}>
            <SelectTrigger>
              <SelectValue placeholder="프리셋 선택" />
            </SelectTrigger>
            <SelectContent>
              {presets.map((preset) => (
                <SelectItem
                  key={preset.recPresetSeq}
                  value={String(preset.recPresetSeq)}
                >
                  {preset.presetName} (#{preset.presetNumber})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Start / Stop buttons */}
      <div className="flex gap-2">
        {isRecording ? (
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleStop}
            disabled={disabled || isStopping}
          >
            <Square className="h-4 w-4 mr-2" />
            {isStopping ? '종료 중...' : '녹화 종료'}
          </Button>
        ) : (
          <Button
            className="flex-1"
            onClick={handleStart}
            disabled={disabled || isStarting}
          >
            <Play className="h-4 w-4 mr-2" />
            {isStarting ? '시작 중...' : '녹화 시작'}
          </Button>
        )}
      </div>
    </div>
  );
}
