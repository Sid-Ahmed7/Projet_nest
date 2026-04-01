import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterRequest {
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}
