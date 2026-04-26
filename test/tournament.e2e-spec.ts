import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '@/app.module';
import { Reflector } from '@nestjs/core';
import { TransformInterceptor } from '@/interceptors/transform/transform.interceptor';
import { io, Socket } from 'socket.io-client';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../src/player/enum/role.enum';
import { TournamentStatus } from '@/tournament/enum/tournament-status.enum';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from '@/game/game.entity';
import { Player } from '@/player/player.entity';
import { Tournament } from '@/tournament/tournament.entity';
import { Match } from '@/match/match.entity';
import * as bcrypt from 'bcrypt';

describe('TournamentController & WebSocket (e2e)', () => {
  let app: INestApplication<App>;
  let wsClient: Socket;

  let adminToken: string;
  let p1Token: string;
  let p2Token: string;
  let gameId: string;
  let tournamentId: string;
  let tournamentToDeleteId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.useGlobalInterceptors(new TransformInterceptor(new Reflector()));
    await app.listen(5001);

    const gameRepo = app.get<Repository<Game>>(getRepositoryToken(Game));
    const playerRepo = app.get<Repository<Player>>(getRepositoryToken(Player));
    const tourRepo = app.get<Repository<Tournament>>(getRepositoryToken(Tournament));
    const matchRepo = app.get<Repository<Match>>(getRepositoryToken(Match));
    const jwtService = app.get<JwtService>(JwtService);

    await matchRepo.query('TRUNCATE TABLE matches CASCADE');
    await tourRepo.query('TRUNCATE TABLE tournament_players CASCADE');
    await tourRepo.query('TRUNCATE TABLE tournaments CASCADE');
    await playerRepo.query('TRUNCATE TABLE players CASCADE');
    await gameRepo.query('TRUNCATE TABLE games CASCADE');

    const game = await gameRepo.save({
      name: 'Super Smash Bros',
      publisher: 'Nintendo',
      releaseDate: new Date(),
      genre: 'Fighting',
    });
    gameId = game.gameId;

    const pwd = await bcrypt.hash('secret123', 10);

    const admin = await playerRepo.save({
      username: 'AdminUser',
      email: 'admin@test.com',
      password: pwd,
      role: Role.ADMIN,
    });
    const p1 = await playerRepo.save({ username: 'PlayerOne', email: 'p1@test.com', password: pwd, role: Role.PLAYER });
    const p2 = await playerRepo.save({ username: 'PlayerTwo', email: 'p2@test.com', password: pwd, role: Role.PLAYER });

    adminToken = jwtService.sign({ sub: admin.playerId, role: admin.role });
    p1Token = jwtService.sign({ sub: p1.playerId, role: p1.role });
    p2Token = jwtService.sign({ sub: p2.playerId, role: p2.role });
  });

  afterAll(async () => {
    if (wsClient) {
      wsClient.disconnect();
    }
    await app.close();
  });

  describe('POST /tournaments', () => {
    it('should create a tournament', async () => {
      const response = await request(app.getHttpServer())
        .post('/tournaments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Smash E2E Cup', gameId, maxPlayers: 2, startDate: new Date().toISOString() })
        .expect(201);

      const body = response.body as { data: { tournamentId: string } };
      expect(body.data).toHaveProperty('tournamentId');
      tournamentId = body.data.tournamentId;
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/tournaments')
        .send({ name: 'Unauthorized Tournament', gameId, maxPlayers: 2, startDate: new Date().toISOString() })
        .expect(401);
    });
  });

  describe('GET /tournaments', () => {
    it('should return a list of tournaments', async () => {
      const response = await request(app.getHttpServer()).get('/tournaments').expect(200);
      const body = response.body as { data: { tournamentId: string; name: string }[] };
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tournaments?status=${TournamentStatus.PENDING}`)
        .expect(200);
      const body = response.body as { data: { status: string }[] };
      expect(Array.isArray(body.data)).toBe(true);
      body.data.forEach((t) => expect(t.status).toBe(TournamentStatus.PENDING));
    });
  });

  describe('GET /tournaments/:tournamentId', () => {
    it('should return tournament details', async () => {
      const response = await request(app.getHttpServer()).get(`/tournaments/${tournamentId}`).expect(200);
      const body = response.body as { data: { tournamentId: string } };
      expect(body.data).toHaveProperty('tournamentId', tournamentId);
    });

    it('should return 404 for non-existent tournament', async () => {
      const randomID = crypto.randomUUID();
      await request(app.getHttpServer()).get(`/tournaments/${randomID}`).expect(404);
    });
  });

  describe('PUT /tournaments/:tournamentId', () => {
    it('should update a tournament', async () => {
      await request(app.getHttpServer())
        .put(`/tournaments/${tournamentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Smash E2E Cup Updated' })
        .expect(200);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .put(`/tournaments/${tournamentId}`)
        .send({ name: 'Unauthorized Update' })
        .expect(401);
    });
  });

  describe('DELETE /tournaments/:tournamentId', () => {
    it('should create a tournament to delete', async () => {
      const response = await request(app.getHttpServer())
        .post('/tournaments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Tournament To Delete', gameId, maxPlayers: 4, startDate: new Date().toISOString() })
        .expect(201);

      const body = response.body as { data: { tournamentId: string } };
      tournamentToDeleteId = body.data.tournamentId;
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer()).delete(`/tournaments/${tournamentToDeleteId}`).expect(401);
    });

    it('should delete a tournament', async () => {
      await request(app.getHttpServer())
        .delete(`/tournaments/${tournamentToDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    it('should return 404 after deletion', async () => {
      await request(app.getHttpServer()).get(`/tournaments/${tournamentToDeleteId}`).expect(404);
    });
  });

  describe('POST /tournaments/:tournamentId/join & WebSocket', () => {
    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer()).post(`/tournaments/${tournamentId}/join`).expect(401);
    });

    it('WebSocket should notify when tournament reaches maxCapacity and goes INPROGRESS', async () => {
      wsClient = io('http://localhost:5001');

      await new Promise<void>((resolve, reject) => {
        wsClient.on('connect', resolve);
        wsClient.on('connect_error', reject);
      });

      const statusChangePromise = new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('tournamentStatusChanged non reçu'));
        }, 10000);

        wsClient.on('tournamentStatusChanged', (data: { tournamentId: string; status: string }) => {
          if (data.tournamentId === tournamentId && data.status === 'in_progress') {
            clearTimeout(timeoutId);
            expect(data.status).toBe('in_progress');
            resolve();
          }
        });
      });

      const joinP1Res = await request(app.getHttpServer())
        .post(`/tournaments/${tournamentId}/join`)
        .set('Authorization', `Bearer ${p1Token}`);

      if (joinP1Res.status !== 200) {
        throw new Error(`P1 join failed ${joinP1Res.status}: ${JSON.stringify(joinP1Res.body)}`);
      }

      const joinP2Res = await request(app.getHttpServer())
        .post(`/tournaments/${tournamentId}/join`)
        .set('Authorization', `Bearer ${p2Token}`);

      if (joinP2Res.status !== 200) {
        throw new Error(`P2 join failed ${joinP2Res.status}: ${JSON.stringify(joinP2Res.body)}`);
      }

      await statusChangePromise;
    });
  });

  describe('GET /tournaments/:tournamentId/matches', () => {
    it('should return matches for the tournament', async () => {
      const response = await request(app.getHttpServer()).get(`/tournaments/${tournamentId}/matches`).expect(200);
      const body = response.body as { data: { matchId: string; round: number; status: string }[] };
      expect(Array.isArray(body.data)).toBe(true);
    });
  });
});
