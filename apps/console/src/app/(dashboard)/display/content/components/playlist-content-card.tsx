'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, Film, Image, Code, Radio } from 'lucide-react';
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: content.plc_seq });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const imageUrl =
    content.content_type === 'IMAGE'
      ? getImageUrl(content.content_file_path)
      : null;

  const Icon = ContentTypeIcon[content.content_type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm
        transition-shadow duration-200
        ${isDragging
          ? 'z-50 shadow-lg ring-2 ring-primary/30 opacity-95 scale-[1.02]'
          : 'hover:shadow-md'
        }
      `}
    >
      {/* Drag Handle */}
      <button
        type="button"
        className="flex h-full shrink-0 cursor-grab items-center px-0.5 text-muted-foreground/40 transition-colors hover:text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Order Number */}
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {content.play_order}
      </div>

      {/* Thumbnail / Icon */}
      <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
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
      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
