import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TournamentModule } from './tournament/tournament.module';
import { PlayerModule } from './player/player.module';
import { MatchModule } from './match/match.module';
import { GameModule } from './game/game.module';
import { AuthModule } from './auth/auth.module';
import { SeederModule } from './seeder/seeder.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : (process.env.NODE_ENV === 'development' ? '.env.development.local' : '.env'),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: Number.parseInt(config.get<string>('DB_PORT')!),
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
    AuthModule,
    SeederModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
