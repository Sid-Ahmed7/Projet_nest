import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tournament } from '@/tournament/tournament.entity';
import { Repository } from 'typeorm';
import { Game } from '@/game/game.entity';
import { Player } from '@/player/player.entity';
import { TournamentStatus } from '@/tournament/enum/tournament-status.enum';
import { CreateTournamentRequest } from '@/tournament/requests/CreateTournamentRequest';
import { UpdateTournamentRequest } from '@/tournament/requests/UpdateTournamentRequest';

@Injectable()
export class TournamentService {
  constructor(
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
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
    return this.tournamentRepository.save(tournament);
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
