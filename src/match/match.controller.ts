import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { MatchService } from '@/match/match.service';
import { CreateMatchRequest } from '@/match/requests/CreateMatchRequest';
import { SubmitMatchResultRequest } from '@/match/requests/SubmitMatchResultRequest';
import { MatchStatus } from '@/match/enum/match-status.enum';
import { ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '@/auth/guards/jwt.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Role } from '@/player/enum/role.enum';
import { Roles } from '@/decorator/role.decorator';
import { ResponseMessage } from '@/decorator/response-message.decorator';

@ApiTags('Matches')
@Controller('matches')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Get()
  @ResponseMessage('Matches retrieved successfully')
  findAllMatches(@Query('status') status?: MatchStatus) {
    return this.matchService.findAll(status);
  }

  @Get(':matchId')
  @ResponseMessage('Match retrieved successfully')
  findMatchById(@Param('matchId', ParseUUIDPipe) matchId: string) {
    return this.matchService.findOne(matchId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PLAYER)
  @ResponseMessage('Match created successfully')
  createMatch(@Body(ValidationPipe) req: CreateMatchRequest) {
    return this.matchService.createMatch(req);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PLAYER)
  @Post(':matchId/result')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Match result submitted successfully')
  submitMatchResult(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Body(ValidationPipe) req: SubmitMatchResultRequest,
  ) {
    return this.matchService.submitResult(matchId, req);
  }
}
