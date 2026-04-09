import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PlayerService } from './player.service';
import { PlayerStatsDto } from './dto/player-stats.dto';
import { IndividualPlayerStatsDto } from './dto/individual-player-stats.dto';

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

  @Get(':playerId/stats')
  @ApiOperation({ summary: 'Obtenir les statistiques détaillées d\'un joueur' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès.',
    type: IndividualPlayerStatsDto,
  })
  @ApiResponse({ status: 404, description: 'Joueur introuvable.' })
  async getPlayerStats(@Param('playerId', ParseUUIDPipe) playerId: string): Promise<IndividualPlayerStatsDto> {
    return this.playerService.getPlayerStats(playerId);
  }
}
