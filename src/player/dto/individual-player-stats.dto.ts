import { ApiProperty } from '@nestjs/swagger';

export class IndividualPlayerStatsDto {
  @ApiProperty({ description: 'ID du joueur', example: 'uuid-1234' })
  playerId: string;

  @ApiProperty({ description: 'Nom utilisateur du joueur', example: 'Arthur' })
  username: string;

  @ApiProperty({ description: 'Nombre de victoires du joueur', example: 10 })
  winCount: number;

  @ApiProperty({ description: 'Nombre total de matchs joués', example: 15 })
  totalMatches: number;

  @ApiProperty({ description: 'Ratio de victoire (en %)', example: 66.67 })
  winRatio: number;
}
