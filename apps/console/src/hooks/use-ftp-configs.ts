import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFtpConfigs,
  createFtpConfig,
  updateFtpConfig,
  deleteFtpConfig,
  testFtpConnection,
} from '@/lib/api/ftp-configs';
import type { CreateFtpConfigDto, UpdateFtpConfigDto } from '@ku/types';
import { useToast } from '@/hooks/use-toast';

// Query Keys
export const ftpConfigKeys = {
  all: ['ftp-configs'] as const,
  lists: () => [...ftpConfigKeys.all, 'list'] as const,
};

export function useFtpConfigsQuery() {
  return useQuery({
    queryKey: ftpConfigKeys.lists(),
    queryFn: () => getFtpConfigs(),
  });
}

export function useCreateFtpConfigMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateFtpConfigDto) => createFtpConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ftpConfigKeys.lists() });
      toast({ title: 'FTP 설정 등록 완료', description: 'FTP 설정이 성공적으로 등록되었습니다.' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'FTP 설정 등록 실패', description: error.message });
    },
  });
}

export function useUpdateFtpConfigMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ ftpConfigSeq, data }: { ftpConfigSeq: number; data: UpdateFtpConfigDto }) =>
      updateFtpConfig(ftpConfigSeq, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ftpConfigKeys.lists() });
      toast({ title: 'FTP 설정 수정 완료', description: 'FTP 설정이 수정되었습니다.' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'FTP 설정 수정 실패', description: error.message });
    },
  });
}

export function useDeleteFtpConfigMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (ftpConfigSeq: number) => deleteFtpConfig(ftpConfigSeq),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ftpConfigKeys.lists() });
      toast({ title: 'FTP 설정 삭제 완료', description: 'FTP 설정이 삭제되었습니다.' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'FTP 설정 삭제 실패', description: error.message });
    },
  });
}

export function useTestFtpConnectionMutation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (ftpConfigSeq: number) => testFtpConnection(ftpConfigSeq),
    onSuccess: (data) => {
      if (data.result === 'SUCCESS') {
        toast({ title: 'FTP 연결 성공', description: data.message });
      } else {
        toast({ variant: 'destructive', title: 'FTP 연결 실패', description: data.message });
      }
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'FTP 연결 테스트 실패', description: error.message });
    },
  });
}
