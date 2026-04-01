import { Role } from 'src/player/enum/role.enum';

export interface Jwt {
  sub: string;
  role: Role;
}

export interface JwtPayload {
  access_token: string;
  refresh_token: string;
}

export interface RefreshTokenPayload {
  user: {
    playerId: string;
    refreshToken: string;
  };
}
