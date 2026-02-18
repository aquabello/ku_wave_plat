'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Search, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { showToast } from '@/lib/toast';
import { getLogs, getLogDetail } from '@/lib/api/nfc';
import { getBuildings } from '@/lib/api/buildings';
import type {
  NfcLogListItem,
  NfcLogDetail,
  NfcControlDetailItem,
} from '@ku/types';

// Date formatting helper
function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

// Badge color helpers
const getLogTypeBadge = (logType: string) => {
  switch (logType) {
    case 'ENTER':
      return { className: 'bg-emerald-100 text-emerald-800', label: '입실' };
    case 'EXIT':
      return { className: 'bg-blue-100 text-blue-800', label: '퇴실' };
    case 'DENIED':
      return { className: 'bg-red-100 text-red-800', label: '거부' };
    case 'UNKNOWN':
      return { className: 'bg-amber-100 text-amber-800', label: '미등록' };
    default:
      return { className: 'bg-gray-100 text-gray-800', label: logType };
  }
};

const getControlResultBadge = (result: string) => {
  switch (result) {
    case 'SUCCESS':
      return { className: 'bg-green-100 text-green-800', label: '성공' };
    case 'FAIL':
      return { className: 'bg-red-100 text-red-800', label: '실패' };
    case 'PARTIAL':
      return { className: 'bg-orange-100 text-orange-800', label: '부분' };
    case 'SKIPPED':
      return { className: 'bg-gray-100 text-gray-800', label: '건너뜀' };
    default:
      return { className: 'bg-gray-100 text-gray-800', label: result };
  }
};

const getDetailResultBadge = (status: string) => {
  switch (status) {
    case 'SUCCESS':
      return { className: 'bg-green-100 text-green-800', label: '성공' };
    case 'FAIL':
      return { className: 'bg-red-100 text-red-800', label: '실패' };
    case 'TIMEOUT':
      return { className: 'bg-amber-100 text-amber-800', label: '타임아웃' };
    default:
      return { className: 'bg-gray-100 text-gray-800', label: status };
  }
};

