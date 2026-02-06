import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/contexts/ProfileContext";
import { useNavigate } from "react-router-dom";
import { onboardingApi, CosmicDataPayload, PsychometricPayload, NarrativePayload } from "@/services/api.service";
import AuthLayout from "@/layouts/AuthLayout";
import { ChevronLeft, ChevronRight, Loader2, Sparkles, Brain, Heart, Star, CheckCircle2 } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* TYPES & CONSTANTS                                                          */
/* -------------------------------------------------------------------------- */
interface Suggestion {
  display: string;
  cidade: string;
  estado: string;
  pais: string;
}

const STEPS = [
  { id: 1, title: "Identidade", icon: Star, description: "Como devemos te chamar?" },
  { id: 2, title: "Dados Cósmicos", icon: Sparkles, description: "Para seu mapa astral" },
  { id: 3, title: "Perfil Mental", icon: Brain, description: "Seus arquétipos" },
  { id: 4, title: "Sua História", icon: Heart, description: "Valores e aspirações" },
  { id: 5, title: "Processamento", icon: CheckCircle2, description: "Criando seu Eu Superior" },
];

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */
export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const { toast } = useToast();
  const { user } = useProfile();
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Identity
    fullName: "",
    // Step 2: Cosmic
    birthDate: "",
    birthTime: "",
    birthLocation: { display: "", cidade: "", estado: "", pais: "" },
    birthTimezone: "America/Sao_Paulo",
    // Step 3: Psychometric
    mbtiType: "",
    enneagramType: "",
    discType: "",
    // Step 4: Narrative
    lifeStory: "",
    coreValues: [] as string[],
    challenges: "",
    aspirations: "",
  });

  // --------------------------------------------------------------------------
  // LOCATION SEARCH (Nominatim)
  // --------------------------------------------------------------------------
  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`
      );
      const results = await response.json();
      const formatted: Suggestion[] = results.map((r: any) => ({
        display: r.display_name,
        cidade: r.address?.city || r.address?.town || r.address?.village || r.address?.municipality || "",
        estado: r.address?.state || r.address?.province || "",
        pais: r.address?.country || "",
      }));
      setSuggestions(formatted);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleLocationSearch = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      birthLocation: { ...prev.birthLocation, display: value },
    }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLocations(value), 300);
  };

  const selectSuggestion = (suggestion: Suggestion) => {
    setFormData((prev) => ({ ...prev, birthLocation: suggestion }));
    setSuggestions([]);
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // --------------------------------------------------------------------------
  // STEP NAVIGATION
  // --------------------------------------------------------------------------
  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return formData.fullName.trim().split(" ").length >= 2;
      case 2:
        return !!formData.birthDate && !!formData.birthTime && !!formData.birthLocation.display;
      case 3:
        return true; // Optional fields
      case 4:
        return formData.lifeStory.length >= 50;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!canProceed()) {
      toast({ title: "Campos obrigatórios", description: "Preencha todos os campos antes de continuar.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      switch (currentStep) {
        case 1: {
          // Start onboarding
          if (!user) throw new Error("Usuário não autenticado");
          const result = await onboardingApi.start({ userId: user.id, fullName: formData.fullName.trim() });
          if (result.error) throw new Error(result.error);
          setProfileId(result.data?.id || null);
          break;
        }
        case 2: {
          // Submit cosmic data
          if (!profileId) throw new Error("Profile não inicializado");
          const cosmicPayload: CosmicDataPayload = {
            birthDate: formData.birthDate,
            birthTime: formData.birthTime,
            birthCity: formData.birthLocation.cidade || formData.birthLocation.display.split(",")[0],
            birthState: formData.birthLocation.estado,
            birthCountry: formData.birthLocation.pais,
            birthTimezone: formData.birthTimezone,
          };
          const cosmicResult = await onboardingApi.submitCosmic(profileId, cosmicPayload);
          if (cosmicResult.error) throw new Error(cosmicResult.error);
          break;
        }
        case 3: {
          // Submit psychometric
          if (!profileId) throw new Error("Profile não inicializado");
          const psychoPayload: PsychometricPayload = {
            mbtiType: formData.mbtiType || undefined,
            enneagramType: formData.enneagramType || undefined,
            discType: formData.discType || undefined,
          };
          const psychoResult = await onboardingApi.submitPsychometric(profileId, psychoPayload);
          if (psychoResult.error) throw new Error(psychoResult.error);
          break;
        }
        case 4: {
          // Submit narrative and trigger processing
          if (!profileId) throw new Error("Profile não inicializado");
          const narrativePayload: NarrativePayload = {
            lifeStory: formData.lifeStory,
            coreValues: formData.coreValues,
            challenges: formData.challenges,
            aspirations: formData.aspirations,
          };
          await onboardingApi.submitNarrative(profileId, narrativePayload);
          await onboardingApi.triggerProcessing(profileId);
          break;
        }
      }
      setCurrentStep((s) => s + 1);
    } catch (error) {
      toast({ title: "Erro", description: error instanceof Error ? error.message : "Erro ao processar", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  // --------------------------------------------------------------------------
  // STEP 5: PROCESSING POLLING
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (currentStep !== 5 || !profileId) return;
    const pollInterval = setInterval(async () => {
      const status = await onboardingApi.getStatus(profileId);
      if (status.data?.status === "COMPLETED") {
        clearInterval(pollInterval);
        toast({ title: "Perfil criado!", description: "Seu Eu Superior está pronto." });
        navigate("/dashboard");
      }
    }, 3000);
    return () => clearInterval(pollInterval);
  }, [currentStep, profileId, navigate, toast]);

  // --------------------------------------------------------------------------
  // RENDER STEPS
  // --------------------------------------------------------------------------
  const renderStep = () => {
    const variants = {
      enter: { x: 50, opacity: 0 },
      center: { x: 0, opacity: 1 },
      exit: { x: -50, opacity: 0 },
    };

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="min-h-[300px]"
        >
          {currentStep === 1 && (
            <div className="space-y-4">
              <Label htmlFor="fullName">Nome Completo *</Label>
              <Input
                id="fullName"
                placeholder="Seu nome completo"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                disabled={isLoading}
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="birthDate">Data de Nascimento *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="birthTime">Hora de Nascimento *</Label>
                <Input
                  id="birthTime"
                  type="time"
                  value={formData.birthTime}
                  onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                  disabled={isLoading}
                />
              </div>
              <div className="relative">
                <Label htmlFor="birthLocation">Local de Nascimento *</Label>
                <Input
                  id="birthLocation"
                  placeholder="Digite sua cidade..."
                  value={formData.birthLocation.display}
                  onChange={(e) => handleLocationSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  disabled={isLoading}
                />
                {isSearching && <Loader2 className="absolute right-3 top-9 h-4 w-4 animate-spin" />}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                    {suggestions.map((s, i) => (
                      <div key={i} className="px-4 py-2 hover:bg-accent cursor-pointer" onClick={() => selectSuggestion(s)}>
                        <div className="text-sm truncate">{s.display}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Opcional: Se você conhece seus tipos, informe abaixo.</p>
              <div>
                <Label htmlFor="mbti">MBTI (ex: INFJ)</Label>
                <Input
                  id="mbti"
                  placeholder="INFJ, ENTP..."
                  value={formData.mbtiType}
                  onChange={(e) => setFormData({ ...formData, mbtiType: e.target.value.toUpperCase() })}
                  maxLength={4}
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="enneagram">Eneagrama (ex: 5w4)</Label>
                <Input
                  id="enneagram"
                  placeholder="1w2, 5w4..."
                  value={formData.enneagramType}
                  onChange={(e) => setFormData({ ...formData, enneagramType: e.target.value })}
                  maxLength={3}
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="disc">DISC (ex: SC)</Label>
                <Input
                  id="disc"
                  placeholder="D, I, S, C..."
                  value={formData.discType}
                  onChange={(e) => setFormData({ ...formData, discType: e.target.value.toUpperCase() })}
                  maxLength={2}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="lifeStory">Sua História (mín. 50 caracteres) *</Label>
                <Textarea
                  id="lifeStory"
                  placeholder="Conte-nos sobre você, suas experiências de vida..."
                  value={formData.lifeStory}
                  onChange={(e) => setFormData({ ...formData, lifeStory: e.target.value })}
                  rows={4}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">{formData.lifeStory.length}/50 caracteres mínimos</p>
              </div>
              <div>
                <Label htmlFor="aspirations">Aspirações</Label>
                <Textarea
                  id="aspirations"
                  placeholder="Quais são seus sonhos e objetivos?"
                  value={formData.aspirations}
                  onChange={(e) => setFormData({ ...formData, aspirations: e.target.value })}
                  rows={2}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="flex flex-col items-center justify-center space-y-6 py-8">
              <Loader2 className="h-16 w-16 animate-spin text-cyber-cyan" />
              <div className="text-center">
                <h3 className="text-xl font-semibold">Processando seu perfil...</h3>
                <p className="text-muted-foreground mt-2">
                  Nossa equipe de agentes de IA está analisando seus dados para criar seu Eu Superior.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  // --------------------------------------------------------------------------
  // MAIN RENDER
  // --------------------------------------------------------------------------
  return (
    <AuthLayout>
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center gap-2 mb-4">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              return (
                <div
                  key={step.id}
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${isActive ? "bg-cyber-cyan text-black" : isCompleted ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                    }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              );
            })}
          </div>
          <Progress value={(currentStep / STEPS.length) * 100} className="mb-4" />
          <CardTitle className="text-2xl">{STEPS[currentStep - 1].title}</CardTitle>
          <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
        </CardHeader>

        <CardContent>
          {renderStep()}

          {currentStep < 5 && (
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={handleBack} disabled={currentStep === 1 || isLoading}>
                <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
              <Button onClick={handleNext} disabled={isLoading || !canProceed()}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {currentStep === 4 ? "Finalizar" : "Próximo"} <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}