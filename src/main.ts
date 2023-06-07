import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // front: 3000 /  back: 3001
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
