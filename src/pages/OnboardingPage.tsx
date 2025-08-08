import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/contexts/ProfileContext";
import { initializeGuide } from "@/services/n8nWebhook";
import { ProfileStatus } from "@/types/profile";
import AuthLayout from "@/layouts/AuthLayout";

interface LocalNascimento {
  display: string;
  cidade: string;
  estado: string;
  pais: string;
}

interface Suggestion {
  display: string;
  cidade: string;
  estado: string;
  pais: string;
}

export default function OnboardingPage() {
  const [fullName, setFullName] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [horaNascimento, setHoraNascimento] = useState("");
  const [local, setLocal] = useState<LocalNascimento>({ display: '', cidade: '', estado: '', pais: '' });
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();
  const { updateProfile, user } = useProfile();

  // Função para buscar locais na API Nominatim
  const searchLocations = async (query: string) => {
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
      
      if (!response.ok) {
        throw new Error('Erro na busca');
      }

      const results = await response.json();
      
      const formattedSuggestions: Suggestion[] = results.map((result: any) => {
        const cidade = result.address?.city || result.address?.town || result.address?.village || result.address?.municipality || '';
        const estado = result.address?.state || result.address?.province || result.address?.region || '';
        const pais = result.address?.country || '';

        return {
          display: result.display_name,
          cidade,
          estado,
          pais
        };
      });

      setSuggestions(formattedSuggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Erro ao buscar localizações:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce para a busca
  const handleLocationSearch = (value: string) => {
    setLocal({ ...local, display: value });
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchLocations(value);
    }, 300);
  };

  // Selecionar uma sugestão
  const selectSuggestion = (suggestion: Suggestion) => {
    setLocal(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Limpar sugestões quando clicar fora
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSuggestions(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // 🔧 FUNÇÃO MELHORADA DE EXTRAÇÃO DE LOCALIZAÇÃO
  const extractLocationData = (locationString: string): { cidade: string, estado: string, pais: string } => {
    if (!locationString?.trim()) {
      return { cidade: '', estado: '', pais: '' };
    }
    
    try {
      const parts = locationString.split(',').map(part => part.trim()).filter(Boolean);
      
      if (parts.length === 0) {
        return { cidade: '', estado: '', pais: '' };
      }
      
      // Estratégia: primeiro item é cidade, último é país, penúltimo é estado
      const cidade = parts[0] || '';
      const pais = parts[parts.length - 1] || '';
      const estado = parts.length > 2 ? parts[parts.length - 2] : '';
      
      return { cidade, estado, pais };
    } catch (error) {
      console.error('Erro ao extrair dados de localização:', error);
      return { cidade: '', estado: '', pais: '' };
    }
  };

  // 🔧 VALIDAÇÃO COMPLETA - TODOS OS CAMPOS OBRIGATÓRIOS
  const validateForm = (): { isValid: boolean; message: string } => {
    // Nome completo obrigatório
    if (!fullName.trim()) {
      return {
        isValid: false,
        message: "Nome completo é obrigatório."
      };
    }

    // Nome deve ter pelo menos 2 palavras
    if (fullName.trim().split(' ').length < 2) {
      return {
        isValid: false,
        message: "Por favor, informe seu nome completo (nome e sobrenome)."
      };
    }

    // Data de nascimento obrigatória
    if (!dataNascimento) {
      return {
        isValid: false,
        message: "Data de nascimento é obrigatória."
      };
    }

    // Hora de nascimento obrigatória
    if (!horaNascimento) {
      return {
        isValid: false,
        message: "Hora de nascimento é obrigatória."
      };
    }

    // Local de nascimento obrigatório
    if (!local.display.trim()) {
      return {
        isValid: false,
        message: "Local de nascimento é obrigatório."
      };
    }

    return { isValid: true, message: "" };
  };

  // 🔧 LÓGICA DE SUBMISSÃO CORRIGIDA
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar autenticação
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Usuário não encontrado. Por favor, faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    // Validação simples do formulário
    const validation = validateForm();
    if (!validation.isValid) {
      toast({
        title: "Dados inválidos",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // 🔧 PREPARAR DADOS DE LOCALIZAÇÃO DE FORMA MAIS ROBUSTA
      let cidade = local.cidade || '';
      let estado = local.estado || '';
      let pais = local.pais || '';

      // Se os campos estruturados estão vazios, tentar extrair da string de display
      if (local.display && (!cidade || !estado || !pais)) {
        const extracted = extractLocationData(local.display);
        cidade = cidade || extracted.cidade;
        estado = estado || extracted.estado;
        pais = pais || extracted.pais;
      }

      // 🔧 PREPARAR DADOS DO PERFIL - TODOS OBRIGATÓRIOS
      const profileData = {
        full_name: fullName.trim(),
        data_nascimento: dataNascimento, // Obrigatório
        hora_nascimento: horaNascimento, // Obrigatório
        local_nascimento: local.display, // Obrigatório
        cidade_nascimento: cidade || null,
        estado_nascimento: estado || null,
        pais_nascimento: pais || null,
        status: ProfileStatus.COMPLETED,
      };

      // 🔧 DEBUG: Log dos dados que serão enviados
      console.log('📝 Dados do perfil sendo enviados:', {
        ...profileData,
        user_id: user.id,
        email: user.email
      });

      // 🔧 SALVAR PERFIL
      const success = await updateProfile(profileData);

      if (success) {
        // 🔧 SUCESSO: Mostrar toast e disparar webhook
        toast({
          title: "Perfil criado com sucesso!",
          description: "Bem-vindo ao EU MAIOR.",
        });

        // 🔧 DISPARAR WEBHOOK N8N COM TODOS OS DADOS NO FORMATO CORRETO
        try {
          const webhookData = {
            user_id: user.id,
            email: user.email,
            full_name: fullName.trim(),
            data_nascimento: dataNascimento,
            hora_nascimento: horaNascimento,
            local_nascimento: local.display, // Campo completo mantido
            cidade: cidade || '',            // ✅ cidade (não cidade_nascimento)
            estado: estado || '',            // ✅ estado (não estado_nascimento)  
            pais: pais || '',               // ✅ pais (não pais_nascimento)
            created_at: new Date().toISOString()
          };
          
          console.log('🚀 Disparando webhook N8N com dados completos:', webhookData);
          await initializeGuide(webhookData);
          console.log('✅ N8N webhook disparado com sucesso');
        } catch (webhookError) {
          console.warn('⚠️ Erro ao disparar webhook N8N (não crítico):', webhookError);
          // Não mostrar erro para o usuário, é um processo em background
        }
        
        // 🔧 REDIRECIONAMENTO AUTOMÁTICO
        // O NavigationController detectará que o perfil está completo e redirecionará
        console.log('✅ Perfil salvo, aguardando redirecionamento automático...');
        
      } else {
        // 🔧 ERRO NO SALVAMENTO
        toast({
          title: "Erro ao salvar perfil",
          description: "Não foi possível salvar suas informações. Verifique os dados e tente novamente.",
          variant: "destructive",
        });
        
        console.error('❌ Falha ao salvar perfil via updateProfile');
      }
      
    } catch (error) {
      // 🔧 ERRO INESPERADO
      console.error('💥 Erro inesperado no handleSubmit:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um problema técnico. Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 🔧 CLEANUP DO DEBOUNCE
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <AuthLayout>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Complete seu perfil</CardTitle>
          <CardDescription>
            Nos conte um pouco sobre você para começar sua jornada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 🔧 NOME COMPLETO - OBRIGATÓRIO */}
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Nome Completo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Seu nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                maxLength={100}
                disabled={isLoading}
              />
            </div>
            
            {/* 🔧 DATA DE NASCIMENTO - OBRIGATÓRIO */}
            <div className="space-y-2">
              <Label htmlFor="dataNascimento">
                Data de Nascimento <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dataNascimento"
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                disabled={isLoading}
                required
                max={new Date().toISOString().split('T')[0]} // Não permite datas futuras
              />
            </div>
            
            {/* 🔧 HORA DE NASCIMENTO - OBRIGATÓRIO */}
            <div className="space-y-2">
              <Label htmlFor="horaNascimento">
                Hora de Nascimento <span className="text-destructive">*</span>
              </Label>
              <Input
                id="horaNascimento"
                type="time"
                value={horaNascimento}
                onChange={(e) => setHoraNascimento(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            
            {/* 🔧 LOCAL DE NASCIMENTO - OBRIGATÓRIO */}
            <div className="space-y-2 relative">
              <Label htmlFor="localNascimento">
                Local de Nascimento <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="localNascimento"
                  type="text"
                  placeholder="Digite sua cidade para buscar..."
                  value={local.display}
                  onChange={(e) => handleLocationSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  disabled={isLoading}
                  required
                  maxLength={200}
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
              
              {/* 🔧 SUGESTÕES DE LOCALIZAÇÃO */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer border-b border-border last:border-b-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectSuggestion(suggestion);
                      }}
                    >
                      <div className="text-sm font-medium truncate">{suggestion.display}</div>
                      {(suggestion.cidade || suggestion.estado || suggestion.pais) && (
                        <div className="text-xs text-muted-foreground mt-1 truncate">
                          {[suggestion.cidade, suggestion.estado, suggestion.pais].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* 🔧 SUGESTÕES DE LOCALIZAÇÃO */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer border-b border-border last:border-b-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectSuggestion(suggestion);
                      }}
                    >
                      <div className="text-sm font-medium truncate">{suggestion.display}</div>
                      {(suggestion.cidade || suggestion.estado || suggestion.pais) && (
                        <div className="text-xs text-muted-foreground mt-1 truncate">
                          {[suggestion.cidade, suggestion.estado, suggestion.pais].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* 🔧 BOTÃO DE SUBMISSÃO */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !fullName.trim() || !dataNascimento || !horaNascimento || !local.display.trim()}
            >
              {isLoading ? "Salvando perfil..." : "Completar Perfil"}
            </Button>
            
            {/* 🔧 INFORMAÇÃO ADICIONAL */}
            <p className="text-xs text-center text-muted-foreground">
              * Todos os campos são obrigatórios para personalizar sua experiência.
            </p>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}