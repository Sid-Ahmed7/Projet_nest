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
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { PlayerService } from '@/player/player.service';
import { ChangePasswordRequest } from '@/player/requests/ChangePasswordRequest';
import { UpdatePlayerRequest } from '@/player/requests/UpdatePlayerRequest';
import { ResponseMessage } from '@/decorator/response-message.decorator';
import { JwtGuard } from '@/auth/guards/jwt.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/decorator/role.decorator';
import { Role } from '@/player/enum/role.enum';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Players')
@Controller('players')
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Get()
  @ResponseMessage('Players retrieved successfully')
  async findAll() {
    return this.playerService.findAll();
  }

  @Get(':playerId')
  @ResponseMessage('Player retrieved successfully')
  async findPlayerById(@Param('playerId', ParseUUIDPipe) playerId: string) {
    return this.playerService.findPlayerById(playerId);
  }

  @Get(':playerId/tournaments')
  @ResponseMessage('Player tournaments retrieved successfully')
  async findTournamentsByPlayer(@Param('playerId', ParseUUIDPipe) playerId: string) {
    return this.playerService.findTournamentsByPlayer(playerId);
  }

  @Patch(':playerId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PLAYER)
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
  async deletePlayer(@Param('playerId', ParseUUIDPipe) playerId: string) {
    return this.playerService.deletePlayer(playerId);
  }

  @Patch(':playerId/password')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PLAYER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @Param('playerId', ParseUUIDPipe) playerId: string,
    @Body(ValidationPipe) req: ChangePasswordRequest,
  ) {
    return this.playerService.changePassword(playerId, req);
  }
}
