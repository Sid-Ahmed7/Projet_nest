import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from '@/player/player.entity';
import { PlayerService } from '@/player/player.service';
import { PlayerController } from '@/player/player.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Player])],
  providers: [PlayerService],
  controllers: [PlayerController],
  exports: [PlayerService],
})
export class PlayerModule {}
