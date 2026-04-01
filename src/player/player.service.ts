import { Injectable, NotFoundException } from '@nestjs/common';
import { Player } from './player.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
}
