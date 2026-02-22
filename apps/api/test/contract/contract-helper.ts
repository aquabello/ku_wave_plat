/**
 * Contract Test Helper
 *
 * Zod 스키마를 사용해 API 응답의 런타임 구조를 검증하는 유틸리티.
 * Contract Test가 실패하면 = FE-BE 간 API 계약이 깨졌다는 의미.
 */
import { z } from 'zod';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

/**
 * 테스트 앱 초기화 + 로그인 토큰 발급
 */
export async function setupTestApp(): Promise<{
  app: INestApplication;
  token: string;
}> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();

  // 로그인하여 토큰 발급
  const loginResponse = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({
      tu_email: 'admin@test.com',
      tu_password: 'password123',
    });

  const token = loginResponse.body?.data?.accessToken ?? '';

  return { app, token };
}

/**
 * Zod 스키마로 API 응답 검증
 *
 * 실패 시 어떤 필드가 계약을 위반했는지 상세히 출력.
 */
export function expectMatchesSchema<T extends z.ZodType>(
  data: unknown,
  schema: T,
  context?: string,
): z.infer<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      expected: issue.message,
      received: getNestedValue(data, issue.path),
    }));

    const errorMsg = [
      `\n❌ CONTRACT VIOLATION${context ? ` [${context}]` : ''}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ...issues.map(
        (i) =>
          `  Field: "${i.path}"\n  Expected: ${i.expected}\n  Received: ${JSON.stringify(i.received)}`,
      ),
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `FE-BE 계약이 깨졌습니다. @ku/contracts 스키마를 확인하세요.`,
    ].join('\n');

    throw new Error(errorMsg);
  }

  return result.data;
}

/**
 * 성공 응답 (success: true, data 존재) 검증
 */
export function expectSuccessResponse(body: any): void {
  expect(body).toHaveProperty('success', true);
  expect(body).toHaveProperty('data');
  expect(body.data).toBeDefined();
}

/**
 * 에러 응답 (success: false, error 존재) 검증
 */
export function expectErrorResponse(body: any, expectedCode?: string): void {
  expect(body).toHaveProperty('success', false);
  expect(body).toHaveProperty('error');
  expect(body.error).toHaveProperty('code');
  expect(body.error).toHaveProperty('message');
  expect(body.error).toHaveProperty('timestamp');
  if (expectedCode) {
    expect(body.error.code).toBe(expectedCode);
  }
}

// =============================================
// Internal Helpers
// =============================================

function getNestedValue(obj: any, path: (string | number)[]): any {
  let current = obj;
  for (const key of path) {
    if (current == null) return undefined;
    current = current[key];
  }
  return current;
}
