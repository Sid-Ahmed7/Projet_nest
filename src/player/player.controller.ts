import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { PlayerService } from '@/player/player.service';
import { RankingQueryRequest } from '@/player/requests/RankingQueryRequest';
import { ChangePasswordRequest } from '@/player/requests/ChangePasswordRequest';
import { UpdatePlayerRequest } from '@/player/requests/UpdatePlayerRequest';
import { ResponseMessage } from '@/decorator/response-message.decorator';
import { JwtGuard } from '@/auth/guards/jwt.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/decorator/role.decorator';
import { Role } from '@/player/enum/role.enum';
import { ApiTags, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Players')
@Controller('players')
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Get()
  @ApiQuery({ name: 'username', required: false, example: 'admin' })
  @ResponseMessage('Players retrieved successfully')
  async findAll(@Query('username') username?: string) {
    return this.playerService.findAll(username);
  }

  @Get('rankings')
  @ResponseMessage('Player rankings retrieved successfully')
  async getRankings(@Query(ValidationPipe) query: RankingQueryRequest) {
    return this.playerService.getRankings(query.sortBy);
  }

  @Get(':playerId')
  @ApiParam({ name: 'playerId', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ResponseMessage('Player retrieved successfully')
  async findPlayerById(@Param('playerId', ParseUUIDPipe) playerId: string) {
    return this.playerService.findPlayerById(playerId);
  }

  @Get(':playerId/stats')
  @ApiParam({ name: 'playerId', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ResponseMessage('Player statistics retrieved successfully')
  async getPlayerStats(@Param('playerId', ParseUUIDPipe) playerId: string) {
    return this.playerService.getPlayerStats(playerId);
  }

  @Get(':playerId/tournaments')
  @ApiParam({ name: 'playerId', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ResponseMessage('Player tournaments retrieved successfully')
  async findTournamentsByPlayer(@Param('playerId', ParseUUIDPipe) playerId: string) {
    return this.playerService.findTournamentsByPlayer(playerId);
  }

  @Patch(':playerId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PLAYER)
  @ApiBearerAuth()
  @ApiParam({ name: 'playerId', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ResponseMessage('Player updated successfully')
  async updatePlayerProfile(
    @Param('playerId', ParseUUIDPipe) playerId: string,
    @Body(ValidationPipe) req: UpdatePlayerRequest,
  ) {
    return this.playerService.updatePlayerProfile(playerId, req);
  }

  @Delete(':playerId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PLAYER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiParam({ name: 'playerId', example: '123e4567-e89b-12d3-a456-426614174001' })
  async deletePlayer(@Param('playerId', ParseUUIDPipe) playerId: string) {
    return this.playerService.deletePlayer(playerId);
  }

  @Patch(':playerId/password')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PLAYER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiParam({ name: 'playerId', example: '123e4567-e89b-12d3-a456-426614174001' })
  async changePassword(
    @Param('playerId', ParseUUIDPipe) playerId: string,
    @Body(ValidationPipe) req: ChangePasswordRequest,
  ) {
    return this.playerService.changePassword(playerId, req);
  }
}
