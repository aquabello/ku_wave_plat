'use client';

import { useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { ApprovalStats } from './components/approval-stats';
import { ApprovalFilters } from './components/approval-filters';
import { ApprovalTable } from './components/approval-table';
import { RejectDialog } from './components/reject-dialog';
import { HistoryDialog } from './components/history-dialog';
import {
  useContentApprovalsQuery,
  useApproveContentMutation,
  useRejectContentMutation,
  useCancelApprovalMutation,
} from '@/hooks/use-content-approvals';
import type { ContentApprovalFilter } from '@ku/types';

export default function ContentApprovalPage() {
  // Filter state (draft — applied on search button click)
  const [draftFilter, setDraftFilter] = useState<ContentApprovalFilter>({});
  const [appliedFilter, setAppliedFilter] = useState<ContentApprovalFilter>({});

  // Dialog states
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTargetSeq, setRejectTargetSeq] = useState<number | null>(null);

  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyTargetSeq, setHistoryTargetSeq] = useState<number | null>(null);
  const [historyContentName, setHistoryContentName] = useState<string>('');

  // Data fetching
  const { data, isLoading } = useContentApprovalsQuery(appliedFilter);
  const items = data?.items ?? [];
  const stats = data?.stats ?? { total: 0, pending: 0, approved: 0, rejected: 0 };

  // Mutations
  const approveMutation = useApproveContentMutation();
  const rejectMutation = useRejectContentMutation();
  const cancelMutation = useCancelApprovalMutation();

  // Handlers
  const handleSearch = () => {
    setAppliedFilter(draftFilter);
  };

  const handleApprove = (plcSeq: number) => {
    approveMutation.mutate(plcSeq);
  };

  const handleRejectOpen = (plcSeq: number) => {
    setRejectTargetSeq(plcSeq);
    setRejectDialogOpen(true);
  };

  const handleRejectSubmit = (reason: string) => {
    if (rejectTargetSeq === null) return;
    rejectMutation.mutate(
      { plcSeq: rejectTargetSeq, reason },
      {
        onSuccess: () => {
          setRejectDialogOpen(false);
          setRejectTargetSeq(null);
        },
      }
    );
  };

  const handleCancel = (plcSeq: number) => {
    cancelMutation.mutate(plcSeq);
  };

  const handleViewHistory = (plcSeq: number, contentName: string) => {
    setHistoryTargetSeq(plcSeq);
    setHistoryContentName(contentName);
    setHistoryDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">콘텐츠 승인 관리</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            업로드된 콘텐츠를 검토하고 승인 또는 반려할 수 있습니다.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <ApprovalStats stats={stats} />

      {/* Filter Bar */}
      <ApprovalFilters
        filter={draftFilter}
        onFilterChange={setDraftFilter}
        onSearch={handleSearch}
      />

      {/* Total count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              로딩 중...
            </span>
          ) : (
            `총 ${items.length}개`
          )}
        </p>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ApprovalTable
          items={items}
          onApprove={handleApprove}
          onReject={handleRejectOpen}
          onCancel={handleCancel}
          onViewHistory={handleViewHistory}
          isPendingApprove={approveMutation.isPending}
          isPendingReject={rejectMutation.isPending}
          isPendingCancel={cancelMutation.isPending}
        />
      )}

      {/* Reject Dialog */}
      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={(open) => {
          setRejectDialogOpen(open);
          if (!open) setRejectTargetSeq(null);
        }}
        onSubmit={handleRejectSubmit}
        isPending={rejectMutation.isPending}
      />

      {/* History Dialog */}
      <HistoryDialog
        open={historyDialogOpen}
        onOpenChange={(open) => {
          setHistoryDialogOpen(open);
          if (!open) {
            setHistoryTargetSeq(null);
            setHistoryContentName('');
          }
        }}
        plcSeq={historyTargetSeq}
        contentName={historyContentName}
      />
    </div>
  );
}
