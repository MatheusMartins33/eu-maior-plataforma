import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ProfilePipelineService } from './profile-pipeline.service';
import { ProcessingProcessor } from './processing.processor';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'profile-processing',
        }),
    ],
    providers: [ProfilePipelineService, ProcessingProcessor],
    exports: [ProfilePipelineService],
})
export class ProcessingModule { }
