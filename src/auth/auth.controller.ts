import {
  Body,
  Controller,
  Post,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Player } from 'src/player/player.entity';
import { AuthService } from './auth.service';
import { RegisterRequest } from './requests/register-request';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import type { RefreshTokenPayload } from './interfaces/jwt.interface';
import { ResponseMessage } from 'src/decorator/response-message.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @ResponseMessage('Login successful')
  login(@Request() req: { user: Player }) {
    return this.authService.generateTokens(req.user);
  }

  @Post('register')
  @ResponseMessage('Player registered successfully')
  register(@Body(ValidationPipe) req: RegisterRequest) {
    return this.authService.register(req);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @ResponseMessage('Tokens refreshed successfully')
  refresh(@Request() req: RefreshTokenPayload) {
    return this.authService.refresh(req.user.playerId, req.user.refreshToken);
  }
}
