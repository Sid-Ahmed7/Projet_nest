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
import { ResponseMessage } from '@/decorator/response-message.decorator';
import { ApiTags, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from '@/auth/guards/jwt.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Role } from '@/player/enum/role.enum';
import { Roles } from '@/decorator/role.decorator';

@ApiTags('Matches')
@Controller('matches')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Get()
  @ApiQuery({ name: 'status', enum: MatchStatus, required: false })
  @ResponseMessage('Matches retrieved successfully')
  findAllMatches(@Query('status') status?: MatchStatus) {
    return this.matchService.findAll(status);
  }

  @Get(':matchId')
  @ApiParam({ name: 'matchId', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ResponseMessage('Match retrieved successfully')
  findMatchById(@Param('matchId', ParseUUIDPipe) matchId: string) {
    return this.matchService.findOne(matchId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PLAYER)
  @ApiBearerAuth()
  @ResponseMessage('Match created successfully')
  createMatch(@Body(ValidationPipe) req: CreateMatchRequest) {
    return this.matchService.createMatch(req);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PLAYER)
  @Post(':matchId/result')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiParam({ name: 'matchId', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ResponseMessage('Match result submitted successfully')
  submitMatchResult(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Body(ValidationPipe) req: SubmitMatchResultRequest,
  ) {
    return this.matchService.submitResult(matchId, req);
  }
}
