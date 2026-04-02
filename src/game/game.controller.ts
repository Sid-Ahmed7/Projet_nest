import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { GameService } from './game.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorator/role.decorator';
import { Role } from 'src/player/enum/role.enum';
import { CreateGameRequest } from './requests/CreateGameRequest';
import { UpdateGameRequest } from './requests/UpdateGameRequest';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get()
  findAll() {
    return this.gameService.findAll();
  }

  @Get(':gameId')
  findOne(@Param('gameId', ParseUUIDPipe) gameId: string) {
    return this.gameService.findOne(gameId);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  createGame(@Body(ValidationPipe) request: CreateGameRequest) {
    return this.gameService.createGame(request);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':gameId')
  updateGame(
    @Param('gameId', ParseUUIDPipe) gameId: string,
    @Body(ValidationPipe) request: UpdateGameRequest,
  ) {
    return this.gameService.updateGame(gameId, request);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':gameId/delete')
  deleteGame(@Param('gameId', ParseUUIDPipe) gameId: string) {
    return this.gameService.deleteGame(gameId);
  }
}
