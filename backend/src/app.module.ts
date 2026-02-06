import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

import { PrismaModule } from './core/prisma/prisma.module';
import { RedisModule } from './core/redis/redis.module';
import { LlmModule } from './core/llm/llm.module';
import { GoogleModule } from './core/google/google.module';

import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { ChatModule } from './modules/chat/chat.module';
import { ProcessingModule } from './modules/processing/processing.module';

@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
        }),

        // BullMQ Queue
        BullModule.forRoot({
            connection: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD || undefined,
            },
        }),

        // Core Modules
        PrismaModule,
        RedisModule,
        LlmModule,
        GoogleModule,

        // Feature Modules
        OnboardingModule,
        ChatModule,
        ProcessingModule,
    ],
})
export class AppModule { }
