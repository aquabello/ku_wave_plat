'use client';

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { Eye, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
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
import type { RecorderListItem } from '@ku/types';

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface RecorderTableProps {
  data: RecorderListItem[];
  pagination?: Pagination;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onDetail: (recorder: RecorderListItem) => void;
  onEdit: (recorder: RecorderListItem) => void;
  onDelete: (recorder: RecorderListItem) => void;
}

const statusColorMap: Record<string, string> = {
  ONLINE: 'bg-green-100 text-green-800 hover:bg-green-100',
  OFFLINE: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
  ERROR: 'bg-red-100 text-red-800 hover:bg-red-100',
};

const statusLabelMap: Record<string, string> = {
  ONLINE: '온라인',
  OFFLINE: '오프라인',
  ERROR: '에러',
};

export function RecorderTable({
  data,
  pagination,
  isLoading,
  onPageChange,
  onDetail,
  onEdit,
  onDelete,
}: RecorderTableProps) {
  const columns = useMemo<ColumnDef<RecorderListItem>[]>(
    () => [
      {
        accessorKey: 'no',
        header: 'No',
        cell: ({ row }) => (
          <div className="text-center text-muted-foreground">
            {row.original.no}
          </div>
        ),
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
        accessorKey: 'recorderName',
        header: '녹화기명',
        cell: ({ row }) => (
          <div className="font-medium">{row.original.recorderName}</div>
        ),
      },
      {
        accessorKey: 'recorderIp',
        header: 'IP',
        cell: ({ row }) => (
          <div className="font-mono text-sm">{row.original.recorderIp}</div>
        ),
      },
      {
        accessorKey: 'recorderModel',
        header: '모델',
        cell: ({ row }) => (
          <div>{row.original.recorderModel || '-'}</div>
        ),
      },
      {
        accessorKey: 'recorderStatus',
        header: '상태',
        cell: ({ row }) => {
          const status = row.original.recorderStatus;
          return (
            <Badge className={statusColorMap[status]}>
              {statusLabelMap[status]}
            </Badge>
          );
        },
      },
      {
        id: 'users',
        header: '사용 중',
        cell: ({ row }) => (
          <div>
            {row.original.currentUserName || '-'}
          </div>
        ),
      },
      {
        id: 'actions',
        header: '관리',
        cell: ({ row }) => {
          const recorder = row.original;
          return (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDetail(recorder);
                }}
                title="상세보기"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(recorder);
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
                  onDelete(recorder);
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
    [onDetail, onEdit, onDelete],
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
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
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
            {Math.min(pagination.page * pagination.limit, pagination.total)}개
            표시
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
