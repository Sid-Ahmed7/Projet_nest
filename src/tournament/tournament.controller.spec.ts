import { Test, TestingModule } from '@nestjs/testing';
import { TournamentController } from '@/tournament/tournament.controller';
import { TournamentService } from '@/tournament/tournament.service';

describe('TournamentController', () => {
  let controller: TournamentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TournamentController],
      providers: [{ provide: TournamentService, useValue: {} }],
    }).compile();

    controller = module.get<TournamentController>(TournamentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
