import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MatchStatus } from './enum/match-status.enum';
import { Tournament } from 'src/tournament/tournament.entity';
import { Player } from 'src/player/player.entity';

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

  @ManyToOne(() => Tournament, (tournament) => tournament.matches)
  @JoinColumn()
  tournament!: Tournament;

  @ManyToOne(() => Player, (player) => player.firstPlayer)
  @JoinColumn()
  firstPlayer!: Player;

  @ManyToOne(() => Player, (player) => player.secondPlayer)
  @JoinColumn()
  secondPlayer!: Player;

  @ManyToOne(() => Player, (player) => player.winner, { nullable: true })
  @JoinColumn()
  winner!: Player | null;
}
