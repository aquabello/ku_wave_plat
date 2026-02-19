'use client';

import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CheckCircle, XCircle, RotateCcw, History, AlertCircle } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { ContentApprovalItem, ApprovalStatus } from '@ku/types';

/** 콘텐츠 유형 라벨 */
const contentTypeLabels: Record<string, string> = {
  VIDEO: '영상',
  IMAGE: '이미지',
  HTML: 'HTML',
  STREAM: '스트림',
};

/** 승인 상태 배지 설정 */
const statusConfig: Record<ApprovalStatus, { label: string; className: string }> = {
  PENDING: {
    label: '대기중',
    className: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  },
  APPROVED: {
    label: '승인됨',
    className: 'bg-green-100 text-green-800 hover:bg-green-100',
  },
  REJECTED: {
    label: '반려됨',
    className: 'bg-red-100 text-red-800 hover:bg-red-100',
  },
};

interface RejectReasonDialogProps {
  open: boolean;
  onClose: () => void;
  contentName: string;
  reason: string;
}

function RejectReasonDialog({ open, onClose, contentName, reason }: RejectReasonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            반려 사유
          </DialogTitle>
          <DialogDescription className="truncate">{contentName}</DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <p className="text-sm text-gray-700 break-words whitespace-pre-wrap">{reason}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ApprovalTableProps {
  items: ContentApprovalItem[];
  onApprove: (plcSeq: number) => void;
  onReject: (plcSeq: number) => void;
  onCancel: (plcSeq: number) => void;
  onViewHistory: (plcSeq: number, contentName: string) => void;
  isPendingApprove?: boolean;
  isPendingReject?: boolean;
  isPendingCancel?: boolean;
}

export function ApprovalTable({
  items,
  onApprove,
  onReject,
  onCancel,
  onViewHistory,
  isPendingApprove = false,
  isPendingReject = false,
  isPendingCancel = false,
}: ApprovalTableProps) {
  const [rejectReasonItem, setRejectReasonItem] = useState<ContentApprovalItem | null>(null);

  const columns = useMemo<ColumnDef<ContentApprovalItem>[]>(
    () => [
      {
        id: 'index',
        header: '번호',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">{row.index + 1}</div>
        ),
      },
      {
        accessorKey: 'building_name',
        header: '건물명',
        cell: ({ row }) => (
          <div className="text-sm">{row.original.building_name ?? '-'}</div>
        ),
      },
      {
        accessorKey: 'player_name',
        header: '플레이어명',
        cell: ({ row }) => (
          <div className="text-sm">{row.original.player_name ?? '-'}</div>
        ),
      },
      {
        accessorKey: 'playlist_name',
        header: '리스트명',
        cell: ({ row }) => (
          <div className="text-sm font-medium">{row.original.playlist_name}</div>
        ),
      },
      {
        accessorKey: 'content_name',
        header: '콘텐츠명',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{item.content_name}</span>
              {item.approval_status === 'REJECTED' && item.reject_reason && (
                <button
                  type="button"
                  className="text-xs text-red-500 underline hover:text-red-700 self-start flex items-center gap-0.5"
                  onClick={() => setRejectReasonItem(item)}
                >
                  <AlertCircle className="h-3 w-3" />
                  반려 사유 보기
                </button>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'content_type',
        header: '유형',
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs">
            {contentTypeLabels[row.original.content_type] ?? row.original.content_type}
          </Badge>
        ),
      },
      {
        accessorKey: 'requester_name',
        header: '요청자',
        cell: ({ row }) => (
          <div className="text-sm">{row.original.requester_name}</div>
        ),
      },
      {
        accessorKey: 'reg_date',
        header: '등록일',
        cell: ({ row }) => (
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {row.original.reg_date
              ? format(new Date(row.original.reg_date), 'yyyy.MM.dd', { locale: ko })
              : '-'}
          </div>
        ),
      },
      {
        accessorKey: 'approval_status',
        header: '승인상태',
        cell: ({ row }) => {
          const status = row.original.approval_status;
          const config = statusConfig[status];
          return <Badge className={config.className}>{config.label}</Badge>;
        },
      },
      {
        accessorKey: 'reviewer_name',
        header: '승인/반려자',
        cell: ({ row }) => (
          <div className="text-sm">{row.original.reviewer_name ?? '-'}</div>
        ),
      },
      {
        accessorKey: 'reviewed_date',
        header: '승인/반려일',
        cell: ({ row }) => (
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {row.original.reviewed_date
              ? format(new Date(row.original.reviewed_date), 'yyyy.MM.dd', { locale: ko })
              : '-'}
          </div>
        ),
      },
      {
        id: 'actions',
        header: '작업',
        cell: ({ row }) => {
          const item = row.original;
          const status = item.approval_status;

          return (
            <div className="flex items-center gap-1 flex-wrap min-w-[160px]">
              {status === 'PENDING' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs text-green-700 border-green-300 hover:bg-green-50"
                    onClick={() => onApprove(item.plc_seq)}
                    disabled={isPendingApprove}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    승인
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs text-red-700 border-red-300 hover:bg-red-50"
                    onClick={() => onReject(item.plc_seq)}
                    disabled={isPendingReject}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    반려
                  </Button>
                </>
              )}

              {status === 'APPROVED' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                  onClick={() => onCancel(item.plc_seq)}
                  disabled={isPendingCancel}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  승인취소
                </Button>
              )}

              {status === 'REJECTED' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                  onClick={() => onCancel(item.plc_seq)}
                  disabled={isPendingCancel}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  반려취소
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900"
                onClick={() => onViewHistory(item.plc_seq, item.content_name)}
                title="이력보기"
              >
                <History className="h-3 w-3 mr-1" />
                이력보기
              </Button>
            </div>
          );
        },
      },
    ],
    [onApprove, onReject, onCancel, onViewHistory, isPendingApprove, isPendingReject, isPendingCancel]
  );

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap text-xs">
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
                <TableRow key={row.id} className="hover:bg-muted/40">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground text-sm"
                >
                  데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 반려 사유 보기 Dialog */}
      {rejectReasonItem && (
        <RejectReasonDialog
          open={rejectReasonItem !== null}
          onClose={() => setRejectReasonItem(null)}
          contentName={rejectReasonItem.content_name}
          reason={rejectReasonItem.reject_reason ?? ''}
        />
      )}
    </>
  );
}
