import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from '@langchain/core/messages';

export interface LlmCallOptions {
    temperature?: number;
    maxTokens?: number;
    model?: string;
}

export interface LlmResponse {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

@Injectable()
export class LlmService {
    private readonly openai: ChatOpenAI;
    private readonly defaultModel: string;

    constructor(private readonly config: ConfigService) {
        this.defaultModel = 'gpt-4o';

        this.openai = new ChatOpenAI({
            openAIApiKey: this.config.get('OPENAI_API_KEY'),
            modelName: this.defaultModel,
            temperature: 0.7,
        });
    }

    /**
     * Get a ChatOpenAI instance with custom configuration
     */
    getChatModel(options: LlmCallOptions = {}): ChatOpenAI {
        return new ChatOpenAI({
            openAIApiKey: this.config.get('OPENAI_API_KEY'),
            modelName: options.model || this.defaultModel,
            temperature: options.temperature ?? 0.7,
            maxTokens: options.maxTokens,
        });
    }

    /**
     * Simple completion with system and user prompts
     */
    async complete(
        systemPrompt: string,
        userPrompt: string,
        options: LlmCallOptions = {},
    ): Promise<LlmResponse> {
        const model = this.getChatModel(options);

        const messages: BaseMessage[] = [
            new SystemMessage(systemPrompt),
            new HumanMessage(userPrompt),
        ];

        const response = await model.invoke(messages);

        return {
            content: response.content as string,
            usage: response.response_metadata?.usage ? {
                promptTokens: response.response_metadata.usage.prompt_tokens,
                completionTokens: response.response_metadata.usage.completion_tokens,
                totalTokens: response.response_metadata.usage.total_tokens,
            } : undefined,
        };
    }

    /**
     * Structured output with JSON mode
     */
    async completeJson<T>(
        systemPrompt: string,
        userPrompt: string,
        options: LlmCallOptions = {},
    ): Promise<T> {
        const model = this.getChatModel(options).bind({
            response_format: { type: 'json_object' },
        });

        const messages: BaseMessage[] = [
            new SystemMessage(systemPrompt + '\n\nRespond ONLY with valid JSON.'),
            new HumanMessage(userPrompt),
        ];

        const response = await model.invoke(messages);
        const content = response.content as string;

        try {
            return JSON.parse(content) as T;
        } catch (error) {
            throw new Error(`Failed to parse LLM JSON response: ${content}`);
        }
    }

    /**
     * Chat completion with history
     */
    async chat(
        systemPrompt: string,
        history: Array<{ role: 'user' | 'assistant'; content: string }>,
        options: LlmCallOptions = {},
    ): Promise<LlmResponse> {
        const model = this.getChatModel(options);

        const messages: BaseMessage[] = [
            new SystemMessage(systemPrompt),
            ...history.map(msg =>
                msg.role === 'user'
                    ? new HumanMessage(msg.content)
                    : new AIMessage(msg.content)
            ),
        ];

        const response = await model.invoke(messages);

        return {
            content: response.content as string,
            usage: response.response_metadata?.usage ? {
                promptTokens: response.response_metadata.usage.prompt_tokens,
                completionTokens: response.response_metadata.usage.completion_tokens,
                totalTokens: response.response_metadata.usage.total_tokens,
            } : undefined,
        };
    }
}
