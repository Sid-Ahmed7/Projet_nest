import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, IsDateString, IsEnum } from 'class-validator';
import { TournamentStatus } from '@/tournament/enum/tournament-status.enum';

export class UpdateTournamentRequest {
  @ApiProperty({ example: 'Winter Championship 2026', description: 'Name of the tournament', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 32, description: 'Maximum number of players', required: false })
  @IsInt()
  @Min(2)
  @IsOptional()
  maxPlayers?: number;

  @ApiProperty({ example: '2026-12-15T10:00:00Z', description: 'Start date of the tournament', required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ enum: TournamentStatus, example: TournamentStatus.INPROGRESS, description: 'Status of the tournament', required: false })
  @IsEnum(TournamentStatus)
  @IsOptional()
  status?: TournamentStatus;
}
