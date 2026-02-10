'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigation';
import { refreshTokens } from '@/lib/api/auth';

const TOKEN_CHECK_INTERVAL = 60_000; // 60초 주기 클라이언트 토큰 만료 체크

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

/**
 * JWT 토큰 만료 여부 클라이언트 체크 (네트워크 없이 즉시 판별)
 */
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

/**
 * JWT 토큰이 곧 만료되는지 체크 (만료 5분 전)
 */
function isTokenExpiringSoon(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const fiveMinutes = 5 * 60 * 1000;
    return payload.exp * 1000 - Date.now() < fiveMinutes;
  } catch {
    return true;
  }
}

/**
 * Refresh Token으로 Access Token 갱신 시도
 */
async function tryRefresh(): Promise<boolean> {
  const rt = localStorage.getItem('refresh_token');
  if (!rt) return false;

  try {
    const result = await refreshTokens(rt);
    localStorage.setItem('access_token', result.accessToken);
    localStorage.setItem('refresh_token', result.refreshToken);
    return true;
  } catch {
    return false;
  }
}

/**
 * AuthGuard - 인증 게이트 컴포넌트
 *
 * 검증 전략:
 * - 초기 로드: accessToken 만료 시 refreshToken으로 갱신 시도
 * - 주기적(60초) + 탭 포커스: 만료 임박(5분 전) 시 자동 갱신
 * - 서버 측 검증(tokenVer 등): apiClient의 401 인터셉터가 자동 처리
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const clearMenus = useNavigationStore((s) => s.clearMenus);

  const handleForceLogout = useCallback((reason?: 'token_expired' | 'session_invalid') => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    clearMenus();
    if (reason) {
      sessionStorage.setItem('logout_reason', reason);
    }
    router.replace('/login');
  }, [clearMenus, router]);

  // 토큰 체크 + 만료 임박 시 자동 갱신
  const checkAndRefreshToken = useCallback(async () => {
    const token = localStorage.getItem('access_token');

    // 토큰 없음 → 로그아웃
    if (!token) {
      handleForceLogout('token_expired');
      return false;
    }

    // 만료됨 → refresh 시도
    if (isTokenExpired(token)) {
      const refreshed = await tryRefresh();
      if (!refreshed) {
        handleForceLogout('token_expired');
        return false;
      }
      return true;
    }

    // 만료 임박(5분 전) → 백그라운드 갱신
    if (isTokenExpiringSoon(token)) {
      tryRefresh(); // fire-and-forget
    }

    return true;
  }, [handleForceLogout]);

  // ── 초기 로드: 토큰 검증 + 갱신 ──
  useEffect(() => {
    checkAndRefreshToken().then((valid) => {
      if (valid) {
        setStatus('authenticated');
      }
    });
  }, [checkAndRefreshToken]);

  // ── 주기적 토큰 체크 (60초) + 탭 포커스 시 즉시 체크 ──
  useEffect(() => {
    if (status !== 'authenticated') return;

    const interval = setInterval(checkAndRefreshToken, TOKEN_CHECK_INTERVAL);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkAndRefreshToken();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [status, checkAndRefreshToken]);

  // 로딩 중 → 인증 확인 스피너
  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 미인증 → null (handleForceLogout에서 router.replace 처리됨)
  if (status !== 'authenticated') {
    return null;
  }

  return <>{children}</>;
}
