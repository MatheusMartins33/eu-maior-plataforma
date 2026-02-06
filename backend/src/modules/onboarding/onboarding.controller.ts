import { Controller, Post, Body, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import {
    StartOnboardingDto,
    SubmitCosmicDataDto,
    SubmitPsychometricDto,
    SubmitNarrativeDto,
} from './onboarding.dto';

@Controller('onboarding')
export class OnboardingController {
    constructor(private readonly onboardingService: OnboardingService) { }

    /**
     * Step 1: Start onboarding process
     */
    @Post('start')
    async startOnboarding(@Body() dto: StartOnboardingDto) {
        try {
            return await this.onboardingService.startOnboarding(dto.userId, dto.fullName);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Step 2: Submit cosmic (birth) data
     */
    @Post(':profileId/cosmic')
    async submitCosmicData(
        @Param('profileId') profileId: string,
        @Body() dto: SubmitCosmicDataDto,
    ) {
        try {
            return await this.onboardingService.submitCosmicData(profileId, dto);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Step 3: Submit psychometric (Big Five) data
     */
    @Post(':profileId/psychometric')
    async submitPsychometricData(
        @Param('profileId') profileId: string,
        @Body() dto: SubmitPsychometricDto,
    ) {
        try {
            return await this.onboardingService.submitPsychometricData(profileId, dto);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Step 4: Submit narrative responses
     */
    @Post(':profileId/narrative')
    async submitNarrativeData(
        @Param('profileId') profileId: string,
        @Body() dto: SubmitNarrativeDto,
    ) {
        try {
            return await this.onboardingService.submitNarrativeData(profileId, dto);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Step 5: Trigger profile processing
     */
    @Post(':profileId/process')
    async triggerProcessing(@Param('profileId') profileId: string) {
        try {
            return await this.onboardingService.triggerProcessing(profileId);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Get processing status
     */
    @Get(':profileId/status')
    async getStatus(@Param('profileId') profileId: string) {
        try {
            return await this.onboardingService.getProcessingStatus(profileId);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.NOT_FOUND);
        }
    }
}
