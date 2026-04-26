import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ILike } from 'typeorm';
import { Game } from './game.entity';
import { NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

const randomId = randomUUID();
const game: Game = {
  gameId: randomId,
  name: 'Street Fighter',
  publisher: 'Capcom',
  genre: 'Fighting',
  releaseDate: new Date('1991-01-01'),
  tournaments: [],
};

const gameRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

describe('GameService', () => {
  let service: GameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameService, { provide: getRepositoryToken(Game), useValue: gameRepository }],
    }).compile();

    service = module.get<GameService>(GameService);
    jest.clearAllMocks();
  });

  describe('findAllGames', () => {
    it('should return all games without filter', async () => {
      gameRepository.find.mockResolvedValue([game]);
      const result = await service.findAllGames();
      expect(result).toHaveLength(1);
    });

    it('should filter by genre if provided', async () => {
      gameRepository.find.mockResolvedValue([game]);
      await service.findAllGames('Fighting');
      expect(gameRepository.find).toHaveBeenCalledWith({ where: { genre: ILike('Fighting') } });
    });
  });

  describe('findGameById', () => {
    it('should return game when found', async () => {
      gameRepository.findOne.mockResolvedValue(game);
      const result = await service.findGameById(game.gameId);
      expect(result).toEqual(game);
    });

    it('should throw NotFoundException when not found', async () => {
      gameRepository.findOne.mockResolvedValue(null);
      await expect(service.findGameById(randomUUID())).rejects.toThrow(NotFoundException);
    });
  });

  describe('createGame', () => {
    it('should create game', async () => {
      gameRepository.create.mockReturnValue(game);
      gameRepository.save.mockResolvedValue(game);

      const result = await service.createGame({
        name: 'Street Fighter',
        publisher: 'Capcom',
        genre: 'Fighting',
        releaseDate: '1991-01-01',
      });
      expect(result).toEqual(game);
    });
  });

  describe('updateGame', () => {
    it('should update game', async () => {
      gameRepository.findOne.mockResolvedValue({ ...game });
      gameRepository.save.mockResolvedValue({ ...game, name: 'SF6' });

      const result = await service.updateGame(game.gameId, { name: 'SF6' });
      expect(result.name).toBe('SF6');
    });

    it('should throw NotFoundException when game not found', async () => {
      gameRepository.findOne.mockResolvedValue(null);
      await expect(service.updateGame(randomUUID(), { name: 'SF6' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteGame', () => {
    it('should delete game', async () => {
      gameRepository.findOne.mockResolvedValue(game);
      gameRepository.remove.mockResolvedValue(undefined);
      await expect(service.deleteGame(game.gameId)).resolves.toBeUndefined();
    });

    it('should throw NotFoundException when game not found', async () => {
      gameRepository.findOne.mockResolvedValue(null);
      await expect(service.deleteGame(randomUUID())).rejects.toThrow(NotFoundException);
    });
  });
});
