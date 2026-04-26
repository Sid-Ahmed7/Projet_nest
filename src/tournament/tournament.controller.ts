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
  ValidationPipe,
} from '@nestjs/common';
import { JwtGuard } from '@/auth/guards/jwt.guard';
import { ResponseMessage } from '@/decorator/response-message.decorator';
import { TournamentStatus } from '@/tournament/enum/tournament-status.enum';
import { CreateTournamentRequest } from '@/tournament/requests/CreateTournamentRequest';
import { UpdateTournamentRequest } from '@/tournament/requests/UpdateTournamentRequest';
import { TournamentService } from '@/tournament/tournament.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Tournaments')
@Controller('tournaments')
export class TournamentController {
  constructor(private readonly tournamentsService: TournamentService) {}

  @Get()
  @ResponseMessage('Tournaments retrieved successfully')
  findAllTournaments(@Query('status') status?: TournamentStatus) {
    return this.tournamentsService.findAllTournaments(status);
  }

  @Get(':tournamentId')
  @ResponseMessage('Tournament retrieved successfully')
  findTournamentById(@Param('tournamentId', ParseUUIDPipe) tournamentId: string) {
    return this.tournamentsService.findTournamentById(tournamentId);
  }

  @UseGuards(JwtGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Tournament created successfully')
  createTournament(@Body(ValidationPipe) req: CreateTournamentRequest) {
    return this.tournamentsService.createTournament(req);
  }

  @UseGuards(JwtGuard)
  @Put(':tournamentId')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Tournament updated successfully')
  updateTournament(
    @Param('tournamentId', ParseUUIDPipe) tournamentId: string,
    @Body(ValidationPipe) req: UpdateTournamentRequest,
  ) {
    return this.tournamentsService.updateTournament(tournamentId, req);
  }

  @UseGuards(JwtGuard)
  @Delete(':tournamentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage('Tournament deleted successfully')
  deleteTournament(@Param('tournamentId', ParseUUIDPipe) tournamentId: string) {
    return this.tournamentsService.deleteTournament(tournamentId);
  }

  @UseGuards(JwtGuard)
  @Post(':tournamentId/join')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Tournament joined successfully')
  joinTournament(
    @Param('tournamentId', ParseUUIDPipe) tournamentId: string,
    @Request() req: { user: { playerId: string } },
  ) {
    return this.tournamentsService.joinTournament(tournamentId, req.user.playerId);
  }

  @Get(':tournamentId/matches')
  @ResponseMessage('Matches retrieved successfully')
  findMatchesByTournament(@Param('tournamentId', ParseUUIDPipe) tournamentId: string) {
    return this.tournamentsService.findMatchesByTournament(tournamentId);
  }
}
