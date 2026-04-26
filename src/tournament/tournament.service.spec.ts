import { Test, TestingModule } from '@nestjs/testing';
import { TournamentService } from '@/tournament/tournament.service';
import { Tournament } from '@/tournament/tournament.entity';
import { TournamentStatus } from '@/tournament/enum/tournament-status.enum';
import { Player } from '@/player/player.entity';
import { Role } from '@/player/enum/role.enum';
import { Game } from '@/game/game.entity';
import { Match } from '@/match/match.entity';
import { MatchStatus } from '@/match/enum/match-status.enum';
import { TournamentGateway } from '@/tournament/tournament.gateway';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

const pwdPlayer1 = bcrypt.hashSync('Jesuisleplayer1@', 10);
const pwdPlayer2 = bcrypt.hashSync('Jesuislesecondplayer2@', 10);

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
  password: pwdPlayer1,
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
  password: pwdPlayer2,
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
  players: [],
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

const tournamentRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

const gameRepository = {
  findOne: jest.fn(),
};

const playerRepository = {
  findOne: jest.fn(),
};

const matchRepository = {
  create: jest.fn(),
  save: jest.fn(),
};

const tournamentGateway = {
  notifyTournamentStatusChange: jest.fn(),
};

describe('TournamentService', () => {
  let service: TournamentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TournamentService,
        { provide: 'TournamentRepository', useValue: tournamentRepository },
        { provide: 'GameRepository', useValue: gameRepository },
        { provide: 'PlayerRepository', useValue: playerRepository },
        { provide: 'MatchRepository', useValue: matchRepository },
        { provide: TournamentGateway, useValue: tournamentGateway },
      ],
    }).compile();

    service = module.get<TournamentService>(TournamentService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllTournaments', () => {
    it('should return all tournaments without filter', async () => {
      tournamentRepository.find.mockResolvedValue([tournament]);
      const result = await service.findAllTournaments();
      expect(result).toHaveLength(1);
    });

    it('should filter by status if provided', async () => {
      tournamentRepository.find.mockResolvedValue([tournament]);
      await service.findAllTournaments(TournamentStatus.PENDING);
      expect(tournamentRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: TournamentStatus.PENDING } }),
      );
    });
  });

  describe('findTournamentById', () => {
    it('should return tournament when found', async () => {
      tournamentRepository.findOne.mockResolvedValue(tournament);
      const result = await service.findTournamentById(tournament.tournamentId);
      expect(result).toEqual(tournament);
    });

    it('should throw NotFoundException when not found', async () => {
      tournamentRepository.findOne.mockResolvedValue(null);
      await expect(service.findTournamentById(randomUUID())).rejects.toThrow(NotFoundException);
    });
  });

  describe('createTournament', () => {
    it('should create and return a tournament', async () => {
      gameRepository.findOne.mockResolvedValue(game);
      tournamentRepository.create.mockReturnValue(tournament);
      tournamentRepository.save.mockResolvedValue(tournament);

      const result = await service.createTournament({
        name: 'Cursed Fight',
        maxPlayers: 2,
        startDate: tournament.startDate.toISOString(),
        gameId: game.gameId,
      });
      expect(result).toEqual(tournament);
    });

    it('should throw NotFoundException when game not found', async () => {
      gameRepository.findOne.mockResolvedValue(null);
      await expect(
        service.createTournament({
          name: 'Cursed Fight',
          maxPlayers: 2,
          startDate: tournament.startDate.toISOString(),
          gameId: randomUUID(),
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTournament', () => {
    it('should update and return the tournament', async () => {
      tournamentRepository.findOne.mockResolvedValue({ ...tournament });
      tournamentRepository.save.mockResolvedValue({ ...tournament, name: 'Grand Finals' });

      const result = await service.updateTournament(tournament.tournamentId, { name: 'Grand Finals' });
      expect(result.name).toBe('Grand Finals');
    });

    it('should throw NotFoundException when tournament not found', async () => {
      tournamentRepository.findOne.mockResolvedValue(null);
      await expect(service.updateTournament(randomUUID(), { name: 'Grand Finals' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteTournament', () => {
    it('should delete the tournament', async () => {
      tournamentRepository.findOne.mockResolvedValue(tournament);
      tournamentRepository.remove.mockResolvedValue(undefined);
      await expect(service.deleteTournament(tournament.tournamentId)).resolves.toBeUndefined();
    });

    it('should throw NotFoundException when tournament not found', async () => {
      tournamentRepository.findOne.mockResolvedValue(null);
      await expect(service.deleteTournament(randomUUID())).rejects.toThrow(NotFoundException);
    });
  });

  describe('joinTournament', () => {
    it('should add player to tournament', async () => {
      tournamentRepository.findOne.mockResolvedValue({ ...tournament, players: [] });
      playerRepository.findOne.mockResolvedValue(player1);
      tournamentRepository.save.mockResolvedValue({ ...tournament, players: [player1] });

      const result = await service.joinTournament(tournament.tournamentId, player1.playerId);
      expect(result.players).toHaveLength(1);
    });

    it('should throw NotFoundException when tournament not found', async () => {
      tournamentRepository.findOne.mockResolvedValue(null);
      await expect(service.joinTournament(randomUUID(), player1.playerId)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when player not found', async () => {
      tournamentRepository.findOne.mockResolvedValue({ ...tournament, players: [] });
      playerRepository.findOne.mockResolvedValue(null);
      await expect(service.joinTournament(tournament.tournamentId, randomUUID())).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when tournament is not pending', async () => {
      tournamentRepository.findOne.mockResolvedValue({ ...tournament, status: TournamentStatus.INPROGRESS });
      playerRepository.findOne.mockResolvedValue(player1);
      await expect(service.joinTournament(tournament.tournamentId, player1.playerId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when player already joined', async () => {
      tournamentRepository.findOne.mockResolvedValue({ ...tournament, players: [player1] });
      playerRepository.findOne.mockResolvedValue(player1);
      await expect(service.joinTournament(tournament.tournamentId, player1.playerId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when tournament is full', async () => {
      tournamentRepository.findOne.mockResolvedValue({ ...tournament, players: [player1, player2] });
      playerRepository.findOne.mockResolvedValue({ ...player2, playerId: randomUUID() });
      await expect(service.joinTournament(tournament.tournamentId, randomUUID())).rejects.toThrow(BadRequestException);
    });
  });

  describe('findMatchesByTournament', () => {
    it('should return matches of a tournament', async () => {
      tournamentRepository.findOne.mockResolvedValue({ ...tournament, matches: [match] });
      const result = await service.findMatchesByTournament(tournament.tournamentId);
      expect(result).toHaveLength(1);
    });

    it('should throw NotFoundException when tournament not found', async () => {
      tournamentRepository.findOne.mockResolvedValue(null);
      await expect(service.findMatchesByTournament(randomUUID())).rejects.toThrow(NotFoundException);
    });
  });
});
