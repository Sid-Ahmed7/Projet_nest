import { IsOptional, IsString } from 'class-validator';

export class UpdatePlayerRequest {
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}
