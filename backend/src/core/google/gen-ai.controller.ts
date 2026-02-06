import { Controller, Post, Body, UseGuards, Res, HttpStatus } from '@nestjs/common';
import { GoogleGenAiService } from './google-gen-ai.service';
import { Response } from 'express';

@Controller('ai/gen')
export class GenAiController {
    constructor(private readonly googleService: GoogleGenAiService) { }

    @Post('image')
    async generateImage(@Body('prompt') prompt: string, @Res() res: Response) {
        try {
            if (!prompt) {
                return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Prompt is required' });
            }

            const imageUrl = await this.googleService.generateHigherSelfImage(prompt);
            return res.status(HttpStatus.OK).json({ url: imageUrl });
        } catch (error) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'Failed to generate image',
                error: error.message
            });
        }
    }
}
