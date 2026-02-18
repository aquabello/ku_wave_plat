import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Playlists (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let createdPlaylistSeq: number;

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

  describe('POST /api/v1/playlists', () => {
    it('should create a new playlist with content mappings', () => {
      return request(app.getHttpServer())
        .post('/api/v1/playlists')
        .set('Authorization', `Bearer ${token}`)
        .send({
          playlist_name: 'E2E Test Playlist',
          playlist_code: 'E2E-PLAYLIST-001',
          playlist_type: 'NORMAL',
          playlist_loop: 'Y',
          playlist_description: 'E2E Test Description',
          contents: [
            {
              content_seq: 1,
              play_order: 1,
              play_duration: 30,
              transition_effect: 'FADE',
            },
            {
              content_seq: 2,
              play_order: 2,
              play_duration: 45,
              transition_effect: 'SLIDE',
            },
          ],
        })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.playlist_seq).toBeDefined();
          expect(res.body.data.playlist_code).toBe('E2E-PLAYLIST-001');
          createdPlaylistSeq = res.body.data.playlist_seq;
        });
    });

    it('should create playlist without contents', () => {
      return request(app.getHttpServer())
        .post('/api/v1/playlists')
        .set('Authorization', `Bearer ${token}`)
        .send({
          playlist_name: 'Empty Playlist',
          playlist_code: 'E2E-PLAYLIST-002',
          playlist_type: 'NORMAL',
        })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.playlist_seq).toBeDefined();
        });
    });

    it('should fail with duplicate playlist code', () => {
      return request(app.getHttpServer())
        .post('/api/v1/playlists')
        .set('Authorization', `Bearer ${token}`)
        .send({
          playlist_name: 'Duplicate Playlist',
          playlist_code: 'E2E-PLAYLIST-001', // Same code
          playlist_type: 'NORMAL',
        })
        .expect(409);
    });

    it('should fail with non-existent content', () => {
      return request(app.getHttpServer())
        .post('/api/v1/playlists')
        .set('Authorization', `Bearer ${token}`)
        .send({
          playlist_name: 'Invalid Content Playlist',
          playlist_code: 'E2E-PLAYLIST-003',
          playlist_type: 'NORMAL',
          contents: [
            {
              content_seq: 999999, // Non-existent
              play_order: 1,
              play_duration: 30,
            },
          ],
        })
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/playlists')
        .send({
          playlist_name: 'Unauthorized Playlist',
          playlist_code: 'E2E-PLAYLIST-999',
          playlist_type: 'NORMAL',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/playlists', () => {
    it('should return paginated playlists list', () => {
      return request(app.getHttpServer())
        .get('/api/v1/playlists')
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

    it('should filter by playlist type', () => {
      return request(app.getHttpServer())
        .get('/api/v1/playlists')
        .set('Authorization', `Bearer ${token}`)
        .query({ type: 'NORMAL' })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          const normalPlaylists = res.body.data.items.filter(
            (p: any) => p.playlist_type === 'NORMAL',
          );
          expect(normalPlaylists.length).toBe(res.body.data.items.length);
        });
    });

    it('should search by name or code', () => {
      return request(app.getHttpServer())
        .get('/api/v1/playlists')
        .set('Authorization', `Bearer ${token}`)
        .query({ search: 'E2E' })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
        });
    });
  });

  describe('GET /api/v1/playlists/:playlist_seq', () => {
    it('should return playlist with contents', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/playlists/${createdPlaylistSeq}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.playlist_seq).toBe(createdPlaylistSeq);
          expect(res.body.data.playlist_name).toBe('E2E Test Playlist');
          expect(res.body.data.playlist_code).toBe('E2E-PLAYLIST-001');
          expect(res.body.data.contents).toBeInstanceOf(Array);
          expect(res.body.data.contents.length).toBe(2);
          expect(res.body.data.contents[0].play_order).toBe(1);
          expect(res.body.data.contents[1].play_order).toBe(2);
        });
    });

    it('should return 404 for non-existent playlist', () => {
      return request(app.getHttpServer())
        .get('/api/v1/playlists/999999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/playlists/:playlist_seq', () => {
    it('should update playlist information', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/playlists/${createdPlaylistSeq}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          playlist_name: 'E2E Test Playlist Updated',
          playlist_description: 'Updated description',
        })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.playlist_seq).toBe(createdPlaylistSeq);
          expect(res.body.data.upd_date).toBeDefined();
        });
    });

    it('should replace content mappings', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/playlists/${createdPlaylistSeq}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          contents: [
            {
              content_seq: 1,
              play_order: 1,
              play_duration: 60,
              transition_effect: 'NONE',
            },
          ],
        })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
        })
        .then(() => {
          // Verify contents were replaced
          return request(app.getHttpServer())
            .get(`/api/v1/playlists/${createdPlaylistSeq}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect((res: any) => {
              expect(res.body.data.contents.length).toBe(1);
              expect(res.body.data.contents[0].play_duration).toBe(60);
            });
        });
    });
  });

  describe('DELETE /api/v1/playlists/:playlist_seq', () => {
    it('should soft delete a playlist', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/playlists/${createdPlaylistSeq}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('플레이리스트가 삭제되었습니다.');
        });
    });

    it('should not find deleted playlist', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/playlists/${createdPlaylistSeq}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});
