'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { showToast } from '@/lib/toast';
import { login } from '@/lib/api/auth';
import { loginSchema, type LoginFormValues } from '@/lib/validations/auth';
import { useNavigationStore } from '@/stores/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // 세션 만료/변경으로 인한 강제 로그아웃 시 안내 메시지 표시
  useEffect(() => {
    const reason = sessionStorage.getItem('logout_reason');
    if (!reason) return;

    sessionStorage.removeItem('logout_reason');

    switch (reason) {
      case 'permission_changed':
        showToast.error(
          '권한 변경',
          '권한이 변경되어 자동 로그아웃 되었습니다. 다시 로그인해주세요.'
        );
        break;
      case 'token_expired':
        showToast.error(
          '세션 만료',
          '로그인 세션이 만료되었습니다. 다시 로그인해주세요.'
        );
        break;
      case 'session_invalid':
      case 'session_expired':
        showToast.error(
          '세션 종료',
          '세션이 변경되어 로그아웃 되었습니다. 다시 로그인해주세요.'
        );
        break;
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      id: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await login(data);
      localStorage.setItem('access_token', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      useNavigationStore.getState().setMenus(response.menus ?? []);
      router.push('/dashboard');
    } catch (error) {
      showToast.apiError(error, '로그인 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          <img
            src="https://www.konkuk.ac.kr/sites/konkuk/images/common/logo-top-color.png"
            alt="건국대학교 로고"
            className="h-12"
          />
        </div>
        <CardTitle className="text-2xl text-center">KU Wave Plat</CardTitle>
        <CardDescription className="text-center">
          관리자 계정으로 로그인하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="id">아이디</Label>
            <Input
              id="id"
              type="text"
              placeholder="admin"
              {...register('id')}
            />
            {errors.id && (
              <p className="text-sm text-destructive">{errors.id.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
