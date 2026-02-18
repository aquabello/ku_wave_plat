import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Contents (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let createdContentSeq: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
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
      })
      .expect(200);

    token = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/contents', () => {
    it('should create content with file upload (mock)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/contents')
        .set('Authorization', `Bearer ${token}`)
        .field('content_name', 'E2E Test Video')
        .field('content_code', 'E2E-CONTENT-001')
        .field('content_type', 'VIDEO')
        .field('content_duration', '45')
        .field('content_description', 'E2E Test Video Description')
        .attach('file', Buffer.from('mock video content'), 'test-video.mp4')
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.content_seq).toBeDefined();
          expect(res.body.data.content_code).toBe('E2E-CONTENT-001');
          expect(res.body.data.content_file_path).toBeDefined();
          createdContentSeq = res.body.data.content_seq;
        });
    });

    it('should create STREAM content without file', () => {
      return request(app.getHttpServer())
        .post('/api/v1/contents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content_name: 'E2E Stream Content',
          content_code: 'E2E-CONTENT-002',
          content_type: 'STREAM',
          content_url: 'https://stream.example.com/video.m3u8',
          content_duration: 0,
        })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.content_seq).toBeDefined();
        });
    });

    it('should fail with duplicate content code', () => {
      return request(app.getHttpServer())
        .post('/api/v1/contents')
        .set('Authorization', `Bearer ${token}`)
        .field('content_name', 'Duplicate Content')
        .field('content_code', 'E2E-CONTENT-001') // Same code
        .field('content_type', 'VIDEO')
        .attach('file', Buffer.from('mock content'), 'duplicate.mp4')
        .expect(409);
    });

    it('should fail VIDEO type without file', () => {
      return request(app.getHttpServer())
        .post('/api/v1/contents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content_name: 'Missing File',
          content_code: 'E2E-CONTENT-003',
          content_type: 'VIDEO',
        })
        .expect(400);
    });

    it('should fail STREAM type without URL', () => {
      return request(app.getHttpServer())
        .post('/api/v1/contents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content_name: 'Missing URL',
          content_code: 'E2E-CONTENT-004',
          content_type: 'STREAM',
        })
        .expect(400);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/contents')
        .send({
          content_name: 'Unauthorized Content',
          content_code: 'E2E-CONTENT-999',
          content_type: 'IMAGE',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/contents', () => {
    it('should return paginated contents list', () => {
      return request(app.getHttpServer())
        .get('/api/v1/contents')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, limit: 20 })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.items).toBeInstanceOf(Array);
          expect(res.body.data.pagination).toBeDefined();
          expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(2);
        });
    });

    it('should filter by content type', () => {
      return request(app.getHttpServer())
        .get('/api/v1/contents')
        .set('Authorization', `Bearer ${token}`)
        .query({ type: 'VIDEO' })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          const videoContents = res.body.data.items.filter(
            (c: any) => c.content_type === 'VIDEO',
          );
          expect(videoContents.length).toBe(res.body.data.items.length);
        });
    });

    it('should search by name or code', () => {
      return request(app.getHttpServer())
        .get('/api/v1/contents')
        .set('Authorization', `Bearer ${token}`)
        .query({ search: 'E2E' })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
        });
    });
  });

  describe('GET /api/v1/contents/:content_seq', () => {
    it('should return content details', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/contents/${createdContentSeq}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.content_seq).toBe(createdContentSeq);
          expect(res.body.data.content_name).toBe('E2E Test Video');
          expect(res.body.data.content_code).toBe('E2E-CONTENT-001');
          expect(res.body.data.content_type).toBe('VIDEO');
          expect(res.body.data.content_file_path).toBeDefined();
        });
    });

    it('should return 404 for non-existent content', () => {
      return request(app.getHttpServer())
        .get('/api/v1/contents/999999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/contents/:content_seq', () => {
    it('should update content information without file', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/contents/${createdContentSeq}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content_name: 'E2E Test Video Updated',
          content_duration: 60,
          content_description: 'Updated description',
        })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.content_seq).toBe(createdContentSeq);
          expect(res.body.data.upd_date).toBeDefined();
        });
    });

    it('should replace file when provided', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/contents/${createdContentSeq}`)
        .set('Authorization', `Bearer ${token}`)
        .field('content_name', 'E2E Test Video with New File')
        .attach('file', Buffer.from('new mock video content'), 'new-test-video.mp4')
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.content_seq).toBe(createdContentSeq);
        });
    });

    it('should fail to update non-existent content', () => {
      return request(app.getHttpServer())
        .put('/api/v1/contents/999999')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content_name: 'Non-existent Update',
        })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/contents/:content_seq', () => {
    it('should soft delete a content', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/contents/${createdContentSeq}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('콘텐츠가 삭제되었습니다.');
        });
    });

    it('should not find deleted content', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/contents/${createdContentSeq}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('should fail to delete non-existent content', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/contents/999999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});
