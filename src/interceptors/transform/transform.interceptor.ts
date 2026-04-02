import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { instanceToPlain } from 'class-transformer';
import { map, Observable } from 'rxjs';
import { RESPONSE_MESSAGE_KEY } from 'src/decorator/response-message.decorator';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context
      .switchToHttp()
      .getResponse<{ statusCode: number }>();
    const message =
      this.reflector.get<string>(RESPONSE_MESSAGE_KEY, context.getHandler()) ??
      null;

    return next.handle().pipe(
      map((data: object) => ({
        statusCode: this.formatStatusCode(response.statusCode),
        message,
        data: instanceToPlain(data),
      })),
    );
  }
  private formatStatusCode(code: number): string {
    return `${code} ${HttpStatus[code].replaceAll('_', ' ')}`;
  }
}
