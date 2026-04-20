import { AppModule } from '@/app.module';
import { Game } from '@/game/game.entity';
import { TransformInterceptor } from '@/interceptors/transform/transform.interceptor';
import { Player } from '@/player/player.entity';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core/services/reflector.service';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm/dist/common/typeorm.utils';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';
import { Role } from '@/player/enum/role.enum';
import * as bcrypt from 'bcrypt';
import request from 'supertest';

describe('GameController (e2e)', () => {
  let app: INestApplication<App>;
  let gameRepository: Repository<Game>;
  let adminToken: string;
  let playerToken: string;
  let createdGameId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.useGlobalInterceptors(new TransformInterceptor(new Reflector()));
    await app.init();

    gameRepository = app.get<Repository<Game>>(getRepositoryToken(Game));
    const playerRepository = app.get<Repository<Player>>(getRepositoryToken(Player));
    const jwtService = app.get<JwtService>(JwtService);

    await gameRepository.query('TRUNCATE TABLE tournament_players CASCADE');
    await gameRepository.query('TRUNCATE TABLE tournaments CASCADE');
    await gameRepository.query('TRUNCATE TABLE games CASCADE');
    await gameRepository.query('TRUNCATE TABLE players CASCADE');

    const pwdPlayer = await bcrypt.hash('jesuisunplayer', 10);
    const pwdAdmin = await bcrypt.hash('jesuisunadmin', 10);

    const admin = await playerRepository.save({
      username: 'AdminUser',
      email: 'admin@gmail.com',
      password: pwdAdmin,
      role: Role.ADMIN,
    });

    const player = await playerRepository.save({
      username: 'GojoSatoru',
      email: 'gojo@gmail.com',
      password: pwdPlayer,
      role: Role.PLAYER,
    });

    adminToken = jwtService.sign({ sub: admin.playerId, role: admin.role });
    playerToken = jwtService.sign({ sub: player.playerId, role: player.role });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /games', () => {
    it('should create a new game', async () => {
      const response = await request(app.getHttpServer())
        .post('/games')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Naruto Shippuden: Ultimate Ninja Storm 4',
          publisher: 'Bandai Namco',
          releaseDate: '2016-02-04',
          genre: 'Action',
        })
        .expect(201);
      const body = response.body as { data: { gameId: string } };
      expect(body.data).toHaveProperty('gameId');

      createdGameId = body.data.gameId;
    });

    it('should return 403 for when player users try to create a game', async () => {
      await request(app.getHttpServer())
        .post('/games')
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          name: 'Naruto Shippuden: Ultimate Ninja Storm 4',
          publisher: 'Bandai Namco',
          releaseDate: '2016-02-04',
          genre: 'Action',
        })
        .expect(403);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/games')
        .send({
          name: 'Naruto Shippuden: Ultimate Ninja Storm 4',
          publisher: 'Bandai Namco',
          releaseDate: '2016-02-04',
          genre: 'Action',
        })
        .expect(401);
    });
  });

  describe('GET /games', () => {
    it('should return a list of games', async () => {
      const response = await request(app.getHttpServer()).get('/games').expect(200);
      const body = response.body as { data: Game[] };
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /games/:gameId', () => {
    it('should return game details', async () => {
      const response = await request(app.getHttpServer()).get(`/games/${createdGameId}`).expect(200);
      const body = response.body as { data: Game };
      expect(body.data).toHaveProperty('gameId', createdGameId);
    });

    it('should return 404 for non-existent game', async () => {
      await request(app.getHttpServer()).get(`/games/${crypto.randomUUID()}`).expect(404);
    });
  });

  describe('PUT /games/:gameId', () => {
    it('should update game details', async () => {
      await request(app.getHttpServer())
        .put(`/games/${createdGameId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Naruto Shippuden: Ultimate Ninja Storm 4 Road to Boruto' })
        .expect(200);

      const updatedGame = await gameRepository.findOneBy({ gameId: createdGameId });
      expect(updatedGame).toHaveProperty('name', 'Naruto Shippuden: Ultimate Ninja Storm 4 Road to Boruto');
    });

    it('should return 403 when player tries to update a game', async () => {
      await request(app.getHttpServer())
        .put(`/games/${createdGameId}`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({ name: 'Naruto Shippuden: Ultimate Ninja Storm 4 Road to Boruto' })
        .expect(403);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .put(`/games/${createdGameId}`)
        .send({ name: 'Naruto Shippuden: Ultimate Ninja Storm 4 Road to Boruto' })
        .expect(401);
    });
  });
  describe('DELETE /games/:gameId', () => {
    it('should return 403 when player tries to delete', async () => {
      await request(app.getHttpServer())
        .delete(`/games/${createdGameId}`)
        .set('Authorization', `Bearer ${playerToken}`)
        .expect(403);
    });

    it('should delete a game as admin', async () => {
      await request(app.getHttpServer())
        .delete(`/games/${createdGameId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    it('should return 404 after deletion', async () => {
      await request(app.getHttpServer()).get(`/games/${createdGameId}`).expect(404);
    });
  });
});
