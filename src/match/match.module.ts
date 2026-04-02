import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './match.entity';
import { Player } from 'src/player/player.entity';
import { Tournament } from 'src/tournament/tournament.entity';
import { MatchService } from './match.service';
import { MatchController } from './match.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Match, Player, Tournament])],
  providers: [MatchService],
  controllers: [MatchController],
})
export class MatchModule {}
