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
import type { LectureSummaryListItem } from '@ku/types';

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface LectureSummaryTableProps {
  data: LectureSummaryListItem[];
  pagination?: Pagination;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onDetail: (item: LectureSummaryListItem) => void;
}

const statusColorMap: Record<string, string> = {
  UPLOADING: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  PROCESSING: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  COMPLETED: 'bg-green-100 text-green-800 hover:bg-green-100',
  FAILED: 'bg-red-100 text-red-800 hover:bg-red-100',
};

const statusLabelMap: Record<string, string> = {
  UPLOADING: '업로드 중',
  PROCESSING: '처리 중',
  COMPLETED: '완료',
  FAILED: '실패',
};

export function LectureSummaryTable({
  data,
  pagination,
  isLoading,
  onPageChange,
  onDetail,
}: LectureSummaryTableProps) {
  const columns = useMemo<ColumnDef<LectureSummaryListItem>[]>(
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
        accessorKey: 'recordingTitle',
        header: '강의 제목',
        cell: ({ row }) => (
          <div className="font-medium max-w-[200px] truncate">
            {row.original.recordingTitle || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'userName',
        header: '강의자',
        cell: ({ row }) => <div>{row.original.userName || '-'}</div>,
      },
      {
        accessorKey: 'durationFormatted',
        header: '녹음 시간',
        cell: ({ row }) => <div>{row.original.durationFormatted || '-'}</div>,
      },
      {
        accessorKey: 'recordedAt',
        header: '녹음일',
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.recordedAt
              ? new Date(row.original.recordedAt).toLocaleDateString('ko-KR')
              : '-'}
          </div>
        ),
      },
      {
        accessorKey: 'processStatus',
        header: '상태',
        cell: ({ row }) => {
          const status = row.original.processStatus;
          return (
            <Badge className={statusColorMap[status]}>
              {statusLabelMap[status] || status}
            </Badge>
          );
        },
      },
      {
        id: 'keywords',
        header: '키워드',
        cell: ({ row }) => {
          const keywords = row.original.summaryKeywords;
          if (!keywords?.length) return <div className="text-muted-foreground">-</div>;
          return (
            <div className="flex flex-wrap gap-1 max-w-[200px]">
              {keywords.slice(0, 3).map((kw: string) => (
                <Badge key={kw} variant="outline" className="text-xs">
                  {kw}
                </Badge>
              ))}
              {keywords.length > 3 && (
                <span className="text-xs text-muted-foreground">+{keywords.length - 3}</span>
              )}
            </div>
          );
        },
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
