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
import { Roles } from 'src/decorator/role.decorator';
import { Role } from 'src/player/enum/role.enum';
import { CreateGameRequest } from './requests/CreateGameRequest';
import { UpdateGameRequest } from './requests/UpdateGameRequest';
import { ResponseMessage } from 'src/decorator/response-message.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Games')
@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get()
  @ResponseMessage('Games retrieved successfully')
  findAll() {
    return this.gameService.findAll();
  }

  @Get(':gameId')
  @ResponseMessage('Game retrieved successfully')
  findOne(@Param('gameId', ParseUUIDPipe) gameId: string) {
    return this.gameService.findOne(gameId);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @ResponseMessage('Game created successfully')
  createGame(@Body(ValidationPipe) request: CreateGameRequest) {
    return this.gameService.createGame(request);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':gameId')
  @ResponseMessage('Game updated successfully')
  updateGame(
    @Param('gameId', ParseUUIDPipe) gameId: string,
    @Body(ValidationPipe) request: UpdateGameRequest,
  ) {
    return this.gameService.updateGame(gameId, request);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':gameId/delete')
  @ResponseMessage('Game deleted successfully')
  deleteGame(@Param('gameId', ParseUUIDPipe) gameId: string) {
    return this.gameService.deleteGame(gameId);
  }
}
