// ============================================
// EU MAIOR - Agent Types
// Each agent has its own personality and analysis style
// ============================================

// Miner Agent Output (Kai - The Explorer)
export interface MiuFragment {
    id: string;
    source: 'COSMIC' | 'PSYCHOMETRIC' | 'NARRATIVE';
    rawData: string;
    interpretation: string;
    confidence: number;
}

export interface MinerOutput {
    mius: MiuFragment[];
    totalExtracted: number;
}

// Judge Agent Output (Theron - The Guardian)
export interface JudgeOutput {
    approvedMius: MiuFragment[];
    rejectedMius: Array<{
        id: string;
        reason: string;
    }>;
    requiresReprocessing: boolean;
    validationRate: number;
}

// Psychologist Agent Output (Dr. Elara - The Analyst)
export interface PsychologistOutput {
    drivers: {
        coreMotivations: string[];
        coreFears: string[];
        communicationStyle: string;
        decisionMakingPattern: string;
        relationshipPattern: string;
    };
    bigFiveMapping: {
        openness: number;
        conscientiousness: number;
        extraversion: number;
        agreeableness: number;
        neuroticism: number;
    };
}

// Shadow Analyst Output (Nyx - The Dark Mirror)
export interface ShadowOutput {
    shadowSelf: {
        repressedTalents: string[];
        hiddenFears: string[];
        projections: string[];
        integrationPath: string;
    };
    archetypes: {
        primary: string;
        secondary: string;
        shadow: string;
    };
}

// Synthesizer Output (Orion - The Alchemist)
export interface HigherSelfProfile {
    essenceSummary: string;
    personalityVector: number[];
    cosmicBlueprint: {
        sunSign: string;
        moonSign: string;
        ascendant: string;
        dominantPlanets: string[];
        keyAspects: string[];
    };
    archetypeMatrix: {
        conscious: { primary: string; secondary: string };
        shadow: { primary: string; repressed: string };
    };
    psychologicalDrivers: {
        coreMotivations: string[];
        coreFears: string[];
        communicationStyle: string;
        decisionMakingPattern: string;
        relationshipPattern: string;
    };
    shadowIntegration: {
        repressedTalents: string[];
        integrationPath: string;
    };
    aiPersonaGuidelines: {
        toneOfVoice: string;
        communicationRules: string[];
        examplePhrases: string[];
    };
}

// LangGraph State
export interface ProfileProcessingState {
    profileId: string;
    userId: string;

    // Input Data
    cosmicData: Record<string, unknown> | null;
    psychometricData: Record<string, unknown> | null;
    narrativeData: {
        decisiveMoment: string | null;
        frustration: string | null;
        dream: string | null;
    };

    // Pipeline Outputs
    minerOutput: MinerOutput | null;
    judgeOutput: JudgeOutput | null;
    psychologistOutput: PsychologistOutput | null;
    shadowOutput: ShadowOutput | null;

    // Final Output
    higherSelfProfile: HigherSelfProfile | null;

    // Control Flow
    currentNode: string;
    retryCount: number;
    error: string | null;
}
