import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordRequest {
  @ApiProperty({ example: 'OldP@ssw0rd!', description: 'Current password' })
  @IsString()
  currentPassword!: string;

  @ApiProperty({ example: 'NewP@ssw0rd!', description: 'New password' })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
