import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeederService } from './seeder/seeder.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.get(SeederService).seedAdmin();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
