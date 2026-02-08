'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigation';
import { apiClient } from '@/lib/api/client';

const TOKEN_CHECK_INTERVAL = 30_000; // 30초 주기 토큰 검증
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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
 * 서버사이드 토큰 유효성 검증 (blocking)
 * apiClient의 onResponseError 우회를 위해 raw fetch 사용
 * → 401 시 window.location.href 이중 리다이렉트 방지
 */
async function verifyTokenOnServer(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/buildings?limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * AuthGuard - 인증 게이트 컴포넌트
 *
 * 렌더링 순서:
 * 1. loading → 로딩 스피너 표시
 * 2. JWT 클라이언트 만료 체크 (즉시)
 * 3. 서버 토큰 검증 (raw fetch, blocking)
 * 4. authenticated → children 렌더링
 * 5. unauthenticated → /login 리다이렉트
 *
 * 주기적 검증 (30초 + 탭 포커스)은 apiClient 사용 → onResponseError 자동 처리
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const clearMenus = useNavigationStore((s) => s.clearMenus);

  const handleForceLogout = useCallback((reason?: 'token_expired' | 'session_invalid') => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    clearMenus();
    if (reason) {
      sessionStorage.setItem('logout_reason', reason);
    }
    router.replace('/login');
  }, [clearMenus, router]);

  // 주기적 검증용 (apiClient 사용 → onResponseError에서 401 자동 처리)
  const verifyTokenPeriodic = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return Promise.resolve(false);
    return apiClient('/buildings', { method: 'GET', params: { limit: 1 } })
      .then(() => true)
      .catch(() => false);
  }, []);

  // ── 초기 로드: blocking 토큰 검증 ──
  useEffect(() => {
    const token = localStorage.getItem('access_token');

    // 1) 토큰 없음 → 즉시 로그인 (reason 없음 - 자연스러운 첫 방문일 수 있음)
    if (!token) {
      handleForceLogout();
      return;
    }

    // 2) 클라이언트 JWT 만료 체크
    if (isTokenExpired(token)) {
      handleForceLogout('token_expired');
      return;
    }

    // 3) 서버사이드 검증
    verifyTokenOnServer(token).then((valid) => {
      if (valid) {
        setStatus('authenticated');
      } else {
        handleForceLogout('session_invalid');
      }
    });
  }, [handleForceLogout]);

  // ── 주기적 토큰 검증 (30초) + 탭 포커스 시 즉시 검증 ──
  useEffect(() => {
    if (status !== 'authenticated') return;

    const interval = setInterval(verifyTokenPeriodic, TOKEN_CHECK_INTERVAL);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        verifyTokenPeriodic();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [status, verifyTokenPeriodic]);

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
