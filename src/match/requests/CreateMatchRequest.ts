import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class CreateMatchRequest {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Tournament UUID' })
  @IsUUID()
  tournamentId!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001', description: 'First player UUID' })
  @IsUUID()
  firstPlayerId!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002', description: 'Second player UUID' })
  @IsUUID()
  secondPlayerId!: string;

  @ApiProperty({ example: 1, description: 'Round number' })
  @IsInt()
  @Min(1)
  round!: number;
}
