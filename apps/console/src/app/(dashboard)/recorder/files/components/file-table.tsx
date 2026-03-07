'use client';

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
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
import { FileDownloadButton } from './file-download-button';
import { useRetryUploadMutation } from '@/hooks/use-recordings';
import type { RecordingFileListItem, FtpUploadStatus } from '@ku/types';

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FileTableProps {
  data: RecordingFileListItem[];
  pagination?: Pagination;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

const ftpStatusColorMap: Record<FtpUploadStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  UPLOADING: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  COMPLETED: 'bg-green-100 text-green-800 hover:bg-green-100',
  FAILED: 'bg-red-100 text-red-800 hover:bg-red-100',
  RETRY: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
};

const ftpStatusLabelMap: Record<FtpUploadStatus, string> = {
  PENDING: '대기',
  UPLOADING: '업로드 중',
  COMPLETED: '완료',
  FAILED: '실패',
  RETRY: '재시도',
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function FileTable({ data, pagination, isLoading, onPageChange }: FileTableProps) {
  const retryMutation = useRetryUploadMutation();

  const columns = useMemo<ColumnDef<RecordingFileListItem>[]>(
    () => [
      {
        accessorKey: 'no',
        header: 'No',
        cell: ({ row }) => (
          <div className="text-center text-muted-foreground">{row.original.no}</div>
        ),
      },
      {
        accessorKey: 'fileName',
        header: '파일명',
        cell: ({ row }) => (
          <div className="font-mono text-sm max-w-[200px] truncate" title={row.original.fileName}>
            {row.original.fileName}
          </div>
        ),
      },
      {
        accessorKey: 'fileSizeFormatted',
        header: '크기',
        cell: ({ row }) => <div>{row.original.fileSizeFormatted}</div>,
      },
      {
        accessorKey: 'fileFormat',
        header: '포맷',
        cell: ({ row }) => (
          <Badge variant="outline" className="uppercase">
            {row.original.fileFormat}
          </Badge>
        ),
      },
      {
        id: 'duration',
        header: '녹화시간',
        cell: ({ row }) => <div className="font-mono">{formatDuration(row.original.fileDurationSec)}</div>,
      },
      {
        accessorKey: 'ftpStatus',
        header: 'FTP 상태',
        cell: ({ row }) => {
          const status = row.original.ftpStatus;
          return (
            <Badge className={ftpStatusColorMap[status]}>
              {ftpStatusLabelMap[status]}
            </Badge>
          );
        },
      },
      {
        id: 'ftpUploadedAt',
        header: '업로드일',
        cell: ({ row }) => <div>{formatDate(row.original.ftpUploadedAt)}</div>,
      },
      {
        accessorKey: 'sessionTitle',
        header: '강의명',
        cell: ({ row }) => (
          <div className="max-w-[160px] truncate" title={row.original.sessionTitle}>
            {row.original.sessionTitle || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'userName',
        header: '교수',
        cell: ({ row }) => <div>{row.original.userName || '-'}</div>,
      },
      {
        id: 'location',
        header: '건물/공간',
        cell: ({ row }) => (
          <div>
            {row.original.buildingName} {row.original.spaceName}
          </div>
        ),
      },
      {
        id: 'actions',
        header: '관리',
        cell: ({ row }) => {
          const file = row.original;
          const canRetry = file.ftpStatus === 'FAILED' || file.ftpStatus === 'RETRY';
          return (
            <div className="flex gap-1">
              <FileDownloadButton recFileSeq={file.recFileSeq} fileName={file.fileName} />
              {canRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    retryMutation.mutate(file.recFileSeq);
                  }}
                  disabled={retryMutation.isPending}
                  title="FTP 재업로드"
                >
                  <RefreshCw className="h-4 w-4 text-orange-600" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [retryMutation],
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
                  데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
