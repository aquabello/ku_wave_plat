'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CheckCircle, XCircle, RotateCcw, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useApprovalHistoryQuery } from '@/hooks/use-content-approvals';
import type { ContentApprovalHistoryItem } from '@ku/types';

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plcSeq: number | null;
  contentName?: string;
}

const actionConfig: Record<
  ContentApprovalHistoryItem['action'],
  { label: string; icon: React.ReactNode; color: string; bgColor: string }
> = {
  APPROVED: {
    label: '승인',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'text-green-700',
    bgColor: 'bg-green-100 border-green-300',
  },
  REJECTED: {
    label: '반려',
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-red-700',
    bgColor: 'bg-red-100 border-red-300',
  },
  CANCELLED: {
    label: '취소',
    icon: <RotateCcw className="h-4 w-4" />,
    color: 'text-gray-700',
    bgColor: 'bg-gray-100 border-gray-300',
  },
};

export function HistoryDialog({
  open,
  onOpenChange,
  plcSeq,
  contentName,
}: HistoryDialogProps) {
  const { data: history, isLoading } = useApprovalHistoryQuery(open ? plcSeq : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>승인 이력</DialogTitle>
          {contentName && (
            <DialogDescription className="truncate">{contentName}</DialogDescription>
          )}
        </DialogHeader>

        <div className="py-2 max-h-[440px] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !history || history.length === 0 ? (
            <div className="flex justify-center items-center h-32 text-sm text-muted-foreground">
              승인 이력이 없습니다.
            </div>
          ) : (
            <ol className="relative border-l border-gray-200 ml-4">
              {history.map((item, idx) => {
                const config = actionConfig[item.action];
                return (
                  <li key={item.history_seq ?? idx} className="mb-6 ml-6">
                    {/* Timeline dot */}
                    <span
                      className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white ${config.bgColor} ${config.color}`}
                    >
                      {config.icon}
                    </span>

                    <div className={`rounded-lg border p-3 ${config.bgColor}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-semibold text-sm ${config.color}`}>
                          {config.label}
                        </span>
                        <time className="text-xs text-muted-foreground">
                          {format(new Date(item.created_at), 'yyyy.MM.dd HH:mm', {
                            locale: ko,
                          })}
                        </time>
                      </div>
                      <p className="text-sm text-gray-700">
                        처리자: <span className="font-medium">{item.actor_name}</span>
                      </p>
                      {item.reason && (
                        <p className="text-sm text-gray-600 mt-1 break-words">
                          사유: {item.reason}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
