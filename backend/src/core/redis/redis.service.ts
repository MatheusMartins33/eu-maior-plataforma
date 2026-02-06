import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
    private readonly client: Redis;

    constructor(private readonly config: ConfigService) {
        this.client = new Redis({
            host: this.config.get('REDIS_HOST', 'localhost'),
            port: this.config.get('REDIS_PORT', 6379),
            password: this.config.get('REDIS_PASSWORD') || undefined,
        });
    }

    onModuleDestroy() {
        this.client.disconnect();
    }

    getClient(): Redis {
        return this.client;
    }

    // ============================================
    // CHAT MEMORY OPERATIONS
    // ============================================

    /**
     * Get chat history for a session
     */
    async getChatHistory(userId: string, sessionId: string, limit = 20): Promise<string[]> {
        const key = this.buildChatKey(userId, sessionId);
        return this.client.lrange(key, -limit, -1);
    }

    /**
     * Add message to chat history
     */
    async addChatMessage(userId: string, sessionId: string, message: object): Promise<void> {
        const key = this.buildChatKey(userId, sessionId);
        await this.client.rpush(key, JSON.stringify(message));
        // Keep only last 100 messages per session
        await this.client.ltrim(key, -100, -1);
        // Set TTL of 24 hours
        await this.client.expire(key, 86400);
    }

    /**
     * Clear chat history for a session
     */
    async clearChatHistory(userId: string, sessionId: string): Promise<void> {
        const key = this.buildChatKey(userId, sessionId);
        await this.client.del(key);
    }

    // ============================================
    // CONTEXT CACHE OPERATIONS
    // ============================================

    /**
     * Cache the Higher Self Profile for fast access
     */
    async cacheHigherSelfProfile(userId: string, profile: object): Promise<void> {
        const key = `user:${userId}:higher_self`;
        await this.client.set(key, JSON.stringify(profile), 'EX', 3600); // 1 hour TTL
    }

    /**
     * Get cached Higher Self Profile
     */
    async getCachedHigherSelfProfile(userId: string): Promise<object | null> {
        const key = `user:${userId}:higher_self`;
        const cached = await this.client.get(key);
        return cached ? JSON.parse(cached) : null;
    }

    /**
     * Invalidate cached profile (e.g., after reprocessing)
     */
    async invalidateProfileCache(userId: string): Promise<void> {
        const key = `user:${userId}:higher_self`;
        await this.client.del(key);
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private buildChatKey(userId: string, sessionId: string): string {
        return `chat:${userId}:${sessionId}`;
    }
}
