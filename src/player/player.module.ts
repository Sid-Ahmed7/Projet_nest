import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from '@/player/player.entity';
import { Match } from '@/match/match.entity';
import { PlayerService } from '@/player/player.service';
import { PlayerController } from '@/player/player.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Player, Match])],
  providers: [PlayerService],
  controllers: [PlayerController],
  exports: [PlayerService],
})
export class PlayerModule {}
