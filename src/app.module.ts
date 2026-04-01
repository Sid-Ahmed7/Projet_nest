import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TournamentModule } from './tournament/tournament.module';
import { PlayerModule } from './player/player.module';
import { MatchModule } from './match/match.module';
import { GameModule } from './game/game.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV ?? 'development'}`,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: Number.parseInt(config.get<string>('DB_PORT')!, 10),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        synchronize: config.get<boolean>('DB_SYNCHRONIZE'),
        autoLoadEntities: true,
      }),
    }),
    TournamentModule,
    PlayerModule,
    MatchModule,
    GameModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
