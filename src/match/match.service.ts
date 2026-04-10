import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '@/match/match.entity';
import { Player } from '@/player/player.entity';
import { Tournament } from '@/tournament/tournament.entity';
import { TournamentStatus } from '@/tournament/enum/tournament-status.enum';
import { MatchStatus } from '@/match/enum/match-status.enum';
import { CreateMatchRequest } from '@/match/requests/CreateMatchRequest';
import { SubmitMatchResultRequest } from '@/match/requests/SubmitMatchResultRequest';
import { TournamentGateway } from '@/tournament/tournament.gateway';

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    private readonly tournamentGateway: TournamentGateway,
  ) {}

  async findAll(): Promise<Match[]> {
    return this.matchRepository.find({
      relations: ['tournament', 'firstPlayer', 'secondPlayer', 'winner'],
    });
  }

  async findOne(matchId: string): Promise<Match> {
    const match = await this.matchRepository.findOne({
      where: { matchId },
      relations: ['tournament', 'firstPlayer', 'secondPlayer', 'winner', 'nextMatch'],
    });
    if (!match) {
      throw new NotFoundException(`Match ${matchId} not found`);
    }
    return match;
  }

  async createMatch(data: CreateMatchRequest): Promise<Match> {
    const tournament = await this.tournamentRepository.findOne({
      where: { tournamentId: data.tournamentId },
    });
    if (!tournament) {
      throw new NotFoundException(`Tournament ${data.tournamentId} not found`);
    }

    const firstPlayer = await this.playerRepository.findOne({
      where: { playerId: data.firstPlayerId },
    });
    if (!firstPlayer) {
      throw new NotFoundException(`Player ${data.firstPlayerId} not found`);
    }

    const secondPlayer = await this.playerRepository.findOne({
      where: { playerId: data.secondPlayerId },
    });
    if (!secondPlayer) {
      throw new NotFoundException(`Player ${data.secondPlayerId} not found`);
    }

    if (data.firstPlayerId === data.secondPlayerId) {
      throw new BadRequestException('A player cannot play against themselves');
    }

    const match = this.matchRepository.create({
      tournament,
      firstPlayer,
      secondPlayer,
      round: data.round,
    });
    return this.matchRepository.save(match);
  }

  async submitResult(matchId: string, data: SubmitMatchResultRequest): Promise<Match> {
    const match = await this.findOne(matchId);

    if (match.status === MatchStatus.COMPLETED) {
      throw new BadRequestException('Match already completed');
    }

    const winner = await this.playerRepository.findOne({
      where: { playerId: data.winnerId },
    });
    if (!winner) {
      throw new NotFoundException(`Player ${data.winnerId} not found`);
    }

    const isParticipant =
      match.firstPlayer?.playerId === data.winnerId || match.secondPlayer?.playerId === data.winnerId;
    if (!isParticipant) {
      throw new BadRequestException('Winner must be a participant of the match');
    }

    match.winner = winner;
    match.score = data.score;
    match.status = MatchStatus.COMPLETED;
    const savedMatch = await this.matchRepository.save(match);

    if (savedMatch.nextMatch) {
      const nextMatch = await this.matchRepository.findOne({
        where: { matchId: savedMatch.nextMatch.matchId },
        relations: ['firstPlayer', 'secondPlayer'],
      });
      if (nextMatch) {
        if (!nextMatch.firstPlayer) {
          nextMatch.firstPlayer = winner;
        } else {
          nextMatch.secondPlayer = winner;
        }
        await this.matchRepository.save(nextMatch);
      }
    } else {
      const tournament = await this.tournamentRepository.findOne({
        where: { tournamentId: savedMatch.tournament.tournamentId },
      });
      if (tournament) {
        tournament.status = TournamentStatus.COMPLETED;
        await this.tournamentRepository.save(tournament);
        this.tournamentGateway.notifyTournamentStatusChange(tournament.tournamentId, TournamentStatus.COMPLETED);
      }
    }

    return savedMatch;
  }
}
