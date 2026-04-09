import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tournament } from '@/tournament/tournament.entity';
import { TournamentService } from '@/tournament/tournament.service';
import { TournamentController } from '@/tournament/tournament.controller';
import { Game } from '@/game/game.entity';
import { Player } from '@/player/player.entity';
import { Match } from '@/match/match.entity';
import { TournamentGateway } from '@/tournament/tournament.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Tournament, Game, Player, Match])],
  providers: [TournamentService, TournamentGateway],
  controllers: [TournamentController],
  exports: [TournamentGateway],
})
export class TournamentModule {}
