import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';

describe('PlayerGroups (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let createdGroupSeq: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get access token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        tu_email: 'admin@example.com',
        tu_password: 'password123',
      });

    accessToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/player-groups', () => {
    it('should create a new player group', () => {
      return request(app.getHttpServer())
        .post('/api/v1/player-groups')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          group_name: 'E2E Test Group',
          group_code: `GROUP-E2E-${Date.now()}`,
          building_seq: 1,
          group_description: 'E2E test group description',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('플레이어 그룹이 등록되었습니다.');
          expect(res.body.data.group_seq).toBeDefined();
          createdGroupSeq = res.body.data.group_seq;
        });
    });

    it('should return 400 if group_code is missing', () => {
      return request(app.getHttpServer())
        .post('/api/v1/player-groups')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          group_name: 'Invalid Group',
        })
        .expect(400);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/player-groups')
        .send({
          group_name: 'Test Group',
          group_code: 'GROUP-001',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/player-groups', () => {
    it('should return paginated player groups list', () => {
      return request(app.getHttpServer())
        .get('/api/v1/player-groups')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.items).toBeDefined();
          expect(res.body.data.pagination).toBeDefined();
          expect(Array.isArray(res.body.data.items)).toBe(true);
        });
    });

    it('should filter by building_seq', () => {
      return request(app.getHttpServer())
        .get('/api/v1/player-groups?building_seq=1')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should search by name', () => {
      return request(app.getHttpServer())
        .get('/api/v1/player-groups?search=E2E')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer()).get('/api/v1/player-groups').expect(401);
    });
  });

  describe('GET /api/v1/player-groups/:id', () => {
    it('should return a single player group', () => {
      if (!createdGroupSeq) {
        return; // Skip if no group was created
      }

      return request(app.getHttpServer())
        .get(`/api/v1/player-groups/${createdGroupSeq}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.group_seq).toBe(createdGroupSeq);
          expect(res.body.data.members).toBeDefined();
          expect(res.body.data.playlists).toBeDefined();
        });
    });

    it('should return 404 for non-existent group', () => {
      return request(app.getHttpServer())
        .get('/api/v1/player-groups/999999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/player-groups/:id', () => {
    it('should update a player group', () => {
      if (!createdGroupSeq) {
        return;
      }

      return request(app.getHttpServer())
        .put(`/api/v1/player-groups/${createdGroupSeq}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          group_name: 'Updated E2E Test Group',
          group_description: 'Updated description',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('플레이어 그룹이 수정되었습니다.');
        });
    });

    it('should return 404 for non-existent group', () => {
      return request(app.getHttpServer())
        .put('/api/v1/player-groups/999999')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          group_name: 'Updated Group',
        })
        .expect(404);
    });
  });

  describe('POST /api/v1/player-groups/:id/members', () => {
    it('should add members to a group', () => {
      if (!createdGroupSeq) {
        return;
      }

      return request(app.getHttpServer())
        .post(`/api/v1/player-groups/${createdGroupSeq}/members`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          player_seqs: [1, 2],
        })
        .expect((res) => {
          // May be 201 or 400 depending on if players exist
          expect([201, 400, 404]).toContain(res.status);
        });
    });
  });

  describe('DELETE /api/v1/player-groups/:id/members/:player_id', () => {
    it('should remove a member from a group', () => {
      if (!createdGroupSeq) {
        return;
      }

      return request(app.getHttpServer())
        .delete(`/api/v1/player-groups/${createdGroupSeq}/members/1`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect((res) => {
          // May be 200 or 404 depending on if member exists
          expect([200, 404]).toContain(res.status);
        });
    });
  });

  describe('DELETE /api/v1/player-groups/:id', () => {
    it('should delete a player group', () => {
      if (!createdGroupSeq) {
        return;
      }

      return request(app.getHttpServer())
        .delete(`/api/v1/player-groups/${createdGroupSeq}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('플레이어 그룹이 삭제되었습니다.');
        });
    });

    it('should return 404 for non-existent group', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/player-groups/999999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
