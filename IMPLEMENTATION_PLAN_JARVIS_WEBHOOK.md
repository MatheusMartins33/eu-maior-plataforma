# Implementation Plan: Corrected JarvisPage.tsx and N8N Webhook Integration

## Overview
This document provides the complete implementation plan and code specifications to fix the webhook integration issues. All code should be implemented in the specified files.

## 1. TypeScript Interfaces (src/types/webhook.ts)

```typescript
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
```

## 2. Enhanced Webhook Service (src/services/n8nWebhook.ts)

```typescript
// Enhanced N8N Webhook Service with proper error handling and retry logic

import { 
  N8NWebhookRawResponse, 
  ParsedAIResponse, 
  WebhookRequest, 
  WebhookError, 
  WebhookErrorType,
  WebhookConfig,
  RetryConfig
} from '@/types/webhook';
import { User } from '@supabase/supabase-js';

// Configuration
const DEFAULT_CONFIG: WebhookConfig = {
  chatUrl: 'https://c8211fd0efea.ngrok-free.app/webhook/EU_MAIOR',
  onboardingUrl: 'https://c8211fd0efea.ngrok-free.app/webhook/EU_MAIOR_ONBOARDING',
  timeout: 30000,
  retryConfig: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  },
  corsHeaders: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'User-Agent': 'EU-MAIOR-Frontend/1.0'
  }
};

// Session ID for tracking requests
let sessionId: string = crypto.randomUUID();

/**
 * Generate a unique session ID
 */
export const generateSessionId = (): string => {
  sessionId = crypto.randomUUID();
  return sessionId;
};

/**
 * Parse the complex N8N response into a simple format
 */
const parseN8NResponse = (rawResponse: any): ParsedAIResponse => {
  try {
    // Log raw response for debugging
    console.log('Raw N8N Response:', JSON.stringify(rawResponse, null, 2));

    // Handle array response format
    if (Array.isArray(rawResponse) && rawResponse.length > 0) {
      const firstItem = rawResponse[0];
      
      if (firstItem?.response?.body && Array.isArray(firstItem.response.body)) {
        const firstBodyItem = firstItem.response.body[0];
        
        if (firstBodyItem?.output && typeof firstBodyItem.output === 'string') {
          return {
            reply: firstBodyItem.output,
            success: true,
            metadata: {
              statusCode: firstItem.response.statusCode || 200,
              timestamp: new Date().toISOString()
            }
          };
        }
      }
    }

    // Handle object response format (fallback)
    if (rawResponse?.response?.body?.[0]?.output) {
      return {
        reply: rawResponse.response.body[0].output,
        success: true,
        metadata: {
          statusCode: rawResponse.response.statusCode || 200,
          timestamp: new Date().toISOString()
        }
      };
    }

    // If no valid format found, throw parsing error
    throw new Error('Invalid response format: no output field found');
    
  } catch (error) {
    console.error('Failed to parse N8N response:', error);
    throw createWebhookError(
      WebhookErrorType.PARSING_ERROR,
      `Failed to parse webhook response: ${error instanceof Error ? error.message : 'Unknown parsing error'}`,
      error instanceof Error ? error : undefined
    );
  }
};

/**
 * Create a structured webhook error
 */
const createWebhookError = (
  type: WebhookErrorType, 
  message: string, 
  originalError?: Error,
  statusCode?: number
): WebhookError => {
  const retryableErrors = [
    WebhookErrorType.NETWORK_ERROR,
    WebhookErrorType.TIMEOUT_ERROR,
    WebhookErrorType.RATE_LIMIT,
    WebhookErrorType.WEBHOOK_UNAVAILABLE
  ];

  return {
    type,
    message,
    originalError,
    retryable: retryableErrors.includes(type),
    statusCode,
    timestamp: new Date().toISOString()
  };
};

/**
 * Determine error type from fetch error
 */
const categorizeError = (error: any, response?: Response): WebhookError => {
  if (error.name === 'AbortError') {
    return createWebhookError(
      WebhookErrorType.TIMEOUT_ERROR,
      'Request timeout: The webhook took too long to respond'
    );
  }

  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return createWebhookError(
      WebhookErrorType.NETWORK_ERROR,
      'Network error: Unable to connect to webhook',
      error
    );
  }

  if (response) {
    const statusCode = response.status;
    
    if (statusCode === 429) {
      return createWebhookError(
        WebhookErrorType.RATE_LIMIT,
        'Rate limit exceeded: Too many requests',
        error,
        statusCode
      );
    }

    if (statusCode >= 500) {
      return createWebhookError(
        WebhookErrorType.WEBHOOK_UNAVAILABLE,
        `Webhook server error: ${statusCode}`,
        error,
        statusCode
      );
    }

    if (statusCode === 0 || statusCode >= 400) {
      return createWebhookError(
        WebhookErrorType.CORS_ERROR,
        'CORS or network error: Check webhook availability',
        error,
        statusCode
      );
    }
  }

  return createWebhookError(
    WebhookErrorType.UNKNOWN_ERROR,
    `Unknown error: ${error.message || 'Unexpected error occurred'}`,
    error
  );
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate retry delay with exponential backoff
 */
const calculateRetryDelay = (attempt: number, config: RetryConfig): number => {
  const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelay);
};

/**
 * Make HTTP request with retry logic
 */
const makeRequestWithRetry = async (
  url: string,
  payload: WebhookRequest,
  config: WebhookConfig = DEFAULT_CONFIG
): Promise<ParsedAIResponse> => {
  let lastError: WebhookError;
  
  for (let attempt = 0; attempt < config.retryConfig.maxAttempts; attempt++) {
    try {
      const startTime = Date.now();
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);
      
      console.log(`Webhook request attempt ${attempt + 1}/${config.retryConfig.maxAttempts}:`, {
        url,
        payload: {
          message: payload.message.substring(0, 100) + '...',
          userId: payload.user.id,
          sessionId: payload.metadata.sessionId
        }
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: config.corsHeaders,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw createWebhookError(
          WebhookErrorType.WEBHOOK_UNAVAILABLE,
          `HTTP ${response.status}: ${response.statusText}`,
          undefined,
          response.status
        );
      }

      const rawData = await response.json();
      const parsedResponse = parseN8NResponse(rawData);
      
      // Add response time to metadata
      if (parsedResponse.metadata) {
        parsedResponse.metadata.responseTime = Date.now() - startTime;
      }

      console.log('Webhook request successful:', {
        attempt: attempt + 1,
        responseTime: Date.now() - startTime,
        statusCode: response.status
      });

      return parsedResponse;
      
    } catch (error) {
      console.error(`Webhook request attempt ${attempt + 1} failed:`, error);
      
      lastError = error instanceof Error 
        ? categorizeError(error)
        : createWebhookError(WebhookErrorType.UNKNOWN_ERROR, 'Unknown error occurred');

      // Don't retry if error is not retryable or it's the last attempt
      if (!lastError.retryable || attempt === config.retryConfig.maxAttempts - 1) {
        break;
      }

      // Wait before retry
      const delay = calculateRetryDelay(attempt, config.retryConfig);
      console.log(`Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  // All attempts failed
  throw lastError!;
};

