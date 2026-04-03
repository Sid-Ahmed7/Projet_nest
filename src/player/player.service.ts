import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Player } from '@/player/player.entity';
import { Tournament } from '@/tournament/tournament.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdatePlayerRequest } from '@/player/requests/UpdatePlayerRequest';
import { ChangePasswordRequest } from '@/player/requests/ChangePasswordRequest';
import { CreatePlayerRequest } from '@/player/requests/CreatePlayerRequest';

@Injectable()
export class PlayerService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
  ) {}

  async findPlayerById(playerId: string): Promise<Player> {
    const player = await this.playerRepository.findOne({ where: { playerId } });
    if (!player) {
      throw new NotFoundException('Player not found');
    }
    return player;
  }

  async findAll(): Promise<Player[]> {
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
}
