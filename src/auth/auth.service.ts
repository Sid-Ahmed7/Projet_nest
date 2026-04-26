import * as bcrypt from 'bcrypt';
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Player } from '@/player/player.entity';
import { PlayerService } from '@/player/player.service';
import { RegisterRequest } from './requests/register-request';
import { JwtPayload } from './interfaces/jwt.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly playerService: PlayerService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<Player> {
    const player = await this.playerService.findByEmail(email);
    if (!player) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, player.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return player;
  }

  async register(register: RegisterRequest): Promise<Player> {
    const existing = await this.playerService.findByEmail(register.email);
    if (existing) throw new ConflictException('Email already in use');

    const passwordHashed = await bcrypt.hash(register.password, 10);
    return this.playerService.create({ ...register, password: passwordHashed });
  }

  async refresh(playerId: string, token: string): Promise<JwtPayload> {
    const player = await this.playerService.findPlayerById(playerId);

    if (!player.refreshToken) throw new UnauthorizedException('No refresh token');

    const match = await bcrypt.compare(token, player.refreshToken);
    if (!match) throw new UnauthorizedException('Invalid refresh token');

    return this.generateTokens(player);
  }

  async generateTokens(player: Player): Promise<JwtPayload> {
    const payload = { sub: player.playerId, role: player.role };

    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: Number.parseInt(process.env.JWT_REFRESH_EXPIRES_IN!),
    });

    const hashed = await bcrypt.hash(refresh_token, 10);
    await this.playerService.saveRefreshToken(player.playerId, hashed);

    return { access_token, refresh_token };
  }
}
