import { IsString, IsUUID } from 'class-validator';

export class SubmitMatchResultRequest {
  @IsUUID()
  winnerId!: string;

  @IsString()
  score!: string;
}
