import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NeonCard, NeonCardHeader, NeonCardContent } from "@/components/dashboard/NeonCard";
import { TechBadge } from "@/components/dashboard/TechBadge";
import { ApexGauge } from "@/components/dashboard/ApexGauge";
import { NeuralProgress } from "@/components/dashboard/NeuralProgress";
import { BigFiveRadar } from "@/components/dashboard/BigFiveRadar";
import { useProfile } from "@/contexts/ProfileContext";
import { Brain, Sparkles, Heart, Eye, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { imageApi } from "@/services/api.service";

/* -------------------------------------------------------------------------- */
/* MOCK DATA (Replace with actual profile data)                              */
/* -------------------------------------------------------------------------- */
const mockProfile = {
    name: "Usuário EU MAIOR",
    role: "Buscador Espiritual",
    id: "EM001",
    avatarUrl: "",
    neuralData: { current: 142, max: 800 },
    apexScore: 7.0,
    quote: "O Virtuoso Pragmático com profundidade emocional de O Investigador",
    archetypes: {
        mbti: "INFJ",
        enneagram: "5w4",
        disc: "SC",
    },
    bigFive: [
        { trait: "Abertura", value: 85, fullMark: 100 },
        { trait: "Conscienciosidade", value: 70, fullMark: 100 },
        { trait: "Extroversão", value: 35, fullMark: 100 },
        { trait: "Amabilidade", value: 65, fullMark: 100 },
        { trait: "Neuroticismo", value: 45, fullMark: 100 },
    ],
    enneagram: {
        type: "O Investigador",
        coreFear: "Ser inútil, incapaz ou incompetente",
        coreDesire: "Ser capaz e competente",
    },
};

export default function MindViewPage() {
    const { profile } = useProfile();
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const displayName = profile?.full_name || mockProfile.name;
    const initials = displayName.split(" ").map(n => n[0]).join("").slice(0, 2);

    const handleGenerateImage = async () => {
        setIsGenerating(true);
        try {
            const prompt = `Cyberpunk avatar of a ${mockProfile.role}, ${mockProfile.archetypes.mbti} personality, glowing neon accents, hyper-realistic, 8k`;
            const response = await imageApi.generateHigherSelf(prompt);

            if (response.data?.url) {
                setGeneratedImage(response.data.url);
            } else if (response.error) {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error("Failed to generate image", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Hero Section */}
            <motion.section
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
                {/* Profile Card */}
                <NeonCard className="lg:col-span-2" glowColor="cyan">
                    <NeonCardContent className="flex items-center gap-6">
                        <Avatar className="w-24 h-24 border-2 border-cyber-cyan/30">
                            <AvatarImage src={generatedImage || mockProfile.avatarUrl} alt={displayName} />
                            <AvatarFallback className="bg-gradient-to-br from-cyber-cyan to-cyber-purple text-white text-2xl font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-2xl font-bold text-white tracking-tight">
                                        {displayName}
                                    </h1>
                                    <p className="text-cyber-text text-sm">{mockProfile.role}</p>
                                </div>
                                <Button
                                    onClick={handleGenerateImage}
                                    disabled={isGenerating}
                                    variant="outline"
                                    className="bg-cyber-purple/10 border-cyber-purple/50 text-cyber-purple hover:bg-cyber-purple/20"
                                >
                                    <Wand2 className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                                    {isGenerating ? 'Gerando...' : 'Gerar Eu Superior'}
                                </Button>
                            </div>
                            <span className="inline-block mt-2 px-2 py-1 bg-cyber-surface border border-cyber-cyan/30 rounded text-xs font-mono text-cyber-cyan">
                                ID: {mockProfile.id}
                            </span>

                            <div className="mt-4">
                                <NeuralProgress
                                    value={mockProfile.neuralData.current}
                                    max={mockProfile.neuralData.max}
                                    label="Neural Data"
                                    color="cyan"
                                    size="sm"
                                />
                            </div>
                        </div>
                    </NeonCardContent>
                </NeonCard>

                {/* Apex Score */}
                <NeonCard glowColor="purple" className="flex items-center justify-center">
                    <NeonCardContent className="text-center">
                        <ApexGauge value={mockProfile.apexScore} max={10} size="lg" />
                        <p className="mt-4 text-cyber-text text-sm font-mono">APEX SCORE</p>
                    </NeonCardContent>
                </NeonCard>
            </motion.section>

            {/* Tabs Navigation */}
            <Tabs defaultValue="dna" className="w-full">
                <TabsList className="bg-cyber-surface border border-white/5 p-1">
                    <TabsTrigger value="geral" className="data-[state=active]:bg-cyber-cyan/10 data-[state=active]:text-cyber-cyan">
                        Geral
                    </TabsTrigger>
                    <TabsTrigger value="dna" className="data-[state=active]:bg-cyber-cyan/10 data-[state=active]:text-cyber-cyan">
                        DNA
                    </TabsTrigger>
                    <TabsTrigger value="comunicacao" className="data-[state=active]:bg-cyber-cyan/10 data-[state=active]:text-cyber-cyan">
                        Comunicação
                    </TabsTrigger>
                    <TabsTrigger value="historia" className="data-[state=active]:bg-cyber-cyan/10 data-[state=active]:text-cyber-cyan">
                        História
                    </TabsTrigger>
                </TabsList>

                {/* DNA Tab Content */}
                <TabsContent value="dna" className="mt-6 space-y-6">
                    {/* Quote Card */}
                    <NeonCard glowColor="purple" hoverable={false}>
                        <NeonCardContent className="text-center py-8">
                            <p className="text-lg italic text-white/90">
                                "{mockProfile.quote}"
                            </p>
                        </NeonCardContent>
                    </NeonCard>

                    {/* Archetypes Badges */}
                    <div className="flex flex-wrap gap-4">
                        <TechBadge
                            label="MBTI"
                            value={mockProfile.archetypes.mbti}
                            variant="cyan"
                            icon={<Brain className="w-4 h-4" />}
                        />
                        <TechBadge
                            label="Eneagrama"
                            value={mockProfile.archetypes.enneagram}
                            variant="purple"
                            icon={<Sparkles className="w-4 h-4" />}
                        />
                        <TechBadge
                            label="DISC"
                            value={mockProfile.archetypes.disc}
                            variant="green"
                            icon={<Heart className="w-4 h-4" />}
                        />
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Big Five Radar */}
                        <NeonCard glowColor="cyan">
                            <NeonCardHeader>
                                <h3 className="text-white font-semibold">Big Five (OCEAN)</h3>
                            </NeonCardHeader>
                            <NeonCardContent>
                                <BigFiveRadar data={mockProfile.bigFive} />
                            </NeonCardContent>
                        </NeonCard>

                        {/* Enneagram Details */}
                        <NeonCard glowColor="purple">
                            <NeonCardHeader>
                                <h3 className="text-white font-semibold flex items-center gap-2">
                                    <Eye className="w-5 h-5 text-cyber-purple" aria-hidden="true" />
                                    {mockProfile.enneagram.type}
                                </h3>
                            </NeonCardHeader>
                            <NeonCardContent className="space-y-4">
                                <div>
                                    <span className="text-cyber-red text-xs font-mono uppercase">Medo Central</span>
                                    <p className="text-white/80 mt-1">{mockProfile.enneagram.coreFear}</p>
                                </div>
                                <div>
                                    <span className="text-cyber-green text-xs font-mono uppercase">Desejo Central</span>
                                    <p className="text-white/80 mt-1">{mockProfile.enneagram.coreDesire}</p>
                                </div>
                            </NeonCardContent>
                        </NeonCard>
                    </div>
                </TabsContent>

                {/* Other tabs - placeholder content */}
                <TabsContent value="geral" className="mt-6">
                    <NeonCard>
                        <NeonCardContent>
                            <p className="text-cyber-text">Visão geral do perfil em desenvolvimento...</p>
                        </NeonCardContent>
                    </NeonCard>
                </TabsContent>

                <TabsContent value="comunicacao" className="mt-6">
                    <NeonCard>
                        <NeonCardContent>
                            <p className="text-cyber-text">Análise de comunicação em desenvolvimento...</p>
                        </NeonCardContent>
                    </NeonCard>
                </TabsContent>

                <TabsContent value="historia" className="mt-6">
                    <NeonCard>
                        <NeonCardContent>
                            <p className="text-cyber-text">Linha do tempo em desenvolvimento...</p>
                        </NeonCardContent>
                    </NeonCard>
                </TabsContent>
            </Tabs>
        </div>
    );
}
