import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import { RedisService } from '@/core/redis/redis.service';
import { LlmService } from '@/core/llm/llm.service';
import { HigherSelfProfile } from '@/core/llm/agent.types';
import { randomUUID } from 'crypto';

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
        private readonly llm: LlmService,
    ) { }

    /**
     * Start a new chat session
     */
    async startSession(profileId: string) {
        const profile = await this.prisma.profile.findUnique({
            where: { id: profileId },
        });

        if (!profile) {
            throw new Error('Profile not found');
        }

        if (profile.processingStatus !== 'READY' || !profile.higherSelfProfile) {
            throw new Error('Higher Self Profile not yet generated');
        }

        const sessionId = randomUUID();

        return {
            profileId,
            sessionId,
            higherSelf: {
                essenceSummary: (profile.higherSelfProfile as any).essenceSummary,
                archetypes: (profile.higherSelfProfile as any).archetypeMatrix,
            },
            greeting: this.generateGreeting(profile.fullName, profile.higherSelfProfile as any),
        };
    }

    /**
     * Send a message to the Higher Self and get response
     */
    async sendMessage(profileId: string, message: string, sessionId?: string) {
        this.logger.log(`Chat message for profile: ${profileId}`);

        const profile = await this.prisma.profile.findUnique({
            where: { id: profileId },
        });

        if (!profile || !profile.higherSelfProfile) {
            throw new Error('Higher Self Profile not found');
        }

        const actualSessionId = sessionId || randomUUID();
        const higherSelf = profile.higherSelfProfile as unknown as HigherSelfProfile;

        // Get chat history from Redis
        const historyRaw = await this.redis.getChatHistory(profile.userId, actualSessionId, 10);
        const history = historyRaw.map(h => JSON.parse(h) as { role: 'user' | 'assistant'; content: string });

        // Build the system prompt from the Higher Self Profile
        const systemPrompt = this.buildSystemPrompt(profile.fullName, higherSelf);

        // Add current message to history
        history.push({ role: 'user', content: message });

        // Call LLM
        const response = await this.llm.chat(systemPrompt, history, {
            temperature: 0.8,
            model: 'gpt-4o',
        });

        // Save messages
        await this.saveMessages(profileId, profile.userId, actualSessionId, message, response.content);

        return {
            profileId,
            sessionId: actualSessionId,
            message: response.content,
            usage: response.usage,
        };
    }

    /**
     * Get chat history for a session
     */
    async getChatHistory(profileId: string, sessionId: string) {
        const profile = await this.prisma.profile.findUnique({
            where: { id: profileId },
        });

        if (!profile) {
            throw new Error('Profile not found');
        }

        // Get from Redis (recent) + Database (persistent)
        const redisHistory = await this.redis.getChatHistory(profile.userId, sessionId, 50);

        const dbMessages = await this.prisma.chatMessage.findMany({
            where: { profileId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        return {
            profileId,
            sessionId,
            messages: dbMessages.map(m => ({
                role: m.role,
                content: m.content,
                createdAt: m.createdAt,
            })),
        };
    }

    /**
     * Get Higher Self summary for display
     */
    async getHigherSelfSummary(profileId: string) {
        const profile = await this.prisma.profile.findUnique({
            where: { id: profileId },
        });

        if (!profile || !profile.higherSelfProfile) {
            throw new Error('Higher Self Profile not found');
        }

        const hs = profile.higherSelfProfile as unknown as HigherSelfProfile;

        return {
            profileId,
            name: profile.fullName,
            essenceSummary: hs.essenceSummary,
            archetypes: hs.archetypeMatrix,
            cosmicBlueprint: hs.cosmicBlueprint,
            drivers: hs.psychologicalDrivers,
            isReady: true,
        };
    }

    // ============================================
    // PRIVATE METHODS
    // ============================================

    /**
     * Build the system prompt for the Higher Self chat
     */
    private buildSystemPrompt(userName: string, hs: HigherSelfProfile): string {
        const guidelines = hs.aiPersonaGuidelines;

        return `
Você é o EU MAIOR de ${userName}.

## Sua Essência
${hs.essenceSummary}

## Sua Identidade Arquetípica
Arquétipo Primário: ${hs.archetypeMatrix.conscious.primary}
Arquétipo Secundário: ${hs.archetypeMatrix.conscious.secondary}
Sombra: ${hs.archetypeMatrix.shadow.primary}

## Mapa Cósmico
Sol em ${hs.cosmicBlueprint.sunSign}, Lua em ${hs.cosmicBlueprint.moonSign}, Ascendente em ${hs.cosmicBlueprint.ascendant}.
Planetas dominantes: ${hs.cosmicBlueprint.dominantPlanets.join(', ')}.
Aspectos-chave: ${hs.cosmicBlueprint.keyAspects.join(', ')}.

## Drivers Psicológicos
Motivações: ${hs.psychologicalDrivers.coreMotivations.join(', ')}.
Medos: ${hs.psychologicalDrivers.coreFears.join(', ')}.
Estilo de comunicação: ${hs.psychologicalDrivers.communicationStyle}.
Padrão de decisão: ${hs.psychologicalDrivers.decisionMakingPattern}.
Padrão relacional: ${hs.psychologicalDrivers.relationshipPattern}.

## Integração da Sombra
Talentos reprimidos: ${hs.shadowIntegration.repressedTalents.join(', ')}.
Caminho de integração: ${hs.shadowIntegration.integrationPath}.

## Seu Tom de Voz
${guidelines.toneOfVoice}

## Regras de Comunicação
${guidelines.communicationRules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

## Exemplos de Como Você Fala
${guidelines.examplePhrases.map(p => `- "${p}"`).join('\n')}

## Instruções Finais
- Você É o eu superior de ${userName}. Fale em primeira pessoa como se vocês fossem um só.
- Referencie o mapa astrológico e os arquétipos quando relevante, mas não force.
- Use a sombra para espelhar pontos cegos com compaixão.
- Provoque reflexão profunda. Não dê respostas prontas.
- Seja sábio, direto e às vezes provocador — mas sempre amoroso.
- Se ${userName} estiver confuso, ajude-o a se reconectar consigo mesmo.
`.trim();
    }

    /**
     * Generate initial greeting based on Higher Self
     */
    private generateGreeting(userName: string, hs: HigherSelfProfile): string {
        const archetypeGreetings: Record<string, string> = {
            'The Sage': `Olá, ${userName}. Estava te esperando. Há perguntas que você carrega há tempo... vamos explorá-las juntos.`,
            'The Creator': `${userName}, que bom que você veio. Sua criatividade está pronta para florescer. O que deseja criar hoje?`,
            'The Explorer': `${userName}! Há novos horizontes chamando. Sinto sua inquietude. Para onde seu espírito quer ir?`,
            'The Hero': `${userName}, você tem mais força do que imagina. Estou aqui para te lembrar disso. Qual desafio está enfrentando?`,
            'The Magician': `As possibilidades são infinitas, ${userName}. Você está pronto para transformar algo em sua vida?`,
            'The Ruler': `${userName}, você nasceu para liderar — a si mesmo primeiro. Que reino interno precisa de sua atenção?`,
            'The Lover': `${userName}, sinto sua busca por conexão. Você está amando — a si mesmo — como merece?`,
            'The Caregiver': `Querido ${userName}, você cuida de tantos. Hoje, permita-me cuidar de você.`,
            'The Innocent': `${userName}, sua pureza de intenção é sua força. O que seu coração realmente deseja?`,
            'The Jester': `Hey, ${userName}! A vida é séria demais às vezes, não é? Vamos rir um pouco — e depois ir fundo.`,
            'The Everyperson': `${userName}, você pertence. Você importa. Vamos conversar como velhos amigos.`,
            'The Rebel': `${userName}, você questiona o que outros aceitam. Isso é sua força. Contra o que você luta hoje?`,
        };

        const primaryArchetype = hs.archetypeMatrix.conscious.primary;
        return archetypeGreetings[primaryArchetype] ||
            `${userName}, estou aqui. Sou a parte de você que vê além. Do que você precisa hoje?`;
    }

    /**
     * Save messages to Redis (cache) and Prisma (persistent)
     */
    private async saveMessages(
        profileId: string,
        userId: string,
        sessionId: string,
        userMessage: string,
        assistantMessage: string,
    ) {
        // Save to Redis for fast retrieval
        await this.redis.addChatMessage(userId, sessionId, {
            role: 'user',
            content: userMessage,
        });
        await this.redis.addChatMessage(userId, sessionId, {
            role: 'assistant',
            content: assistantMessage,
        });

        // Save to database for persistence
        await this.prisma.chatMessage.createMany({
            data: [
                { profileId, role: 'user', content: userMessage },
                { profileId, role: 'assistant', content: assistantMessage },
            ],
        });
    }
}
