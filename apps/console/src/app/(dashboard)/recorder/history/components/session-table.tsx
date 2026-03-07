'use client';

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { RecordingSessionListItem } from '@ku/types';

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SessionTableProps {
  data: RecordingSessionListItem[];
  pagination?: Pagination;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onDetail: (session: RecordingSessionListItem) => void;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분 ${s}초`;
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statusConfig: Record<string, { label: string; className: string }> = {
  RECORDING: { label: '녹화 중', className: 'bg-blue-100 text-blue-800 animate-pulse' },
  COMPLETED: { label: '완료', className: 'bg-green-100 text-green-800' },
  FAILED: { label: '실패', className: 'bg-red-100 text-red-800' },
  CANCELLED: { label: '취소', className: 'bg-gray-100 text-gray-800' },
};

const columnHelper = createColumnHelper<RecordingSessionListItem>();

export function SessionTable({
  data,
  pagination,
  isLoading,
  onPageChange,
  onDetail,
}: SessionTableProps) {
  const columns = [
    columnHelper.display({
      id: 'no',
      header: 'No',
      cell: ({ row }) => {
        if (!pagination) return row.index + 1;
        return (pagination.page - 1) * pagination.limit + row.index + 1;
      },
    }),
    columnHelper.accessor('recorderName', {
      header: '녹화기',
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    }),
    columnHelper.display({
      id: 'location',
      header: '건물/공간',
      cell: ({ row }) => (
        <span>
          {row.original.buildingName} {row.original.spaceName}
        </span>
      ),
    }),
    columnHelper.accessor('sessionTitle', {
      header: '강의명',
      cell: (info) => (
        <span className="block max-w-[200px] truncate" title={info.getValue() ?? ''}>
          {info.getValue() || '-'}
        </span>
      ),
    }),
    columnHelper.accessor('userName', {
      header: '교수',
      cell: (info) => info.getValue() || '-',
    }),
    columnHelper.accessor('sessionStatus', {
      header: '상태',
      cell: (info) => {
        const status = info.getValue();
        const config = statusConfig[status] ?? { label: status, className: '' };
        return (
          <Badge className={config.className}>
            {config.label}
          </Badge>
        );
      },
    }),
    columnHelper.display({
      id: 'datetime',
      header: '시작/종료',
      cell: ({ row }) => (
        <div className="text-xs space-y-0.5">
          <p>{formatDateTime(row.original.startedAt)}</p>
          <p className="text-muted-foreground">{formatDateTime(row.original.endedAt)}</p>
        </div>
      ),
    }),
    columnHelper.accessor('durationSec', {
      header: '녹화시간',
      cell: (info) => formatDuration(info.getValue()),
    }),
    columnHelper.accessor('fileCount', {
      header: '파일수',
      cell: (info) => `${info.getValue()}개`,
    }),
    columnHelper.accessor('presetName', {
      header: '프리셋',
      cell: (info) => info.getValue() || '-',
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pagination?.totalPages ?? 0,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center h-24 text-muted-foreground">
                  녹화 이력이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onDetail(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            이전
          </Button>
          <span className="text-sm text-muted-foreground">
            {pagination.page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
