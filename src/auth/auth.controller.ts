import { Body, Controller, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Player } from '@/player/player.entity';
import { AuthService } from './auth.service';
import { RegisterRequest } from './requests/register-request';
import { LoginRequest } from './requests/login-request';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import type { RefreshTokenPayload } from './interfaces/jwt.interface';
import { ResponseMessage } from '@/decorator/response-message.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginRequest })
  @ResponseMessage('Login successful')
  login(@Request() req: { user: Player }) {
    return this.authService.generateTokens(req.user);
  }

  @Post('register')
  @ResponseMessage('Player registered successfully')
  register(@Body() req: RegisterRequest) {
    return this.authService.register(req);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ResponseMessage('Tokens refreshed successfully')
  refresh(@Request() req: RefreshTokenPayload) {
    return this.authService.refresh(req.user.playerId, req.user.refreshToken);
  }
}
