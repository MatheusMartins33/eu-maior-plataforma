import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));

    // CORS for frontend
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    });

    // API prefix
    app.setGlobalPrefix('api');

    const port = process.env.PORT || 3333;
    await app.listen(port);

    console.log(`🚀 EU MAIOR Backend running on http://localhost:${port}`);
}

bootstrap();
