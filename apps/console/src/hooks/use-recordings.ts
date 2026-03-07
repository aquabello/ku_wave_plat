import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSessions,
  getSessionDetail,
  getFiles,
  retryUpload,
  type GetSessionsParams,
  type GetFilesParams,
} from '@/lib/api/recordings';
import { useToast } from '@/hooks/use-toast';

// Query Keys
export const recordingKeys = {
  all: ['recordings'] as const,
  sessions: () => [...recordingKeys.all, 'sessions'] as const,
  sessionList: (params?: GetSessionsParams) => [...recordingKeys.sessions(), params] as const,
  sessionDetail: (id: number) => [...recordingKeys.sessions(), 'detail', id] as const,
  files: () => [...recordingKeys.all, 'files'] as const,
  fileList: (params?: GetFilesParams) => [...recordingKeys.files(), params] as const,
};

export function useSessionsQuery(params?: GetSessionsParams) {
  return useQuery({
    queryKey: recordingKeys.sessionList(params),
    queryFn: () => getSessions(params),
  });
}

export function useSessionDetailQuery(recSessionSeq: number, enabled = true) {
  return useQuery({
    queryKey: recordingKeys.sessionDetail(recSessionSeq),
    queryFn: () => getSessionDetail(recSessionSeq),
    enabled,
  });
}

export function useFilesQuery(params?: GetFilesParams) {
  return useQuery({
    queryKey: recordingKeys.fileList(params),
    queryFn: () => getFiles(params),
  });
}

export function useRetryUploadMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (recFileSeq: number) => retryUpload(recFileSeq),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: recordingKeys.files() });
      toast({ title: 'FTP 업로드 재시도', description: data.message });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'FTP 업로드 재시도 실패', description: error.message });
    },
  });
}
