import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RankingSortCriteria } from '@/player/enum/ranking-sort-criteria.enum';

export class RankingQueryRequest {
  @ApiPropertyOptional({ enum: RankingSortCriteria, default: RankingSortCriteria.WINS })
  @IsEnum(RankingSortCriteria)
  @IsOptional()
  sortBy?: RankingSortCriteria = RankingSortCriteria.WINS;
}
