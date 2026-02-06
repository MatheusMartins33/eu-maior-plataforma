import { Module, Global } from '@nestjs/common';
import { GoogleGenAiService } from './google-gen-ai.service';
import { GenAiController } from './gen-ai.controller';

@Global()
@Module({
    providers: [GoogleGenAiService],
    controllers: [GenAiController],
    exports: [GoogleGenAiService],
})
export class GoogleModule { }
