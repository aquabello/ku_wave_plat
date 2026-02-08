'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  KeyRound,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { showToast } from '@/lib/toast';
import {
  getUsers,
  createUser,
  updateUser,
  resetPassword,
  deleteUser,
} from '@/lib/api/members';
import type { UserListItem, UpdateUserDto } from '@ku/types';

// --- JWT 유저 타입 확인 ---

function getCurrentUserType(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userType ?? null;
  } catch {
    return null;
  }
}

// --- 폼 스키마 ---

const createFormSchema = z.object({
  id: z.string().min(1, '아이디를 입력해주세요').max(20, '20자 이하로 입력해주세요'),
  name: z.string().min(1, '이름을 입력해주세요').max(50, '50자 이하로 입력해주세요'),
  password: z.string().min(8, '비밀번호는 8자 이상 입력해주세요').max(100),
});

const editFormSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(50, '50자 이하로 입력해주세요'),
  step: z.string().min(1, '상태를 선택해주세요'),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, '비밀번호는 8자 이상 입력해주세요').max(100),
  confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
});

type CreateFormValues = z.infer<typeof createFormSchema>;
type EditFormValues = z.infer<typeof editFormSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

// --- 상태 라벨 ---

const STEP_LABELS: Record<string, string> = {
  ST: '대기',
  OK: '승인',
  BN: '반려',
};

function getStepLabel(step: string | null) {
  if (!step) return '-';
  return STEP_LABELS[step] ?? step;
}

