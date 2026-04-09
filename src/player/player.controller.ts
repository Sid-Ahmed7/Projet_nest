import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PlayerService } from './player.service';
import { PlayerStatsDto } from './dto/player-stats.dto';

@ApiTags('Players')
@Controller('player')
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Get('leaderboard')
  @ApiOperation({ summary: 'Obtenir le classement des joueurs par nombre de victoires' })
  @ApiResponse({
    status: 200,
    description: 'Classement récupéré avec succès.',
    type: [PlayerStatsDto],
  })
  async getLeaderboard(): Promise<PlayerStatsDto[]> {
    return this.playerService.getLeaderboard();
  }
}