/**
 * Initialize the AI guide in n8n with user data
 */
export const initializeGuide = async (userData: any): Promise<ParsedAIResponse> => {
  const payload: WebhookRequest = {
    message: 'INITIALIZE_GUIDE',
    user: {
      id: userData.id,
      email: userData.email
    },
    metadata: {
      timestamp: new Date().toISOString(),
      sessionId,
      clientVersion: '1.0.0'
    }
  };

  return makeRequestWithRetry(DEFAULT_CONFIG.onboardingUrl, payload);
};

/**
 * Send a message to the AI in n8n
 */
export const sendMessage = async (message: string, user: User): Promise<ParsedAIResponse> => {
  if (!message?.trim()) {
    throw createWebhookError(
      WebhookErrorType.INVALID_RESPONSE,
      'Message cannot be empty'
    );
  }

  if (!user?.id) {
    throw createWebhookError(
      WebhookErrorType.INVALID_RESPONSE,
      'User ID is required'
    );
  }

  const payload: WebhookRequest = {
    message: message.trim(),
    user: {
      id: user.id,
      email: user.email
    },
    metadata: {
      timestamp: new Date().toISOString(),
      sessionId,
      clientVersion: '1.0.0'
    }
  };

  return makeRequestWithRetry(DEFAULT_CONFIG.chatUrl, payload);
};

