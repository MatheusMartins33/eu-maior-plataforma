import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/layouts/AuthLayout";
import { initializeGuide } from "@/services/n8nWebhook";

export default function OnboardingPage() {
  const [fullName, setFullName] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [horaNascimento, setHoraNascimento] = useState("");
  const [localNascimento, setLocalNascimento] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
          local_nascimento: localNascimento || null,
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
            local_nascimento: localNascimento,
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
            
            <div className="space-y-2">
              <Label htmlFor="localNascimento">Local de Nascimento</Label>
              <Input
                id="localNascimento"
                type="text"
                placeholder="Cidade, Estado, País"
                value={localNascimento}
                onChange={(e) => setLocalNascimento(e.target.value)}
              />
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