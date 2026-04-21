import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PlayerService } from '@/player/player.service';
import { JwtService } from '@nestjs/jwt';
import { Player } from '@/player/player.entity';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Role } from '@/player/enum/role.enum';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

const randomId = randomUUID();
const pwd = bcrypt.hashSync('Jesuisleplayer1@', 10);

const player: Player = {
  playerId: randomId,
  username: 'TheRevenger',
  email: 'therevenger@gmail.com',
  password: pwd,
  role: Role.PLAYER,
  refreshToken: null,
  avatar: '',
  createdAt: new Date(),
  tournaments: [],
  firstPlayer: [],
  secondPlayer: [],
  winner: [],
};

const playerService = {
  findByEmail: jest.fn(),
  findPlayerById: jest.fn(),
  create: jest.fn(),
  saveRefreshToken: jest.fn(),
};

const jwtService = {
  sign: jest.fn().mockReturnValue('token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PlayerService, useValue: playerService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return player if credentials are valid', async () => {
      playerService.findByEmail.mockResolvedValue({ ...player, password: pwd });

      const result = await service.validateUser(player.email, 'Jesuisleplayer1@');
      expect(result).toBeDefined();
      expect(result.email).toBe(player.email);
    });

    it('should throw UnauthorizedException if email is not found', async () => {
      playerService.findByEmail.mockResolvedValue(null);

      await expect(service.validateUser('bonjour@gmail.com', 'Jesuisleplayer1@')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      playerService.findByEmail.mockResolvedValue({ ...player, password: pwd });

      await expect(service.validateUser(player.email, 'Jesuisleplayer254@')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create a new player', async () => {
      playerService.findByEmail.mockResolvedValue(null);
      playerService.create.mockResolvedValue(player);

      const result = await service.register({
        username: player.username,
        email: player.email,
        password: 'Jesuisleplayer1@',
      });
      expect(result).toBeDefined();
      expect(result.email).toBe(player.email);
      expect(playerService.create).toHaveBeenCalledWith(expect.objectContaining({ email: player.email }));
    });

    it('should throw ConflictException if email is already in use', async () => {
      playerService.findByEmail.mockResolvedValue(player);

      await expect(
        service.register({
          username: player.username,
          email: player.email,
          password: 'Jesuisleplayer1@',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('generateTokens', () => {
    it('should return access_token and refresh_token', async () => {
      playerService.saveRefreshToken.mockResolvedValue(undefined);

      const result = await service.generateTokens(player);
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });
  });
});
