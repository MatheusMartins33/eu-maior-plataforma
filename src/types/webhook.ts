// TypeScript interfaces for N8N Webhook Integration

import { User } from '@supabase/supabase-js';

// Raw response from N8N Webhook
export interface N8NWebhookRawResponse {
  response: {
    body: Array<{
      output: string;
    }>;
    headers: Record<string, any>;
    statusCode: number;
  };
}

// Parsed response for frontend consumption
export interface ParsedAIResponse {
  reply: string;
  success: boolean;
  metadata?: {
    statusCode: number;
    timestamp: string;
    responseTime?: number;
  };
}

// Request payload to webhook
export interface WebhookRequest {
  message: string;
  user: {
    id: string;
    email?: string;
  };
  metadata: {
    timestamp: string;
    sessionId: string;
    clientVersion: string;
  };
}

// Error types for webhook operations
export enum WebhookErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  RATE_LIMIT = 'RATE_LIMIT',
  WEBHOOK_UNAVAILABLE = 'WEBHOOK_UNAVAILABLE',
  CORS_ERROR = 'CORS_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Structured error for webhook operations
export interface WebhookError {
  type: WebhookErrorType;
  message: string;
  originalError?: Error;
  retryable: boolean;
  statusCode?: number;
  timestamp: string;
}

// Retry configuration
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

// Webhook service configuration
export interface WebhookConfig {
  chatUrl: string;
  onboardingUrl: string;
  timeout: number;
  retryConfig: RetryConfig;
  corsHeaders: Record<string, string>;
}