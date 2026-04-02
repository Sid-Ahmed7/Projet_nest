import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from './game.entity';
import { Repository } from 'typeorm';
import { CreateGameRequest } from './requests/CreateGameRequest';
import { UpdateGameRequest } from './requests/UpdateGameRequest';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
  ) {}

  async findAll(): Promise<Game[]> {
    return this.gameRepository.find();
  }

  async findOne(gameId: string): Promise<Game> {
    const game = await this.gameRepository.findOne({ where: { gameId } });
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    return game;
  }

  async createGame(data: CreateGameRequest): Promise<Game> {
    const game = this.gameRepository.create(data);
    return this.gameRepository.save(game);
  }

  async updateGame(gameId: string, data: UpdateGameRequest): Promise<Game> {
    const game = await this.findOne(gameId);
    Object.assign(game, data);
    return this.gameRepository.save(game);
  }

  async deleteGame(gameId: string): Promise<void> {
    const game = await this.findOne(gameId);
    await this.gameRepository.remove(game);
  }
}
