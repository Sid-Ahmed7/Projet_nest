import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePlayerRequest {
  @IsString()
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}
