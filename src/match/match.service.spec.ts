import { Test, TestingModule } from '@nestjs/testing';
import { MatchService } from '@/match/match.service';
import { randomUUID } from 'crypto';
import { Tournament } from '@/tournament/tournament.entity';
import { TournamentStatus } from '@/tournament/enum/tournament-status.enum';
import { Player } from '@/player/player.entity';
import { Role } from '@/player/enum/role.enum';
import { Match } from '@/match/match.entity';
import { MatchStatus } from '@/match/enum/match-status.enum';
import { Game } from '@/game/game.entity';
import * as bcrypt from 'bcrypt';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { BadRequestException } from '@nestjs/common/exceptions/bad-request.exception';
import { TournamentGateway } from '@/tournament/tournament.gateway';

const tournamentId = randomUUID();
const pwdPlayer = bcrypt.hashSync('Jesuisleplayer1@', 10);
const pwdSecondPlayer = bcrypt.hashSync('Jesuislesecondplayer2@', 10);

const game: Game = {
  gameId: randomUUID(),
  name: 'Mortal Kombat',
  publisher: 'Midway',
  releaseDate: new Date('1992-10-08'),
  genre: 'Fighting',
  tournaments: [],
};

const player1: Player = {
  playerId: randomUUID(),
  username: 'TheRevenger',
  email: 'therevenger@gmail.com',
  password: pwdPlayer,
  role: Role.PLAYER,
  refreshToken: null,
  avatar: '',
  createdAt: new Date(),
  tournaments: [],
  firstPlayer: [],
  secondPlayer: [],
  winner: [],
};

const player2: Player = {
  playerId: randomUUID(),
  username: 'TheConqueror',
  email: 'theconqueror@gmail.com',
  password: pwdSecondPlayer,
  role: Role.PLAYER,
  refreshToken: null,
  avatar: '',
  createdAt: new Date(),
  tournaments: [],
  firstPlayer: [],
  secondPlayer: [],
  winner: [],
};

const tournament: Tournament = {
  tournamentId: randomUUID(),
  name: 'Cursed Fight',
  maxPlayers: 2,
  startDate: new Date(),
  status: TournamentStatus.PENDING,
  createdAt: new Date(),
  game,
  players: [player1, player2],
  matches: [],
};

const match: Match = {
  matchId: randomUUID(),
  score: '',
  round: 1,
  status: MatchStatus.PENDING,
  tournament,
  firstPlayer: player1,
  secondPlayer: player2,
  winner: null,
  nextMatch: null,
};
const matchRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
};

const playerRepository = {
  findOne: jest.fn(),
};
const tournamentRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
};

const tournamentGateway = {
  notifyTournamentStatusChange: jest.fn(),
};

describe('MatchService', () => {
  let service: MatchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchService,
        { provide: 'MatchRepository', useValue: matchRepository },
        { provide: 'PlayerRepository', useValue: playerRepository },
        { provide: 'TournamentRepository', useValue: tournamentRepository },
        { provide: TournamentGateway, useValue: tournamentGateway },
      ],
    }).compile();

    service = module.get<MatchService>(MatchService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all matches without filter', async () => {
      matchRepository.find.mockResolvedValue([match]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });

    it('should return matches filtered by status', async () => {
      matchRepository.find.mockResolvedValue([match]);
      await service.findAll(MatchStatus.PENDING);
      expect(matchRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: MatchStatus.PENDING } }),
      );
    });
  });

  describe('findOne', () => {
    it('should return match when found', async () => {
      matchRepository.findOne.mockResolvedValue(match);
      const result = await service.findOne(match.matchId);
      expect(result).toEqual(match);
    });

    it('should throw NotFoundException when not found', async () => {
      matchRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(match.matchId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createMatch', () => {
    it('should create a match successfully', async () => {
      tournamentRepository.findOne.mockResolvedValue(tournament);
      playerRepository.findOne.mockResolvedValueOnce(player1).mockResolvedValueOnce(player2);
      matchRepository.create.mockReturnValue(match);
      matchRepository.save.mockResolvedValue(match);

      const result = await service.createMatch({
        tournamentId: tournament.tournamentId,
        firstPlayerId: player1.playerId,
        secondPlayerId: player2.playerId,
        round: 1,
      });
      expect(result).toEqual(match);
    });

    it('should throw NotFoundException when tournament not found', async () => {
      tournamentRepository.findOne.mockResolvedValue(null);
      await expect(
        service.createMatch({
          tournamentId: tournamentId,
          firstPlayerId: player1.playerId,
          secondPlayerId: player2.playerId,
          round: 1,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when first player not found', async () => {
      tournamentRepository.findOne.mockResolvedValue(tournament);
      playerRepository.findOne.mockResolvedValueOnce(null);
      await expect(
        service.createMatch({
          tournamentId: tournament.tournamentId,
          firstPlayerId: randomUUID(),
          secondPlayerId: player2.playerId,
          round: 1,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when second player not found', async () => {
      tournamentRepository.findOne.mockResolvedValue(tournament);
      playerRepository.findOne.mockResolvedValueOnce(player1).mockResolvedValueOnce(null);
      await expect(
        service.createMatch({
          tournamentId: tournament.tournamentId,
          firstPlayerId: player1.playerId,
          secondPlayerId: randomUUID(),
          round: 1,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when player plays against themselves', async () => {
      tournamentRepository.findOne.mockResolvedValue(tournament);
      playerRepository.findOne.mockResolvedValueOnce(player1).mockResolvedValueOnce(player1);

      await expect(
        service.createMatch({
          tournamentId: tournament.tournamentId,
          firstPlayerId: player1.playerId,
          secondPlayerId: player1.playerId,
          round: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitResult', () => {
    it('should submit result successfully', async () => {
      matchRepository.findOne.mockResolvedValue({ ...match });
      playerRepository.findOne.mockResolvedValue(player1);
      matchRepository.save.mockResolvedValue({
        ...match,
        winner: player1,
        score: '3-1',
        status: MatchStatus.COMPLETED,
        nextMatch: null,
      });
      tournamentRepository.findOne.mockResolvedValue({ ...tournament });
      tournamentRepository.save.mockResolvedValue(undefined);

      const result = await service.submitResult(match.matchId, { winnerId: player1.playerId, score: '3-1' });
      expect(result.status).toBe(MatchStatus.COMPLETED);
    });

    it('should throw BadRequestException when match already completed', async () => {
      matchRepository.findOne.mockResolvedValue({ ...match, status: MatchStatus.COMPLETED });

      await expect(service.submitResult(match.matchId, { winnerId: player1.playerId, score: '3-1' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when winner player not found', async () => {
      matchRepository.findOne.mockResolvedValue({ ...match });
      playerRepository.findOne.mockResolvedValue(null);

      await expect(service.submitResult(match.matchId, { winnerId: randomUUID(), score: '3-1' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when winner is not a participant', async () => {
      matchRepository.findOne.mockResolvedValue({ ...match });
      playerRepository.findOne.mockResolvedValue({ playerId: randomUUID(), username: 'ConquerorStranger' });

      await expect(service.submitResult(match.matchId, { winnerId: randomUUID(), score: '3-1' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
