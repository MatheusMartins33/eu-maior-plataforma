/**
 * EU MAIOR - API Service
 * Central service for backend communication
 * Replaces deprecated n8nWebhook.ts
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

interface ApiResponse<T> {
    data?: T;
    error?: string;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            ...options,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { error: errorData.message || `Error: ${response.status}` };
        }

        const data = await response.json();
        return { data };
    } catch (error) {
        console.error('API request failed:', error);
        return { error: error instanceof Error ? error.message : 'Network error' };
    }
}

// ============================================================================
// ONBOARDING API
// ============================================================================

export interface OnboardingStartPayload {
    userId: string;
    fullName: string;
}

export interface CosmicDataPayload {
    birthDate: string;      // ISO date
    birthTime: string;      // HH:mm
    birthCity: string;
    birthState: string;
    birthCountry: string;
    birthTimezone: string;
}

export interface PsychometricPayload {
    mbtiType?: string;
    enneagramType?: string;
    discType?: string;
    bigFive?: {
        openness: number;
        conscientiousness: number;
        extraversion: number;
        agreeableness: number;
        neuroticism: number;
    };
}

export interface NarrativePayload {
    lifeStory: string;
    coreValues: string[];
    challenges: string;
    aspirations: string;
}

export interface ProfileResponse {
    id: string;
    status: string;
    fullName?: string;
    higherSelfProfile?: unknown;
}

export const onboardingApi = {
    start: (payload: OnboardingStartPayload) =>
        request<ProfileResponse>('/onboarding/start', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    submitCosmic: (profileId: string, payload: CosmicDataPayload) =>
        request<ProfileResponse>(`/onboarding/${profileId}/cosmic`, {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    submitPsychometric: (profileId: string, payload: PsychometricPayload) =>
        request<ProfileResponse>(`/onboarding/${profileId}/psychometric`, {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    submitNarrative: (profileId: string, payload: NarrativePayload) =>
        request<ProfileResponse>(`/onboarding/${profileId}/narrative`, {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    triggerProcessing: (profileId: string) =>
        request<ProfileResponse>(`/onboarding/${profileId}/process`, {
            method: 'POST',
        }),

    getStatus: (profileId: string) =>
        request<ProfileResponse>(`/onboarding/${profileId}/status`),
};

// ============================================================================
// CHAT API
// ============================================================================

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatResponse {
    message: string;
    sessionId?: string;
}

export const chatApi = {
    createSession: (profileId: string) =>
        request<{ sessionId: string }>(`/chat/${profileId}/session`, {
            method: 'POST',
        }),

    sendMessage: (profileId: string, sessionId: string, message: string) =>
        request<ChatResponse>(`/chat/${profileId}/message`, {
            method: 'POST',
            body: JSON.stringify({ sessionId, message }),
        }),

    getHistory: (profileId: string, sessionId: string) =>
        request<ChatMessage[]>(`/chat/${profileId}/history/${sessionId}`),

    getHigherSelf: (profileId: string) =>
        request<unknown>(`/chat/${profileId}/higher-self`),
};

// ============================================================================
// IMAGE GENERATION API
// ============================================================================

export const imageApi = {
    generateHigherSelf: (prompt: string) =>
        request<{ url: string }>('/ai/gen/image', {
            method: 'POST',
            body: JSON.stringify({ prompt }),
        }),
};
