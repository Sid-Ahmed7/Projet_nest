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

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let playerRepository: Repository<Player>;
  let refreshToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.useGlobalInterceptors(new TransformInterceptor(new Reflector()));
    await app.init();

    playerRepository = app.get<Repository<Player>>(getRepositoryToken(Player));
    await playerRepository.query('TRUNCATE TABLE matches CASCADE');
    await playerRepository.query('TRUNCATE TABLE tournament_players CASCADE');
    await playerRepository.query('TRUNCATE TABLE tournaments CASCADE');
    await playerRepository.query('TRUNCATE TABLE players CASCADE');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new player', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'GojoSatoru', email: 'gojo@gmail.com', password: 'Jesuisleplayernumero1@' })
        .expect(201);

      const body = response.body as { data: { username: string; email: string } };
      expect(body.data).toHaveProperty('username', 'GojoSatoru');
      expect(body.data).toHaveProperty('email', 'gojo@gmail.com');
    });

    it('should return 409 if email is already used', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'ItadoriYuji', email: 'sukuna@gmail.com', password: 'Jesuisleroidesfleauxdu91@' });

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'MegumiFushiguro', email: 'sukuna@gmail.com', password: 'Jesuismegumi91@' })
        .expect(409);
    });

    it('should return 400 for invalid input', async () => {
      await request(app.getHttpServer()).post('/auth/register').send({ username: 'S' }).expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'gojo@gmail.com', password: 'Jesuisleplayernumero1@' })
        .expect(200);

      const body = response.body as { data: { access_token: string; refresh_token: string } };
      expect(body.data).toHaveProperty('access_token');
      expect(body.data).toHaveProperty('refresh_token');
      refreshToken = body.data.refresh_token;
    });

    it('should return 401 for invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'gojo@gmail.com', password: 'Jesuisleplusfortdu91@' })
        .expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should return new tokens with a valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(200);

      const body = response.body as { data: { access_token: string; refresh_token: string } };
      expect(body.data).toHaveProperty('access_token');
      expect(body.data).toHaveProperty('refresh_token');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer()).post('/auth/refresh').expect(401);
    });
  });
});
