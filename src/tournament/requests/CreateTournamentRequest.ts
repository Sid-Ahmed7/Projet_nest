import { IsString, IsUUID, IsInt, Min, IsDateString } from 'class-validator';

export class CreateTournamentRequest {
  @IsString()
  name!: string;

  @IsUUID()
  gameId!: string;

  @IsInt()
  @Min(2)
  maxPlayers!: number;

  @IsDateString()
  startDate!: string;
}
