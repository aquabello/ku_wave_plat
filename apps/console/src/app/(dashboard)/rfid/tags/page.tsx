'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Tag,
  Search,
  Pencil,
  Trash2,
  ShieldBan,
  ShieldCheck,
  Loader2,
  UserCheck,
  Radio,
  Square,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  getCards,
  getCard,
  createCard,
  updateCard,
  deleteCard,
  getUnregisteredTags,
} from '@/lib/api/nfc';
import { getUsers } from '@/lib/api/members';
import { useNfcWebSocket } from '@/hooks/useNfcWebSocket';
import type {
  NfcCardListItem,
  UnregisteredTagItem,
  CreateNfcCardRequest,
  UpdateNfcCardRequest,
  NfcTagResponse,
  NfcWsTagEventData,
} from '@ku/types';

// ==================== Zod Schemas ====================

const approvalFormSchema = z.object({
  tuSeq: z.coerce.number().min(1, '사용자를 선택해주세요'),
  cardLabel: z.string().optional(),
  cardType: z.string().min(1, '카드 유형을 선택해주세요'),
});

type ApprovalFormData = z.infer<typeof approvalFormSchema>;

const cardEditFormSchema = z.object({
  tuSeq: z.coerce.number().optional(),
  cardAid: z.string().optional(),
  cardLabel: z.string().optional(),
  cardType: z.string().optional(),
  cardStatus: z.string().optional(),
});

type CardEditFormData = z.infer<typeof cardEditFormSchema>;

// ==================== Badge Helpers ====================

const getCardTypeBadge = (type: string) => {
  switch (type) {
    case 'CARD':
      return <Badge className="bg-blue-100 text-blue-800">CARD</Badge>;
    case 'PHONE':
      return <Badge className="bg-purple-100 text-purple-800">PHONE</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800">{type}</Badge>;
  }
};

const getCardStatusBadge = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return <Badge className="bg-green-100 text-green-800">활성</Badge>;
    case 'INACTIVE':
      return <Badge className="bg-gray-100 text-gray-800">비활성</Badge>;
    case 'BLOCKED':
      return <Badge className="bg-red-100 text-red-800">차단</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
  }
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ==================== Page Component ====================

