import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tournament } from '@/tournament/tournament.entity';
import { Repository } from 'typeorm';
import { Game } from '@/game/game.entity';
import { Match } from '@/match/match.entity';
import { MatchStatus } from '@/match/enum/match-status.enum';
import { Player } from '@/player/player.entity';
import { TournamentStatus } from '@/tournament/enum/tournament-status.enum';
import { CreateTournamentRequest } from '@/tournament/requests/CreateTournamentRequest';
import { UpdateTournamentRequest } from '@/tournament/requests/UpdateTournamentRequest';
import { TournamentGateway } from '@/tournament/tournament.gateway';

@Injectable()
export class TournamentService {
  constructor(
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    private readonly tournamentGateway: TournamentGateway,
  ) {}

  async findAllTournaments(status?: TournamentStatus): Promise<Tournament[]> {
    if (status) {
      return this.tournamentRepository.find({ where: { status } });
    }
    return this.tournamentRepository.find();
  }

  async findTournamentById(tournamentId: string): Promise<Tournament> {
    const tournament = await this.tournamentRepository.findOne({
      where: { tournamentId },
      relations: ['players', 'matches'],
    });
    if (!tournament) {
      throw new NotFoundException(`Tournament ${tournamentId} not found`);
    }
    return tournament;
  }

  async createTournament(data: CreateTournamentRequest): Promise<Tournament> {
    const game = await this.gameRepository.findOne({
      where: { gameId: data.gameId },
    });
    if (!game) {
      throw new NotFoundException(`Game ${data.gameId} not found`);
    }

    const tournament = this.tournamentRepository.create({
      name: data.name,
      maxPlayers: data.maxPlayers,
      startDate: new Date(data.startDate),
      game,
    });
    return this.tournamentRepository.save(tournament);
  }

  async updateTournament(tournamentId: string, data: UpdateTournamentRequest): Promise<Tournament> {
    const tournament = await this.findTournamentById(tournamentId);
    const { startDate, ...rest } = data;
    Object.assign(tournament, rest);
    if (startDate) {
      tournament.startDate = new Date(startDate);
    }
    return this.tournamentRepository.save(tournament);
  }

  async deleteTournament(tournamentId: string): Promise<void> {
    const tournament = await this.findTournamentById(tournamentId);
    await this.tournamentRepository.remove(tournament);
  }

  async joinTournament(tournamentId: string, playerId: string): Promise<Tournament> {
    const tournament = await this.findTournamentById(tournamentId);
    const player = await this.playerRepository.findOne({
      where: { playerId },
    });
    if (!player) {
      throw new NotFoundException(`Player ${playerId} not found`);
    }

    if (tournament.status !== TournamentStatus.PENDING) {
      throw new BadRequestException('Tournament is not open for registration');
    }

    const alreadyJoined = tournament.players.some((p) => p.playerId === playerId);
    if (alreadyJoined) {
      throw new BadRequestException('Already joined');
    }

    if (tournament.players.length >= tournament.maxPlayers) {
      throw new BadRequestException('Tournament is full');
    }

    tournament.players.push(player);
    const savedTournament = await this.tournamentRepository.save(tournament);

    if (savedTournament.players.length === savedTournament.maxPlayers) {
      await this.generateBracket(savedTournament);
    }

    return savedTournament;
  }

  private async generateBracket(tournament: Tournament) {
    const players = [...tournament.players].sort(() => 0.5 - Math.random());
    const numPlayers = players.length;

    const totalRounds = Math.max(1, Math.ceil(Math.log2(numPlayers)));

    let previousRoundMatches: Match[] = [];

    for (let r = totalRounds; r >= 1; r--) {
      const numMatchesInRound = Math.pow(2, totalRounds - r);
      const currentRoundMatches: Match[] = [];

      for (let i = 0; i < numMatchesInRound; i++) {
        const match = this.matchRepository.create({
          tournament,
          round: r,
          status: MatchStatus.PENDING,
        });

        if (r < totalRounds) {
          match.nextMatch = previousRoundMatches[Math.floor(i / 2)];
        }

        if (r === 1) {
          match.firstPlayer = players[i * 2] || null;
          match.secondPlayer = players[i * 2 + 1] || null;
        }

        const savedMatch = await this.matchRepository.save(match);
        currentRoundMatches.push(savedMatch);
      }
      previousRoundMatches = currentRoundMatches;
    }

    tournament.status = TournamentStatus.INPROGRESS;
    await this.tournamentRepository.save(tournament);
    this.tournamentGateway.notifyTournamentStatusChange(tournament.tournamentId, TournamentStatus.INPROGRESS);
  }

  async findMatchesByTournament(tournamentId: string) {
    const tournament = await this.tournamentRepository.findOne({
      where: { tournamentId },
      relations: ['matches', 'matches.firstPlayer', 'matches.secondPlayer', 'matches.winner'],
    });
    if (!tournament) {
      throw new NotFoundException(`Tournament ${tournamentId} not found`);
    }
    return tournament.matches;
  }
}
