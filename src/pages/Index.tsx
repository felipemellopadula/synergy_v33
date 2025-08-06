import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Sparkles, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleChatClick = () => {
    if (user) {
      navigate('/chat');
    } else {
      setShowAuthModal(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">AI Chat</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <Button onClick={() => navigate('/chat')}>
                Ir para Chat
              </Button>
            ) : (
              <Button onClick={() => setShowAuthModal(true)}>
                Entrar
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Converse com a <span className="text-primary">Inteligência Artificial</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experimente modelos avançados de IA como GPT-4, Claude e Grok. 
            Cada usuário pago recebe 1 milhão de tokens para explorar.
          </p>
          <Button 
            size="lg" 
            onClick={handleChatClick}
            className="text-lg px-8 py-6"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            {user ? 'Começar Chat' : 'Começar Agora'}
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Modelos Avançados
              </CardTitle>
              <CardDescription>
                Acesse GPT-4o, Claude 3.5 Sonnet, Grok e outros modelos de última geração
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-primary" />
                Sistema de Tokens
              </CardTitle>
              <CardDescription>
                1 milhão de tokens inclusos. Diferentes modelos consomem quantidades variáveis
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                Busca na Web
              </CardTitle>
              <CardDescription>
                Modo especial para buscar informações atualizadas diretamente da internet
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="bg-muted rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Custos por Modelo</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-background rounded-lg p-4">
              <h4 className="font-semibold">Modelos Premium</h4>
              <p className="text-sm text-muted-foreground">Claude, GPT-4o, Grok</p>
              <p className="text-lg font-bold text-primary">10.000 tokens</p>
            </div>
            <div className="bg-background rounded-lg p-4">
              <h4 className="font-semibold">Modelos Rápidos</h4>
              <p className="text-sm text-muted-foreground">GPT-4o Mini, Claude Haiku</p>
              <p className="text-lg font-bold text-primary">2.000 tokens</p>
            </div>
          </div>
        </div>
      </main>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Index;