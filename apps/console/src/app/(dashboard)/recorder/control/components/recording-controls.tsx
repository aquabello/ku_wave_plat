'use client';

import { useState } from 'react';
import { Play, Square, Monitor, Users, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  useStartRecordingMutation,
  useStopRecordingMutation,
  useApplyPresetMutation,
} from '@/hooks/use-recorders';
import type { RecorderPreset } from '@ku/types';

const PRESET_ICONS: Record<string, React.ReactNode> = {
  'PC화면': <Monitor className="h-5 w-5" />,
  'PC+강사화면': <Users className="h-5 w-5" />,
  '강사카메라': <Camera className="h-5 w-5" />,
};

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
        sessionTitle: sessionTitle.trim(),
        recPresetSeq: selectedPresetSeq
          ? Number(selectedPresetSeq)
          : undefined,
      },
    });
  };

  const handleStop = () => {
    stopRec(recorderSeq);
  };

  const handleApplyPreset = (preset: RecorderPreset) => {
    setSelectedPresetSeq(String(preset.recPresetSeq));
    applyPreset({ recorderSeq, recPresetSeq: preset.recPresetSeq });
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

      {/* Preset cards */}
      {presets.length > 0 && (
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            프리셋
          </label>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((preset) => {
              const isActive = selectedPresetSeq === String(preset.recPresetSeq);
              return (
                <button
                  key={preset.recPresetSeq}
                  onClick={() => handleApplyPreset(preset)}
                  disabled={disabled}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all',
                    'hover:shadow-md hover:border-primary/50',
                    isActive
                      ? 'border-primary bg-primary/10 shadow-md ring-1 ring-primary'
                      : 'border-border bg-card',
                    disabled && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  <span className={cn(
                    'transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )}>
                    {PRESET_ICONS[preset.presetName] ?? <Monitor className="h-5 w-5" />}
                  </span>
                  <span className={cn(
                    'text-xs font-medium',
                    isActive ? 'text-primary' : 'text-foreground',
                  )}>
                    {preset.presetName}
                  </span>
                </button>
              );
            })}
          </div>
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
            disabled={disabled || isStarting || !sessionTitle.trim()}
          >
            <Play className="h-4 w-4 mr-2" />
            {isStarting ? '시작 중...' : '녹화 시작'}
          </Button>
        )}
      </div>
    </div>
  );
}
