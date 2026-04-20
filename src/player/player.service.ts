import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Player } from '@/player/player.entity';
import { Tournament } from '@/tournament/tournament.entity';
import { Match } from '@/match/match.entity';
import { MatchStatus } from '@/match/enum/match-status.enum';
import { RankingSortCriteria } from '@/player/enum/ranking-sort-criteria.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { UpdatePlayerRequest } from '@/player/requests/UpdatePlayerRequest';
import { ChangePasswordRequest } from '@/player/requests/ChangePasswordRequest';
import { CreatePlayerRequest } from '@/player/requests/CreatePlayerRequest';

export interface PlayerStats {
  playerId: string;
  username: string;
  avatar: string | null;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
}

@Injectable()
export class PlayerService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
  ) {}

  async findPlayerById(playerId: string): Promise<Player> {
    const player = await this.playerRepository.findOne({ where: { playerId } });
    if (!player) {
      throw new NotFoundException('Player not found');
    }
    return player;
  }

  async findAll(username?: string): Promise<Player[]> {
    if (username) {
      return this.playerRepository.find({ where: { username: ILike(`%${username}%`) } });
    }
    return this.playerRepository.find();
  }

  async findByEmail(email: string): Promise<Player | null> {
    return this.playerRepository.findOne({ where: { email } });
  }

  async findTournamentsByPlayer(playerId: string): Promise<Tournament[]> {
    const player = await this.playerRepository.findOne({
      where: { playerId: playerId },
      relations: ['tournaments'],
    });
    if (!player) {
      throw new NotFoundException('Player not found');
    }
    return player.tournaments;
  }

  async create(data: CreatePlayerRequest): Promise<Player> {
    const player = this.playerRepository.create(data);
    return this.playerRepository.save(player);
  }

  async updatePlayerProfile(playerId: string, data: UpdatePlayerRequest): Promise<Player> {
    const player = await this.findPlayerById(playerId);
    Object.assign(player, data);
    return this.playerRepository.save(player);
  }

  async deletePlayer(playerId: string): Promise<void> {
    const player = await this.findPlayerById(playerId);
    await this.playerRepository.remove(player);
  }

  async changePassword(playerId: string, data: ChangePasswordRequest): Promise<void> {
    const player = await this.findPlayerById(playerId);

    const isPasswordValid = await bcrypt.compare(data.currentPassword, player.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    const isSamePassword = await bcrypt.compare(data.newPassword, player.password);
    if (isSamePassword) {
      throw new BadRequestException('New password must be different from current password');
    }
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    player.password = hashedPassword;
    await this.playerRepository.save(player);
  }

  async saveRefreshToken(playerId: string, token: string | null): Promise<void> {
    await this.playerRepository.update(playerId, { refreshToken: token });
  }

  async getPlayerStats(playerId: string) {
    const player = await this.findPlayerById(playerId);

    const totalMatches = await this.matchRepository.count({
      where: [
        { firstPlayer: { playerId }, status: MatchStatus.COMPLETED },
        { secondPlayer: { playerId }, status: MatchStatus.COMPLETED },
      ],
    });

    const wins = await this.matchRepository.count({
      where: { winner: { playerId }, status: MatchStatus.COMPLETED },
    });

    const losses = totalMatches - wins;
    const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

    return {
      playerId: player.playerId,
      username: player.username,
      avatar: player.avatar,
      totalMatches,
      wins,
      losses,
      winRate,
    };
  }

  async getRankings(sortBy: RankingSortCriteria = RankingSortCriteria.WINS) {
    const players = await this.playerRepository.find();

    const matches = await this.matchRepository.find({
      where: { status: MatchStatus.COMPLETED },
      relations: ['firstPlayer', 'secondPlayer', 'winner'],
    });

    const statsMap = new Map<string, PlayerStats>();
    for (const player of players) {
      statsMap.set(player.playerId, {
        playerId: player.playerId,
        username: player.username,
        avatar: player.avatar,
        totalMatches: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
      });
    }

    for (const match of matches) {
      if (match.firstPlayer) {
        const stats = statsMap.get(match.firstPlayer.playerId);
        if (stats) stats.totalMatches++;
      }
      if (match.secondPlayer) {
        const stats = statsMap.get(match.secondPlayer.playerId);
        if (stats) stats.totalMatches++;
      }
      if (match.winner) {
        const stats = statsMap.get(match.winner.playerId);
        if (stats) stats.wins++;
      }
    }

    const results = Array.from(statsMap.values()).map((stat) => {
      stat.losses = stat.totalMatches - stat.wins;
      stat.winRate = stat.totalMatches > 0 ? (stat.wins / stat.totalMatches) * 100 : 0;
      return stat;
    });

    results.sort((a, b) => {
      if (sortBy === RankingSortCriteria.WINS) {
        return b.wins - a.wins;
      } else if (sortBy === RankingSortCriteria.WIN_RATE) {
        return b.winRate - a.winRate;
      } else if (sortBy === RankingSortCriteria.TOTAL_MATCHES) {
        return b.totalMatches - a.totalMatches;
      }
      return 0;
    });

    return results;
  }
}
