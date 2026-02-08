'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Calendar,
  X,
  Clock,
  Globe,
  Monitor,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getActivityLogs, getActivityLogDetail } from '@/lib/api/activity-logs';
import type { ActivityLogListItem } from '@ku/types';

// --- 날짜 포맷 ---

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// --- HTTP 메서드 Badge 색상 ---

function getMethodBadgeClass(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'bg-blue-100 text-blue-700';
    case 'POST':
      return 'bg-green-100 text-green-700';
    case 'PUT':
      return 'bg-amber-100 text-amber-700';
    case 'DELETE':
      return 'bg-red-100 text-red-700';
    case 'PATCH':
      return 'bg-purple-100 text-purple-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

// --- 상태 코드 Badge 색상 ---

function getStatusBadgeClass(code: number | null): string {
  if (!code) return 'bg-gray-100 text-gray-700';
  if (code >= 200 && code < 300) return 'bg-green-100 text-green-700';
  if (code >= 400 && code < 500) return 'bg-amber-100 text-amber-700';
  if (code >= 500) return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-700';
}

// --- 처리시간 색상 ---

function getDurationClass(ms: number | null): string {
  if (!ms) return 'text-muted-foreground';
  if (ms < 100) return 'text-green-600';
  if (ms <= 500) return 'text-amber-600';
  return 'text-red-600';
}

// --- 메인 페이지 ---

export default function ActivityLogPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [httpMethod, setHttpMethod] = useState('');
  const [selectedLog, setSelectedLog] = useState<ActivityLogListItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // 활동 로그 목록 조회
  const { data, isLoading } = useQuery({
    queryKey: ['activityLogs', page, searchQuery, startDate, endDate, httpMethod],
    queryFn: () =>
      getActivityLogs({
        page,
        limit: 20,
        search: searchQuery || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        httpMethod: httpMethod || undefined,
      }),
  });

  // 활동 로그 상세 조회 (Sheet 열릴 때만)
  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['activityLogDetail', selectedLog?.logSeq],
    queryFn: () => getActivityLogDetail(selectedLog!.logSeq),
    enabled: !!selectedLog && sheetOpen,
  });

  const logs = data?.items ?? [];

  // 빠른 날짜 필터 핸들러
  const handleQuickDate = (days: number) => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - days);
    setStartDate(toDateStr(start));
    setEndDate(toDateStr(today));
    setPage(1);
  };

  const handleTodayFilter = () => {
    const today = toDateStr(new Date());
    setStartDate(today);
    setEndDate(today);
    setPage(1);
  };

  const handleResetFilter = () => {
    setStartDate('');
    setEndDate('');
    setHttpMethod('');
    setSearchInput('');
    setSearchQuery('');
    setPage(1);
  };

  const handleRowClick = (log: ActivityLogListItem) => {
    setSelectedLog(log);
    setSheetOpen(true);
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setSelectedLog(null);
  };

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">활동 로그</h1>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardContent className="pt-6">
          {/* Row 1: 검색 */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="아이디, 이름으로 검색"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchQuery(searchInput);
                    setPage(1);
                  }
                }}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery(searchInput);
                setPage(1);
              }}
            >
              <Search className="mr-2 h-4 w-4" />
              검색
            </Button>
            <div className="text-sm text-muted-foreground">
              총{' '}
              <span className="font-semibold text-foreground">
                {data?.total ?? 0}
              </span>
              건
            </div>
          </div>

          {/* Row 2: 필터 칩 */}
          <div className="flex items-center gap-3 mt-3">
            {/* 날짜 범위 */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-[140px]"
              />
              <span className="text-muted-foreground">~</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-[140px]"
              />
            </div>

            {/* 빠른 날짜 버튼 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleTodayFilter}
            >
              오늘
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDate(7)}
            >
              7일
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDate(30)}
            >
              30일
            </Button>

            {/* HTTP 메서드 필터 */}
            <Select
              value={httpMethod}
              onValueChange={(value) => {
                setHttpMethod(value === '전체' ? '' : value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="전체">전체</SelectItem>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>

            {/* 필터 초기화 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilter}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 로그 테이블 */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">No.</TableHead>
                <TableHead className="w-[150px]">사용자</TableHead>
                <TableHead>행위명</TableHead>
                <TableHead className="w-[100px] text-center">메서드</TableHead>
                <TableHead className="w-[100px] text-center">상태</TableHead>
                <TableHead className="w-[100px] text-center">처리시간</TableHead>
                <TableHead className="w-[180px] text-center">발생일시</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    로딩 중...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    {searchQuery || startDate || endDate || httpMethod
                      ? '검색 결과가 없습니다'
                      : '활동 로그가 없습니다'}
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow
                    key={log.logSeq}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(log)}
                  >
                    <TableCell className="font-medium text-muted-foreground">
                      {log.no}
                    </TableCell>
                    <TableCell>
                      {log.tuName ? (
                        <div>
                          <div className="font-semibold">{log.tuName}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {log.tuId}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.actionName ? (
                        <span className="text-sm">{log.actionName}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono">
                          {log.requestUrl.length > 40
                            ? `...${log.requestUrl.slice(-40)}`
                            : log.requestUrl}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className={getMethodBadgeClass(log.httpMethod)}
                      >
                        {log.httpMethod}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {log.statusCode !== null ? (
                        <Badge
                          variant="secondary"
                          className={getStatusBadgeClass(log.statusCode)}
                        >
                          {log.statusCode}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {log.durationMs !== null ? (
                        <span className={`text-sm font-medium ${getDurationClass(log.durationMs)}`}>
                          {log.durationMs}ms
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {formatDateTime(log.regDate)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* 페이징 */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                이전
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                다음
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 상세 정보 Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="pb-6">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <Monitor className="h-5 w-5 text-konkuk-green" />
              활동 로그 상세
            </SheetTitle>
            <SheetDescription>
              {selectedLog?.actionName || selectedLog?.requestUrl || '로그 상세 정보'}
            </SheetDescription>
          </SheetHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              로딩 중...
            </div>
          ) : detailData ? (
            <div className="space-y-6 px-1">
              {/* 요약 정보 */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  기본 정보
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">사용자</Label>
                    <div className="text-sm">
                      {detailData.tuName ? (
                        <>
                          <div className="font-semibold">{detailData.tuName}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {detailData.tuId}
                          </div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">행위명</Label>
                    <div className="text-sm">
                      {detailData.actionName || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">메서드</Label>
                    <div>
                      <Badge
                        variant="secondary"
                        className={getMethodBadgeClass(detailData.httpMethod)}
                      >
                        {detailData.httpMethod}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">상태 코드</Label>
                    <div>
                      {detailData.statusCode !== null ? (
                        <Badge
                          variant="secondary"
                          className={getStatusBadgeClass(detailData.statusCode)}
                        >
                          {detailData.statusCode}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">처리 시간</Label>
                    <div className="text-sm">
                      {detailData.durationMs !== null ? (
                        <span className={`font-medium ${getDurationClass(detailData.durationMs)}`}>
                          <Clock className="inline h-3 w-3 mr-1" />
                          {detailData.durationMs}ms
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">IP 주소</Label>
                    <div className="text-sm font-mono">
                      {detailData.ipAddress ? (
                        <>
                          <Globe className="inline h-3 w-3 mr-1 text-muted-foreground" />
                          {detailData.ipAddress}
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label className="text-muted-foreground">URL</Label>
                    <div className="text-xs font-mono bg-muted p-2 rounded break-all">
                      {detailData.requestUrl}
                    </div>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label className="text-muted-foreground">발생 일시</Label>
                    <div className="text-sm">{formatDateTime(detailData.regDate)}</div>
                  </div>
                </div>
              </div>

              {/* 요청 데이터 */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  요청 데이터
                </h3>
                {detailData.requestBody && Object.keys(detailData.requestBody).length > 0 ? (
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-64 overflow-y-auto">
                    <code>{JSON.stringify(detailData.requestBody, null, 2)}</code>
                  </pre>
                ) : (
                  <div className="text-sm text-muted-foreground py-4 text-center">
                    데이터 없음
                  </div>
                )}
              </div>

              {/* 응답 데이터 */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  응답 데이터
                </h3>
                {detailData.responseBody && Object.keys(detailData.responseBody).length > 0 ? (
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-64 overflow-y-auto">
                    <code>{JSON.stringify(detailData.responseBody, null, 2)}</code>
                  </pre>
                ) : (
                  <div className="text-sm text-muted-foreground py-4 text-center">
                    데이터 없음
                  </div>
                )}
              </div>

              {/* User-Agent */}
              {detailData.userAgent && (
                <div className="space-y-2 pt-4 border-t">
                  <Label className="text-xs text-muted-foreground">User-Agent</Label>
                  <div className="text-xs text-muted-foreground font-mono break-all">
                    {detailData.userAgent}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <div className="flex gap-3 pt-6 border-t mt-6">
            <Button variant="outline" className="flex-1" onClick={handleSheetClose}>
              닫기
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
