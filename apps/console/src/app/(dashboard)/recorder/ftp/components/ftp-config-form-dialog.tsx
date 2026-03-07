'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import {
  useCreateFtpConfigMutation,
  useUpdateFtpConfigMutation,
} from '@/hooks/use-ftp-configs';
import { useRecordersQuery } from '@/hooks/use-recorders';
import type { FtpConfigListItem, CreateFtpConfigDto, UpdateFtpConfigDto } from '@ku/types';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

// ─── Schemas ────────────────────────────────────────────────────────────────

const createFtpSchema = z.object({
  ftpName: z.string().min(1, 'FTP 설정 이름을 입력하세요').max(100, '최대 100자입니다'),
  ftpHost: z.string().min(1, '호스트를 입력하세요'),
  ftpPort: z.coerce.number().int().min(1).max(65535),
  ftpUsername: z.string().min(1, '사용자명을 입력하세요'),
  ftpPassword: z.string().min(1, '비밀번호를 입력하세요'),
  ftpPath: z.string(),
  ftpProtocol: z.enum(['FTP', 'SFTP', 'FTPS']),
  ftpPassiveMode: z.boolean(),
  isDefault: z.boolean(),
  recorderSeq: z.string().optional(),
});

const updateFtpSchema = z.object({
  ftpName: z.string().min(1, 'FTP 설정 이름을 입력하세요').max(100, '최대 100자입니다'),
  ftpHost: z.string().min(1, '호스트를 입력하세요'),
  ftpPort: z.coerce.number().int().min(1).max(65535),
  ftpUsername: z.string().optional(),
  ftpPassword: z.string().optional(),
  ftpPath: z.string(),
  ftpProtocol: z.enum(['FTP', 'SFTP', 'FTPS']),
  ftpPassiveMode: z.boolean(),
  isDefault: z.boolean(),
  recorderSeq: z.string().optional(),
});

type CreateFtpFormData = z.infer<typeof createFtpSchema>;
type UpdateFtpFormData = z.infer<typeof updateFtpSchema>;

// ─── Props ───────────────────────────────────────────────────────────────────

interface FtpConfigFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: FtpConfigListItem | null;
}

// ─── Shell wrapper ───────────────────────────────────────────────────────────

