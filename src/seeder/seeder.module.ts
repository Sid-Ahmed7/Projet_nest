import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from '@/player/player.entity';
import { SeederService } from '@/seeder/seeder.service';

@Module({
  imports: [TypeOrmModule.forFeature([Player])],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
