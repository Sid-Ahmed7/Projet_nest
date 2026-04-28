import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class RegisterRequest {
  @ApiProperty({ example: 'johndoe', description: 'User username' })
  @IsString()
  username!: string;

  @ApiProperty({ example: 'john@example.com', description: 'User email' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'StrongP@ssw0rd!',
    description: 'User password (must contain uppercase, lowercase, number, and special character)',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password!: string;

  @ApiProperty({ example: 'https://example.com/avatar.png', description: 'User avatar URL', required: false })
  @IsString()
  @IsOptional()
  avatar?: string;
}
