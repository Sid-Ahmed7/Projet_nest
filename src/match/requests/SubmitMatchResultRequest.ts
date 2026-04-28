import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class SubmitMatchResultRequest {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001', description: 'Winner UUID' })
  @IsUUID()
  winnerId!: string;

  @ApiProperty({ example: '2-1', description: 'Score of the match' })
  @IsString()
  score!: string;
}
