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
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '@/auth/guards/jwt.guard';
import { ResponseMessage } from '@/decorator/response-message.decorator';
import { TournamentStatus } from '@/tournament/enum/tournament-status.enum';
import { CreateTournamentRequest } from '@/tournament/requests/CreateTournamentRequest';
import { UpdateTournamentRequest } from '@/tournament/requests/UpdateTournamentRequest';
import { TournamentService } from '@/tournament/tournament.service';
import { ApiTags, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Tournaments')
@Controller('tournaments')
export class TournamentController {
  constructor(private readonly tournamentsService: TournamentService) {}

  @Get()
  @ApiQuery({ name: 'status', enum: TournamentStatus, required: false })
  @ResponseMessage('Tournaments retrieved successfully')
  findAllTournaments(@Query('status') status?: TournamentStatus) {
    return this.tournamentsService.findAllTournaments(status);
  }

  @Get(':tournamentId')
  @ApiParam({ name: 'tournamentId', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ResponseMessage('Tournament retrieved successfully')
  findTournamentById(@Param('tournamentId', ParseUUIDPipe) tournamentId: string) {
    return this.tournamentsService.findTournamentById(tournamentId);
  }

  @UseGuards(JwtGuard)
  @Post()
  @ApiBearerAuth()
  @ResponseMessage('Tournament created successfully')
  createTournament(@Body() req: CreateTournamentRequest) {
    return this.tournamentsService.createTournament(req);
  }

  @UseGuards(JwtGuard)
  @Put(':tournamentId')
  @ApiBearerAuth()
  @ApiParam({ name: 'tournamentId', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ResponseMessage('Tournament updated successfully')
  updateTournament(@Param('tournamentId', ParseUUIDPipe) tournamentId: string, @Body() req: UpdateTournamentRequest) {
    return this.tournamentsService.updateTournament(tournamentId, req);
  }

  @UseGuards(JwtGuard)
  @Delete(':tournamentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiParam({ name: 'tournamentId', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ResponseMessage('Tournament deleted successfully')
  deleteTournament(@Param('tournamentId', ParseUUIDPipe) tournamentId: string) {
    return this.tournamentsService.deleteTournament(tournamentId);
  }

  @UseGuards(JwtGuard)
  @Post(':tournamentId/join')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiParam({ name: 'tournamentId', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ResponseMessage('Tournament joined successfully')
  joinTournament(
    @Param('tournamentId', ParseUUIDPipe) tournamentId: string,
    @Request() req: { user: { playerId: string } },
  ) {
    return this.tournamentsService.joinTournament(tournamentId, req.user.playerId);
  }

  @Get(':tournamentId/matches')
  @ApiParam({ name: 'tournamentId', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ResponseMessage('Matches retrieved successfully')
  findMatchesByTournament(@Param('tournamentId', ParseUUIDPipe) tournamentId: string) {
    return this.tournamentsService.findMatchesByTournament(tournamentId);
  }
}
