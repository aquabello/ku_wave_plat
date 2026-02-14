import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Players (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let createdPlayerSeq: number;
  let playerApiKey: string;

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

  describe('POST /api/v1/players', () => {
    it('should create a new player with PENDING approval', () => {
      return request(app.getHttpServer())
        .post('/api/v1/players')
        .set('Authorization', `Bearer ${token}`)
        .send({
          player_name: 'E2E Test Player',
          player_code: 'E2E-PLAYER-001',
          player_did: 'E2E-DID-001',
          player_mac: 'AA:BB:CC:DD:EE:FF',
          building_seq: 1,
          space_seq: 1,
          player_ip: '192.168.100.100',
          player_port: 9090,
          player_resolution: '1920x1080',
          player_orientation: 'LANDSCAPE',
          player_description: 'E2E Test Player Description',
          default_volume: 75,
        })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.player_seq).toBeDefined();
          expect(res.body.data.player_api_key).toMatch(/^player_[a-f0-9]{32}$/);
          expect(res.body.data.player_approval).toBe('PENDING');
          createdPlayerSeq = res.body.data.player_seq;
          playerApiKey = res.body.data.player_api_key;
        });
    });

    it('should fail with duplicate player code', () => {
      return request(app.getHttpServer())
        .post('/api/v1/players')
        .set('Authorization', `Bearer ${token}`)
        .send({
          player_name: 'Duplicate Player',
          player_code: 'E2E-PLAYER-001', // Same code
          building_seq: 1,
          player_ip: '192.168.100.101',
        })
        .expect(409);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/players')
        .send({
          player_name: 'Unauthorized Player',
          player_code: 'E2E-PLAYER-999',
          building_seq: 1,
          player_ip: '192.168.100.200',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/players', () => {
    it('should return paginated players list with all fields', () => {
      return request(app.getHttpServer())
        .get('/api/v1/players')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, limit: 20 })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.items).toBeInstanceOf(Array);
          expect(res.body.data.pagination).toBeDefined();
          expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(1);
          // 목록에서도 필드가 포함되어야 함
          const testPlayer = res.body.data.items.find(
            (p: any) => p.player_seq === createdPlayerSeq,
          );
          if (testPlayer) {
            expect(testPlayer.player_orientation).toBeDefined();
            expect(testPlayer.player_description).toBeDefined();
            expect(testPlayer.default_volume).toBeDefined();
          }
        });
    });

    it('should filter by approval status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/players')
        .set('Authorization', `Bearer ${token}`)
        .query({ approval: 'PENDING' })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          const pendingPlayers = res.body.data.items.filter(
            (p: any) => p.player_approval === 'PENDING',
          );
          expect(pendingPlayers.length).toBe(res.body.data.items.length);
        });
    });
  });

  describe('GET /api/v1/players/:player_seq', () => {
    it('should return player details with all fields including default_volume', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/players/${createdPlayerSeq}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.player_seq).toBe(createdPlayerSeq);
          expect(res.body.data.player_name).toBe('E2E Test Player');
          expect(res.body.data.player_code).toBe('E2E-PLAYER-001');
          expect(res.body.data.player_api_key).toBe(playerApiKey);
          // DB에 저장된 필드 검증
          expect(res.body.data.player_orientation).toBe('LANDSCAPE');
          expect(res.body.data.player_description).toBe('E2E Test Player Description');
          expect(res.body.data.default_volume).toBe(75);
          expect(res.body.data.player_resolution).toBe('1920x1080');
        });
    });

    it('should return 404 for non-existent player', () => {
      return request(app.getHttpServer())
        .get('/api/v1/players/999999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('POST /api/v1/players/:player_seq/approve', () => {
    it('should approve a pending player', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/players/${createdPlayerSeq}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.player_approval).toBe('APPROVED');
          expect(res.body.data.approved_by).toBeDefined();
          expect(res.body.data.approved_at).toBeDefined();
        });
    });

    it('should fail to approve already approved player', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/players/${createdPlayerSeq}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });

  describe('PUT /api/v1/players/:player_seq', () => {
    it('should update player information including default_volume', async () => {
      const updateResponse = await request(app.getHttpServer())
        .put(`/api/v1/players/${createdPlayerSeq}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          player_name: 'E2E Test Player Updated',
          player_ip: '192.168.100.150',
          player_description: 'Updated description',
          default_volume: 85,
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.player_seq).toBe(createdPlayerSeq);
      expect(updateResponse.body.data.upd_date).toBeDefined();

      // 업데이트 후 조회하여 실제 DB 저장 확인
      const getResponse = await request(app.getHttpServer())
        .get(`/api/v1/players/${createdPlayerSeq}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data.player_name).toBe('E2E Test Player Updated');
      expect(getResponse.body.data.default_volume).toBe(85);
      expect(getResponse.body.data.player_description).toBe('Updated description');
    });
  });

  describe('POST /api/v1/players/heartbeat', () => {
    it('should accept heartbeat from player', () => {
      return request(app.getHttpServer())
        .post('/api/v1/players/heartbeat')
        .set('X-Player-Api-Key', playerApiKey)
        .send({
          player_seq: createdPlayerSeq,
          player_version: '1.0.0',
          cpu_usage: 45.5,
          memory_usage: 60.2,
          disk_usage: 30.1,
          current_playlist: 'PLAYLIST-001',
          current_content: 'CONTENT-001',
        })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.player_status).toBe('ONLINE');
          expect(res.body.data.last_heartbeat_at).toBeDefined();
        });
    });

    it('should reject heartbeat with invalid API key', () => {
      return request(app.getHttpServer())
        .post('/api/v1/players/heartbeat')
        .set('X-Player-Api-Key', 'invalid_api_key')
        .send({
          player_seq: createdPlayerSeq,
          player_version: '1.0.0',
        })
        .expect(401);
    });

    it('should set status to ERROR if error_message provided', () => {
      return request(app.getHttpServer())
        .post('/api/v1/players/heartbeat')
        .set('X-Player-Api-Key', playerApiKey)
        .send({
          player_seq: createdPlayerSeq,
          player_version: '1.0.0',
          error_message: 'Connection timeout',
        })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.player_status).toBe('ERROR');
        });
    });
  });

  describe('GET /api/v1/players/:player_seq/heartbeat-logs', () => {
    it('should return heartbeat logs for player', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/players/${createdPlayerSeq}/heartbeat-logs`)
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, limit: 20 })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.items).toBeInstanceOf(Array);
          expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
        });
    });
  });

  describe('DELETE /api/v1/players/:player_seq', () => {
    it('should soft delete a player', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/players/${createdPlayerSeq}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('플레이어가 삭제되었습니다.');
        });
    });

    it('should not find deleted player', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/players/${createdPlayerSeq}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});
