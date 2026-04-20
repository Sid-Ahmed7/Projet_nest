import { AppModule } from '@/app.module';
import { TransformInterceptor } from '@/interceptors/transform/transform.interceptor';
import { Player } from '@/player/player.entity';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core/services/reflector.service';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { Game } from '@/game/game.entity';
import { JwtService } from '@nestjs/jwt';
import { Tournament } from '@/tournament/tournament.entity';
import { Match } from '@/match/match.entity';
import * as bcrypt from 'bcrypt';
import { Role } from '@/player/enum/role.enum';
import { MatchStatus } from '@/match/enum/match-status.enum';

describe('MatchController (e2e)', () => {
  let app: INestApplication<App>;
  let matchRepository: Repository<Match>;
  let firstPlayerToken: string;
  let secondPlayerToken: string;
  let firstPlayerId: string;
  let secondPlayerId: string;
  let tournamentId: string;
  let createdMatchId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.useGlobalInterceptors(new TransformInterceptor(new Reflector()));
    await app.init();

    matchRepository = app.get<Repository<Match>>(getRepositoryToken(Match));
    const playerRepository = app.get<Repository<Player>>(getRepositoryToken(Player));
    const gameRepository = app.get<Repository<Game>>(getRepositoryToken(Game));
    const tournamentRepository = app.get<Repository<Tournament>>(getRepositoryToken(Tournament));
    const jwtService = app.get<JwtService>(JwtService);

    await matchRepository.query('TRUNCATE TABLE matches CASCADE');
    await tournamentRepository.query('TRUNCATE TABLE tournament_players CASCADE');
    await tournamentRepository.query('TRUNCATE TABLE tournaments CASCADE');
    await playerRepository.query('TRUNCATE TABLE players CASCADE');
    await gameRepository.query('TRUNCATE TABLE games CASCADE');

    const firstPlayer = await playerRepository.save({
      username: 'GojoSatoru',
      email: 'gojo.satoru@gmail.com',
      password: await bcrypt.hash('Jesuislefirstplayer1@', 10),
      role: Role.PLAYER,
    });

    const secondPlayer = await playerRepository.save({
      username: 'SukunaRyomen',
      email: 'sukuna.ryomen@gmail.com',
      password: await bcrypt.hash('Jesuislesecondplayer2@', 10),
      role: Role.PLAYER,
    });

    firstPlayerId = firstPlayer.playerId;
    secondPlayerId = secondPlayer.playerId;

    firstPlayerToken = jwtService.sign({ sub: firstPlayer.playerId, role: firstPlayer.role });
    secondPlayerToken = jwtService.sign({ sub: secondPlayer.playerId, role: secondPlayer.role });

    const game = await gameRepository.save({
      name: 'Deadly Stalk',
      publisher: 'Kenjaku',
      genre: 'Action',
      releaseDate: new Date(),
    });

    const tournament = await tournamentRepository.save({
      name: 'Cursed Fight',
      maxPlayers: 2,
      startDate: new Date(),
      game,
      players: [firstPlayer, secondPlayer],
    });

    tournamentId = tournament.tournamentId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /matches', () => {
    it('should create a match', async () => {
      const response = await request(app.getHttpServer())
        .post('/matches')
        .send({ tournamentId, firstPlayerId, secondPlayerId, round: 1 })
        .expect(201);

      const body = response.body as { data: { matchId: string } };
      expect(body.data).toHaveProperty('matchId');
      createdMatchId = body.data.matchId;
    });

    it('should return 400 when data is invalid', async () => {
      await request(app.getHttpServer()).post('/matches').send({ tournamentId, firstPlayerId, round: 1 }).expect(400);
    });

    it('should return 404 when tournament does not exist', async () => {
      const randomID = crypto.randomUUID();
      await request(app.getHttpServer())
        .post('/matches')
        .send({
          tournamentId: randomID,
          firstPlayerId,
          secondPlayerId,
          round: 1,
        })
        .expect(404);
    });
  });

  describe('GET /matches', () => {
    it('should return a list of matches', async () => {
      const response = await request(app.getHttpServer()).get('/matches').expect(200);
      const body = response.body as { data: Match[] };
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });

    it('should filter matches by status', async () => {
      const response = await request(app.getHttpServer()).get(`/matches?status=${MatchStatus.PENDING}`).expect(200);
      const body = response.body as { data: Match[] };
      expect(Array.isArray(body.data)).toBe(true);
      body.data.forEach((match) => expect(match.status).toBe(MatchStatus.PENDING));
    });
  });

  describe('GET /matches/:matchId', () => {
    it('should return match details', async () => {
      const response = await request(app.getHttpServer()).get(`/matches/${createdMatchId}`).expect(200);
      const body = response.body as { data: { matchId: string } };
      expect(body.data).toHaveProperty('matchId', createdMatchId);
    });

    it('should return 404 for non-existent match', async () => {
      const randomID = crypto.randomUUID();
      await request(app.getHttpServer()).get(`/matches/${randomID}`).expect(404);
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app.getHttpServer()).get('/matches/invalid-uuid').expect(400);
    });
  });

  describe('POST /matches/:matchId/result', () => {
    it('should submit match result successfully', async () => {
      const response = await request(app.getHttpServer())
        .post(`/matches/${createdMatchId}/result`)
        .set('Authorization', `Bearer ${firstPlayerToken}`)
        .send({ winnerId: secondPlayerId, score: '3-1' })
        .expect(200);

      const body = response.body as { data: { matchId: string; status: string } };
      expect(body.data).toHaveProperty('matchId');
      expect(body.data.status).toBe('completed');
    });

    it('should return 400 when match is already completed', async () => {
      await request(app.getHttpServer())
        .post(`/matches/${createdMatchId}/result`)
        .set('Authorization', `Bearer ${secondPlayerToken}`)
        .send({ winnerId: secondPlayerId, score: '3-1' })
        .expect(400);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post(`/matches/${createdMatchId}/result`)
        .send({ winnerId: firstPlayerId, score: '3-1' })
        .expect(401);
    });

    it('should return 404 when match does not exist', async () => {
      const randomID = crypto.randomUUID();
      await request(app.getHttpServer())
        .post(`/matches/${randomID}/result`)
        .set('Authorization', `Bearer ${firstPlayerToken}`)
        .send({ winnerId: firstPlayerId, score: '3-1' })
        .expect(404);
    });
  });
});
