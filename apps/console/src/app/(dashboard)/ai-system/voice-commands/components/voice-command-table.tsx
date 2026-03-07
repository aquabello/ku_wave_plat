'use client';

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
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
import type { VoiceCommandListItem } from '@ku/types';

interface VoiceCommandTableProps {
  data: VoiceCommandListItem[];
  isLoading: boolean;
  onEdit: (item: VoiceCommandListItem) => void;
  onDelete: (item: VoiceCommandListItem) => void;
}

export function VoiceCommandTable({
  data,
  isLoading,
  onEdit,
  onDelete,
}: VoiceCommandTableProps) {
  const columns = useMemo<ColumnDef<VoiceCommandListItem>[]>(
    () => [
      {
        accessorKey: 'spaceName',
        header: '공간',
        cell: ({ row }) => <div>{row.original.spaceName}</div>,
      },
      {
        accessorKey: 'keyword',
        header: '키워드',
        cell: ({ row }) => (
          <div className="font-medium">{row.original.keyword}</div>
        ),
      },
      {
        id: 'aliases',
        header: '별칭',
        cell: ({ row }) => {
          const aliases = row.original.keywordAliases;
          if (!aliases?.length) return <span className="text-muted-foreground">-</span>;
          return (
            <div className="flex flex-wrap gap-1 max-w-[200px]">
              {aliases.map((a: string) => (
                <Badge key={a} variant="outline" className="text-xs">
                  {a}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: 'deviceName',
        header: '장비',
        cell: ({ row }) => <div>{row.original.deviceName}</div>,
      },
      {
        accessorKey: 'commandName',
        header: '명령',
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.commandName}</Badge>
        ),
      },
      {
        accessorKey: 'minConfidence',
        header: '최소 신뢰도',
        cell: ({ row }) => (
          <div>{(row.original.minConfidence * 100).toFixed(0)}%</div>
        ),
      },
      {
        id: 'actions',
        header: '관리',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
                title="수정"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item);
                }}
                title="삭제"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

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
                    : flexRender(header.column.columnDef.header, header.getContext())}
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
                등록된 음성 명령어가 없습니다.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
