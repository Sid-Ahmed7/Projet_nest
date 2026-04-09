import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { GameService } from './game.service';
import { JwtGuard } from '@/auth/guards/jwt.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/decorator/role.decorator';
import { Role } from '@/player/enum/role.enum';
import { CreateGameRequest } from './requests/CreateGameRequest';
import { UpdateGameRequest } from './requests/UpdateGameRequest';
import { ResponseMessage } from '@/decorator/response-message.decorator';

@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get()
  @ResponseMessage('Games retrieved successfully')
  findAllGames() {
    return this.gameService.findAllGames();
  }

  @Get(':gameId')
  @ResponseMessage('Game retrieved successfully')
  findGameById(@Param('gameId', ParseUUIDPipe) gameId: string) {
    return this.gameService.findGameById(gameId);
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
  updateGame(@Param('gameId', ParseUUIDPipe) gameId: string, @Body(ValidationPipe) request: UpdateGameRequest) {
    return this.gameService.updateGame(gameId, request);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':gameId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage('Game deleted successfully')
  deleteGame(@Param('gameId', ParseUUIDPipe) gameId: string) {
    return this.gameService.deleteGame(gameId);
  }
}
