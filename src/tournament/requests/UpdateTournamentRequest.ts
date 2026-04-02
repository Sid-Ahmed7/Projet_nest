import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { TournamentStatus } from '../enum/tournament-status.enum';

export class UpdateTournamentRequest {
  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @Min(2)
  @IsOptional()
  maxPlayers?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsEnum(TournamentStatus)
  @IsOptional()
  status?: TournamentStatus;
}
