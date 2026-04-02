import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from 'src/player/player.entity';
import { Role } from 'src/player/enum/role.enum';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
  ) {}

  async seedAdmin(): Promise<void> {
    const existingAdmin = await this.playerRepository.findOne({
      where: { role: Role.ADMIN },
    });

    if (existingAdmin) {
      return;
    }

    const password = await bcrypt.hash(process.env.ADMIN_PASSWORD!, 10);

    const admin = this.playerRepository.create({
      username: process.env.ADMIN_USERNAME,
      email: process.env.ADMIN_EMAIL,
      password,
      role: Role.ADMIN,
    });

    await this.playerRepository.save(admin);
  }
}