/**
 * Test webhook connectivity
 */
export const testWebhookConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(DEFAULT_CONFIG.chatUrl, {
      method: 'HEAD',
      headers: DEFAULT_CONFIG.corsHeaders
    });
    return response.ok;
  } catch {
    return false;
  }
};
```

## 3. Updated JarvisPage Component (src/pages/JarvisPage.tsx)

```typescript
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/contexts/ProfileContext";
import { sendMessage, generateSessionId } from "@/services/n8nWebhook";
import { WebhookError, WebhookErrorType } from "@/types/webhook";
import { Send, LogOut, Loader2, AlertCircle, RefreshCw } from "lucide-react";

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  error?: boolean;
}

export default function JarvisPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('connected');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useProfile();

  // Generate unique session ID on component mount
  useState(() => {
    generateSessionId();
  });

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
      navigate("/login");
    }
  };

  const createMessage = (sender: 'user' | 'ai', text: string, error: boolean = false): Message => ({
    id: crypto.randomUUID(),
    sender,
    text,
    timestamp: new Date(),
    error
  });

  const getErrorMessage = (error: WebhookError): string => {
    switch (error.type) {
      case WebhookErrorType.NETWORK_ERROR:
        return "Erro de conexão. Verifique sua internet e tente novamente.";
      case WebhookErrorType.TIMEOUT_ERROR:
        return "A resposta está demorando muito. Tente novamente.";
      case WebhookErrorType.RATE_LIMIT:
        return "Muitas mensagens enviadas. Aguarde um momento antes de tentar novamente.";
      case WebhookErrorType.WEBHOOK_UNAVAILABLE:
        return "O serviço está temporariamente indisponível. Tente novamente em alguns minutos.";
      case WebhookErrorType.PARSING_ERROR:
        return "Erro ao processar a resposta. Nossa equipe foi notificada.";
      case WebhookErrorType.CORS_ERROR:
        return "Erro de configuração. Verifique se o webhook está acessível.";
      default:
        return "Ocorreu um erro inesperado. Tente novamente.";
    }
  };

  const getToastMessage = (error: WebhookError): { title: string; description: string } => {
    const isRetryable = error.retryable;
    return {
      title: isRetryable ? "Erro temporário" : "Erro de comunicação",
      description: `${getErrorMessage(error)}${isRetryable ? " (Tentativa automática em andamento)" : ""}`
    };
  };

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || isLoading) return;

    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para enviar mensagens.",
        variant: "destructive",
      });
      return;
    }

    const userMessage = createMessage('user', inputText.trim());
    
    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);
    setConnectionStatus('checking');

    try {
      console.log('Sending message to webhook:', {
        message: userMessage.text,
        userId: user.id,
        timestamp: userMessage.timestamp
      });

      const response = await sendMessage(userMessage.text, user);
      
      if (!response.success || !response.reply?.trim()) {
        throw new Error("Invalid response format from webhook");
      }

      const aiMessage = createMessage('ai', response.reply);
      setMessages(prev => [...prev, aiMessage]);
      setConnectionStatus('connected');

      console.log('Message sent successfully:', {
        responseTime: response.metadata?.responseTime,
        statusCode: response.metadata?.statusCode
      });

    } catch (error) {
      console.error('Error sending message:', error);
      setConnectionStatus('disconnected');

      let errorMessage: Message;
      let toastConfig: { title: string; description: string; variant?: "destructive" };

      if (error && typeof error === 'object' && 'type' in error) {
        // Handle WebhookError
        const webhookError = error as WebhookError;
        const userFriendlyMessage = getErrorMessage(webhookError);
        const toastData = getToastMessage(webhookError);
        
        errorMessage = createMessage('ai', userFriendlyMessage, true);
        toastConfig = {
          ...toastData,
          variant: "destructive"
        };

        // Log detailed error for debugging
        console.error('Webhook error details:', {
          type: webhookError.type,
          message: webhookError.message,
          retryable: webhookError.retryable,
          statusCode: webhookError.statusCode,
          timestamp: webhookError.timestamp
        });
      } else {
        // Handle generic errors
        errorMessage = createMessage(
          'ai', 
          "Desculpe, houve um problema na comunicação. Tente novamente mais tarde.", 
          true
        );
        toastConfig = {
          title: "Erro inesperado",
          description: "Não foi possível enviar sua mensagem. Tente novamente.",
          variant: "destructive"
        };
      }

      setMessages(prev => [...prev, errorMessage]);
      toast(toastConfig);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, user, toast]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRetry = () => {
    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find(m => m.sender === 'user');
      if (lastUserMessage) {
        setInputText(lastUserMessage.text);
        // Remove error messages from the end
        setMessages(prev => prev.filter(m => !m.error));
      }
    }
  };

  if (!user) {
    return null; // Will redirect to login via ProtectedRoute
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-foreground">EU MAIOR</h1>
          {connectionStatus === 'disconnected' && (
            <div className="flex items-center text-destructive">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span className="text-sm">Desconectado</span>
            </div>
          )}
          {connectionStatus === 'checking' && (
            <div className="flex items-center text-muted-foreground">
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              <span className="text-sm">Conectando...</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {connectionStatus === 'disconnected' && (
            <Button onClick={handleRetry} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          )}
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-lg mb-2">
              Olá, {profile?.full_name || user.email?.split('@')[0]}!
            </p>
            <p>Como posso ajudá-lo hoje?</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : message.error
                    ? 'bg-destructive/10 text-destructive border border-destructive/20'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {message.error && (
                  <div className="flex items-center mb-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    <span className="text-xs font-medium">Erro</span>
                  </div>
                )}
                <p className="text-sm">{message.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted text-muted-foreground px-4 py-2 rounded-lg flex items-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span className="text-sm">Pensando...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-card">
        <div className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            disabled={isLoading}
            className="flex-1"
            maxLength={2000}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!inputText.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {inputText.length > 1800 && (
          <p className="text-xs text-muted-foreground mt-1">
            {2000 - inputText.length} caracteres restantes
          </p>
        )}
      </div>
    </div>
  );
}
```

## 4. Implementation Steps

### Phase 1: Critical Fixes
1. Create `src/types/webhook.ts` with all TypeScript interfaces
2. Rename `src/services/n8nWebhook.js` to `src/services/n8nWebhook.ts` and replace with enhanced implementation
3. Replace `src/pages/JarvisPage.tsx` with the corrected version

### Phase 2: Testing & Validation
1. Test webhook response parsing with the actual N8N endpoint
2. Verify error handling for different failure scenarios
3. Test retry logic and exponential backoff
4. Validate TypeScript compilation and type safety

### Phase 3: Production Readiness
1. Add comprehensive logging for production debugging
2. Implement performance monitoring
3. Add user feedback mechanisms for different error states
4. Create fallback UI components for extended outages

## 5. Key Improvements

### Response Parsing Fix
- **Before**: Expected `{reply: "text"}` format
- **After**: Correctly parses N8N's nested response structure: `[{response: {body: [{output: "text"}]}}]`

### Error Handling Enhancement
- **Before**: Generic error messages
- **After**: Specific error types with user-friendly messages and retry logic

### Network Resilience
- **Before**: Single request with basic timeout
- **After**: Retry logic with exponential backoff, CORS headers, ngrok configuration

### User Experience
- **Before**: Loading state only
- **After**: Connection status, detailed error messages, retry buttons, character limits

### Developer Experience
- **Before**: JavaScript with loose typing
- **After**: Full TypeScript with comprehensive interfaces and type safety