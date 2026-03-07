'use client';

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
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
import type { SpeechSessionListItem } from '@ku/types';

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SpeechSessionTableProps {
  data: SpeechSessionListItem[];
  pagination?: Pagination;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onDetail: (item: SpeechSessionListItem) => void;
}

const statusColorMap: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 hover:bg-green-100',
  PAUSED: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  ENDED: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
};

const statusLabelMap: Record<string, string> = {
  ACTIVE: '진행 중',
  PAUSED: '일시정지',
  ENDED: '종료',
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return '-';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}시간 ${m}분`;
  if (m > 0) return `${m}분 ${s}초`;
  return `${s}초`;
}

export function SpeechSessionTable({
  data,
  pagination,
  isLoading,
  onPageChange,
  onDetail,
}: SpeechSessionTableProps) {
  const columns = useMemo<ColumnDef<SpeechSessionListItem>[]>(
    () => [
      {
        accessorKey: 'no',
        header: 'No',
        cell: ({ row }) => (
          <div className="text-center text-muted-foreground">{row.original.no}</div>
        ),
      },
      {
        id: 'location',
        header: '건물/공간',
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.buildingName} {row.original.spaceName}
          </div>
        ),
      },
      {
        accessorKey: 'userName',
        header: '강의자',
        cell: ({ row }) => <div>{row.original.userName || '-'}</div>,
      },
      {
        accessorKey: 'sessionStatus',
        header: '상태',
        cell: ({ row }) => {
          const status = row.original.sessionStatus;
          return (
            <Badge className={statusColorMap[status]}>
              {statusLabelMap[status] || status}
            </Badge>
          );
        },
      },
      {
        id: 'engine',
        header: 'STT 엔진',
        cell: ({ row }) => (
          <div className="text-xs font-mono">
            {row.original.sttEngine} / {row.original.sttModel}
          </div>
        ),
      },
      {
        accessorKey: 'startedAt',
        header: '시작 시간',
        cell: ({ row }) => (
          <div className="text-sm">
            {new Date(row.original.startedAt).toLocaleString('ko-KR')}
          </div>
        ),
      },
      {
        id: 'duration',
        header: '소요 시간',
        cell: ({ row }) => (
          <div className="text-sm">{formatDuration(row.original.totalDurationSec)}</div>
        ),
      },
      {
        id: 'stats',
        header: '세그먼트/명령',
        cell: ({ row }) => (
          <div className="text-sm">
            <span>{row.original.totalSegments}건</span>
            <span className="text-muted-foreground"> / </span>
            <span className="text-orange-600">{row.original.totalCommands}건</span>
          </div>
        ),
      },
      {
        id: 'actions',
        header: '관리',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDetail(row.original);
            }}
            title="상세보기"
          >
            <Eye className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [onDetail],
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => onDetail(row.original)}
                >
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