export function FtpConfigFormDialog({ open, onOpenChange, config }: FtpConfigFormDialogProps) {
  const isEdit = config !== null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'FTP 설정 수정' : 'FTP 설정 추가'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'FTP 설정 정보를 수정합니다. 비밀번호를 비워두면 기존 값이 유지됩니다.'
              : '새 FTP 서버 연결 설정을 등록합니다.'}
          </SheetDescription>
        </SheetHeader>
        {isEdit ? (
          <FtpUpdateForm
            key={config.ftpConfigSeq}
            config={config}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <FtpCreateForm onClose={() => onOpenChange(false)} />
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Recorder select helper ──────────────────────────────────────────────────

function RecorderSelect({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (val: string) => void;
}) {
  const { data } = useRecordersQuery({ limit: 100 });

  return (
    <Select onValueChange={onChange} value={value ?? 'none'}>
      <SelectTrigger>
        <SelectValue placeholder="글로벌 설정 (선택 안함)" />
      </SelectTrigger>
      <SelectContent position="popper" sideOffset={4}>
        <SelectItem value="none">글로벌 설정 (선택 안함)</SelectItem>
        {data?.items.map((r) => (
          <SelectItem key={r.recorderSeq} value={String(r.recorderSeq)}>
            {r.recorderName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function recorderSeqToPayload(val: string | undefined): number | null {
  return val && val !== 'none' ? Number(val) : null;
}

// ─── Create form ─────────────────────────────────────────────────────────────

function FtpCreateForm({ onClose }: { onClose: () => void }) {
  const { mutate: createConfig, isPending } = useCreateFtpConfigMutation();

  const form = useForm<CreateFtpFormData>({
    resolver: zodResolver(createFtpSchema),
    defaultValues: {
      ftpName: '',
      ftpHost: '',
      ftpPort: 21,
      ftpUsername: '',
      ftpPassword: '',
      ftpPath: '/',
      ftpProtocol: 'FTP',
      ftpPassiveMode: true,
      isDefault: false,
      recorderSeq: 'none',
    },
  });

  const onSubmit = (data: CreateFtpFormData) => {
    const payload: CreateFtpConfigDto = {
      ftpName: data.ftpName,
      ftpHost: data.ftpHost,
      ftpPort: data.ftpPort,
      ftpUsername: data.ftpUsername,
      ftpPassword: data.ftpPassword,
      ftpPath: data.ftpPath,
      ftpProtocol: data.ftpProtocol,
      ftpPassiveMode: data.ftpPassiveMode ? 'Y' : 'N',
      isDefault: data.isDefault ? 'Y' : 'N',
      recorderSeq: recorderSeqToPayload(data.recorderSeq),
    };
    createConfig(payload, { onSuccess: () => onClose() });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
        {/* 기본 정보 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">기본 정보</h3>

          <FormField
            control={form.control}
            name="ftpName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>FTP 설정 이름 *</FormLabel>
                <FormControl>
                  <Input placeholder="예: 본관 FTP 서버" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="ftpHost"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>호스트 *</FormLabel>
                  <FormControl>
                    <Input placeholder="ftp.example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ftpPort"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>포트</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="21" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="ftpProtocol"
            render={({ field }) => (
              <FormItem>
                <FormLabel>프로토콜</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent position="popper" sideOffset={4}>
                    <SelectItem value="FTP">FTP</SelectItem>
                    <SelectItem value="SFTP">SFTP</SelectItem>
                    <SelectItem value="FTPS">FTPS</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ftpPath"
            render={({ field }) => (
              <FormItem>
                <FormLabel>경로</FormLabel>
                <FormControl>
                  <Input placeholder="/" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 인증 정보 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">인증 정보</h3>

          <FormField
            control={form.control}
            name="ftpUsername"
            render={({ field }) => (
              <FormItem>
                <FormLabel>사용자명 *</FormLabel>
                <FormControl>
                  <Input placeholder="ftpuser" autoComplete="off" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ftpPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>비밀번호 *</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 옵션 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">옵션</h3>

          <FormField
            control={form.control}
            name="ftpPassiveMode"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <FormLabel className="text-sm font-medium">패시브 모드</FormLabel>
                  <p className="text-xs text-muted-foreground">방화벽 환경에서 권장</p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isDefault"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <FormLabel className="text-sm font-medium">기본 FTP 설정</FormLabel>
                  <p className="text-xs text-muted-foreground">녹화기 미지정 시 이 설정이 사용됩니다</p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="recorderSeq"
            render={({ field }) => (
              <FormItem>
                <FormLabel>연결 녹화기 (선택)</FormLabel>
                <FormControl>
                  <RecorderSelect value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            취소
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            등록
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─── Update form ─────────────────────────────────────────────────────────────

function FtpUpdateForm({ config, onClose }: { config: FtpConfigListItem; onClose: () => void }) {
  const { mutate: updateConfig, isPending } = useUpdateFtpConfigMutation();

  const form = useForm<UpdateFtpFormData>({
    resolver: zodResolver(updateFtpSchema),
    defaultValues: {
      ftpName: config.ftpName,
      ftpHost: config.ftpHost,
      ftpPort: config.ftpPort,
      ftpUsername: '',
      ftpPassword: '',
      ftpPath: config.ftpPath,
      ftpProtocol: config.ftpProtocol,
      ftpPassiveMode: config.ftpPassiveMode === 'Y',
      isDefault: config.isDefault === 'Y',
      recorderSeq: config.recorderSeq ? String(config.recorderSeq) : 'none',
    },
  });

  const onSubmit = (data: UpdateFtpFormData) => {
    const payload: UpdateFtpConfigDto = {
      ftpName: data.ftpName,
      ftpHost: data.ftpHost,
      ftpPort: data.ftpPort,
      ftpPath: data.ftpPath,
      ftpProtocol: data.ftpProtocol,
      ftpPassiveMode: data.ftpPassiveMode ? 'Y' : 'N',
      isDefault: data.isDefault ? 'Y' : 'N',
      recorderSeq: recorderSeqToPayload(data.recorderSeq),
    };
    if (data.ftpUsername) payload.ftpUsername = data.ftpUsername;
    if (data.ftpPassword) payload.ftpPassword = data.ftpPassword;

    updateConfig({ ftpConfigSeq: config.ftpConfigSeq, data: payload }, { onSuccess: () => onClose() });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
        {/* 기본 정보 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">기본 정보</h3>

          <FormField
            control={form.control}
            name="ftpName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>FTP 설정 이름 *</FormLabel>
                <FormControl>
                  <Input placeholder="예: 본관 FTP 서버" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="ftpHost"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>호스트 *</FormLabel>
                  <FormControl>
                    <Input placeholder="ftp.example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ftpPort"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>포트</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="21" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="ftpProtocol"
            render={({ field }) => (
              <FormItem>
                <FormLabel>프로토콜</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent position="popper" sideOffset={4}>
                    <SelectItem value="FTP">FTP</SelectItem>
                    <SelectItem value="SFTP">SFTP</SelectItem>
                    <SelectItem value="FTPS">FTPS</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ftpPath"
            render={({ field }) => (
              <FormItem>
                <FormLabel>경로</FormLabel>
                <FormControl>
                  <Input placeholder="/" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 인증 정보 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">인증 정보</h3>

          <FormField
            control={form.control}
            name="ftpUsername"
            render={({ field }) => (
              <FormItem>
                <FormLabel>사용자명 (변경 시 입력)</FormLabel>
                <FormControl>
                  <Input placeholder="변경하지 않으려면 비워두세요" autoComplete="off" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ftpPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>비밀번호 (변경 시 입력)</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="변경하지 않으려면 비워두세요" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 옵션 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">옵션</h3>

          <FormField
            control={form.control}
            name="ftpPassiveMode"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <FormLabel className="text-sm font-medium">패시브 모드</FormLabel>
                  <p className="text-xs text-muted-foreground">방화벽 환경에서 권장</p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isDefault"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <FormLabel className="text-sm font-medium">기본 FTP 설정</FormLabel>
                  <p className="text-xs text-muted-foreground">녹화기 미지정 시 이 설정이 사용됩니다</p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="recorderSeq"
            render={({ field }) => (
              <FormItem>
                <FormLabel>연결 녹화기 (선택)</FormLabel>
                <FormControl>
                  <RecorderSelect value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            취소
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            수정
          </Button>
        </div>
      </form>
    </Form>
  );
}
