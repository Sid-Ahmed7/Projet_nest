import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tournament } from './tournament.entity';
import { TournamentService } from './tournament.service';
import { TournamentController } from './tournament.controller';
import { Game } from 'src/game/game.entity';
import { Player } from 'src/player/player.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tournament, Game, Player])],
  providers: [TournamentService],
  controllers: [TournamentController],
})
export class TournamentModule {}
