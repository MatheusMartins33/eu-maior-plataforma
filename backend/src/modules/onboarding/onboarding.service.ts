import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@/core/prisma/prisma.service';
import { AstrologyService } from './astrology.service';
import { SubmitCosmicDataDto, SubmitPsychometricDto, SubmitNarrativeDto } from './onboarding.dto';

@Injectable()
export class OnboardingService {
    private readonly logger = new Logger(OnboardingService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly astrology: AstrologyService,
        @InjectQueue('profile-processing') private readonly processingQueue: Queue,
    ) { }

    /**
     * Step 1: Create initial profile
     */
    async startOnboarding(userId: string, fullName: string) {
        this.logger.log(`Starting onboarding for user: ${userId}`);

        // Check if profile already exists
        const existing = await this.prisma.profile.findUnique({
            where: { userId },
        });

        if (existing) {
            return {
                profileId: existing.id,
                status: existing.processingStatus,
                message: 'Profile already exists',
            };
        }

        // Create new profile
        const profile = await this.prisma.profile.create({
            data: {
                userId,
                fullName,
                // Placeholder dates - will be updated in cosmic step
                birthDate: new Date(),
                birthTime: '00:00',
                birthPlace: 'Unknown',
            },
        });

        return {
            profileId: profile.id,
            status: 'PENDING',
            nextStep: 'cosmic',
            message: 'Profile created. Submit birth data next.',
        };
    }

    /**
     * Step 2: Submit and process cosmic (birth) data
     */
    async submitCosmicData(profileId: string, data: SubmitCosmicDataDto) {
        this.logger.log(`Submitting cosmic data for profile: ${profileId}`);

        // Geocode the birth place
        const coordinates = await this.astrology.geocode(data.birthPlace);

        // Call Astrologer API
        const astroMap = await this.astrology.generateNatalChart({
            date: data.birthDate,
            time: data.birthTime,
            latitude: coordinates.lat,
            longitude: coordinates.lng,
            timezone: data.birthTimezone || coordinates.timezone,
        });

        // Update profile
        await this.prisma.profile.update({
            where: { id: profileId },
            data: {
                birthDate: new Date(data.birthDate),
                birthTime: data.birthTime,
                birthPlace: data.birthPlace,
                birthCity: data.birthCity || coordinates.city,
                birthState: data.birthState,
                birthCountry: data.birthCountry || coordinates.country,
                birthTimezone: data.birthTimezone || coordinates.timezone,
                birthLatitude: coordinates.lat,
                birthLongitude: coordinates.lng,
                astroMapRaw: astroMap as any,
            },
        });

        return {
            profileId,
            status: 'cosmic_complete',
            nextStep: 'psychometric',
            cosmicSummary: {
                sunSign: astroMap.sunSign,
                moonSign: astroMap.moonSign,
                ascendant: astroMap.ascendant,
            },
            message: 'Birth chart generated. Submit psychometric data next.',
        };
    }

    /**
     * Step 3: Submit psychometric (Big Five) assessment
     */
    async submitPsychometricData(profileId: string, data: SubmitPsychometricDto) {
        this.logger.log(`Submitting psychometric data for profile: ${profileId}`);

        // Calculate Big Five scores from answers
        const bigFive = this.calculateBigFive(data.answers);

        await this.prisma.profile.update({
            where: { id: profileId },
            data: {
                psychometricAnswers: {
                    answers: data.answers,
                    bigFive,
                },
            },
        });

        return {
            profileId,
            status: 'psychometric_complete',
            nextStep: 'narrative',
            bigFiveSummary: bigFive,
            message: 'Psychometric assessment complete. Submit narratives next.',
        };
    }

    /**
     * Step 4: Submit narrative responses
     */
    async submitNarrativeData(profileId: string, data: SubmitNarrativeDto) {
        this.logger.log(`Submitting narrative data for profile: ${profileId}`);

        await this.prisma.profile.update({
            where: { id: profileId },
            data: {
                narrativeDecisiveMoment: data.decisiveMoment,
                narrativeFrustration: data.frustration,
                narrativeDream: data.dream,
            },
        });

        return {
            profileId,
            status: 'narrative_complete',
            nextStep: 'process',
            message: 'Narratives submitted. Ready to generate Higher Self Profile.',
        };
    }

    /**
     * Step 5: Trigger profile processing
     */
    async triggerProcessing(profileId: string) {
        this.logger.log(`Triggering processing for profile: ${profileId}`);

        const profile = await this.prisma.profile.findUnique({
            where: { id: profileId },
        });

        if (!profile) {
            throw new Error('Profile not found');
        }

        // Validate all required data is present
        if (!profile.astroMapRaw) {
            throw new Error('Cosmic data not submitted');
        }

        // Add to processing queue
        const job = await this.processingQueue.add('process-profile', {
            profileId: profile.id,
            userId: profile.userId,
        });

        await this.prisma.profile.update({
            where: { id: profileId },
            data: {
                processingStatus: 'PROCESSING',
                processingJobId: job.id,
            },
        });

        return {
            profileId,
            jobId: job.id,
            status: 'processing',
            message: 'Profile processing started. Check status endpoint for updates.',
        };
    }

    /**
     * Get current processing status
     */
    async getProcessingStatus(profileId: string) {
        const profile = await this.prisma.profile.findUnique({
            where: { id: profileId },
            include: {
                processingJobs: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });

        if (!profile) {
            throw new Error('Profile not found');
        }

        const job = profile.processingJobs[0];

        return {
            profileId,
            processingStatus: profile.processingStatus,
            jobStatus: job?.status,
            currentNode: job?.currentNode,
            isReady: profile.processingStatus === 'READY',
            hasHigherSelf: !!profile.higherSelfProfile,
        };
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    /**
     * Calculate Big Five scores from 10-question assessment
     * Using reverse scoring for some items
     */
    private calculateBigFive(answers: number[]): {
        openness: number;
        conscientiousness: number;
        extraversion: number;
        agreeableness: number;
        neuroticism: number;
    } {
        // Questions map to traits (simplified 10-question version)
        // Q1, Q6 → Openness
        // Q2, Q7 → Conscientiousness
        // Q3, Q8 → Extraversion
        // Q4, Q9 → Agreeableness
        // Q5, Q10 → Neuroticism

        const normalize = (score: number) => (score - 1) / 4; // 1-5 → 0-1

        return {
            openness: normalize((answers[0] + answers[5]) / 2),
            conscientiousness: normalize((answers[1] + answers[6]) / 2),
            extraversion: normalize((answers[2] + answers[7]) / 2),
            agreeableness: normalize((answers[3] + answers[8]) / 2),
            neuroticism: normalize((answers[4] + answers[9]) / 2),
        };
    }
}
