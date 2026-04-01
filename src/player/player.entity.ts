import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from './enum/role.enum';
import { Tournament } from 'src/tournament/tournament.entity';
import { Match } from 'src/match/match.entity';

@Entity('players')
export class Player {
  @PrimaryGeneratedColumn('uuid')
  playerId: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'varchar', default: Role.PLAYER })
  role: Role;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToMany(() => Tournament, (tournament) => tournament.players)
  tournaments: Tournament[];

  @OneToMany(() => Match, (match) => match.firstPlayer)
  firstPlayer: Match[];

  @OneToMany(() => Match, (match) => match.secondPlayer)
  secondPlayer: Match[];

  @OneToMany(() => Match, (match) => match.winner)
  winner: Match[];
}
