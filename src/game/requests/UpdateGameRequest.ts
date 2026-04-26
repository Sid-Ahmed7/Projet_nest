import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateGameRequest {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  publisher?: string;

  @IsDateString()
  @IsOptional()
  releaseDate?: string;

  @IsString()
  @IsOptional()
  genre?: string;
}
