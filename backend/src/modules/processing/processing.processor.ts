import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ProfilePipelineService } from './profile-pipeline.service';
import { PrismaService } from '@/core/prisma/prisma.service';
import { RedisService } from '@/core/redis/redis.service';

export interface ProcessingJobData {
    profileId: string;
    userId: string;
}

@Processor('profile-processing')
export class ProcessingProcessor extends WorkerHost {
    private readonly logger = new Logger(ProcessingProcessor.name);

    constructor(
        private readonly pipeline: ProfilePipelineService,
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
    ) {
        super();
    }

    async process(job: Job<ProcessingJobData>): Promise<void> {
        const { profileId, userId } = job.data;

        this.logger.log(`Processing profile: ${profileId}`);

        try {
            // Update status to PROCESSING
            await this.prisma.profile.update({
                where: { id: profileId },
                data: { processingStatus: 'PROCESSING' },
            });

            // Create or update processing job record
            await this.prisma.processingJob.upsert({
                where: { id: job.id || profileId },
                create: {
                    id: job.id || profileId,
                    profileId,
                    status: 'MINING',
                    startedAt: new Date(),
                },
                update: {
                    status: 'MINING',
                    startedAt: new Date(),
                    attempts: { increment: 1 },
                },
            });

            // Run the LangGraph pipeline
            const higherSelfProfile = await this.pipeline.processProfile(profileId);

            // Update job as completed
            await this.prisma.processingJob.update({
                where: { id: job.id || profileId },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                    synthesizerOutput: higherSelfProfile as object,
                },
            });

            // Cache the profile for fast chat access
            await this.redis.cacheHigherSelfProfile(userId, higherSelfProfile);

            this.logger.log(`✅ Profile processing completed: ${profileId}`);

        } catch (error) {
            this.logger.error(`❌ Profile processing failed: ${profileId}`, error);

            // Update status to ERROR
            await this.prisma.profile.update({
                where: { id: profileId },
                data: { processingStatus: 'ERROR' },
            });

            await this.prisma.processingJob.update({
                where: { id: job.id || profileId },
                data: {
                    status: 'FAILED',
                    errorLog: { message: error.message, stack: error.stack },
                },
            });

            throw error;
        }
    }
}
