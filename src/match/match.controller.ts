import { Body, Controller, Get, Param, ParseUUIDPipe, Post, ValidationPipe } from '@nestjs/common';
import { MatchService } from '@/match/match.service';
import { CreateMatchRequest } from '@/match/requests/CreateMatchRequest';
import { SubmitMatchResultRequest } from '@/match/requests/SubmitMatchResultRequest';

@Controller('matches')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Get()
  findAllMatches() {
    return this.matchService.findAll();
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
