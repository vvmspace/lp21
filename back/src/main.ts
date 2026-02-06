import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './modules/app.module';
import { loadEnv } from './libs/config/env';

async function bootstrap() {
  loadEnv();
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Life Protocol API')
    .setVersion('v1')
    .addServer('/api/v1')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.BACK_PORT ? Number(process.env.BACK_PORT) : 3001);
}

bootstrap();