export default function NfcTagManagementPage() {
  const queryClient = useQueryClient();
  const pageSize = 10;

  // ---- Tab state ----
  const [activeTab, setActiveTab] = useState('unregistered');

  // ---- Unregistered tags state ----
  const [unregPage, setUnregPage] = useState(1);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<UnregisteredTagItem | null>(null);

  // ---- Registered cards state ----
  const [cardPage, setCardPage] = useState(1);
  const [cardSearch, setCardSearch] = useState('');
  const [cardTypeFilter, setCardTypeFilter] = useState('__all__');
  const [cardStatusFilter, setCardStatusFilter] = useState('__all__');
  const [cardSheetOpen, setCardSheetOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<NfcCardListItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<NfcCardListItem | null>(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [cardToBlock, setCardToBlock] = useState<NfcCardListItem | null>(null);

  // ==================== AID Test State (WebSocket) ====================
  const [wsUrl, setWsUrl] = useState('ws://localhost:9100');
  const [testAid, setTestAid] = useState('');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [testResult, setTestResult] = useState<NfcTagResponse | null>(null);
  const [testHistory, setTestHistory] = useState<Array<{
    id: number;
    timestamp: string;
    identifier: string;
    aid: string;
    response: NfcTagResponse;
  }>>([]);
  const testCounterRef = useRef(0);

  const { status: wsStatus, readerName: wsReaderName } = useNfcWebSocket({
    url: wsUrl,
    enabled: isMonitoring,
    onTagEvent: (data: NfcWsTagEventData, timestamp: string) => {
      setTestResult(data.response);
      testCounterRef.current += 1;
      setTestHistory(prev => [{
        id: testCounterRef.current,
        timestamp: new Date(timestamp).toLocaleString('ko-KR'),
        identifier: data.request.identifier,
        aid: data.request.aid || '',
        response: data.response,
      }, ...prev].slice(0, 50));
    },
  });

  // ==================== Queries ====================

  // Unregistered tags
  const { data: unregData, isLoading: unregLoading } = useQuery({
    queryKey: ['unregisteredTags', unregPage],
    queryFn: () => getUnregisteredTags({ page: unregPage, limit: pageSize }),
  });

  // Registered cards
  const { data: cardsData, isLoading: cardsLoading } = useQuery({
    queryKey: ['nfcCards', cardPage, cardSearch, cardTypeFilter, cardStatusFilter],
    queryFn: () =>
      getCards({
        page: cardPage,
        limit: pageSize,
        search: cardSearch || undefined,
        type: cardTypeFilter === '__all__' ? undefined : cardTypeFilter,
        status: cardStatusFilter === '__all__' ? undefined : cardStatusFilter,
      }),
  });

  // Users for approval / edit dropdowns
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers({ limit: 100 }),
  });


  // ==================== Forms ====================

  const approvalForm = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalFormSchema),
    defaultValues: {
      tuSeq: 0,
      cardLabel: '',
      cardType: 'CARD',
    },
  });

  const editForm = useForm<CardEditFormData>({
    resolver: zodResolver(cardEditFormSchema),
    defaultValues: {
      tuSeq: undefined,
      cardAid: '',
      cardLabel: '',
      cardType: '',
      cardStatus: '',
    },
  });

  // ==================== Mutations ====================

  // Approve (create card)
  const createCardMutation = useMutation({
    mutationFn: (data: CreateNfcCardRequest) => createCard(data),
    onSuccess: () => {
      showToast.success('카드가 승인 등록되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['unregisteredTags'] });
      queryClient.invalidateQueries({ queryKey: ['nfcCards'] });
      setApprovalDialogOpen(false);
      setSelectedTag(null);
      approvalForm.reset();
    },
    onError: (error: any) => {
      showToast.apiError(error, '카드 승인에 실패했습니다.');
    },
  });

  // Update card
  const updateCardMutation = useMutation({
    mutationFn: ({ cardSeq, data }: { cardSeq: number; data: UpdateNfcCardRequest }) =>
      updateCard(cardSeq, data),
    onSuccess: () => {
      showToast.success('카드 정보가 수정되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['nfcCards'] });
      setCardSheetOpen(false);
      setEditingCard(null);
      editForm.reset();
    },
    onError: (error: any) => {
      showToast.apiError(error, '카드 수정에 실패했습니다.');
    },
  });

  // Delete card
  const deleteCardMutation = useMutation({
    mutationFn: (cardSeq: number) => deleteCard(cardSeq),
    onSuccess: () => {
      showToast.delete('카드 삭제', '카드가 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['nfcCards'] });
      setDeleteDialogOpen(false);
      setCardToDelete(null);
    },
    onError: (error: any) => {
      showToast.apiError(error, '카드 삭제에 실패했습니다.');
      setDeleteDialogOpen(false);
      setCardToDelete(null);
    },
  });

  // Block / Unblock card
  const blockCardMutation = useMutation({
    mutationFn: ({ cardSeq, status }: { cardSeq: number; status: 'BLOCKED' | 'ACTIVE' }) =>
      updateCard(cardSeq, { cardStatus: status }),
    onSuccess: (_data, variables) => {
      const msg = variables.status === 'BLOCKED' ? '카드가 차단되었습니다.' : '카드 차단이 해제되었습니다.';
      showToast.success(msg);
      queryClient.invalidateQueries({ queryKey: ['nfcCards'] });
      setBlockDialogOpen(false);
      setCardToBlock(null);
    },
    onError: (error: any) => {
      showToast.apiError(error, '카드 상태 변경에 실패했습니다.');
      setBlockDialogOpen(false);
      setCardToBlock(null);
    },
  });


  // ==================== Handlers ====================

  // -- Approval --
  const handleOpenApproval = (tag: UnregisteredTagItem) => {
    setSelectedTag(tag);
    approvalForm.reset({
      tuSeq: 0,
      cardLabel: '',
      cardType: 'CARD',
    });
    setApprovalDialogOpen(true);
  };

  const handleApprovalSubmit = (data: ApprovalFormData) => {
    if (!selectedTag) return;
    const payload: CreateNfcCardRequest = {
      tuSeq: data.tuSeq,
      cardIdentifier: selectedTag.tagIdentifier,
      cardAid: selectedTag.tagAid || undefined,
      cardLabel: data.cardLabel || undefined,
      cardType: data.cardType as 'CARD' | 'PHONE',
    };
    createCardMutation.mutate(payload);
  };

  // -- Edit card --
  const handleEditCard = async (card: NfcCardListItem) => {
    try {
      const detail = await getCard(card.cardSeq);
      setEditingCard(card);
      editForm.reset({
        tuSeq: detail.tuSeq,
        cardAid: detail.cardAid || '',
        cardLabel: detail.cardLabel || '',
        cardType: detail.cardType,
        cardStatus: detail.cardStatus,
      });
      setCardSheetOpen(true);
    } catch (error: any) {
      showToast.apiError(error, '카드 조회에 실패했습니다.');
    }
  };

  const handleEditSubmit = (data: CardEditFormData) => {
    if (!editingCard) return;
    const payload: UpdateNfcCardRequest = {
      tuSeq: data.tuSeq || undefined,
      cardAid: data.cardAid || undefined,
      cardLabel: data.cardLabel || undefined,
      cardType: (data.cardType as 'CARD' | 'PHONE') || undefined,
      cardStatus: (data.cardStatus as 'ACTIVE' | 'INACTIVE' | 'BLOCKED') || undefined,
    };
    updateCardMutation.mutate({ cardSeq: editingCard.cardSeq, data: payload });
  };

  // -- Delete card --
  const handleDeleteCard = (card: NfcCardListItem) => {
    setCardToDelete(card);
    setDeleteDialogOpen(true);
  };

  // -- Block / Unblock --
  const handleBlockCard = (card: NfcCardListItem) => {
    setCardToBlock(card);
    setBlockDialogOpen(true);
  };

  // -- Filter reset --
  const resetCardFilters = () => {
    setCardSearch('');
    setCardTypeFilter('__all__');
    setCardStatusFilter('__all__');
    setCardPage(1);
  };

  const hasCardFilters = cardSearch || cardTypeFilter !== '__all__' || cardStatusFilter !== '__all__';

  // -- Row numbering --
  const cardStartNum = cardsData ? cardsData.total - (cardPage - 1) * pageSize : 0;

  // ==================== Render ====================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Tag className="h-6 w-6" />
        <h1 className="text-2xl font-bold">태그 관리</h1>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="unregistered">미등록 태그</TabsTrigger>
          <TabsTrigger value="registered">등록된 카드</TabsTrigger>
          <TabsTrigger value="test">AID 테스트</TabsTrigger>
        </TabsList>

        {/* ==================== Tab 1: Unregistered Tags ==================== */}
        <TabsContent value="unregistered">
          <Card>
            <CardContent className="pt-6">
              {/* Action Bar */}
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  총 {unregData?.total || 0}개의 미등록 태그
                </div>
              </div>

              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>식별값</TableHead>
                      <TableHead>AID</TableHead>
                      <TableHead>최초 태깅일</TableHead>
                      <TableHead>마지막 태깅일</TableHead>
                      <TableHead className="text-center">태깅 횟수</TableHead>
                      <TableHead>마지막 리더기</TableHead>
                      <TableHead>마지막 공간</TableHead>
                      <TableHead className="w-24 text-center">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unregLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center">
                          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                        </TableCell>
                      </TableRow>
                    ) : unregData?.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          미등록 태그가 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : (
                      unregData?.items.map((tag) => (
                        <TableRow key={tag.tagIdentifier}>
                          <TableCell className="font-mono text-sm">{tag.tagIdentifier}</TableCell>
                          <TableCell className="font-mono text-sm">{tag.tagAid || '-'}</TableCell>
                          <TableCell>{formatDate(tag.firstTaggedAt)}</TableCell>
                          <TableCell>{formatDate(tag.lastTaggedAt)}</TableCell>
                          <TableCell className="text-center">{tag.tagCount}</TableCell>
                          <TableCell>{tag.lastReaderName}</TableCell>
                          <TableCell>{tag.lastSpaceName}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenApproval(tag)}
                            >
                              <UserCheck className="mr-1 h-4 w-4" />
                              승인
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {unregData && unregData.total > pageSize && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {unregPage} / {Math.ceil(unregData.total / pageSize)} 페이지
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUnregPage((p) => Math.max(1, p - 1))}
                      disabled={unregPage === 1}
                    >
                      이전
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUnregPage((p) => p + 1)}
                      disabled={unregPage >= Math.ceil(unregData.total / pageSize)}
                    >
                      다음
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== Tab 2: Registered Cards ==================== */}
        <TabsContent value="registered">
          <Card>
            <CardContent className="pt-6">
              {/* Filters */}
              <div className="mb-4 flex items-end gap-4">
                <div className="flex-1">
                  <Label htmlFor="card-search">검색</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="card-search"
                      placeholder="소유자, 식별값, 별칭으로 검색"
                      value={cardSearch}
                      onChange={(e) => {
                        setCardSearch(e.target.value);
                        setCardPage(1);
                      }}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="w-40">
                  <Label htmlFor="card-type-filter">유형</Label>
                  <Select
                    value={cardTypeFilter}
                    onValueChange={(value) => {
                      setCardTypeFilter(value);
                      setCardPage(1);
                    }}
                  >
                    <SelectTrigger id="card-type-filter">
                      <SelectValue placeholder="유형 전체" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">전체</SelectItem>
                      <SelectItem value="CARD">CARD</SelectItem>
                      <SelectItem value="PHONE">PHONE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-40">
                  <Label htmlFor="card-status-filter">상태</Label>
                  <Select
                    value={cardStatusFilter}
                    onValueChange={(value) => {
                      setCardStatusFilter(value);
                      setCardPage(1);
                    }}
                  >
                    <SelectTrigger id="card-status-filter">
                      <SelectValue placeholder="상태 전체" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">전체</SelectItem>
                      <SelectItem value="ACTIVE">활성</SelectItem>
                      <SelectItem value="INACTIVE">비활성</SelectItem>
                      <SelectItem value="BLOCKED">차단</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {hasCardFilters && (
                  <Button variant="outline" onClick={resetCardFilters}>
                    필터 초기화
                  </Button>
                )}
              </div>

              {/* Action Bar */}
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  총 {cardsData?.total || 0}개
                </div>
              </div>

              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">No.</TableHead>
                      <TableHead>소유자</TableHead>
                      <TableHead>식별값</TableHead>
                      <TableHead>AID</TableHead>
                      <TableHead>별칭</TableHead>
                      <TableHead className="w-24 text-center">유형</TableHead>
                      <TableHead className="w-24 text-center">상태</TableHead>
                      <TableHead>마지막 태깅</TableHead>
                      <TableHead>등록일</TableHead>
                      <TableHead className="w-32 text-center">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cardsLoading ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center">
                          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                        </TableCell>
                      </TableRow>
                    ) : cardsData?.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-muted-foreground">
                          등록된 카드가 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : (
                      cardsData?.items.map((card, index) => (
                        <TableRow key={card.cardSeq}>
                          <TableCell>{cardStartNum - index}</TableCell>
                          <TableCell className="font-medium">{card.userName}</TableCell>
                          <TableCell className="font-mono text-sm">{card.cardIdentifier}</TableCell>
                          <TableCell className="font-mono text-sm">{card.cardAid || '-'}</TableCell>
                          <TableCell>{card.cardLabel || '-'}</TableCell>
                          <TableCell className="text-center">
                            {getCardTypeBadge(card.cardType)}
                          </TableCell>
                          <TableCell className="text-center">
                            {getCardStatusBadge(card.cardStatus)}
                          </TableCell>
                          <TableCell>{formatDate(card.lastTaggedAt)}</TableCell>
                          <TableCell>{formatDate(card.regDate)}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditCard(card)}
                                title="수정"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {card.cardStatus === 'BLOCKED' ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    blockCardMutation.mutate({
                                      cardSeq: card.cardSeq,
                                      status: 'ACTIVE',
                                    });
                                  }}
                                  title="차단 해제"
                                >
                                  <ShieldCheck className="h-4 w-4 text-green-600" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleBlockCard(card)}
                                  title="차단"
                                >
                                  <ShieldBan className="h-4 w-4 text-red-600" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCard(card)}
                                title="삭제"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {cardsData && cardsData.total > pageSize && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {cardPage} / {Math.ceil(cardsData.total / pageSize)} 페이지
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCardPage((p) => Math.max(1, p - 1))}
                      disabled={cardPage === 1}
                    >
                      이전
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCardPage((p) => p + 1)}
                      disabled={cardPage >= Math.ceil(cardsData.total / pageSize)}
                    >
                      다음
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== Tab 3: AID Test (Real-time Monitoring) ==================== */}
        <TabsContent value="test">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: Connection Settings */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* WS URL */}
                  <div>
                    <Label htmlFor="ws-url">NFC Agent 주소</Label>
                    <Input
                      id="ws-url"
                      value={wsUrl}
                      onChange={(e) => setWsUrl(e.target.value)}
                      placeholder="ws://localhost:9100"
                      className="font-mono"
                      disabled={isMonitoring}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      NFC Agent의 WebSocket 주소를 입력하세요
                    </p>
                  </div>

                  {/* AID Input */}
                  <div>
                    <Label htmlFor="test-aid">AID (Application Identifier)</Label>
                    <Input
                      id="test-aid"
                      value={testAid}
                      onChange={(e) => setTestAid(e.target.value)}
                      placeholder="D4100000030001"
                      className="font-mono"
                      disabled={isMonitoring}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      카드에서 SELECT할 AID를 지정합니다 (미입력 시 기본 AID 사용)
                    </p>
                  </div>

                  {/* Connection Status */}
                  <div className="rounded-md border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">연결 상태</span>
                      <div className="flex items-center gap-2">
                        {wsStatus === 'connected' && (
                          <>
                            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                            <span className="text-sm font-medium text-green-600">연결됨</span>
                          </>
                        )}
                        {wsStatus === 'connecting' && (
                          <>
                            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-yellow-500" />
                            <span className="text-sm font-medium text-yellow-600">연결 중...</span>
                          </>
                        )}
                        {wsStatus === 'disconnected' && (
                          <>
                            <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
                            <span className="text-sm text-muted-foreground">연결 안됨</span>
                          </>
                        )}
                        {wsStatus === 'error' && (
                          <>
                            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                            <span className="text-sm font-medium text-red-600">연결 오류</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">리더기</span>
                      <div className="flex items-center gap-2">
                        {wsReaderName ? (
                          <>
                            <Wifi className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">{wsReaderName}</span>
                          </>
                        ) : (
                          <>
                            <WifiOff className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">감지 안됨</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Monitoring Toggle */}
                  <div className="flex gap-2 pt-2">
                    {!isMonitoring ? (
                      <Button
                        onClick={() => setIsMonitoring(true)}
                        disabled={!wsUrl}
                        className="flex-1"
                      >
                        <Radio className="mr-2 h-4 w-4" />
                        모니터링 시작
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setIsMonitoring(false);
                          setTestResult(null);
                        }}
                        className="flex-1"
                      >
                        <Square className="mr-2 h-4 w-4" />
                        모니터링 중지
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setTestResult(null);
                        setTestHistory([]);
                      }}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      초기화
                    </Button>
                  </div>

                  {/* Monitoring indicator */}
                  {isMonitoring && wsStatus === 'connected' && (
                    <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      카드를 리더기에 태깅하세요...
                    </div>
                  )}
                  {isMonitoring && wsStatus !== 'connected' && (
                    <div className="flex items-center gap-2 rounded-md bg-yellow-50 p-3 text-sm text-yellow-700">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      NFC Agent에 연결 시도 중...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Right: Result */}
            <Card>
              <CardContent className="pt-6">
                {testResult ? (
                  <div className="space-y-4">
                    {/* Result badge */}
                    <div className="flex items-center justify-center gap-3 rounded-lg border p-4">
                      {testResult.result === 'SUCCESS' && (
                        <>
                          <CheckCircle2 className="h-8 w-8 text-green-600" />
                          <span className="text-xl font-bold text-green-600">성공</span>
                        </>
                      )}
                      {testResult.result === 'PARTIAL' && (
                        <>
                          <AlertTriangle className="h-8 w-8 text-amber-600" />
                          <span className="text-xl font-bold text-amber-600">부분 성공</span>
                        </>
                      )}
                      {testResult.result === 'DENIED' && (
                        <>
                          <XCircle className="h-8 w-8 text-red-600" />
                          <span className="text-xl font-bold text-red-600">거부</span>
                        </>
                      )}
                      {testResult.result === 'UNKNOWN' && (
                        <>
                          <HelpCircle className="h-8 w-8 text-gray-500" />
                          <span className="text-xl font-bold text-gray-500">미등록</span>
                        </>
                      )}
                      {testResult.result === 'ERROR' && (
                        <>
                          <XCircle className="h-8 w-8 text-red-600" />
                          <span className="text-xl font-bold text-red-600">오류</span>
                        </>
                      )}
                    </div>

                    {/* Details grid */}
                    <div className="space-y-2 rounded-md bg-muted p-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">유형</span>
                        <span>
                          {testResult.logType === 'ENTER' && <Badge className="bg-green-100 text-green-800">입실</Badge>}
                          {testResult.logType === 'EXIT' && <Badge className="bg-blue-100 text-blue-800">퇴실</Badge>}
                          {testResult.logType === 'DENIED' && <Badge className="bg-red-100 text-red-800">거부</Badge>}
                          {testResult.logType === 'UNKNOWN' && <Badge className="bg-amber-100 text-amber-800">미등록</Badge>}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">공간</span>
                        <span>{testResult.spaceName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">사용자</span>
                        <span>{testResult.userName || '미등록'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">메시지</span>
                        <span className="text-right max-w-[60%]">{testResult.message}</span>
                      </div>
                    </div>

                    {/* Control summary */}
                    {testResult.controlSummary && (
                      <div className="space-y-2 rounded-md border p-3 text-sm">
                        <div className="font-medium">장비 제어 결과</div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">제어 결과</span>
                          <span>
                            {testResult.controlResult === 'SUCCESS' && <Badge className="bg-green-100 text-green-800">성공</Badge>}
                            {testResult.controlResult === 'FAIL' && <Badge className="bg-red-100 text-red-800">실패</Badge>}
                            {testResult.controlResult === 'PARTIAL' && <Badge className="bg-amber-100 text-amber-800">부분</Badge>}
                            {testResult.controlResult === 'SKIPPED' && <Badge className="bg-gray-100 text-gray-800">건너뜀</Badge>}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">전체 장비</span>
                          <span>{testResult.controlSummary.totalDevices}개</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">성공</span>
                          <span className="text-green-600">{testResult.controlSummary.successCount}개</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">실패</span>
                          <span className={testResult.controlSummary.failCount > 0 ? 'text-red-600' : ''}>
                            {testResult.controlSummary.failCount}개
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-muted-foreground">
                    {isMonitoring ? (
                      <>
                        <Radio className="h-8 w-8 animate-pulse" />
                        <span>대기 중... 카드를 태깅하세요</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-8 w-8" />
                        <span>모니터링을 시작하면 태깅 결과가 표시됩니다</span>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bottom: History table */}
          {testHistory.length > 0 && (
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">실시간 태깅 기록 ({testHistory.length}건)</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTestHistory([])}
                  >
                    기록 삭제
                  </Button>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">No</TableHead>
                        <TableHead>시각</TableHead>
                        <TableHead>식별값</TableHead>
                        <TableHead>AID</TableHead>
                        <TableHead className="text-center">결과</TableHead>
                        <TableHead className="text-center">유형</TableHead>
                        <TableHead>사용자</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testHistory.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{entry.id}</TableCell>
                          <TableCell className="text-sm">{entry.timestamp}</TableCell>
                          <TableCell className="font-mono text-xs">{entry.identifier}</TableCell>
                          <TableCell className="font-mono text-xs">{entry.aid || '-'}</TableCell>
                          <TableCell className="text-center">
                            {entry.response.result === 'SUCCESS' && <Badge className="bg-green-100 text-green-800">성공</Badge>}
                            {entry.response.result === 'PARTIAL' && <Badge className="bg-amber-100 text-amber-800">부분</Badge>}
                            {entry.response.result === 'DENIED' && <Badge className="bg-red-100 text-red-800">거부</Badge>}
                            {entry.response.result === 'UNKNOWN' && <Badge className="bg-gray-100 text-gray-800">미등록</Badge>}
                            {entry.response.result === 'ERROR' && <Badge className="bg-red-100 text-red-800">오류</Badge>}
                          </TableCell>
                          <TableCell className="text-center">
                            {entry.response.logType === 'ENTER' && <Badge className="bg-green-100 text-green-800">입실</Badge>}
                            {entry.response.logType === 'EXIT' && <Badge className="bg-blue-100 text-blue-800">퇴실</Badge>}
                            {entry.response.logType === 'DENIED' && <Badge className="bg-red-100 text-red-800">거부</Badge>}
                            {entry.response.logType === 'UNKNOWN' && <Badge className="bg-amber-100 text-amber-800">미등록</Badge>}
                          </TableCell>
                          <TableCell className="text-sm">{entry.response.userName || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ==================== Approval Dialog ==================== */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>태그 승인</DialogTitle>
            <DialogDescription>
              미등록 태그를 사용자에게 카드로 등록합니다.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={approvalForm.handleSubmit(handleApprovalSubmit)} className="space-y-4">
            {/* Read-only tag info */}
            <div className="space-y-2 rounded-md bg-muted p-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">식별값</span>
                <span className="font-mono">{selectedTag?.tagIdentifier}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">AID</span>
                <span className="font-mono">{selectedTag?.tagAid || '-'}</span>
              </div>
            </div>

            {/* User select */}
            <div>
              <Label>
                사용자 선택 <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="tuSeq"
                control={approvalForm.control}
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(val) => field.onChange(Number(val))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="사용자를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {usersData?.items.map((user) => (
                        <SelectItem key={user.seq} value={String(user.seq)}>
                          {user.name || user.id || `사용자 #${user.seq}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {approvalForm.formState.errors.tuSeq && (
                <p className="mt-1 text-sm text-destructive">
                  {approvalForm.formState.errors.tuSeq.message}
                </p>
              )}
            </div>

            {/* Card label */}
            <div>
              <Label htmlFor="approval-cardLabel">카드 별칭</Label>
              <Input
                id="approval-cardLabel"
                {...approvalForm.register('cardLabel')}
                placeholder="카드 별칭 (선택사항)"
              />
            </div>

            {/* Card type */}
            <div>
              <Label>카드 유형</Label>
              <Controller
                name="cardType"
                control={approvalForm.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="카드 유형" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CARD">CARD</SelectItem>
                      <SelectItem value="PHONE">PHONE</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setApprovalDialogOpen(false);
                  setSelectedTag(null);
                  approvalForm.reset();
                }}
              >
                취소
              </Button>
              <Button type="submit" disabled={createCardMutation.isPending}>
                {createCardMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    승인 중...
                  </>
                ) : (
                  '승인'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== Card Edit Sheet ==================== */}
      <Sheet open={cardSheetOpen} onOpenChange={setCardSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>카드 수정</SheetTitle>
            <SheetDescription>카드 정보를 수정합니다.</SheetDescription>
          </SheetHeader>
          <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="mt-6 space-y-4">
            {/* Read-only identifier */}
            <div>
              <Label>식별값</Label>
              <Input
                value={editingCard?.cardIdentifier || ''}
                disabled
                className="bg-muted"
              />
            </div>

            {/* User select */}
            <div>
              <Label>소유자 변경</Label>
              <Controller
                name="tuSeq"
                control={editForm.control}
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(val) => field.onChange(Number(val))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="사용자를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {usersData?.items.map((user) => (
                        <SelectItem key={user.seq} value={String(user.seq)}>
                          {user.name || user.id || `사용자 #${user.seq}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* AID */}
            <div>
              <Label htmlFor="edit-cardAid">AID</Label>
              <Input
                id="edit-cardAid"
                {...editForm.register('cardAid')}
                placeholder="AID (선택사항)"
              />
            </div>

            {/* Card label */}
            <div>
              <Label htmlFor="edit-cardLabel">카드 별칭</Label>
              <Input
                id="edit-cardLabel"
                {...editForm.register('cardLabel')}
                placeholder="카드 별칭 (선택사항)"
              />
            </div>

            {/* Card type */}
            <div>
              <Label>카드 유형</Label>
              <Controller
                name="cardType"
                control={editForm.control}
                render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="카드 유형" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CARD">CARD</SelectItem>
                      <SelectItem value="PHONE">PHONE</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Card status */}
            <div>
              <Label>상태</Label>
              <Controller
                name="cardStatus"
                control={editForm.control}
                render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="상태 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">활성</SelectItem>
                      <SelectItem value="INACTIVE">비활성</SelectItem>
                      <SelectItem value="BLOCKED">차단</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCardSheetOpen(false);
                  setEditingCard(null);
                  editForm.reset();
                }}
              >
                취소
              </Button>
              <Button type="submit" disabled={updateCardMutation.isPending}>
                {updateCardMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  '수정'
                )}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ==================== Delete Confirmation Dialog ==================== */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>카드 삭제</DialogTitle>
            <DialogDescription>
              정말로 <strong>{cardToDelete?.userName}</strong>님의 카드
              (<span className="font-mono">{cardToDelete?.cardIdentifier}</span>)를
              삭제하시겠습니까?
              <br />이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setCardToDelete(null);
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (cardToDelete) {
                  deleteCardMutation.mutate(cardToDelete.cardSeq);
                }
              }}
              disabled={deleteCardMutation.isPending}
            >
              {deleteCardMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  삭제 중...
                </>
              ) : (
                '삭제'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== Block Confirmation Dialog ==================== */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>카드 차단</DialogTitle>
            <DialogDescription>
              <strong>{cardToBlock?.userName}</strong>님의 카드
              (<span className="font-mono">{cardToBlock?.cardIdentifier}</span>)를
              차단하시겠습니까?
              <br />차단된 카드는 태깅이 거부됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBlockDialogOpen(false);
                setCardToBlock(null);
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (cardToBlock) {
                  blockCardMutation.mutate({
                    cardSeq: cardToBlock.cardSeq,
                    status: 'BLOCKED',
                  });
                }
              }}
              disabled={blockCardMutation.isPending}
            >
              {blockCardMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  차단 중...
                </>
              ) : (
                '차단'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