export default function NfcLogsPage() {
  // Filter state
  const [search, setSearch] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('__all__');
  const [logTypeFilter, setLogTypeFilter] = useState('__all__');
  const [controlResultFilter, setControlResultFilter] = useState('__all__');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Detail dialog state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [logDetail, setLogDetail] = useState<NfcLogDetail | null>(null);

  const pageSize = 20;

  // Fetch buildings for filter dropdown
  const { data: buildingsData } = useQuery({
    queryKey: ['buildings', 'all'],
    queryFn: () => getBuildings({ page: 1, limit: 100 }),
  });

  // Fetch logs
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: [
      'nfcLogs',
      page,
      pageSize,
      search,
      buildingFilter,
      logTypeFilter,
      controlResultFilter,
      startDate,
      endDate,
    ],
    queryFn: () =>
      getLogs({
        page,
        limit: pageSize,
        search: search || undefined,
        buildingSeq:
          buildingFilter === '__all__' ? undefined : Number(buildingFilter),
        logType: logTypeFilter === '__all__' ? undefined : logTypeFilter,
        controlResult:
          controlResultFilter === '__all__'
            ? undefined
            : controlResultFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
  });

  // Handlers
  const handleViewDetail = async (nfcLogSeq: number) => {
    setDetailLoading(true);
    setDetailDialogOpen(true);
    try {
      const detail = await getLogDetail(nfcLogSeq);
      setLogDetail(detail);
    } catch (error: any) {
      showToast.apiError(error, '로그 상세 조회에 실패했습니다.');
      setDetailDialogOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const hasFilters =
    search ||
    buildingFilter !== '__all__' ||
    logTypeFilter !== '__all__' ||
    controlResultFilter !== '__all__' ||
    startDate ||
    endDate;

  const resetFilters = () => {
    setSearch('');
    setBuildingFilter('__all__');
    setLogTypeFilter('__all__');
    setControlResultFilter('__all__');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const startNum = logsData ? logsData.total - (page - 1) * pageSize : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6" />
        <h1 className="text-2xl font-bold">태깅 로그</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* Filter Row 1 */}
          <div className="mb-3 flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="log-search">통합 검색</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="log-search"
                  placeholder="사용자, 카드, 리더기 검색"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="log-building">건물 필터</Label>
              <Select
                value={buildingFilter}
                onValueChange={(value) => {
                  setBuildingFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger id="log-building">
                  <SelectValue placeholder="건물 전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">건물 전체</SelectItem>
                  {buildingsData?.items.map((b) => (
                    <SelectItem
                      key={b.buildingSeq}
                      value={String(b.buildingSeq)}
                    >
                      {b.buildingName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Label htmlFor="log-type">태깅 유형</Label>
              <Select
                value={logTypeFilter}
                onValueChange={(value) => {
                  setLogTypeFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger id="log-type">
                  <SelectValue placeholder="유형 전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">전체</SelectItem>
                  <SelectItem value="ENTER">입실</SelectItem>
                  <SelectItem value="EXIT">퇴실</SelectItem>
                  <SelectItem value="DENIED">거부</SelectItem>
                  <SelectItem value="UNKNOWN">미등록</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Label htmlFor="log-result">제어 결과</Label>
              <Select
                value={controlResultFilter}
                onValueChange={(value) => {
                  setControlResultFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger id="log-result">
                  <SelectValue placeholder="결과 전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">전체</SelectItem>
                  <SelectItem value="SUCCESS">성공</SelectItem>
                  <SelectItem value="FAIL">실패</SelectItem>
                  <SelectItem value="PARTIAL">부분</SelectItem>
                  <SelectItem value="SKIPPED">건너뜀</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter Row 2 */}
          <div className="mb-4 flex items-end gap-4">
            <div className="w-48">
              <Label htmlFor="log-start-date">시작일</Label>
              <Input
                id="log-start-date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="w-48">
              <Label htmlFor="log-end-date">종료일</Label>
              <Input
                id="log-end-date"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            {hasFilters && (
              <Button variant="outline" onClick={resetFilters}>
                필터 초기화
              </Button>
            )}
          </div>

          {/* Total count */}
          <div className="mb-4 text-sm text-muted-foreground">
            총 {logsData?.total || 0}건
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">No</TableHead>
                  <TableHead className="w-44">태깅 시각</TableHead>
                  <TableHead className="w-36">건물/공간</TableHead>
                  <TableHead className="w-36">리더기</TableHead>
                  <TableHead className="w-28">사용자</TableHead>
                  <TableHead className="w-20 text-center">유형</TableHead>
                  <TableHead className="w-32">식별값</TableHead>
                  <TableHead className="w-24 text-center">
                    제어 결과
                  </TableHead>
                  <TableHead className="w-24 text-center">장비</TableHead>
                  <TableHead className="w-16 text-center">상세</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : logsData?.items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center text-muted-foreground"
                    >
                      태깅 로그가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  logsData?.items.map((log: NfcLogListItem, index: number) => {
                    const logBadge = getLogTypeBadge(log.logType);
                    const resultBadge = log.controlResult
                      ? getControlResultBadge(log.controlResult)
                      : null;
                    return (
                      <TableRow key={log.nfcLogSeq}>
                        <TableCell>{startNum - index}</TableCell>
                        <TableCell className="text-sm">
                          {formatDateTime(log.taggedAt)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{log.buildingName}</div>
                          <div className="text-xs text-muted-foreground">
                            {log.spaceName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{log.readerName}</div>
                          <div className="text-xs text-muted-foreground">
                            {log.readerCode}
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.userName ? (
                            <div>
                              <div className="text-sm">{log.userName}</div>
                              {log.cardLabel && (
                                <div className="text-xs text-muted-foreground">
                                  {log.cardLabel}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              미등록
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={logBadge.className}>
                            {logBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="block max-w-[120px] truncate font-mono text-xs">
                            {log.tagIdentifier}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {resultBadge ? (
                            <Badge className={resultBadge.className}>
                              {resultBadge.label}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {log.controlSummary
                            ? `${log.controlSummary.successCount}/${log.controlSummary.totalDevices} 성공`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(log.nfcLogSeq)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {logsData && logsData.total > pageSize && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {page} / {Math.ceil(logsData.total / pageSize)} 페이지
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  이전
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(logsData.total / pageSize)}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onOpenChange={(open) => {
          setDetailDialogOpen(open);
          if (!open) setLogDetail(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>태깅 로그 상세</DialogTitle>
            <DialogDescription>
              태깅 이벤트의 상세 정보를 확인합니다.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : logDetail ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="mb-3 text-sm font-semibold">기본 정보</h3>
                <div className="grid grid-cols-2 gap-3 rounded-lg border p-4">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      태깅 시각
                    </div>
                    <div className="text-sm">
                      {formatDateTime(logDetail.taggedAt)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">유형</div>
                    <div>
                      <Badge
                        className={
                          getLogTypeBadge(logDetail.logType).className
                        }
                      >
                        {getLogTypeBadge(logDetail.logType).label}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      건물/공간
                    </div>
                    <div className="text-sm">
                      {logDetail.buildingName} / {logDetail.spaceName}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      리더기 (코드)
                    </div>
                    <div className="text-sm">
                      {logDetail.readerName} ({logDetail.readerCode})
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Info */}
              <div>
                <h3 className="mb-3 text-sm font-semibold">카드 정보</h3>
                <div className="grid grid-cols-2 gap-3 rounded-lg border p-4">
                  <div>
                    <div className="text-xs text-muted-foreground">사용자</div>
                    <div className="text-sm">
                      {logDetail.userName || (
                        <span className="text-muted-foreground">미등록</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      카드 별칭
                    </div>
                    <div className="text-sm">
                      {logDetail.cardLabel || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      카드 유형
                    </div>
                    <div className="text-sm">
                      {logDetail.cardType === 'CARD'
                        ? '카드'
                        : logDetail.cardType === 'PHONE'
                          ? '모바일'
                          : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">식별값</div>
                    <div className="font-mono text-xs">
                      {logDetail.tagIdentifier}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-muted-foreground">AID</div>
                    <div className="font-mono text-xs">
                      {logDetail.tagAid || (
                        <span className="font-sans text-muted-foreground">
                          -
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Control Results */}
              {logDetail.controlDetails &&
                logDetail.controlDetails.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold">
                      제어 결과
                      {logDetail.controlResult && (
                        <Badge
                          className={`ml-2 ${getControlResultBadge(logDetail.controlResult).className}`}
                        >
                          {
                            getControlResultBadge(logDetail.controlResult)
                              .label
                          }
                        </Badge>
                      )}
                    </h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>장비명</TableHead>
                            <TableHead className="w-28">명령어 유형</TableHead>
                            <TableHead className="w-24 text-center">
                              결과
                            </TableHead>
                            <TableHead>메시지</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {logDetail.controlDetails.map(
                            (detail: NfcControlDetailItem) => {
                              const dBadge = getDetailResultBadge(
                                detail.resultStatus,
                              );
                              return (
                                <TableRow key={detail.spaceDeviceSeq}>
                                  <TableCell className="text-sm">
                                    {detail.deviceName}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {detail.commandType}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge className={dBadge.className}>
                                      {dBadge.label}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {detail.resultMessage || '-'}
                                  </TableCell>
                                </TableRow>
                              );
                            },
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
