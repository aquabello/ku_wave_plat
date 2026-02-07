'use client';

import { useState } from 'react';
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

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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
