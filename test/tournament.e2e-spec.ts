import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { Reflector } from '@nestjs/core';
import { TransformInterceptor } from '../src/interceptors/transform/transform.interceptor';
import { io, Socket } from 'socket.io-client';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../src/player/enum/role.enum';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from '../src/game/game.entity';
import { Player } from '../src/player/player.entity';
import { Tournament } from '../src/tournament/tournament.entity';
import { Match } from '../src/match/match.entity';
import * as bcrypt from 'bcrypt';

describe('TournamentController & WebSocket (e2e)', () => {
  let app: INestApplication<App>;
  let wsClient: Socket;

  let p1Token: string;
  let p2Token: string;
  let gameId: string;
  let tournamentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new TransformInterceptor(new Reflector()));
    await app.listen(5001);

    // Seed database
    const gameRepo = app.get<Repository<Game>>(getRepositoryToken(Game));
    const playerRepo = app.get<Repository<Player>>(getRepositoryToken(Player));
    const tourRepo = app.get<Repository<Tournament>>(getRepositoryToken(Tournament));
    const matchRepo = app.get<Repository<Match>>(getRepositoryToken(Match));
    const jwtService = app.get<JwtService>(JwtService);

    // Nettoyage complet pour garantir un état propre
    await matchRepo.query('TRUNCATE TABLE matches CASCADE');
    await tourRepo.query('TRUNCATE TABLE tournament_players CASCADE');
    await tourRepo.query('TRUNCATE TABLE tournaments CASCADE');
    await playerRepo.query('TRUNCATE TABLE players CASCADE');
    await gameRepo.query('TRUNCATE TABLE games CASCADE');

    // Create a Game
    const game = await gameRepo.save({
      name: 'Super Smash Bros',
      publisher: 'Nintendo',
      releaseDate: new Date(),
      genre: 'Fighting',
    });
    gameId = game.gameId;

    // Create 2 Players
    const pwd = await bcrypt.hash('secret123', 10);
    const p1 = await playerRepo.save({
      username: 'PlayerOne',
      email: 'p1@test.com',
      password: pwd,
      role: Role.PLAYER,
    });
    const p2 = await playerRepo.save({
      username: 'PlayerTwo',
      email: 'p2@test.com',
      password: pwd,
      role: Role.PLAYER,
    });

    // Generate tokens
    p1Token = jwtService.sign({ sub: p1.playerId, role: p1.role });
    p2Token = jwtService.sign({ sub: p2.playerId, role: p2.role });

    // Ensure database is clean or we have at least 2 players
  });

  afterAll(async () => {
    if (wsClient) {
      wsClient.disconnect();
    }
    await app.close();
  });

  it('Admin should be able to create a tournament', async () => {
    interface CreateTournamentResponse {
      data: { tournamentId: string };
    }

    const adminRepo = app.get<Repository<Player>>(getRepositoryToken(Player));
    const jwtService = app.get<JwtService>(JwtService);

    const admin = await adminRepo.save({
      username: 'AdminUser',
      email: 'admin@test.com',
      password: await bcrypt.hash('secret', 10),
      role: Role.ADMIN,
    });
    const adminToken = jwtService.sign({ sub: admin.playerId, role: admin.role });

    const createRes = await request(app.getHttpServer())
      .post('/tournaments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Smash E2E Cup',
        gameId: gameId,
        maxPlayers: 2,
        startDate: new Date().toISOString(),
      })
      .expect(201);

    const createBody = createRes.body as CreateTournamentResponse;
    tournamentId = createBody.data.tournamentId;
    expect(tournamentId).toBeDefined();
  });

  it('WebSocket should notify when tournament reaches maxCapacity and goes INPROGRESS', async () => {
    wsClient = io('http://localhost:5001');

    // Attendre la connexion WebSocket avant de déclencher les requêtes HTTP
    await new Promise<void>((resolve, reject) => {
      wsClient.on('connect', resolve);
      wsClient.on('connect_error', reject);
    });

    // Enregistrer le listener AVANT les requêtes HTTP pour éviter la race condition
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

    if (joinP1Res.status !== 201) {
      throw new Error(`P1 join failed ${joinP1Res.status}: ${JSON.stringify(joinP1Res.body)}`);
    }

    // Player 2 déclenche la génération du bracket et l'événement WS
    const joinP2Res = await request(app.getHttpServer())
      .post(`/tournaments/${tournamentId}/join`)
      .set('Authorization', `Bearer ${p2Token}`);

    if (joinP2Res.status !== 201) {
      throw new Error(`P2 join failed ${joinP2Res.status}: ${JSON.stringify(joinP2Res.body)}`);
    }

    await statusChangePromise;
  });
});
