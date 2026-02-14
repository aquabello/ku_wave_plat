import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, Grid3x3, Shuffle, ArrowDownUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlaylistCardProps {
  playlist: {
    id: number;
    name: string;
    orientation: 'LANDSCAPE' | 'PORTRAIT';
    layout: string;
    playMode: 'SEQUENTIAL' | 'RANDOM';
    approvedCount: number;
    totalCount: number;
  };
  isSelected: boolean;
  onClick: () => void;
}

export function PlaylistCard({ playlist, isSelected, onClick }: PlaylistCardProps) {
  return (
    <Card
      className={cn(
        'p-4 cursor-pointer transition-all duration-200 hover:shadow-md border-2',
        isSelected
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-transparent hover:border-primary/30'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-pressed={isSelected}
    >
      {/* Playlist Name */}
      <h3 className="font-semibold text-base mb-3 line-clamp-1">{playlist.name}</h3>

      {/* Meta Information */}
      <div className="space-y-2">
        {/* Orientation & Layout */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Monitor className="h-3.5 w-3.5" />
          <span>{playlist.orientation === 'LANDSCAPE' ? '가로' : '세로'}</span>
          <span className="text-muted-foreground/50">•</span>
          <Grid3x3 className="h-3.5 w-3.5" />
          <span>{playlist.layout}</span>
        </div>

        {/* Play Mode */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {playlist.playMode === 'RANDOM' ? (
            <Shuffle className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownUp className="h-3.5 w-3.5" />
          )}
          <span>{playlist.playMode === 'RANDOM' ? '랜덤 재생' : '순차 재생'}</span>
        </div>

        {/* Approval Status */}
        <div className="flex items-center gap-2 pt-2">
          <Badge
            variant={playlist.approvedCount === 0 ? 'secondary' : 'default'}
            className="text-xs"
          >
            승인 {playlist.approvedCount}/{playlist.totalCount}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
