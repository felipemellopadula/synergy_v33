import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Sparkles,
  Zap,
  Users,
  ThumbsUp,
  Activity,
  Stars,
  BrainCircuit,
  Gem,
  Layers,
  FileText,
  FolderKanban,
  LineChart,
  ShieldCheck,
  Globe,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [annual, setAnnual] = useState(true);
  const [isLight, setIsLight] = useState<boolean>(() => document.documentElement.classList.contains('light'));

  const handlePrimaryCta = () => {
    if (user) navigate("/chat");
    else setShowAuthModal(true);
  };

  useEffect(() => {
    // Basic SEO for the landing page
    document.title = "Synergy AI Hub – Modelos de IA, Recursos e Planos";

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta(
      "description",
      "Acesse os melhores modelos de IA: ChatGPT, Claude, Gemini e mais. Recursos poderosos, preços simples e dashboard intuitivo."
    );

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", window.location.href);

    // Track theme changes to swap logos
    const apply = () => setIsLight(document.documentElement.classList.contains('light'));
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-30 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/" className="flex items-center gap-2" aria-label="Synergy AI">
            {isLight ? (
              <img src="/lovable-uploads/d3026126-a31a-4979-b9d5-265db8e3f148.png" alt="Synergy AI logo" className="h-8 w-auto" />
            ) : (
              <img src="/lovable-uploads/75b65017-8e97-493c-85a8-fe1b0f60ce9f.png" alt="Synergy AI logo" className="h-8 w-auto" />
            )}
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#modelos" className="hover:text-foreground transition-colors">Soluções</a>
            <a href="#planos" className="hover:text-foreground transition-colors">Planos</a>
            <a href="#contato" className="hover:text-foreground transition-colors">Contato</a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Button onClick={() => navigate("/chat")} className="hidden sm:inline-flex">
                Ir para Chat
              </Button>
            ) : (
              <Button onClick={() => setShowAuthModal(true)}>Login</Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Conteúdo da landing (hero, modelos, recursos, planos) será reinserido aqui */}
        {/* Footer temporariamente dentro do main */}
        <footer id="contato" className="border-t border-border">
          <div className="container mx-auto px-4 py-12">
            <div className="grid gap-8 md:grid-cols-4">
              <div>
                <h3 className="text-xl font-bold">IA Hub</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Capacitando desenvolvedores e empresas com recursos de IA de ponta.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Empresa</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground">Sobre Nós</a></li>
                  <li><a href="#" className="hover:text-foreground">Carreiras</a></li>
                  <li><a href="#" className="hover:text-foreground">Blog</a></li>
                  <li><a href="#" className="hover:text-foreground">Imprensa</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Recursos</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground">Documentação</a></li>
                  <li><a href="#" className="hover:text-foreground">Referência da API</a></li>
                  <li><a href="#" className="hover:text-foreground">Tutoriais</a></li>
                  <li><a href="#" className="hover:text-foreground">Comunidade</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Contato</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Email: contato@iahub.com.br</li>
                  <li>Telefone: +55 (11) 4567-8901</li>
                  <li>Endereço: Av. Paulista, 1000, São Paulo/SP</li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-border text-xs text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-2">
              <p>© {new Date().getFullYear()} IA Hub. Todos os direitos reservados.</p>
              <div className="flex items-center gap-4">
                <a href="#" className="hover:text-foreground">Política de Privacidade</a>
                <a href="#" className="hover:text-foreground">Termos de Serviço</a>
                <a href="#" className="hover:text-foreground">Política de Cookies</a>
              </div>
            </div>
          </div>
        </footer>
      </main>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Index;
