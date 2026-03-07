'use client';

import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Home,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePtzCommandMutation } from '@/hooks/use-recorders';

interface PtzControllerProps {
  recorderSeq: number;
  disabled?: boolean;
}

export function PtzController({ recorderSeq, disabled }: PtzControllerProps) {
  const { mutate: sendPtz, isPending } = usePtzCommandMutation();

  const handleMove = (pan: number, tilt: number) => {
    sendPtz({
      recorderSeq,
      data: { action: 'move', pan, tilt, zoom: 0 },
    });
  };

  const handleZoom = (zoom: number) => {
    sendPtz({
      recorderSeq,
      data: { action: 'move', pan: 0, tilt: 0, zoom },
    });
  };

  const handleHome = () => {
    sendPtz({ recorderSeq, data: { action: 'home' } });
  };

  const handleStop = () => {
    sendPtz({ recorderSeq, data: { action: 'stop' } });
  };

  const isDisabled = disabled || isPending;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Directional Pad */}
      <div className="grid grid-cols-3 gap-1 w-fit">
        <div />
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleMove(0, 20)}
          disabled={isDisabled}
          title="위"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <div />

        <Button
          variant="outline"
          size="icon"
          onClick={() => handleMove(-20, 0)}
          disabled={isDisabled}
          title="왼쪽"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleHome}
          disabled={isDisabled}
          title="홈"
        >
          <Home className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleMove(20, 0)}
          disabled={isDisabled}
          title="오른쪽"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>

        <div />
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleMove(0, -20)}
          disabled={isDisabled}
          title="아래"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
        <div />
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleZoom(-20)}
          disabled={isDisabled}
        >
          <ZoomOut className="h-4 w-4 mr-1" />
          축소
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleStop}
          disabled={isDisabled}
        >
          정지
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleZoom(20)}
          disabled={isDisabled}
        >
          <ZoomIn className="h-4 w-4 mr-1" />
          확대
        </Button>
      </div>
    </div>
  );
}
