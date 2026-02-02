import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ofetch, FetchError } from 'ofetch';

/**
 * HTTP Client Service using ofetch
 * Provides a centralized HTTP client for external API calls with:
 * - Automatic retry with exponential backoff
 * - Request/response interceptors
 * - Timeout configuration
 * - Error handling
 * - TypeScript type inference
 */
@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);
  private readonly client: typeof ofetch;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>('HTTP_CLIENT_BASE_URL');
    const timeout = this.configService.get<number>('HTTP_CLIENT_TIMEOUT') || 30000;
    const retryAttempts = this.configService.get<number>('HTTP_CLIENT_RETRY') || 3;
    const retryDelay = this.configService.get<number>('HTTP_CLIENT_RETRY_DELAY') || 1000;

    this.client = ofetch.create({
      baseURL,
      timeout,
      retry: retryAttempts,
      retryDelay,
      onRequest: ({ request, options }) => {
        this.logger.debug(`HTTP Request: ${options.method || 'GET'} ${request}`);
        return Promise.resolve();
      },
      onResponse: ({ response }) => {
        this.logger.debug(`HTTP Response: ${response.status} ${response.statusText}`);
        return Promise.resolve();
      },
      onRequestError: ({ request, error }) => {
        this.logger.error(`HTTP Request Error: ${request}`, error);
        return Promise.resolve();
      },
      onResponseError: ({ request, response, error }) => {
        this.logger.error(
          `HTTP Response Error: ${request} - ${response.status} ${response.statusText}`,
          error,
        );
        return Promise.resolve();
      },
    });
  }

  /**
   * Generic request method with full ofetch options support
   */
  async request<T = any>(url: string, options?: any): Promise<T> {
    try {
      return await this.client<T>(url, options);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, options?: any): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, body?: any, options?: any): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, body?: any, options?: any): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, body?: any, options?: any): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, options?: any): Promise<T> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  /**
   * Create a new instance with custom configuration
   * Useful for creating service-specific clients with different base URLs
   */
  createCustomClient(customOptions: any): typeof ofetch {
    const originalOnRequest = customOptions.onRequest;
    const originalOnResponse = customOptions.onResponse;
    const originalOnRequestError = customOptions.onRequestError;
    const originalOnResponseError = customOptions.onResponseError;

    return ofetch.create({
      ...customOptions,
      onRequest: (ctx: any) => {
        this.logger.debug(`Custom HTTP Request: ${ctx.options.method || 'GET'} ${ctx.request}`);
        if (originalOnRequest) {
          if (Array.isArray(originalOnRequest)) {
            originalOnRequest.forEach((fn: any) => fn(ctx));
          } else {
            originalOnRequest(ctx);
          }
        }
        return Promise.resolve();
      },
      onResponse: (ctx: any) => {
        this.logger.debug(
          `Custom HTTP Response: ${ctx.response.status} ${ctx.response.statusText}`,
        );
        if (originalOnResponse) {
          if (Array.isArray(originalOnResponse)) {
            originalOnResponse.forEach((fn: any) => fn(ctx));
          } else {
            originalOnResponse(ctx);
          }
        }
        return Promise.resolve();
      },
      onRequestError: (ctx: any) => {
        this.logger.error(`Custom HTTP Request Error: ${ctx.request}`, ctx.error);
        if (originalOnRequestError) {
          if (Array.isArray(originalOnRequestError)) {
            originalOnRequestError.forEach((fn: any) => fn(ctx));
          } else {
            originalOnRequestError(ctx);
          }
        }
        return Promise.resolve();
      },
      onResponseError: (ctx: any) => {
        this.logger.error(
          `Custom HTTP Response Error: ${ctx.request} - ${ctx.response.status} ${ctx.response.statusText}`,
          ctx.error,
        );
        if (originalOnResponseError) {
          if (Array.isArray(originalOnResponseError)) {
            originalOnResponseError.forEach((fn: any) => fn(ctx));
          } else {
            originalOnResponseError(ctx);
          }
        }
        return Promise.resolve();
      },
    });
  }

  /**
   * Error handling helper
   */
  private handleError(error: unknown): void {
    if (error instanceof FetchError) {
      this.logger.error(`FetchError: ${error.message}`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.data,
      });
    } else if (error instanceof Error) {
      this.logger.error(`Error: ${error.message}`, error.stack);
    } else {
      this.logger.error('Unknown error occurred', error);
    }
  }
}
