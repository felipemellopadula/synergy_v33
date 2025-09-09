// Sections below the fold
import { useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  BrainCircuit,
  Layers,
  FileText,
  FolderKanban,
  LineChart,
  ShieldCheck,
  Users,
  Globe,
  Server,
  Zap
} from "lucide-react";

const LandingSections = () => {
  const [annual, setAnnual] = useState(true);

  return (
    <>
      {/* Principais Modelos de IA */}
      <section id="modelos" className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-16">
          <header className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Principais Modelos de IA Disponíveis
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              Acesse os melhores modelos de inteligência artificial em uma única plataforma. 
              Compare desempenho e escolha o ideal para cada tarefa.
            </p>
          </header>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="group hover:shadow-lg transition-all duration-200 bg-card border-border">
              <CardHeader className="text-center p-6">
                <div className="flex items-center justify-center h-12">
                  <img
                    src="/images/logos/chatgpt.svg"
                    alt="Logo ChatGPT"
                    loading="lazy"
                    decoding="async"
                    className="h-10 w-auto"
                  />
                </div>
                <CardTitle className="text-lg font-semibold text-foreground mt-4">
                  ChatGPT
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  GPT-4 Turbo • Conversação avançada
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-200 bg-card border-border">
              <CardHeader className="text-center p-6">
                <div className="flex items-center justify-center h-12">
                  <img
                    src="/images/logos/claude.svg"
                    alt="Logo Claude"
                    loading="lazy"
                    decoding="async"
                    className="h-10 w-auto"
                  />
                </div>
                <CardTitle className="text-lg font-semibold text-foreground mt-4">
                  Claude
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Sonnet 3.5 • Análise e raciocínio
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-200 bg-card border-border">
              <CardHeader className="text-center p-6">
                <div className="flex items-center justify-center h-12">
                  <img
                    src="/images/logos/gemini.svg"
                    alt="Logo Google Gemini"
                    loading="lazy"
                    decoding="async"
                    className="h-10 w-auto"
                  />
                </div>
                <CardTitle className="text-lg font-semibold text-foreground mt-4">
                  Gemini
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Pro • Multimodalidade avançada
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-200 bg-card border-border">
              <CardHeader className="text-center p-6">
                <div className="flex items-center justify-center h-12">
                  <img
                    src="/images/logos/deepseek.svg"
                    alt="Logo DeepSeek"
                    loading="lazy"
                    decoding="async"
                    className="h-10 w-auto"
                  />
                </div>
                <CardTitle className="text-lg font-semibold text-foreground mt-4">
                  DeepSeek
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  V3 • Programação e lógica
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section id="recursos" className="border-b border-border bg-muted/20">
        <div className="container mx-auto px-4 py-16">
          <header className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Recursos Avançados
            </h2>
            <p className="text-muted-foreground mt-2">
              Recursos avançados para maximizar sua produtividade com IA
            </p>
          </header>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <BrainCircuit className="h-8 w-8 text-primary" />
                  <CardTitle>Chat Inteligente</CardTitle>
                </div>
                <CardDescription>
                  Converse com múltiplos modelos de IA em uma única interface.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="h-8 w-8 text-primary" />
                  <CardTitle>Criação de Conteúdo</CardTitle>
                </div>
                <CardDescription>
                  Gere textos, artigos e documentos profissionais.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Layers className="h-8 w-8 text-primary" />
                  <CardTitle>Geração de Imagens</CardTitle>
                </div>
                <CardDescription>
                  Crie imagens incríveis com modelos de IA avançados.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-16">
          <header className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Planos Simples e Transparentes
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Escolha o plano ideal para suas necessidades
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <span className={annual ? "text-muted-foreground" : "font-semibold"}>
                Mensal
              </span>
              <Switch
                checked={annual}
                onCheckedChange={setAnnual}
              />
              <span className={annual ? "font-semibold" : "text-muted-foreground"}>
                Anual
              </span>
              {annual && (
                <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                  Economize 20%
                </span>
              )}
            </div>
          </header>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {/* Plano Gratuito */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="text-center">
                  <CardTitle className="text-xl">Gratuito</CardTitle>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">R$ 0</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Plano Pro */}
            <Card className="bg-card border-border border-primary relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                  Mais Popular
                </span>
              </div>
              <CardHeader>
                <div className="text-center">
                  <CardTitle className="text-xl">Pro</CardTitle>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">
                      R$ {annual ? "39" : "49"}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Plano Enterprise */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="text-center">
                  <CardTitle className="text-xl">Enterprise</CardTitle>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">
                      R$ {annual ? "199" : "249"}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Button size="lg">
              Começar Agora
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img
                src="/images/synergy-icon.webp"
                alt="Synergy AI"
                className="h-8 w-8"
                loading="lazy"
                decoding="async"
              />
              <span className="font-semibold text-foreground">Synergy AI Hub</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © 2024 Synergy AI Hub. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default LandingSections;