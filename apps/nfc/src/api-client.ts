import { ofetch } from 'ofetch';
import { NfcAgentConfig, NfcTagRequest, NfcTagResponse } from '@ku/types';
import { logger } from './logger';

export class ApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: NfcAgentConfig) {
    this.baseUrl = config.apiUrl;
    this.apiKey = config.apiKey;
  }

  async sendTag(request: NfcTagRequest): Promise<NfcTagResponse> {
    logger.debug(`[API] POST ${this.baseUrl}/nfc/tag`);

    const response = await ofetch<NfcTagResponse>(`${this.baseUrl}/nfc/tag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-NFC-Api-Key': this.apiKey,
      },
      body: request,
      timeout: 10000, // 10초 타임아웃
    });

    return response;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await ofetch(`${this.baseUrl}/health`, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}
