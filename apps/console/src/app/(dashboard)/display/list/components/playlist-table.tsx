'use client';

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
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
import type { MockPlaylist } from '../mock-data';
import {
  orientationLabels,
  screenLayoutLabels,
  playOrderLabels,
} from '../mock-data';

interface PlaylistTableProps {
  playlists: MockPlaylist[];
  onEdit: (playlist: MockPlaylist) => void;
  onDelete: (playlist: MockPlaylist) => void;
}

export function PlaylistTable({
  playlists,
  onEdit,
  onDelete,
}: PlaylistTableProps) {
  const columns = useMemo<ColumnDef<MockPlaylist>[]>(
    () => [
      {
        accessorKey: 'name',
        header: '플레이리스트명',
        cell: ({ row }) => (
          <div className="font-medium">{row.original.name}</div>
        ),
      },
      {
        accessorKey: 'orientation',
        header: '화면유형',
        cell: ({ row }) => (
          <div>{orientationLabels[row.original.orientation]}</div>
        ),
      },
      {
        accessorKey: 'screenLayout',
        header: '스크린구성',
        cell: ({ row }) => (
          <div className="font-mono text-sm">
            {screenLayoutLabels[row.original.screenLayout]}
          </div>
        ),
      },
      {
        accessorKey: 'playOrder',
        header: '랜덤여부',
        cell: ({ row }) => (
          <div>{playOrderLabels[row.original.playOrder]}</div>
        ),
      },
      {
        accessorKey: 'isActive',
        header: '사용여부',
        cell: ({ row }) => {
          const isActive = row.original.isActive;
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
        accessorKey: 'createdAt',
        header: '등록일',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {formatDistanceToNow(row.original.createdAt, {
              addSuffix: true,
              locale: ko,
            })}
          </div>
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: '수정일',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {formatDistanceToNow(row.original.updatedAt, {
              addSuffix: true,
              locale: ko,
            })}
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
    getFilteredRowModel: getFilteredRowModel(),
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
