/* eslint-disable prettier/prettier */
import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TournamentStatus } from "./enum/tournament-status.enum";
import { Game } from "@/game/game.entity";
import { Player } from "@/player/player.entity";
import { Match } from "@/match/match.entity";

@Entity('tournaments')
export class Tournament {

    @PrimaryGeneratedColumn('uuid')
    tournamentId!: string;

    @Column()
    name!: string;

    @Column()
    maxPlayers!: number;

    @Column({ type: 'timestamp' })
    startDate!: Date;

    @Column({ type: 'varchar', default: TournamentStatus.PENDING })
    status!: TournamentStatus;

    @CreateDateColumn()
    createdAt!: Date;

    @ManyToOne(() => Game, (game) => game.tournaments, { eager: true })
    game!: Game;

    @ManyToMany(() => Player, (player) => player.tournaments)
    @JoinTable({ name: 'tournament_players' })
    players!: Player[];

    @OneToMany(() => Match, (match) => match.tournament)
    matches!: Match[];
}
