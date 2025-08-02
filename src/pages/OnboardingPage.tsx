import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/layouts/AuthLayout";
import { initializeGuide } from "@/services/n8nWebhook";

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
  const navigate = useNavigate();
  const { toast } = useToast();

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
      
      const formattedSuggestions: Suggestion[] = results.map((result: any) => ({
        display: result.display_name,
        cidade: result.address?.city || result.address?.town || result.address?.village || '',
        estado: result.address?.state || '',
        pais: result.address?.country || ''
      }));

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Usuário não encontrado.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          data_nascimento: dataNascimento || null,
          hora_nascimento: horaNascimento || null,
          local_nascimento: local.display || null,
          updated_at: new Date().toISOString(),
        } as any);

      if (error) {
        toast({
          title: "Erro ao salvar perfil",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Após salvar o perfil com sucesso, inicializar a IA no n8n
        try {
          const userData = {
            id: user.id,
            full_name: fullName,
            data_nascimento: dataNascimento,
            hora_nascimento: horaNascimento,
            localNascimento: {
              cidade: local.cidade,
              estado: local.estado,
              pais: local.pais
            }
          };
          
          await initializeGuide(userData);
          
          toast({
            title: "Perfil criado com sucesso!",
            description: "Bem-vindo ao EU MAIOR. Sua IA pessoal foi inicializada.",
          });
          navigate("/jarvis");
        } catch (n8nError) {
          console.error('Erro na inicialização da IA:', n8nError);
          toast({
            title: "Perfil criado, mas houve um problema",
            description: "Seu perfil foi salvo, mas não foi possível inicializar sua IA. Tente novamente mais tarde.",
            variant: "destructive",
          });
          navigate("/jarvis");
        }
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Seu nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dataNascimento">Data de Nascimento</Label>
              <Input
                id="dataNascimento"
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="horaNascimento">Hora de Nascimento</Label>
              <Input
                id="horaNascimento"
                type="time"
                value={horaNascimento}
                onChange={(e) => setHoraNascimento(e.target.value)}
              />
            </div>
            
            <div className="space-y-2 relative">
              <Label htmlFor="localNascimento">Local de Nascimento</Label>
              <div className="relative">
                <Input
                  id="localNascimento"
                  type="text"
                  placeholder="Digite sua cidade para buscar..."
                  value={local.display}
                  onChange={(e) => handleLocationSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
              
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
                      <div className="text-sm font-medium">{suggestion.display}</div>
                      {(suggestion.cidade || suggestion.estado || suggestion.pais) && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {[suggestion.cidade, suggestion.estado, suggestion.pais].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Completar Perfil"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}