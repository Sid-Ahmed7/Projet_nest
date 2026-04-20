import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, ValidationPipe } from '@nestjs/common';
import { MatchService } from '@/match/match.service';
import { CreateMatchRequest } from '@/match/requests/CreateMatchRequest';
import { SubmitMatchResultRequest } from '@/match/requests/SubmitMatchResultRequest';
import { MatchStatus } from '@/match/enum/match-status.enum';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Matches')
@Controller('matches')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Get()
  findAllMatches(@Query('status') status?: MatchStatus) {
    return this.matchService.findAll(status);
  }

  @Get(':matchId')
  findMatchById(@Param('matchId', ParseUUIDPipe) matchId: string) {
    return this.matchService.findOne(matchId);
  }

  @Post()
  createMatch(@Body(ValidationPipe) req: CreateMatchRequest) {
    return this.matchService.createMatch(req);
  }

  @Post(':matchId/result')
  submitMatchResult(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Body(ValidationPipe) req: SubmitMatchResultRequest,
  ) {
    return this.matchService.submitResult(matchId, req);
  }
}
