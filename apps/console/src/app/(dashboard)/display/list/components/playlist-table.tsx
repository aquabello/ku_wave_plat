'use client';

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Edit, Trash2 } from 'lucide-react';
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
import type { PlaylistListItem } from '@ku/types';

/** 스크린 레이아웃 라벨 */
const screenLayoutLabels: Record<string, string> = {
  '1x1': '1x1',
  '1x2': '1x2',
  '1x4': '1x4',
  '1x8': '1x8',
};

/** 플레이리스트 유형 라벨 */
const typeLabels: Record<string, string> = {
  NORMAL: '일반',
  EMERGENCY: '긴급',
  ANNOUNCEMENT: '공지',
};

interface PlaylistTableProps {
  playlists: PlaylistListItem[];
  onEdit: (playlist: PlaylistListItem) => void;
  onDelete: (playlist: PlaylistListItem) => void;
}

export function PlaylistTable({
  playlists,
  onEdit,
  onDelete,
}: PlaylistTableProps) {
  const columns = useMemo<ColumnDef<PlaylistListItem>[]>(
    () => [
      {
        accessorKey: 'playlist_name',
        header: '플레이리스트명',
        cell: ({ row }) => (
          <div className="font-medium">{row.original.playlist_name}</div>
        ),
      },
      {
        accessorKey: 'playlist_type',
        header: '유형',
        cell: ({ row }) => {
          const type = row.original.playlist_type;
          return (
            <Badge
              variant="outline"
              className={
                type === 'EMERGENCY'
                  ? 'border-red-300 text-red-700'
                  : type === 'ANNOUNCEMENT'
                    ? 'border-blue-300 text-blue-700'
                    : 'border-gray-300 text-gray-700'
              }
            >
              {typeLabels[type] || type}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'playlist_screen_layout',
        header: '스크린구성',
        cell: ({ row }) => (
          <div className="font-mono text-sm">
            {screenLayoutLabels[row.original.playlist_screen_layout] || row.original.playlist_screen_layout}
          </div>
        ),
      },
      {
        accessorKey: 'playlist_random',
        header: '랜덤여부',
        cell: ({ row }) => (
          <div>{row.original.playlist_random === 'Y' ? '랜덤' : '순차'}</div>
        ),
      },
      {
        accessorKey: 'playlist_status',
        header: '사용여부',
        cell: ({ row }) => {
          const isActive = row.original.playlist_status === 'ACTIVE';
          return (
            <Badge
              className={
                isActive
                  ? 'bg-green-100 text-green-800 hover:bg-green-100'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
              }
            >
              {isActive ? '활성' : '비활성'}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'content_count',
        header: '콘텐츠',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {row.original.content_count}개
          </div>
        ),
      },
      {
        accessorKey: 'reg_date',
        header: '등록일',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {row.original.reg_date
              ? formatDistanceToNow(new Date(row.original.reg_date), {
                  addSuffix: true,
                  locale: ko,
                })
              : '-'}
          </div>
        ),
      },
      {
        accessorKey: 'upd_date',
        header: '수정일',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {row.original.upd_date
              ? formatDistanceToNow(new Date(row.original.upd_date), {
                  addSuffix: true,
                  locale: ko,
                })
              : '-'}
          </div>
        ),
      },
      {
        id: 'actions',
        header: '관리',
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(row.original)}
              title="수정"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(row.original)}
              title="삭제"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        ),
      },
    ],
    [onEdit, onDelete]
  );

  const table = useReactTable({
    data: playlists,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
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
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
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
  );
}
