import { Test, TestingModule } from '@nestjs/testing';
import { PlayerService } from '@/player/player.service';
import { Player } from './player.entity';
import { Role } from './enum/role.enum';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common/exceptions/unauthorized.exception';
import { MatchStatus } from '@/match/enum/match-status.enum';
import { RankingSortCriteria } from './enum/ranking-sort-criteria.enum';

const randomId = randomUUID();
const randomIdSecondPlayer = randomUUID();
const pwd = bcrypt.hashSync('Jesuisleplayer1@', 10);
const passwordSecondPlayer = bcrypt.hashSync('Jesuislesecondplayer2@', 10);
const pwdNewPlayer = bcrypt.hashSync('TheConqueror910@', 10);

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

const secondPlayer: Player = {
  playerId: randomIdSecondPlayer,
  username: 'TheConquerorOfTheMultiverse',
  email: 'theconqueror@gmail.com',
  password: passwordSecondPlayer,
  role: Role.PLAYER,
  refreshToken: null,
  avatar: '',
  createdAt: new Date(),
  tournaments: [],
  firstPlayer: [],
  secondPlayer: [],
  winner: [],
};

const playerRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
};

const matchRepository = {
  count: jest.fn(),
  find: jest.fn(),
};

describe('PlayerService', () => {
  let service: PlayerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayerService,
        { provide: 'PlayerRepository', useValue: playerRepository },
        { provide: 'MatchRepository', useValue: matchRepository },
      ],
    }).compile();

    service = module.get<PlayerService>(PlayerService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('findPlayerById', () => {
    it('should return player when found', async () => {
      playerRepository.findOne.mockResolvedValue(player);
      const result = await service.findPlayerById(player.playerId);
      expect(result).toEqual(player);
    });

    it('should throw NotFoundException when not found', async () => {
      playerRepository.findOne.mockResolvedValue(null);
      await expect(service.findPlayerById(randomUUID())).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all players', async () => {
      playerRepository.find.mockResolvedValue([player]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('findByEmail', () => {
    it('should return player when email exists', async () => {
      playerRepository.findOne.mockResolvedValue(player);
      const result = await service.findByEmail('therevenger@gmail.com');
      expect(result).toEqual(player);
    });
  });

  describe('findTournamentsByPlayer', () => {
    it('should return tournaments of a player', async () => {
      const tournament = { tournamentId: randomId, name: 'Basketball Tournament' };
      playerRepository.findOne.mockResolvedValue({ ...player, tournaments: [tournament] });

      const result = await service.findTournamentsByPlayer(player.playerId);
      expect(result).toHaveLength(1);
      expect(result[0].tournamentId).toBe(tournament.tournamentId);
    });

    it('should throw NotFoundException when player not found', async () => {
      playerRepository.findOne.mockResolvedValue(null);
      await expect(service.findTournamentsByPlayer(randomId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create player', async () => {
      playerRepository.create.mockReturnValue(player);
      playerRepository.save.mockResolvedValue(player);

      const result = await service.create({
        username: 'TheConqueror',
        email: 'Theconqueror2@gmail.com',
        password: pwdNewPlayer,
      });
      expect(result).toEqual(player);
    });
  });

  describe('updatePlayerProfile', () => {
    it('should update player profile', async () => {
      playerRepository.findOne.mockResolvedValue({ ...player });
      playerRepository.save.mockResolvedValue({ ...player, username: 'TheMultiverse' });

      const result = await service.updatePlayerProfile(player.playerId, { username: 'TheMultiverse' });
      expect(result.username).toBe('TheMultiverse');
    });
  });

  describe('changePassword', () => {
    it('should update password successfully', async () => {
      playerRepository.findOne.mockResolvedValue({ ...player, password: pwd });
      playerRepository.save.mockResolvedValue(undefined);

      await expect(
        service.changePassword(player.playerId, {
          currentPassword: 'Jesuisleplayer1@',
          newPassword: 'TheConqueror910@',
        }),
      ).resolves.toBeUndefined();
    });

    it('should throw UnauthorizedException when current password is wrong', async () => {
      playerRepository.findOne.mockResolvedValue({ ...player, password: pwd });

      await expect(
        service.changePassword(player.playerId, {
          currentPassword: 'TheFamousConqueror910@',
          newPassword: 'TheConqueror910@',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getPlayerStats', () => {
    it('should return correct stats', async () => {
      playerRepository.findOne.mockResolvedValue(player);
      matchRepository.count.mockResolvedValueOnce(5).mockResolvedValueOnce(3);

      const result = await service.getPlayerStats(player.playerId);
      expect(result.totalMatches).toBe(5);
      expect(result.wins).toBe(3);
      expect(result.losses).toBe(2);
      expect(result.winRate).toBe(60);
    });
  });

  describe('getRankings', () => {
    it('should return players sorted by wins', async () => {
      const p1 = { ...player, playerId: player.playerId, username: player.username };
      const p2 = { ...secondPlayer, playerId: secondPlayer.playerId, username: secondPlayer.username };
      playerRepository.find.mockResolvedValue([p1, p2]);
      matchRepository.find.mockResolvedValue([
        { firstPlayer: p1, secondPlayer: p2, winner: p1, status: MatchStatus.COMPLETED },
      ]);

      const result = await service.getRankings(RankingSortCriteria.WINS);
      expect(result[0].playerId).toBe(player.playerId);
      expect(result[0].wins).toBe(1);
    });

    it('should return players sorted by win rate', async () => {
      const p1 = { ...player, playerId: player.playerId, username: player.username };
      const p2 = { ...secondPlayer, playerId: secondPlayer.playerId, username: secondPlayer.username };
      playerRepository.find.mockResolvedValue([p1, p2]);
      matchRepository.find.mockResolvedValue([
        { firstPlayer: p1, secondPlayer: p2, winner: p1, status: MatchStatus.COMPLETED },
      ]);

      const result = await service.getRankings(RankingSortCriteria.WIN_RATE);
      expect(result[0].winRate).toBeGreaterThanOrEqual(result[1].winRate);
    });

    it('should return players sorted by total matches', async () => {
      const p1 = { ...player, playerId: player.playerId, username: player.username };
      const p2 = { ...secondPlayer, playerId: secondPlayer.playerId, username: secondPlayer.username };
      playerRepository.find.mockResolvedValue([p1, p2]);
      matchRepository.find.mockResolvedValue([
        { firstPlayer: p1, secondPlayer: p2, winner: p1, status: MatchStatus.COMPLETED },
        { firstPlayer: p1, secondPlayer: p2, winner: p2, status: MatchStatus.COMPLETED },
      ]);

      const result = await service.getRankings(RankingSortCriteria.TOTAL_MATCHES);
      expect(result[0].totalMatches).toBeGreaterThanOrEqual(result[1].totalMatches);
    });
  });

  describe('deletePlayer', () => {
    it('should delete player', async () => {
      playerRepository.findOne.mockResolvedValue(player);
      playerRepository.remove.mockResolvedValue(undefined);

      await expect(service.deletePlayer(player.playerId)).resolves.toBeUndefined();
    });

    it('should throw NotFoundException when player not found', async () => {
      playerRepository.findOne.mockResolvedValue(null);
      await expect(service.deletePlayer(randomId)).rejects.toThrow(NotFoundException);
    });
  });
});
