import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MatchStatus } from '@/match/enum/match-status.enum';
import { Tournament } from '@/tournament/tournament.entity';
import { Player } from '@/player/player.entity';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  matchId!: string;

  @Column({ nullable: true })
  score!: string;

  @Column()
  round!: number;

  @Column({ type: 'varchar', default: MatchStatus.PENDING })
  status!: MatchStatus;

  @ManyToOne(() => Tournament, (tournament) => tournament.matches as Match[])
  @JoinColumn()
  tournament!: Tournament;

  @ManyToOne(() => Player, (player) => player.firstPlayer, { nullable: true })
  @JoinColumn()
  firstPlayer!: Player | null;

  @ManyToOne(() => Player, (player) => player.secondPlayer, { nullable: true })
  @JoinColumn()
  secondPlayer!: Player | null;

  @ManyToOne(() => Player, (player) => player.winner, { nullable: true })
  @JoinColumn()
  winner!: Player | null;

  @ManyToOne(() => Match, { nullable: true })
  @JoinColumn()
  nextMatch!: Match | null;
}
