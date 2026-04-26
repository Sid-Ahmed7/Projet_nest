import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '@/app.module';
import { Reflector } from '@nestjs/core';
import { TransformInterceptor } from '@/interceptors/transform/transform.interceptor';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from '@/player/player.entity';
import { Match } from '@/match/match.entity';
import { Game } from '@/game/game.entity';
import { Tournament } from '@/tournament/tournament.entity';
import { Role } from '@/player/enum/role.enum';
import { MatchStatus } from '@/match/enum/match-status.enum';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

describe('PlayerController (e2e)', () => {
  let app: INestApplication<App>;
  let p1: Player;
  let p2: Player;
  let p1Token: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.useGlobalInterceptors(new TransformInterceptor(new Reflector()));
    await app.init();

    const playerRepo = app.get<Repository<Player>>(getRepositoryToken(Player));
    const gameRepo = app.get<Repository<Game>>(getRepositoryToken(Game));
    const tourRepo = app.get<Repository<Tournament>>(getRepositoryToken(Tournament));
    const matchRepo = app.get<Repository<Match>>(getRepositoryToken(Match));
    const jwtService = app.get<JwtService>(JwtService);

    await matchRepo.query('TRUNCATE TABLE matches CASCADE');
    await tourRepo.query('TRUNCATE TABLE tournament_players CASCADE');
    await tourRepo.query('TRUNCATE TABLE tournaments CASCADE');
    await playerRepo.query('TRUNCATE TABLE players CASCADE');
    await gameRepo.query('TRUNCATE TABLE games CASCADE');

    const pwd = await bcrypt.hash('secret', 10);
    p1 = await playerRepo.save({ username: 'ProGamer', email: 'pro@test.com', password: pwd, role: Role.PLAYER });
    p2 = await playerRepo.save({ username: 'NoobGamer', email: 'noob@test.com', password: pwd, role: Role.PLAYER });
    const admin = await playerRepo.save({
      username: 'AdminUser',
      email: 'admin@test.com',
      password: pwd,
      role: Role.ADMIN,
    });

    p1Token = jwtService.sign({ sub: p1.playerId, role: p1.role });
    adminToken = jwtService.sign({ sub: admin.playerId, role: admin.role });

    const game = await gameRepo.save({ name: 'Chess', publisher: 'World', genre: 'Strategy', releaseDate: new Date() });

    const tour = await tourRepo.save({
      name: 'World Cup',
      startDate: new Date(),
      maxPlayers: 2,
      game,
      players: [p1, p2],
    });

    await matchRepo.save({
      tournament: tour,
      round: 1,
      firstPlayer: p1,
      secondPlayer: p2,
      winner: p1,
      status: MatchStatus.COMPLETED,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /players', () => {
    it('should return a list of players', async () => {
      const response = await request(app.getHttpServer()).get('/players').expect(200);
      const body = response.body as { data: Player[] };
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });

    it('should filter players by username', async () => {
      const response = await request(app.getHttpServer()).get('/players?username=ProGamer').expect(200);
      const body = response.body as { data: Player[] };
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /players/rankings', () => {
    it('should return players sorted by wins', async () => {
      const response = await request(app.getHttpServer()).get('/players/rankings?sortBy=wins').expect(200);
      const body = response.body as { data: { playerId: string; wins: number }[] };

      expect(Array.isArray(body.data)).toBe(true);
      const pro = body.data.find((r) => r.playerId === p1.playerId);
      const noob = body.data.find((r) => r.playerId === p2.playerId);

      expect(pro).toBeDefined();
      expect(noob).toBeDefined();
      expect(pro?.wins).toEqual(1);
      expect(noob?.wins).toEqual(0);
    });
  });

  describe('GET /players/:playerId', () => {
    it('should return player details', async () => {
      const response = await request(app.getHttpServer()).get(`/players/${p1.playerId}`).expect(200);
      const body = response.body as { data: { playerId: string } };
      expect(body.data).toHaveProperty('playerId', p1.playerId);
    });

    it('should return 404 for non-existent player', async () => {
      const randomID = crypto.randomUUID();
      await request(app.getHttpServer()).get(`/players/${randomID}`).expect(404);
    });
  });

  describe('GET /players/:playerId/stats', () => {
    it('should return detailed stats', async () => {
      const response = await request(app.getHttpServer()).get(`/players/${p1.playerId}/stats`).expect(200);
      const body = response.body as { data: { totalMatches: number; wins: number; losses: number; winRate: number } };
      const stats = body.data;

      expect(stats).toHaveProperty('totalMatches');
      expect(stats.totalMatches).toEqual(1);
      expect(stats.wins).toEqual(1);
      expect(stats.losses).toEqual(0);
      expect(stats.winRate).toEqual(100);
    });
  });

  describe('GET /players/:playerId/tournaments', () => {
    it('should return tournaments for a player', async () => {
      const response = await request(app.getHttpServer()).get(`/players/${p1.playerId}/tournaments`).expect(200);
      const body = response.body as { data: { tournamentId: string; name: string }[] };
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });
  });

  describe('PATCH /players/:playerId', () => {
    it('should update player profile', async () => {
      await request(app.getHttpServer())
        .patch(`/players/${p1.playerId}`)
        .set('Authorization', `Bearer ${p1Token}`)
        .send({ username: 'ProGamerUpdated' })
        .expect(200);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .patch(`/players/${p1.playerId}`)
        .send({ username: 'Unauthorized' })
        .expect(401);
    });
  });

  describe('PATCH /players/:playerId/password', () => {
    it('should change player password', async () => {
      await request(app.getHttpServer())
        .patch(`/players/${p1.playerId}/password`)
        .set('Authorization', `Bearer ${p1Token}`)
        .send({ currentPassword: 'secret', newPassword: 'newSecret123' })
        .expect(204);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .patch(`/players/${p1.playerId}/password`)
        .send({ currentPassword: 'newSecret123', newPassword: 'anotherSecret456' })
        .expect(401);
    });
  });

  describe('DELETE /players/:playerId', () => {
    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer()).delete(`/players/${p2.playerId}`).expect(401);
    });

    it('should delete a player', async () => {
      await request(app.getHttpServer())
        .delete(`/players/${p2.playerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    it('should return 404 after deletion', async () => {
      await request(app.getHttpServer()).get(`/players/${p2.playerId}`).expect(404);
    });
  });
});
