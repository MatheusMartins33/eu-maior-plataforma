import { Injectable, Logger } from '@nestjs/common';
import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import { LlmService } from '@/core/llm/llm.service';
import { PrismaService } from '@/core/prisma/prisma.service';
import {
    ProfileProcessingState,
    MinerOutput,
    JudgeOutput,
    PsychologistOutput,
    ShadowOutput,
    HigherSelfProfile,
} from '@/core/llm/agent.types';
import {
    MINER_AGENT_PROMPT,
    JUDGE_AGENT_PROMPT,
    PSYCHOLOGIST_AGENT_PROMPT,
    SHADOW_ANALYST_PROMPT,
    SYNTHESIZER_AGENT_PROMPT,
} from '@/core/llm/agent.prompts';

// LangGraph State Annotation
const StateAnnotation = Annotation.Root({
    profileId: Annotation<string>,
    userId: Annotation<string>,
    cosmicData: Annotation<Record<string, unknown> | null>,
    psychometricData: Annotation<Record<string, unknown> | null>,
    narrativeData: Annotation<{
        decisiveMoment: string | null;
        frustration: string | null;
        dream: string | null;
    }>,
    minerOutput: Annotation<MinerOutput | null>,
    judgeOutput: Annotation<JudgeOutput | null>,
    psychologistOutput: Annotation<PsychologistOutput | null>,
    shadowOutput: Annotation<ShadowOutput | null>,
    higherSelfProfile: Annotation<HigherSelfProfile | null>,
    currentNode: Annotation<string>,
    retryCount: Annotation<number>,
    error: Annotation<string | null>,
});

type GraphState = typeof StateAnnotation.State;

@Injectable()
export class ProfilePipelineService {
    private readonly logger = new Logger(ProfilePipelineService.name);
    private graph: ReturnType<typeof StateGraph.prototype.compile> | null = null;

    constructor(
        private readonly llm: LlmService,
        private readonly prisma: PrismaService,
    ) {
        this.buildGraph();
    }

    /**
     * Build the LangGraph pipeline
     */
    private buildGraph() {
        const workflow = new StateGraph(StateAnnotation)
            .addNode('miner', this.minerNode.bind(this))
            .addNode('judge', this.judgeNode.bind(this))
            .addNode('psychologist', this.psychologistNode.bind(this))
            .addNode('shadowAnalyst', this.shadowAnalystNode.bind(this))
            .addNode('synthesizer', this.synthesizerNode.bind(this))
            .addEdge(START, 'miner')
            .addConditionalEdges('judge', this.routeAfterJudge.bind(this))
            .addEdge('miner', 'judge')
            .addEdge('psychologist', 'shadowAnalyst')
            .addEdge('shadowAnalyst', 'synthesizer')
            .addEdge('synthesizer', END);

        this.graph = workflow.compile();
    }

    /**
     * Route after Judge: retry mining or continue to psychologist
     */
    private routeAfterJudge(state: GraphState): string {
        if (state.judgeOutput?.requiresReprocessing && state.retryCount < 2) {
            return 'miner'; // Retry with feedback
        }
        return 'psychologist';
    }

    /**
     * Execute the full pipeline for a profile
     */
    async processProfile(profileId: string): Promise<HigherSelfProfile> {
        const profile = await this.prisma.profile.findUnique({
            where: { id: profileId },
        });

        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }

        const initialState: GraphState = {
            profileId: profile.id,
            userId: profile.userId,
            cosmicData: profile.astroMapRaw as Record<string, unknown> | null,
            psychometricData: profile.psychometricAnswers as Record<string, unknown> | null,
            narrativeData: {
                decisiveMoment: profile.narrativeDecisiveMoment,
                frustration: profile.narrativeFrustration,
                dream: profile.narrativeDream,
            },
            minerOutput: null,
            judgeOutput: null,
            psychologistOutput: null,
            shadowOutput: null,
            higherSelfProfile: null,
            currentNode: 'miner',
            retryCount: 0,
            error: null,
        };

        this.logger.log(`Starting pipeline for profile: ${profileId}`);

        const result = await this.graph!.invoke(initialState);

        if (result.higherSelfProfile) {
            // Save to database
            await this.prisma.profile.update({
                where: { id: profileId },
                data: {
                    higherSelfProfile: result.higherSelfProfile as object,
                    processingStatus: 'READY',
                },
            });
        }

