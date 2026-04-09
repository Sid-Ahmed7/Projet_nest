import { Injectable, NotFoundException } from '@nestjs/common';
import { Player } from './player.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerStatsDto } from './dto/player-stats.dto';

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
}
