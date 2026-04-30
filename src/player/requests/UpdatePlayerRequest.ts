import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdatePlayerRequest {
  @ApiProperty({ example: 'johndoe_updated', description: 'Username', required: false })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({ example: 'https://example.com/new_avatar.png', description: 'Avatar URL', required: false })
  @IsString()
  @IsOptional()
  avatar?: string;
}
