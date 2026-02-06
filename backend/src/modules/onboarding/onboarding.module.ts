import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { AstrologyService } from './astrology.service';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'profile-processing',
        }),
    ],
    controllers: [OnboardingController],
    providers: [OnboardingService, AstrologyService],
    exports: [OnboardingService],
})
export class OnboardingModule { }
