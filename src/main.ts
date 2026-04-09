import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeederService } from './seeder/seeder.service';
import { HttpExceptionFilter } from './filter/http-exception.filter';
import { TransformInterceptor } from './interceptors/transform/transform.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor(new Reflector()));
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const config = new DocumentBuilder()
    .setTitle('API Video Games')
    .setDescription('L\'API pour la gestion des tournois esport')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.get(SeederService).seedAdmin();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
