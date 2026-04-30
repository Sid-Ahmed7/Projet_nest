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
  Query,
  UseGuards,
} from '@nestjs/common';
import { GameService } from './game.service';
import { JwtGuard } from '@/auth/guards/jwt.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/decorator/role.decorator';
import { Role } from '@/player/enum/role.enum';
import { CreateGameRequest } from './requests/CreateGameRequest';
import { UpdateGameRequest } from './requests/UpdateGameRequest';
import { ResponseMessage } from '@/decorator/response-message.decorator';
import { ApiBearerAuth, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Games')
@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get()
  @ApiQuery({ name: 'genre', required: false, example: 'MOBA' })
  @ResponseMessage('Games retrieved successfully')
  findAllGames(@Query('genre') genre?: string) {
    return this.gameService.findAllGames(genre);
  }

  @Get(':gameId')
  @ApiParam({ name: 'gameId', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ResponseMessage('Game retrieved successfully')
  findGameById(@Param('gameId', ParseUUIDPipe) gameId: string) {
    return this.gameService.findGameById(gameId);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @ApiBearerAuth()
  @ResponseMessage('Game created successfully')
  createGame(@Body() request: CreateGameRequest) {
    return this.gameService.createGame(request);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':gameId')
  @ApiBearerAuth()
  @ApiParam({ name: 'gameId', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ResponseMessage('Game updated successfully')
  updateGame(@Param('gameId', ParseUUIDPipe) gameId: string, @Body() request: UpdateGameRequest) {
    return this.gameService.updateGame(gameId, request);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':gameId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiParam({ name: 'gameId', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ResponseMessage('Game deleted successfully')
  deleteGame(@Param('gameId', ParseUUIDPipe) gameId: string) {
    return this.gameService.deleteGame(gameId);
  }
}
