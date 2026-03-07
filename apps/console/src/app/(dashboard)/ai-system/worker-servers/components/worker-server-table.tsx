'use client';

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { Edit, Trash2, Activity } from 'lucide-react';
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
import type { WorkerServerListItem } from '@ku/types';

interface WorkerServerTableProps {
  data: WorkerServerListItem[];
  isLoading: boolean;
  onEdit: (item: WorkerServerListItem) => void;
  onDelete: (item: WorkerServerListItem) => void;
  onHealth: (item: WorkerServerListItem) => void;
}

const statusColorMap: Record<string, string> = {
  ONLINE: 'bg-green-100 text-green-800 hover:bg-green-100',
  OFFLINE: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
  ERROR: 'bg-red-100 text-red-800 hover:bg-red-100',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
};

const statusLabelMap: Record<string, string> = {
  ONLINE: '온라인',
  OFFLINE: '오프라인',
  ERROR: '에러',
  MAINTENANCE: '유지보수',
};

export function WorkerServerTable({
  data,
  isLoading,
  onEdit,
  onDelete,
  onHealth,
}: WorkerServerTableProps) {
  const columns = useMemo<ColumnDef<WorkerServerListItem>[]>(
    () => [
      {
        accessorKey: 'serverName',
        header: '서버명',
        cell: ({ row }) => (
          <div className="font-medium">{row.original.serverName}</div>
        ),
      },
      {
        accessorKey: 'serverUrl',
        header: 'URL',
        cell: ({ row }) => (
          <div className="font-mono text-sm">{row.original.serverUrl}</div>
        ),
      },
      {
        accessorKey: 'serverStatus',
        header: '상태',
        cell: ({ row }) => {
          const status = row.original.serverStatus;
          return (
            <Badge className={statusColorMap[status]}>
              {statusLabelMap[status] || status}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'gpuInfo',
        header: 'GPU',
        cell: ({ row }) => <div>{row.original.gpuInfo || '-'}</div>,
      },
      {
        accessorKey: 'maxConcurrentJobs',
        header: '최대 동시 Job',
        cell: ({ row }) => (
          <div className="text-center">{row.original.maxConcurrentJobs}</div>
        ),
      },
      {
        id: 'models',
        header: 'STT / LLM 모델',
        cell: ({ row }) => (
          <div className="text-xs font-mono">
            {row.original.defaultSttModel} / {row.original.defaultLlmModel}
          </div>
        ),
      },
      {
        accessorKey: 'lastHealthCheck',
        header: '마지막 헬스체크',
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.lastHealthCheck
              ? new Date(row.original.lastHealthCheck).toLocaleString('ko-KR')
              : '-'}
          </div>
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
                  onHealth(item);
                }}
                title="헬스체크"
              >
                <Activity className="h-4 w-4 text-green-600" />
              </Button>
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
    [onEdit, onDelete, onHealth],
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
                등록된 Worker 서버가 없습니다.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
