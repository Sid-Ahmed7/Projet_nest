import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsInt, Min, IsDateString } from 'class-validator';

export class CreateTournamentRequest {
  @ApiProperty({ example: 'Summer Championship 2026', description: 'Name of the tournament' })
  @IsString()
  name!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Game UUID for the tournament' })
  @IsUUID()
  gameId!: string;

  @ApiProperty({ example: 16, description: 'Maximum number of players' })
  @IsInt()
  @Min(2)
  maxPlayers!: number;

  @ApiProperty({ example: '2026-07-15T10:00:00Z', description: 'Start date of the tournament' })
  @IsDateString()
  startDate!: string;
}
