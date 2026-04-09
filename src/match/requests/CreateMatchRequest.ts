import { IsInt, IsUUID, Min } from 'class-validator';

export class CreateMatchRequest {
  @IsUUID()
  tournamentId!: string;

  @IsUUID()
  firstPlayerId!: string;

  @IsUUID()
  secondPlayerId!: string;

  @IsInt()
  @Min(1)
  round!: number;
}
