import { Injectable, NotFoundException } from '@nestjs/common';
import { Player } from './player.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerStatsDto } from './dto/player-stats.dto';
import { IndividualPlayerStatsDto } from './dto/individual-player-stats.dto';

@Injectable()
export class PlayerService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
  ) {}

  async findOne(playerId: string): Promise<Player> {
    const player = await this.playerRepository.findOne({ where: { playerId } });
    if (!player) {
      throw new NotFoundException('Player not found');
    }
    return player;
  }

  async findByEmail(email: string): Promise<Player | null> {
    return this.playerRepository.findOne({ where: { email } });
  }

  async saveRefreshToken(
    playerId: string,
    token: string | null,
  ): Promise<void> {
    await this.playerRepository.update(playerId, { refreshToken: token });
  }

  async create(data: Partial<Player>): Promise<Player> {
    const player = this.playerRepository.create(data);
    return this.playerRepository.save(player);
  }

  async getLeaderboard(): Promise<PlayerStatsDto[]> {
    const rawResults = await this.playerRepository
      .createQueryBuilder('player')
      .leftJoin('player.winner', 'match')
      .select('player.playerId', 'playerId')
      .addSelect('player.username', 'username')
      .addSelect('COUNT(match.matchId)', 'winCount')
      .groupBy('player.playerId')
      .addGroupBy('player.username')
      .orderBy('"winCount"', 'DESC')
      .getRawMany();

    return rawResults.map((row) => ({
      playerId: row.playerId,
      username: row.username,
      winCount: parseInt(row.winCount, 10),
    }));
  }

  async getPlayerStats(playerId: string): Promise<IndividualPlayerStatsDto> {
    const player = await this.playerRepository.findOne({ where: { playerId } });
    if (!player) {
      throw new NotFoundException('Joueur introuvable');
    }

    const winCountResult = await this.playerRepository.createQueryBuilder('player')
      .leftJoin('player.winner', 'match')
      .where('player.playerId = :playerId', { playerId })
      .select('COUNT(match.matchId)', 'count')
      .getRawOne();

    const firstMatchesResult = await this.playerRepository.createQueryBuilder('player')
      .leftJoin('player.firstPlayer', 'match')
      .where('player.playerId = :playerId', { playerId })
      .select('COUNT(match.matchId)', 'count')
      .getRawOne();

    const secondMatchesResult = await this.playerRepository.createQueryBuilder('player')
      .leftJoin('player.secondPlayer', 'match')
      .where('player.playerId = :playerId', { playerId })
      .select('COUNT(match.matchId)', 'count')
      .getRawOne();

    const winCount = parseInt(winCountResult.count, 10) || 0;
    const totalMatches = (parseInt(firstMatchesResult.count, 10) || 0) + (parseInt(secondMatchesResult.count, 10) || 0);

    return {
      playerId: player.playerId,
      username: player.username,
      winCount,
      totalMatches,
      winRatio: totalMatches > 0 ? parseFloat(((winCount / totalMatches) * 100).toFixed(2)) : 0
    };
  }
}