        return result.higherSelfProfile!;
    }

    // ============================================
    // AGENT NODES
    // ============================================

    /**
     * MINER NODE - Kai (The Explorer)
     * Extracts MIUs from raw data
     */
    private async minerNode(state: GraphState): Promise<Partial<GraphState>> {
        this.logger.log('🔭 Miner (Kai) starting extraction...');

        const userData = this.formatInputData(state);

        const minerOutput = await this.llm.completeJson<MinerOutput>(
            MINER_AGENT_PROMPT,
            `Analise os seguintes dados do usuário e extraia MIUs:\n\n${userData}`,
            { temperature: 0.7 }
        );

        this.logger.log(`Miner extracted ${minerOutput.totalExtracted} MIUs`);

        return {
            minerOutput,
            currentNode: 'judge',
        };
    }

    /**
     * JUDGE NODE - Theron (The Guardian)
     * Validates MIU coherence
     */
    private async judgeNode(state: GraphState): Promise<Partial<GraphState>> {
        this.logger.log('⚖️ Judge (Theron) validating MIUs...');

        const judgeOutput = await this.llm.completeJson<JudgeOutput>(
            JUDGE_AGENT_PROMPT,
            `Valide as seguintes MIUs:\n\n${JSON.stringify(state.minerOutput, null, 2)}`,
            { temperature: 0.3 }
        );

        this.logger.log(`Judge approved ${judgeOutput.approvedMius.length} MIUs (${(judgeOutput.validationRate * 100).toFixed(1)}%)`);

        return {
            judgeOutput,
            currentNode: judgeOutput.requiresReprocessing ? 'miner' : 'psychologist',
            retryCount: judgeOutput.requiresReprocessing ? state.retryCount + 1 : state.retryCount,
        };
    }

    /**
     * PSYCHOLOGIST NODE - Dr. Elara (The Analyst)
     * Identifies psychological drivers
     */
    private async psychologistNode(state: GraphState): Promise<Partial<GraphState>> {
        this.logger.log('🧠 Psychologist (Dr. Elara) analyzing drivers...');

        const approvedMius = state.judgeOutput?.approvedMius || [];

        const psychologistOutput = await this.llm.completeJson<PsychologistOutput>(
            PSYCHOLOGIST_AGENT_PROMPT,
            `Identifique os drivers psicológicos a partir das MIUs validadas:\n\n${JSON.stringify(approvedMius, null, 2)}`,
            { temperature: 0.6 }
        );

        this.logger.log('Psychologist identified core drivers');

        return {
            psychologistOutput,
            currentNode: 'shadowAnalyst',
        };
    }

    /**
     * SHADOW ANALYST NODE - Nyx (The Dark Mirror)
     * Identifies Shadow Self
     */
    private async shadowAnalystNode(state: GraphState): Promise<Partial<GraphState>> {
        this.logger.log('🌑 Shadow Analyst (Nyx) exploring the shadow...');

        const shadowOutput = await this.llm.completeJson<ShadowOutput>(
            SHADOW_ANALYST_PROMPT,
            `Analise a sombra baseada nos drivers identificados:\n\n${JSON.stringify(state.psychologistOutput, null, 2)}\n\nMIUs aprovadas:\n${JSON.stringify(state.judgeOutput?.approvedMius, null, 2)}`,
            { temperature: 0.8 }
        );

        this.logger.log('Shadow Analyst revealed the shadow self');

        return {
            shadowOutput,
            currentNode: 'synthesizer',
        };
    }

    /**
     * SYNTHESIZER NODE - Orion (The Alchemist)
     * Creates the final Higher Self Profile
     */
    private async synthesizerNode(state: GraphState): Promise<Partial<GraphState>> {
        this.logger.log('✨ Synthesizer (Orion) creating Higher Self Profile...');

        const allData = {
            cosmicData: state.cosmicData,
            approvedMius: state.judgeOutput?.approvedMius,
            psychologistOutput: state.psychologistOutput,
            shadowOutput: state.shadowOutput,
        };

        const higherSelfProfile = await this.llm.completeJson<HigherSelfProfile>(
            SYNTHESIZER_AGENT_PROMPT,
            `Sintetize o Higher Self Profile completo:\n\n${JSON.stringify(allData, null, 2)}`,
            { temperature: 0.7 }
        );

        this.logger.log('✅ Higher Self Profile created!');

        return {
            higherSelfProfile,
            currentNode: 'complete',
        };
    }

    // ============================================
    // HELPERS
    // ============================================

    private formatInputData(state: GraphState): string {
        const parts: string[] = [];

        if (state.cosmicData) {
            parts.push(`## Dados Cósmicos (Astrologia)\n${JSON.stringify(state.cosmicData, null, 2)}`);
        }

        if (state.psychometricData) {
            parts.push(`## Dados Psicométricos (Big Five)\n${JSON.stringify(state.psychometricData, null, 2)}`);
        }

        if (state.narrativeData.decisiveMoment || state.narrativeData.frustration || state.narrativeData.dream) {
            parts.push(`## Narrativas Pessoais`);
            if (state.narrativeData.decisiveMoment) {
                parts.push(`### Momento Decisivo\n${state.narrativeData.decisiveMoment}`);
            }
            if (state.narrativeData.frustration) {
                parts.push(`### Frustração Profunda\n${state.narrativeData.frustration}`);
            }
            if (state.narrativeData.dream) {
                parts.push(`### Sonho/Aspiração\n${state.narrativeData.dream}`);
            }
        }

        return parts.join('\n\n');
    }
}
