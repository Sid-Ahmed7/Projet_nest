import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './match.entity';
import { Player } from '@/player/player.entity';
import { Tournament } from '@/tournament/tournament.entity';
import { MatchService } from '@/match/match.service';
import { MatchController } from '@/match/match.controller';
import { TournamentModule } from '@/tournament/tournament.module';

@Module({
  imports: [TypeOrmModule.forFeature([Match, Player, Tournament]), TournamentModule],
  providers: [MatchService],
  controllers: [MatchController],
})
export class MatchModule {}
