import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { Reflector } from '@nestjs/core';
import { TransformInterceptor } from '../src/interceptors/transform/transform.interceptor';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from '../src/player/player.entity';
import { Match } from '../src/match/match.entity';
import { Game } from '../src/game/game.entity';
import { Tournament } from '../src/tournament/tournament.entity';
import { Role } from '../src/player/enum/role.enum';
import { MatchStatus } from '../src/match/enum/match-status.enum';
import * as bcrypt from 'bcrypt';

describe('PlayerController (e2e)', () => {
  let app: INestApplication<App>;
  let p1: Player;
  let p2: Player;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new TransformInterceptor(new Reflector()));
    await app.init();

    const playerRepo = app.get<Repository<Player>>(getRepositoryToken(Player));
    const gameRepo = app.get<Repository<Game>>(getRepositoryToken(Game));
    const tourRepo = app.get<Repository<Tournament>>(getRepositoryToken(Tournament));
    const matchRepo = app.get<Repository<Match>>(getRepositoryToken(Match));

    await matchRepo.query('TRUNCATE TABLE matches CASCADE');
    await tourRepo.query('TRUNCATE TABLE tournament_players CASCADE');
    await tourRepo.query('TRUNCATE TABLE tournaments CASCADE');
    await playerRepo.query('TRUNCATE TABLE players CASCADE');
    await gameRepo.query('TRUNCATE TABLE games CASCADE');
    const pwd = await bcrypt.hash('secret', 10);
    p1 = await playerRepo.save({ username: 'ProGamer', email: 'pro@test.com', password: pwd, role: Role.PLAYER });
    p2 = await playerRepo.save({ username: 'NoobGamer', email: 'noob@test.com', password: pwd, role: Role.PLAYER });

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

  it('GET /players/rankings should return players sorted by wins', async () => {
    interface RankingEntry {
      playerId: string;
      wins: number;
    }
    interface RankingsResponse {
      data: RankingEntry[];
    }

    const response = await request(app.getHttpServer()).get('/players/rankings?sortBy=wins').expect(200);
    const body = response.body as RankingsResponse;

    expect(Array.isArray(body.data)).toBe(true);
    const pro = body.data.find((r) => r.playerId === p1.playerId);
    const noob = body.data.find((r) => r.playerId === p2.playerId);

    expect(pro).toBeDefined();
    expect(noob).toBeDefined();
    expect(pro?.wins).toEqual(1);
    expect(noob?.wins).toEqual(0);
  });

  it('GET /players/:id/stats should return detailed stats', async () => {
    interface StatsResponse {
      data: {
        totalMatches: number;
        wins: number;
        losses: number;
        winRate: number;
      };
    }

    const response = await request(app.getHttpServer()).get(`/players/${p1.playerId}/stats`).expect(200);
    const body = response.body as StatsResponse;
    const stats = body.data;

    expect(stats).toHaveProperty('totalMatches');
    expect(stats.totalMatches).toEqual(1);
    expect(stats.wins).toEqual(1);
    expect(stats.losses).toEqual(0);
    expect(stats.winRate).toEqual(100);
  });
});
