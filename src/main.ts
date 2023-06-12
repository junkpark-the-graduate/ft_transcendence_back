import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { execSync } from 'child_process';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  execSync('npx prisma migrate deploy', { stdio: 'inherit' });

  const config = new DocumentBuilder()
    .setTitle('transcendence')
    .setDescription('The transcendence API description')
    .setVersion('1.0')
    .addTag('transcendence')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  // front: 3000 /  back: 3001
  // app.enableCors();
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
