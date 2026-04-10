import { Column, CreateDateColumn, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '@/player/enum/role.enum';
import { Tournament } from '@/tournament/tournament.entity';
import { Match } from '@/match/match.entity';
import { Exclude } from 'class-transformer';

@Entity('players')
export class Player {
  @PrimaryGeneratedColumn('uuid')
  playerId!: string;

  @Column({ unique: true })
  username!: string;

  @Column({ unique: true })
  email!: string;

  @Exclude()
  @Column()
  password!: string;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  refreshToken!: string | null;

  @Column({ nullable: true })
  avatar!: string;

  @Column({ type: 'varchar', default: Role.PLAYER })
  role!: Role;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToMany(() => Tournament, (tournament) => tournament.players)
  tournaments!: Tournament[];

  @OneToMany(() => Match, (match) => match.firstPlayer)
  firstPlayer!: Match[];

  @OneToMany(() => Match, (match) => match.secondPlayer)
  secondPlayer!: Match[];

  @OneToMany(() => Match, (match) => match.winner)
  winner!: Match[];
}
