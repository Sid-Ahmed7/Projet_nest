import { Tournament } from '@/tournament/tournament.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  gameId!: string;

  @Column()
  name!: string;

  @Column()
  publisher!: string;

  @Column({ type: 'timestamp' })
  releaseDate!: Date;

  @Column()
  genre!: string;

  @OneToMany(() => Tournament, (tournament) => tournament.game as Game)
  tournaments!: Tournament[];
}
