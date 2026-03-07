'use client';

import { useState } from 'react';
import { Loader2, Plus, Edit, Trash2, Star } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PresetFormDialog } from './preset-form-dialog';
import {
  useRecorderQuery,
  useDeletePresetMutation,
} from '@/hooks/use-recorders';
import type { RecorderListItem, RecorderPreset } from '@ku/types';

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

interface RecorderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recorder: RecorderListItem | null;
}

export function RecorderDetailDialog({
  open,
  onOpenChange,
  recorder,
}: RecorderDetailDialogProps) {
  const { data: detail, isLoading } = useRecorderQuery(
    recorder?.recorderSeq ?? 0,
    open && !!recorder,
  );

  if (!recorder) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>녹화기 상세정보</SheetTitle>
          <SheetDescription>
            녹화기의 상세 정보, 배정 사용자, 프리셋을 확인합니다.
          </SheetDescription>
        </SheetHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : detail ? (
          <DetailContent
            key={detail.recorderSeq}
            detail={detail}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function DetailContent({
  detail,
}: {
  detail: NonNullable<ReturnType<typeof useRecorderQuery>['data']>;
}) {
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<RecorderPreset | null>(
    null,
  );
  const { mutate: deletePreset } = useDeletePresetMutation();

  const handleAddPreset = () => {
    setEditingPreset(null);
    setPresetDialogOpen(true);
  };

  const handleEditPreset = (preset: RecorderPreset) => {
    setEditingPreset(preset);
    setPresetDialogOpen(true);
  };

  const handleDeletePreset = (preset: RecorderPreset) => {
    if (!confirm(`"${preset.presetName}" 프리셋을 삭제하시겠습니까?`)) return;
    deletePreset({
      recorderSeq: detail.recorderSeq,
      recPresetSeq: preset.recPresetSeq,
    });
  };

  return (
    <div className="mt-6 space-y-6">
      {/* 기본 정보 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">기본 정보</h3>
        <div className="grid grid-cols-2 gap-3">
          <InfoItem label="녹화기명" value={detail.recorderName} />
          <InfoItem
            label="상태"
            value={
              <Badge className={statusColorMap[detail.recorderStatus]}>
                {statusLabelMap[detail.recorderStatus]}
              </Badge>
            }
          />
          <InfoItem label="IP 주소" value={detail.recorderIp} mono />
          <InfoItem label="포트" value={String(detail.recorderPort)} />
          <InfoItem label="프로토콜" value={detail.recorderProtocol} />
          <InfoItem label="모델" value={detail.recorderModel || '-'} />
          <InfoItem
            label="건물 / 공간"
            value={`${detail.buildingName} ${detail.spaceName} (${detail.spaceFloor})`}
          />
          <InfoItem label="정렬 순서" value={String(detail.recorderOrder)} />
          <InfoItem label="사용자명" value={detail.recorderUsername || '-'} />
          <InfoItem
            label="마지막 헬스체크"
            value={
              detail.lastHealthCheck
                ? new Date(detail.lastHealthCheck).toLocaleString('ko-KR')
                : '-'
            }
          />
          <InfoItem
            label="등록일"
            value={new Date(detail.regDate).toLocaleString('ko-KR')}
          />
          <InfoItem
            label="수정일"
            value={new Date(detail.updDate).toLocaleString('ko-KR')}
          />
        </div>
      </div>

      <div className="border-t" />

      {/* 배정 사용자 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">
          배정 사용자 ({detail.assignedUsers.length}명)
        </h3>
        {detail.assignedUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            배정된 사용자가 없습니다.
          </p>
        ) : (
          <div className="space-y-2">
            {detail.assignedUsers.map((user) => (
              <div
                key={user.recorderUserSeq}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{user.tuName}</span>
                    {user.isDefault === 'Y' && (
                      <Badge
                        variant="outline"
                        className="text-xs gap-1"
                      >
                        <Star className="h-3 w-3" />
                        기본
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {user.tuEmail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t" />

      {/* 프리셋 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">
            프리셋 ({detail.presets.length}개)
          </h3>
          <Button variant="outline" size="sm" onClick={handleAddPreset}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            추가
          </Button>
        </div>
        {detail.presets.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            등록된 프리셋이 없습니다.
          </p>
        ) : (
          <div className="space-y-2">
            {detail.presets.map((preset) => (
              <div
                key={preset.recPresetSeq}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      #{preset.presetNumber} {preset.presetName}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pan: {preset.panValue} / Tilt: {preset.tiltValue} / Zoom:{' '}
                    {preset.zoomValue}
                  </p>
                  {preset.presetDescription && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {preset.presetDescription}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditPreset(preset)}
                    title="수정"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePreset(preset)}
                    title="삭제"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preset Form Dialog */}
      <PresetFormDialog
        open={presetDialogOpen}
        onOpenChange={setPresetDialogOpen}
        recorderSeq={detail.recorderSeq}
        preset={editingPreset}
      />
    </div>
  );
}

function InfoItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="p-2 rounded-lg border bg-muted/20">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className={`text-sm ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}
