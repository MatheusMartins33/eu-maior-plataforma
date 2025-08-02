import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-foreground">EU MAIOR</h1>
        <p className="text-muted-foreground">Descubra o seu potencial maior</p>
        <div className="space-x-4">
          <Button asChild>
            <Link to="/login">Entrar</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/register">Criar Conta</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
