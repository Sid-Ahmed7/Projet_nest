import { ApiProperty } from '@nestjs/swagger';

export class PlayerStatsDto {
  @ApiProperty({ description: 'ID du joueur', example: 'uuid-1234' })
  playerId: string;

  @ApiProperty({ description: 'Nom utilisateur du joueur', example: 'Arthur' })
  username: string;

  @ApiProperty({ description: 'Nombre de victoires du joueur', example: 42 })
  winCount: number;
}
