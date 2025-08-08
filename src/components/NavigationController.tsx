import { useNavigationController } from "@/hooks/useNavigationController";

/**
 * Componente fantasma que executa o hook central de navegação.
 * Deve ser montado uma única vez dentro do <BrowserRouter>.
 */
export default function NavigationController() {
  useNavigationController();
  return null; // Nada na tela, só efeito colateral
}
