'use client';

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Edit, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { getImageUrl } from '@/lib/api/settings';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ContentListItem, ContentType } from '@ku/types';

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ContentTableProps {
  data: ContentListItem[];
  pagination?: Pagination;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onEdit: (content: ContentListItem) => void;
  onDelete: (content: ContentListItem) => void;
  onPreview: (content: ContentListItem) => void;
}

/** 콘텐츠 유형 배지 설정 */
const contentTypeConfig: Record<ContentType, { label: string; className: string }> = {
  VIDEO: {
    label: '영상',
    className: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
  },
  IMAGE: {
    label: '이미지',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  },
  HTML: {
    label: 'HTML',
    className: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
  },
  STREAM: {
    label: '스트림',
    className: 'bg-green-100 text-green-800 hover:bg-green-100',
  },
};

/** 파일 크기 포맷 */
function formatFileSize(bytes: number | null): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ContentTable({
  data,
  pagination,
  isLoading,
  onPageChange,
  onEdit,
  onDelete,
  onPreview,
}: ContentTableProps) {
  const columns = useMemo<ColumnDef<ContentListItem>[]>(
    () => [
      {
        accessorKey: 'content_code',
        header: '코드',
        cell: ({ row }) => (
          <div className="font-mono text-xs text-muted-foreground">
            {row.original.content_code}
          </div>
        ),
      },
      {
        accessorKey: 'content_name',
        header: '콘텐츠명',
        cell: ({ row }) => {
          const content = row.original;
          const isImage = content.content_type === 'IMAGE';
          const imageUrl = isImage ? getImageUrl(content.content_file_path) : null;

          if (isImage && imageUrl) {
            return (
              <HoverCard openDelay={200} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <div className="flex items-center gap-2 cursor-pointer">
                    <div className="shrink-0 w-8 h-8 rounded border overflow-hidden bg-muted">
                      <img
                        src={imageUrl}
                        alt={content.content_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-medium max-w-[200px] truncate" title={content.content_name}>
                      {content.content_name}
                    </span>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent side="right" className="w-auto p-2">
                  <img
                    src={imageUrl}
                    alt={content.content_name}
                    className="max-w-[280px] max-h-[200px] rounded object-contain"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-center truncate max-w-[280px]">
                    {content.content_name}
                  </p>
                </HoverCardContent>
              </HoverCard>
            );
          }

          return (
            <div className="font-medium max-w-[200px] truncate" title={content.content_name}>
              {content.content_name}
            </div>
          );
        },
      },
      {
        accessorKey: 'content_type',
        header: '유형',
        cell: ({ row }) => {
          const type = row.original.content_type;
          const config = contentTypeConfig[type];
          return <Badge className={config.className}>{config.label}</Badge>;
        },
      },
      {
        accessorKey: 'content_size',
        header: '파일 크기',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {formatFileSize(row.original.content_size)}
          </div>
        ),
      },
      {
        accessorKey: 'content_mime_type',
        header: 'MIME',
        cell: ({ row }) => (
          <div className="text-xs text-muted-foreground font-mono">
            {row.original.content_mime_type ?? '-'}
          </div>
        ),
      },
      {
        accessorKey: 'usage_count',
        header: '사용 횟수',
        cell: ({ row }) => (
          <div className="text-sm text-center">
            <Badge variant="outline">{row.original.usage_count}</Badge>
          </div>
        ),
      },
      {
        accessorKey: 'reg_date',
        header: '등록일',
        cell: ({ row }) => (
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {row.original.reg_date
              ? format(new Date(row.original.reg_date), 'yyyy.MM.dd', { locale: ko })
              : '-'}
          </div>
        ),
      },
      {
        accessorKey: 'upd_date',
        header: '수정일',
        cell: ({ row }) => (
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {row.original.upd_date
              ? format(new Date(row.original.upd_date), 'yyyy.MM.dd', { locale: ko })
              : '-'}
          </div>
        ),
      },
      {
        id: 'actions',
        header: '관리',
        cell: ({ row }) => {
          const content = row.original;
          return (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPreview(content)}
                title="미리보기"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(content)}
                title="수정"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(content)}
                title="삭제"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete, onPreview]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pagination?.totalPages ?? 0,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap text-xs">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/40">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            총 {pagination.total}개 중{' '}
            {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)}개 표시
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              이전
            </Button>
            <div className="flex items-center gap-1">
              <span className="text-sm">
                {pagination.page} / {pagination.totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              다음
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