function getStepBadgeClass(step: string | null) {
  switch (step) {
    case 'OK':
      return 'bg-green-100 text-green-700';
    case 'ST':
      return 'bg-yellow-100 text-yellow-700';
    case 'BN':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

// --- 날짜 포맷 ---

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// --- 사용자 추가 Sheet ---

function CreateUserSheet({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateFormValues) => void;
  isSubmitting: boolean;
}) {
  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: { id: '', name: '', password: '' },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Users className="h-5 w-5 text-konkuk-green" />
            사용자 추가
          </SheetTitle>
          <SheetDescription>
            새 사용자 정보를 입력해주세요. * 표시는 필수 항목입니다.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-1">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              계정 정보
            </h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="add-id">
                  아이디 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="add-id"
                  placeholder="예: user01 (최대 20자)"
                  {...form.register('id')}
                />
                {form.formState.errors.id && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.id.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-name">
                  이름 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="add-name"
                  placeholder="예: 홍길동"
                  {...form.register('name')}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-password">
                  비밀번호 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="add-password"
                  type="password"
                  placeholder="8자 이상 입력"
                  {...form.register('password')}
                />
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? '처리 중...' : '사용자 추가'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// --- 사용자 수정 Sheet ---

function EditUserSheet({
  open,
  onOpenChange,
  user,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserListItem;
  onSubmit: (data: EditFormValues) => void;
  isSubmitting: boolean;
}) {
  const form = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      name: user.name ?? '',
      step: user.step ?? 'ST',
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Users className="h-5 w-5 text-konkuk-green" />
            사용자 수정
          </SheetTitle>
          <SheetDescription>
            사용자 정보를 수정합니다. 변경 후 저장 버튼을 눌러주세요.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-1">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              계정 정보
            </h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>아이디</Label>
                <Input value={user.id ?? ''} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">아이디는 변경할 수 없습니다</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              기본 정보
            </h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="edit-name">
                  이름 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-name"
                  placeholder="예: 홍길동"
                  {...form.register('name')}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>
                  상태 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.watch('step')}
                  onValueChange={(value) => form.setValue('step', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ST">대기</SelectItem>
                    <SelectItem value="OK">승인</SelectItem>
                    <SelectItem value="BN">반려</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.step && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.step.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? '처리 중...' : '수정 완료'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// --- 비밀번호 초기화 Dialog ---

function ResetPasswordDialog({
  open,
  onOpenChange,
  user,
  onConfirm,
  isResetting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserListItem | null;
  onConfirm: (data: ResetPasswordFormValues) => void;
  isResetting: boolean;
}) {
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-konkuk-green" />
            비밀번호 초기화
          </DialogTitle>
          <DialogDescription>
            <span className="font-semibold text-foreground">
              {user?.name ?? user?.id}
            </span>
            의 비밀번호를 초기화합니다.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onConfirm)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">새 비밀번호</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="8자 이상 입력"
              {...form.register('newPassword')}
            />
            {form.formState.errors.newPassword && (
              <p className="text-xs text-destructive">
                {form.formState.errors.newPassword.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">비밀번호 확인</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="비밀번호 재입력"
              {...form.register('confirmPassword')}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isResetting}>
              {isResetting ? '처리 중...' : '초기화'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- 삭제 확인 Dialog ---

function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserListItem | null;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            사용자 삭제
          </DialogTitle>
          <DialogDescription>
            <span className="font-semibold text-foreground">
              {user?.name ?? user?.id}
            </span>
            을(를) 삭제하시겠습니까?
            <br />
            삭제된 사용자는 복구할 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            variant="destructive"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- 메인 페이지 ---

export default function MembersPage() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Sheet/Dialog 상태
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [resetPwDialogOpen, setResetPwDialogOpen] = useState(false);
  const [resetPwUser, setResetPwUser] = useState<UserListItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserListItem | null>(null);

  // SUPER 권한 확인
  const isSuper = useMemo(() => getCurrentUserType() === 'SUPER', []);

  // 사용자 목록 조회
  const { data, isLoading } = useQuery({
    queryKey: ['users', page, searchQuery],
    queryFn: () =>
      getUsers({ page, limit: 20, search: searchQuery || undefined }),
  });

  // 사용자 등록 (2스텝: 생성 → 비밀번호 설정)
  const createMutation = useMutation({
    mutationFn: async (formData: CreateFormValues) => {
      const result = await createUser({ id: formData.id, name: formData.name });
      await resetPassword(result.seq, { newPassword: formData.password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setAddSheetOpen(false);
      showToast.success('등록 완료', '사용자가 등록되었습니다.');
    },
    onError: (error) => {
      showToast.apiError(error, '사용자 등록 중 오류가 발생했습니다');
    },
  });

  // 사용자 수정
  const updateMutation = useMutation({
    mutationFn: ({ seq, dto }: { seq: number; dto: UpdateUserDto }) =>
      updateUser(seq, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditSheetOpen(false);
      showToast.success('수정 완료', '사용자 정보가 수정되었습니다.');
    },
    onError: (error) => {
      showToast.apiError(error, '사용자 수정 중 오류가 발생했습니다');
    },
  });

  // 비밀번호 초기화
  const resetPwMutation = useMutation({
    mutationFn: ({ seq, newPassword }: { seq: number; newPassword: string }) =>
      resetPassword(seq, { newPassword }),
    onSuccess: () => {
      setResetPwDialogOpen(false);
      setResetPwUser(null);
      showToast.success('초기화 완료', '비밀번호가 초기화되었습니다.');
    },
    onError: (error) => {
      showToast.apiError(error, '비밀번호 초기화 중 오류가 발생했습니다');
    },
  });

  // 사용자 삭제
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteDialogOpen(false);
      setDeletingUser(null);
      showToast.delete('삭제 완료', '사용자가 삭제되었습니다.');
    },
    onError: (error) => {
      showToast.apiError(error, '사용자 삭제 중 오류가 발생했습니다');
    },
  });

  const users = data?.items ?? [];

  // 핸들러
  const handleAdd = () => setAddSheetOpen(true);

  const handleEdit = (user: UserListItem) => {
    setEditingUser(user);
    setEditSheetOpen(true);
  };

  const handleResetPassword = (user: UserListItem) => {
    setResetPwUser(user);
    setResetPwDialogOpen(true);
  };

  const handleDeleteClick = (user: UserListItem) => {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  };

  const handleAddSubmit = (formData: CreateFormValues) => {
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (formData: EditFormValues) => {
    if (!editingUser) return;
    const dto: UpdateUserDto = {
      name: formData.name,
      step: formData.step,
    };
    updateMutation.mutate({ seq: editingUser.seq, dto });
  };

  const handleResetPwConfirm = (formData: ResetPasswordFormValues) => {
    if (!resetPwUser) return;
    resetPwMutation.mutate({ seq: resetPwUser.seq, newPassword: formData.newPassword });
  };

  const handleDeleteConfirm = () => {
    if (!deletingUser) return;
    deleteMutation.mutate(deletingUser.seq);
  };

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">사용자 목록</h1>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          사용자 추가
        </Button>
      </div>

      {/* 검색 필터 */}
      <Card>
        <CardContent className="pt-6">
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
              명
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 사용자 목록 테이블 */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">No.</TableHead>
                <TableHead className="w-[150px]">아이디</TableHead>
                <TableHead>이름</TableHead>
                <TableHead className="w-[100px] text-center">상태</TableHead>
                <TableHead className="w-[160px] text-center">마지막 접속</TableHead>
                <TableHead className="w-[130px] text-center">승인일</TableHead>
                <TableHead className="w-[130px] text-center">관리</TableHead>
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
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    {searchQuery
                      ? '검색 결과가 없습니다'
                      : '등록된 사용자가 없습니다'}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.seq}>
                    <TableCell className="font-medium text-muted-foreground">
                      {user.no}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {user.id || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {user.name || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getStepBadgeClass(user.step)}`}
                      >
                        {getStepLabel(user.step)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {formatDateTime(user.lastAccessDate)}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {formatDate(user.approvedDate)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-konkuk-green"
                          title="수정"
                          onClick={() => handleEdit(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${isSuper ? 'text-muted-foreground hover:text-amber-600' : 'text-muted-foreground/40 cursor-not-allowed'}`}
                          title={isSuper ? '비밀번호 초기화' : '관리자(SUPER) 권한이 필요합니다'}
                          disabled={!isSuper}
                          onClick={() => handleResetPassword(user)}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="삭제"
                          onClick={() => handleDeleteClick(user)}
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

      {/* 사용자 추가 Sheet */}
      {addSheetOpen && (
        <CreateUserSheet
          key="add"
          open={addSheetOpen}
          onOpenChange={setAddSheetOpen}
          onSubmit={handleAddSubmit}
          isSubmitting={createMutation.isPending}
        />
      )}

      {/* 사용자 수정 Sheet */}
      {editSheetOpen && editingUser && (
        <EditUserSheet
          key={editingUser.seq}
          open={editSheetOpen}
          onOpenChange={setEditSheetOpen}
          user={editingUser}
          onSubmit={handleEditSubmit}
          isSubmitting={updateMutation.isPending}
        />
      )}

      {/* 비밀번호 초기화 Dialog */}
      {resetPwDialogOpen && (
        <ResetPasswordDialog
          open={resetPwDialogOpen}
          onOpenChange={setResetPwDialogOpen}
          user={resetPwUser}
          onConfirm={handleResetPwConfirm}
          isResetting={resetPwMutation.isPending}
        />
      )}

      {/* 삭제 확인 Dialog */}
      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        user={deletingUser}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
