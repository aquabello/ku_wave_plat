import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { ActivityLogsService } from '../activity-logs.service';

/** 로깅 제외 경로 */
const EXCLUDED_PATHS = [
  '/api/v1/activity-logs',
  '/api/v1/docs',
  '/api/v1/health',
];

/** 민감 필드 키 (대소문자 무관) */
const SENSITIVE_KEYS = ['password', 'newpassword', 'token', 'accesstoken', 'refreshtoken', 'authorization'];

/** HTTP 메서드 → 행위명 매핑 (GNB > LNB > 행위) */
const ACTION_MAP: Record<string, Record<string, string>> = {
  // 인증
  '/api/v1/auth/login': { POST: '인증 > 로그인' },
  '/api/v1/auth/logout': { POST: '인증 > 로그아웃' },
  '/api/v1/auth/refresh': { POST: '인증 > 토큰 갱신' },
  // 회원관리 > 사용자 목록
  '/api/v1/users': { GET: '회원관리 > 사용자 목록 > 목록 조회', POST: '회원관리 > 사용자 목록 > 등록' },
  // 회원관리 > 권한 관리
  '/api/v1/permissions': { GET: '회원관리 > 권한 관리 > 목록 조회' },
  '/api/v1/menus': { GET: '회원관리 > 권한 관리 > 메뉴 트리 조회' },
  // 환경설정 > 건물관리
  '/api/v1/buildings': { GET: '환경설정 > 건물관리 > 목록 조회', POST: '환경설정 > 건물관리 > 등록' },
  // 환경설정 > 시스템 설정
  '/api/v1/settings': { GET: '환경설정 > 시스템 설정 > 조회' },
};

/** 동적 경로 행위명 매핑 (GNB > LNB > 행위) */
const DYNAMIC_ACTION_MAP: { pattern: RegExp; actions: Record<string, string> }[] = [
  // 회원관리 > 사용자 목록
  {
    pattern: /^\/api\/v1\/users\/(\d+)$/,
    actions: { GET: '회원관리 > 사용자 목록 > 상세 조회', PUT: '회원관리 > 사용자 목록 > 수정', DELETE: '회원관리 > 사용자 목록 > 삭제' },
  },
  {
    pattern: /^\/api\/v1\/users\/(\d+)\/reset-password$/,
    actions: { PATCH: '회원관리 > 사용자 목록 > 비밀번호 초기화' },
  },
  // 회원관리 > 권한 관리
  {
    pattern: /^\/api\/v1\/menus\/users\/(\d+)$/,
    actions: { GET: '회원관리 > 권한 관리 > 메뉴 권한 조회', PUT: '회원관리 > 권한 관리 > 메뉴 권한 저장' },
  },
  // 환경설정 > 건물관리
  {
    pattern: /^\/api\/v1\/buildings\/(\d+)$/,
    actions: { GET: '환경설정 > 건물관리 > 상세 조회', PUT: '환경설정 > 건물관리 > 수정', DELETE: '환경설정 > 건물관리 > 삭제' },
  },
  // 환경설정 > 시스템 설정
  {
    pattern: /^\/api\/v1\/settings\/(\d+)$/,
    actions: { PUT: '환경설정 > 시스템 설정 > 수정' },
  },
];

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const startTime = Date.now();

    // 로깅 제외 경로 체크
    const path = request.path || request.url;
    if (EXCLUDED_PATHS.some((excluded) => path.startsWith(excluded))) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          this.saveLog(request, context, startTime, responseBody);
        },
        error: (error) => {
          const statusCode = error?.status || error?.statusCode || 500;
          const errorResponse = {
            statusCode,
            message: error?.message || 'Internal Server Error',
          };
          this.saveLog(request, context, startTime, errorResponse, statusCode);
        },
      }),
    );
  }

  private async saveLog(
    request: Request,
    context: ExecutionContext,
    startTime: number,
    responseBody: unknown,
    errorStatusCode?: number,
  ): Promise<void> {
    try {
      const response = context.switchToHttp().getResponse<Response>();
      const durationMs = Date.now() - startTime;

      // 사용자 정보 추출 (JWT Guard에서 주입)
      const user = (request as any).user;

      // 행위명 결정
      const actionName = this.resolveActionName(request.path, request.method);

      // 민감정보 마스킹
      const maskedRequestBody = this.maskSensitiveData(request.body);
      const maskedResponseBody = this.maskSensitiveData(responseBody);

      await this.activityLogsService.create({
        tuSeq: user?.seq || null,
        tuId: user?.userId || null,
        tuName: user?.userName || null,
        httpMethod: request.method,
        requestUrl: request.originalUrl || request.url,
        actionName,
        statusCode: errorStatusCode || response.statusCode,
        requestBody: maskedRequestBody,
        responseBody: maskedResponseBody as Record<string, unknown> | null,
        ipAddress: this.getClientIp(request),
        userAgent: request.headers['user-agent'] || null,
        durationMs,
      });
    } catch {
      // 로그 저장 실패 시 원래 요청에 영향을 주지 않음
    }
  }

  /** 행위명 결정 (정적 + 동적 경로 매핑) */
  private resolveActionName(path: string, method: string): string | null {
    // 정적 경로 매핑
    const staticAction = ACTION_MAP[path];
    if (staticAction && staticAction[method]) {
      return staticAction[method];
    }

    // 동적 경로 매핑
    for (const { pattern, actions } of DYNAMIC_ACTION_MAP) {
      if (pattern.test(path) && actions[method]) {
        return actions[method];
      }
    }

    // 기본 매핑 (HTTP 메서드 기반)
    const methodActionMap: Record<string, string> = {
      GET: '조회',
      POST: '등록',
      PUT: '수정',
      PATCH: '수정',
      DELETE: '삭제',
    };

    return methodActionMap[method] || null;
  }

  /** 민감 정보 마스킹 (중첩 객체 지원, 최대 3레벨) */
  private maskSensitiveData(data: unknown, depth = 0): Record<string, unknown> | null {
    if (!data || typeof data !== 'object' || depth > 3) return null;
    if (Array.isArray(data)) return data as any;

    const masked = { ...data } as Record<string, unknown>;

    for (const key of Object.keys(masked)) {
      if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
        masked[key] = '********';
      } else if (masked[key] && typeof masked[key] === 'object' && !Array.isArray(masked[key])) {
        masked[key] = this.maskSensitiveData(masked[key], depth + 1);
      }
    }

    return masked;
  }

  /** 클라이언트 IP 추출 */
  private getClientIp(request: Request): string | null {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
      return ip.trim();
    }
    return request.ip || request.socket?.remoteAddress || null;
  }
}
