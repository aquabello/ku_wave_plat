'use client';

import { Pencil, Trash2, Film, Image, Code, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getImageUrl } from '@/lib/api/settings';
import type { PlaylistContent, ContentType } from '@ku/types';

interface PlaylistContentCardProps {
  content: PlaylistContent;
  onEdit: (content: PlaylistContent) => void;
  onRemove: (content: PlaylistContent) => void;
}

const contentTypeLabel: Record<ContentType, string> = {
  IMAGE: '이미지',
  VIDEO: '비디오',
  HTML: 'HTML',
  STREAM: '스트림',
};

const contentTypeBadgeVariant: Record<
  ContentType,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  IMAGE: 'default',
  VIDEO: 'secondary',
  HTML: 'outline',
  STREAM: 'destructive',
};

const ContentTypeIcon: Record<ContentType, React.ElementType> = {
  IMAGE: Image,
  VIDEO: Film,
  HTML: Code,
  STREAM: Radio,
};

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '-';
  return `${seconds}초`;
}

export function PlaylistContentCard({ content, onEdit, onRemove }: PlaylistContentCardProps) {
  const imageUrl =
    content.content_type === 'IMAGE'
      ? getImageUrl(content.content_file_path)
      : null;

  const Icon = ContentTypeIcon[content.content_type];

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm">
      {/* Thumbnail / Icon */}
      <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={content.content_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <Icon className="h-8 w-8 text-muted-foreground" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">#{content.play_order}</span>
          <Badge variant={contentTypeBadgeVariant[content.content_type]} className="text-xs">
            {contentTypeLabel[content.content_type]}
          </Badge>
        </div>
        <p className="mt-1 truncate text-sm font-medium leading-tight">{content.content_name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          재생시간: {formatDuration(content.play_duration ?? content.content_duration)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-col gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(content)}
          title="수정"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onRemove(content)}
          title="제거"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
