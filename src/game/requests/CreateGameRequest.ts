import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString } from 'class-validator';

export class CreateGameRequest {
  @ApiProperty({ example: 'League of Legends', description: 'Name of the game' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Riot Games', description: 'Publisher of the game' })
  @IsString()
  publisher!: string;

  @ApiProperty({ example: '2009-10-27', description: 'Release date of the game in YYYY-MM-DD format' })
  @IsDateString()
  releaseDate!: string;

  @ApiProperty({ example: 'MOBA', description: 'Genre of the game' })
  @IsString()
  genre!: string;
}
