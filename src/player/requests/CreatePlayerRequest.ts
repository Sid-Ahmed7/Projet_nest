import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePlayerRequest {
  @ApiProperty({ example: 'johndoe', description: 'Username' })
  @IsString()
  username!: string;

  @ApiProperty({ example: 'johndoe@example.com', description: 'User email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongP@ssw0rd!', description: 'User password' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'https://example.com/avatar.png', description: 'Avatar URL', required: false })
  @IsString()
  @IsOptional()
  avatar?: string;
}
