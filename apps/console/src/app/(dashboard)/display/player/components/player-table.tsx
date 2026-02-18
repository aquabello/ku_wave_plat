'use client';

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Edit, CheckCircle, XCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
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
import type { PlayerListItem } from '@ku/types';

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PlayerTableProps {
  data: PlayerListItem[];
  pagination?: Pagination;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onEdit: (player: PlayerListItem) => void;
  onDelete: (player: PlayerListItem) => void;
  onApprove: (player: PlayerListItem) => void;
  onReject: (player: PlayerListItem) => void;
}

export function PlayerTable({
  data,
  pagination,
  isLoading,
  onPageChange,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}: PlayerTableProps) {

  const columns = useMemo<ColumnDef<PlayerListItem>[]>(
    () => [
      {
        accessorKey: 'building',
        header: '건물',
        cell: ({ row }) => <div>{row.original.building.building_name}</div>,
      },
      {
        accessorKey: 'player_name',
        header: '플레이어명',
        cell: ({ row }) => (
          <div className="font-medium">{row.original.player_name}</div>
        ),
      },
      {
        accessorKey: 'player_code',
        header: '코드',
        cell: ({ row }) => (
          <div className="font-mono text-sm">{row.original.player_code}</div>
        ),
      },
      {
        accessorKey: 'player_ip',
        header: 'IP',
        cell: ({ row }) => (
          <div className="font-mono text-sm">{row.original.player_ip}</div>
        ),
      },
      {
        accessorKey: 'playlist',
        header: '플레이리스트',
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate">
            {row.original.playlist?.playlist_name || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'player_status',
        header: '연결 상태',
        cell: ({ row }) => {
          const status = row.original.player_status;
          const colorMap = {
            ONLINE: 'bg-green-100 text-green-800 hover:bg-green-100',
            OFFLINE: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
            ERROR: 'bg-red-100 text-red-800 hover:bg-red-100',
            MAINTENANCE: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
          };
          const labelMap = {
            ONLINE: '온라인',
            OFFLINE: '오프라인',
            ERROR: '에러',
            MAINTENANCE: '점검',
          };
          return (
            <Badge className={colorMap[status]}>
              {labelMap[status]}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'player_approval',
        header: '승인 상태',
        cell: ({ row }) => {
          const approval = row.original.player_approval;
          const colorMap = {
            PENDING: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
            APPROVED: 'bg-green-100 text-green-800 hover:bg-green-100',
            REJECTED: 'bg-red-100 text-red-800 hover:bg-red-100',
          };
          const labelMap = {
            PENDING: '승인 대기',
            APPROVED: '승인 완료',
            REJECTED: '반려',
          };
          return (
            <Badge className={colorMap[approval]}>
              {labelMap[approval]}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'last_heartbeat_at',
        header: '마지막 호출',
        cell: ({ row }) => {
          const lastHeartbeat = row.original.last_heartbeat_at;
          if (!lastHeartbeat) return <div className="text-sm text-muted-foreground">-</div>;
          return (
            <div className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(lastHeartbeat), {
                addSuffix: true,
                locale: ko,
              })}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: '관리',
        cell: ({ row }) => {
          const player = row.original;
          return (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(player)}
                title="수정"
              >
                <Edit className="h-4 w-4" />
              </Button>
              {player.player_approval === 'PENDING' && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onApprove(player)}
                    title="승인"
                  >
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReject(player)}
                    title="반려"
                  >
                    <XCircle className="h-4 w-4 text-orange-600" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(player)}
                title="삭제"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete, onApprove, onReject]
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

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            총 {pagination.total}개 중{' '}
            {((pagination.page - 1) * pagination.limit) + 1}-
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
