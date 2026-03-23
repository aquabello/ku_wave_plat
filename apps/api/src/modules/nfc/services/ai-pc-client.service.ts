import { Injectable, Logger } from '@nestjs/common';
import { ofetch } from 'ofetch';

interface AiStartRequest {
  spaceSeq: number;
  tuSeq: number | null;
  callbackUrl: string;
  wavePlatUrl: string;
}

interface AiStopRequest {
  spaceSeq: number;
}

interface AiPcResponse {
  status: string;
  sessionSeq?: number;
  filename?: string;
  durationSec?: number;
}

@Injectable()
export class AiPcClientService {
  private readonly logger = new Logger(AiPcClientService.name);
  private static readonly TIMEOUT_MS = 3000;

  async startRecording(
    aiPcUrl: string,
    request: AiStartRequest,
  ): Promise<{ success: boolean; data?: AiPcResponse; error?: string }> {
    try {
      const data = await ofetch<AiPcResponse>(`${aiPcUrl}/ai/start`, {
        method: 'POST',
        body: request,
        timeout: AiPcClientService.TIMEOUT_MS,
        retry: 0,
      });
      this.logger.log(
        `AI 녹음 시작 성공: spaceSeq=${request.spaceSeq}, sessionSeq=${data.sessionSeq}`,
      );
      return { success: true, data };
    } catch (error: any) {
      const message = error?.message ?? 'Unknown error';
      this.logger.error(`AI 녹음 시작 실패: spaceSeq=${request.spaceSeq}, error=${message}`);
      return { success: false, error: message };
    }
  }

  async stopRecording(
    aiPcUrl: string,
    request: AiStopRequest,
  ): Promise<{ success: boolean; data?: AiPcResponse; error?: string }> {
    try {
      const data = await ofetch<AiPcResponse>(`${aiPcUrl}/ai/stop`, {
        method: 'POST',
        body: request,
        timeout: AiPcClientService.TIMEOUT_MS,
        retry: 0,
      });
      this.logger.log(
        `AI 녹음 종료 성공: spaceSeq=${request.spaceSeq}, sessionSeq=${data.sessionSeq}`,
      );
      return { success: true, data };
    } catch (error: any) {
      const message = error?.message ?? 'Unknown error';
      this.logger.error(`AI 녹음 종료 실패: spaceSeq=${request.spaceSeq}, error=${message}`);
      return { success: false, error: message };
    }
  }
}
