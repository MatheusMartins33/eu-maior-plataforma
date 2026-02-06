import { Controller, Post, Body, Param, HttpException, HttpStatus, Get } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './chat.dto';

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    /**
     * Send a message to the Higher Self
     */
    @Post(':profileId/message')
    async sendMessage(
        @Param('profileId') profileId: string,
        @Body() dto: SendMessageDto,
    ) {
        try {
            return await this.chatService.sendMessage(profileId, dto.message, dto.sessionId);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Get chat history for a session
     */
    @Get(':profileId/history/:sessionId')
    async getChatHistory(
        @Param('profileId') profileId: string,
        @Param('sessionId') sessionId: string,
    ) {
        try {
            return await this.chatService.getChatHistory(profileId, sessionId);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.NOT_FOUND);
        }
    }

    /**
     * Start a new chat session
     */
    @Post(':profileId/session')
    async startSession(@Param('profileId') profileId: string) {
        try {
            return await this.chatService.startSession(profileId);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Get the Higher Self profile summary
     */
    @Get(':profileId/higher-self')
    async getHigherSelfSummary(@Param('profileId') profileId: string) {
        try {
            return await this.chatService.getHigherSelfSummary(profileId);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.NOT_FOUND);
        }
    }
}
