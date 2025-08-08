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
 * ✅ NOVA: Parse flexível que funciona para ambos chat e onboarding
 */
const parseFlexibleN8NResponse = (rawResponse: any): ParsedAIResponse => {
  try {
    console.log('📥 [parseFlexibleN8NResponse] Raw response:', JSON.stringify(rawResponse, null, 2));

    // Tentar extrair resposta de vários formatos possíveis
    let reply: string | null = null;
    let statusCode = 200;

    // Formato 1: Array com response.body[0].output (formato antigo esperado)
    if (Array.isArray(rawResponse) && rawResponse.length > 0) {
      const firstItem = rawResponse[0];
      
      if (firstItem?.response?.body && Array.isArray(firstItem.response.body)) {
        const firstBodyItem = firstItem.response.body[0];
        statusCode = firstItem.response.statusCode || 200;
        
        if (firstBodyItem?.output && typeof firstBodyItem.output === 'string') {
          reply = firstBodyItem.output;
        }
        // Formato 2: Qualquer string no primeiro item do body
        else if (typeof firstBodyItem === 'string') {
          reply = firstBodyItem;
        }
        // Formato 3: message field
        else if (firstBodyItem?.message && typeof firstBodyItem.message === 'string') {
          reply = firstBodyItem.message;
        }
        // Formato 4: reply field
        else if (firstBodyItem?.reply && typeof firstBodyItem.reply === 'string') {
          reply = firstBodyItem.reply;
        }
        // Formato 5: text field
        else if (firstBodyItem?.text && typeof firstBodyItem.text === 'string') {
          reply = firstBodyItem.text;
        }
        // Formato 6: response field
        else if (firstBodyItem?.response && typeof firstBodyItem.response === 'string') {
          reply = firstBodyItem.response;
        }
      }
      
      // Formato 7: String direto no primeiro item do array
      if (!reply && typeof firstItem === 'string') {
        reply = firstItem;
      }
      
      // Formato 8: message direto no primeiro item
      if (!reply && firstItem?.message && typeof firstItem.message === 'string') {
        reply = firstItem.message;
      }
      
      // Formato 9: output direto no primeiro item
      if (!reply && firstItem?.output && typeof firstItem.output === 'string') {
        reply = firstItem.output;
      }
    }

    // Formato 10: Objeto com response.body[0].output (fallback antigo)
    if (!reply && rawResponse?.response?.body?.[0]?.output) {
      reply = rawResponse.response.body[0].output;
      statusCode = rawResponse.response.statusCode || 200;
    }

    // Formato 11: String direta na resposta
    if (!reply && typeof rawResponse === 'string') {
      reply = rawResponse;
    }

    // Formato 12: message direto no objeto raiz
    if (!reply && rawResponse?.message && typeof rawResponse.message === 'string') {
      reply = rawResponse.message;
    }

    // Formato 13: output direto no objeto raiz
    if (!reply && rawResponse?.output && typeof rawResponse.output === 'string') {
      reply = rawResponse.output;
    }

    // Formato 14: reply direto no objeto raiz
    if (!reply && rawResponse?.reply && typeof rawResponse.reply === 'string') {
      reply = rawResponse.reply;
    }

    // Formato 15: text direto no objeto raiz
    if (!reply && rawResponse?.text && typeof rawResponse.text === 'string') {
      reply = rawResponse.text;
    }

    // Se encontrou uma resposta válida
    if (reply && reply.trim()) {
      return {
        reply: reply.trim(),
        success: true,
        metadata: {
          statusCode,
          timestamp: new Date().toISOString()
        }
      };
    }

    // Se não encontrou nenhum formato válido
    console.warn('[parseFlexibleN8NResponse] No valid response format found, rawResponse:', rawResponse);
    
    // Retornar sucesso genérico se pelo menos recebeu algo
    if (rawResponse) {
      return {
        reply: 'Resposta recebida com sucesso.',
        success: true,
        metadata: {
          statusCode: 200,
          timestamp: new Date().toISOString()
        }
      };
    }

    // Se não recebeu nada, é erro
    throw new Error('Empty or invalid response from webhook');
    
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
 * Parse response simples para onboarding (sem expectativa de output)
 */
const parseOnboardingResponse = (rawResponse: any): ParsedAIResponse => {
  try {
    console.log('📥 [parseOnboardingResponse] Raw response:', JSON.stringify(rawResponse, null, 2));

    // Para onboarding, sucesso é simplesmente receber qualquer resposta válida
    return {
      reply: 'Onboarding initialized successfully',
      success: true,
      metadata: {
        statusCode: 200,
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('Failed to parse onboarding response:', error);
    throw createWebhookError(
      WebhookErrorType.PARSING_ERROR,
      `Failed to parse onboarding response: ${error instanceof Error ? error.message : 'Unknown parsing error'}`,
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
 * ✅ ATUALIZADA: Make HTTP request with retry logic usando parser flexível
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
      
      console.log(`🔄 Webhook request attempt ${attempt + 1}/${config.retryConfig.maxAttempts}:`, {
        url,
        payload: {
          message: payload.message?.substring(0, 100) + '...',
          userId: payload.user?.id,
          sessionId: payload.metadata?.sessionId
        }
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: config.corsHeaders,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      console.log(`📡 Chat response received:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        throw createWebhookError(
          WebhookErrorType.WEBHOOK_UNAVAILABLE,
          `HTTP ${response.status}: ${response.statusText}`,
          undefined,
          response.status
        );
      }

      const rawData = await response.json();
      
      // ✅ MUDANÇA: Usar parser flexível em vez do rígido
      const parsedResponse = parseFlexibleN8NResponse(rawData);
      
      // Add response time to metadata
      if (parsedResponse.metadata) {
        parsedResponse.metadata.responseTime = Date.now() - startTime;
      }

      console.log('✅ Webhook request successful:', {
        attempt: attempt + 1,
        responseTime: Date.now() - startTime,
        statusCode: response.status,
        replyLength: parsedResponse.reply?.length || 0
      });

      return parsedResponse;
      
    } catch (error) {
      console.error(`❌ Webhook request attempt ${attempt + 1} failed:`, error);
      
      lastError = error instanceof Error 
        ? categorizeError(error)
        : createWebhookError(WebhookErrorType.UNKNOWN_ERROR, 'Unknown error occurred');

      // Don't retry if error is not retryable or it's the last attempt
      if (!lastError.retryable || attempt === config.retryConfig.maxAttempts - 1) {
        break;
      }

      // Wait before retry
      const delay = calculateRetryDelay(attempt, config.retryConfig);
      console.log(`⏳ Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  // All attempts failed
  throw lastError!;
};

/**
 * Make direct request with retry logic (para payload livre)
 */
const makeDirectRequestWithRetry = async (
  url: string,
  payload: any,
  config: WebhookConfig = DEFAULT_CONFIG
): Promise<ParsedAIResponse> => {
  let lastError: WebhookError;
  
  for (let attempt = 0; attempt < config.retryConfig.maxAttempts; attempt++) {
    try {
      const startTime = Date.now();
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);
      
      console.log(`🔄 Direct webhook request attempt ${attempt + 1}/${config.retryConfig.maxAttempts}:`, {
        url,
        payloadPreview: {
          user_id: payload.user_id,
          email: payload.email,
          full_name: payload.full_name,
          hasData: !!payload.data_nascimento
        }
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: config.corsHeaders,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      console.log(`📡 Onboarding response received:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        throw createWebhookError(
          WebhookErrorType.WEBHOOK_UNAVAILABLE,
          `HTTP ${response.status}: ${response.statusText}`,
          undefined,
          response.status
        );
      }

      const rawData = await response.json();
      const parsedResponse = parseOnboardingResponse(rawData);
      
      // Add response time to metadata
      if (parsedResponse.metadata) {
        parsedResponse.metadata.responseTime = Date.now() - startTime;
      }

      console.log('✅ Direct webhook request successful:', {
        attempt: attempt + 1,
        responseTime: Date.now() - startTime,
        statusCode: response.status
      });

      return parsedResponse;
      
    } catch (error) {
      console.error(`❌ Direct webhook request attempt ${attempt + 1} failed:`, error);
      
      lastError = error instanceof Error 
        ? categorizeError(error)
        : createWebhookError(WebhookErrorType.UNKNOWN_ERROR, 'Unknown error occurred');

      // Don't retry if error is not retryable or it's the last attempt
      if (!lastError.retryable || attempt === config.retryConfig.maxAttempts - 1) {
        break;
      }

      // Wait before retry
      const delay = calculateRetryDelay(attempt, config.retryConfig);
      console.log(`⏳ Retrying in ${delay}ms...`);
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
  console.log('🚀 [initializeGuide] Starting with userData:', userData);

  // Validar dados obrigatórios
  if (!userData.user_id || !userData.email) {
    throw createWebhookError(
      WebhookErrorType.INVALID_RESPONSE,
      'user_id and email are required for initialization'
    );
  }

  // Usar função específica para request direto
  return makeDirectRequestWithRetry(DEFAULT_CONFIG.onboardingUrl, userData);
};

/**
 * ✅ CORRIGIDA: Send a message to the AI in n8n
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

  // ✅ Agora usa makeRequestWithRetry com parser flexível
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
