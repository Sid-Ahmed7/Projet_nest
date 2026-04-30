import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateGameRequest {
  @ApiProperty({ example: 'League of Legends: Wild Rift', description: 'Name of the game', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Riot Games', description: 'Publisher of the game', required: false })
  @IsString()
  @IsOptional()
  publisher?: string;

  @ApiProperty({ example: '2020-10-27', description: 'Release date of the game in YYYY-MM-DD format', required: false })
  @IsDateString()
  @IsOptional()
  releaseDate?: string;

  @ApiProperty({ example: 'Mobile MOBA', description: 'Genre of the game', required: false })
  @IsString()
  @IsOptional()
  genre?: string;
}
