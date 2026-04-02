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
import { PlayerService } from './player.service';
import { ChangePasswordRequest } from './requests/ChangePasswordRequest';
import { UpdatePlayerRequest } from './requests/UpdatePlayerRequest';
import { ResponseMessage } from 'src/decorator/response-message.decorator';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorator/role.decorator';
import { Role } from './enum/role.enum';

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
  async findTournamentsByPlayer(
    @Param('playerId', ParseUUIDPipe) playerId: string,
  ) {
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
