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

  const handlePrimaryCta = () => {
    if (user) navigate("/chat");
    else setShowAuthModal(true);
  };

  useEffect(() => {
    // Basic SEO for the landing page
    document.title = "Synapse AI Hub – Modelos de IA, Recursos e Planos";

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
          <div className="flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" aria-hidden />
            <span className="text-lg md:text-xl font-bold tracking-tight">Synapse AI</span>
          </div>
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

      {/* Hero */}
      <main className="flex-1">
        <section className="container mx-auto px-4 pt-14 pb-16 md:pt-20 md:pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <Stars className="h-3.5 w-3.5 text-primary" />
              Inovação em Inteligência Artificial
            </div>
            <h1 className="mt-6 text-4xl md:text-6xl font-extrabold leading-tight">
              Acesso <span className="text-primary">aos melhores</span> modelos de Inteligência
              Artificial <span className="text-primary">do mundo</span>
            </h1>
            <p className="mt-4 md:mt-6 text-lg md:text-xl text-muted-foreground">
              Nosso hub de IA combina os melhores modelos de inteligência artificial para
              potencializar seus projetos de forma simples e eficiente.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={handlePrimaryCta} className="px-8">
                <MessageCircle className="mr-2 h-5 w-5" />
                Começar Agora
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-8"
                onClick={() => document.getElementById("modelos")?.scrollIntoView({ behavior: "smooth" })}
              >
                Ver Modelos
              </Button>
            </div>
            <p className="mt-8 text-xs text-muted-foreground">Empresas que confiam em nosso hub</p>
            <div className="mt-3 grid grid-cols-3 gap-6 max-w-md mx-auto text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2"><ThumbsUp className="h-4 w-4" /> Marca Um</div>
              <div className="flex items-center justify-center gap-2"><Activity className="h-4 w-4" /> Marca Dois</div>
              <div className="flex items-center justify-center gap-2"><Users className="h-4 w-4" /> Marca Três</div>
            </div>
          </div>
        </section>

        {/* Principais Modelos */}
        <section id="modelos" className="container mx-auto px-4 py-14 md:py-20">
          <div className="mx-auto max-w-3xl text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold">Principais Modelos de IA</h2>
            <p className="mt-3 text-muted-foreground">
              Trabalhamos com as inteligências artificiais mais avançadas do mercado para
              oferecer soluções inovadoras.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: BrainCircuit,
                title: "ChatGPT",
                desc:
                  "Modelo avançado de linguagem natural para gerar textos, responder perguntas e auxiliar em tarefas de escrita e análise.",
              },
              {
                icon: Sparkles,
                title: "Claude",
                desc:
                  "Assistente de IA focado em respostas detalhadas com segurança e precisão para uso profissional.",
              },
              { icon: Gem, title: "Gemini", desc: "Modelo multimodal do Google para texto, imagens e código." },
              {
                icon: Layers,
                title: "Llama",
                desc: "Modelo de código aberto para criar aplicações de IA personalizadas com alto desempenho.",
              },
            ].map((m) => (
              <Card key={m.title} className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <m.icon className="h-7 w-7 text-primary" />
                    <CardTitle>{m.title}</CardTitle>
                  </div>
                  <CardDescription className="pt-2">{m.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Ferramentas Exclusivas */}
        <section className="container mx-auto px-4 py-14 md:py-20">
          <div className="mx-auto max-w-3xl text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold">Ferramentas Exclusivas que Transformam seu Trabalho</h2>
            <p className="mt-3 text-muted-foreground">
              Desenvolvemos um conjunto de ferramentas poderosas para maximizar seu potencial criativo.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Sparkles, title: "Sinapse Core", desc: "IA proprietária que seleciona automaticamente o melhor modelo para cada tarefa." },
              { icon: FileText, title: "Análise de Documentos", desc: "Interprete, resuma e avalie PDFs e arquivos com facilidade incomparável." },
              { icon: Layers, title: "Contextos", desc: "Crie contextos detalhados para melhorar a qualidade das respostas." },
              { icon: Zap, title: "Flows", desc: "Mentor especialista para brainstorm, propostas e até programação." },
              { icon: FolderKanban, title: "Organize Chats", desc: "Categorize e gerencie conversas por projetos ou equipes." },
              { icon: LineChart, title: "Análise de Dados", desc: "Transforme planilhas em insights e gráficos automaticamente." },
            ].map((f) => (
              <Card key={f.title} className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <f.icon className="h-6 w-6 text-primary" />
                    <CardTitle>{f.title}</CardTitle>
                  </div>
                  <CardDescription className="pt-2">{f.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Recursos Poderosos */}
        <section className="container mx-auto px-4 py-14 md:py-20">
          <div className="mx-auto max-w-3xl text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold">Recursos Poderosos</h2>
            <p className="mt-3 text-muted-foreground">
              Tudo o que você precisa para construir, implantar e escalar aplicações com IA.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: BrainCircuit, title: "Modelos de IA Avançados", desc: "Texto, imagem e áudio com uma API simples." },
              { icon: Zap, title: "Velocidade Extrema", desc: "Infra otimizada para respostas rápidas." },
              { icon: ShieldCheck, title: "Segurança Empresarial", desc: "Criptografia e segurança nível corporativo." },
              { icon: LineChart, title: "Análises Detalhadas", desc: "Acompanhe uso, desempenho e custos." },
              { icon: Globe, title: "Disponibilidade Global", desc: "Baixa latência em qualquer lugar do mundo." },
              { icon: Server, title: "Infraestrutura Escalável", desc: "Escala automática para qualquer carga." },
            ].map((r) => (
              <Card key={r.title} className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <r.icon className="h-6 w-6 text-primary" />
                    <CardTitle>{r.title}</CardTitle>
                  </div>
                  <CardDescription className="pt-2">{r.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Planos */}
        <section id="planos" className="container mx-auto px-4 py-14 md:py-20">
          <div className="mx-auto max-w-3xl text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold">Simples, Transparente e Prático</h2>
            <p className="mt-3 text-muted-foreground">
              Escolha o plano que melhor se adapta às suas necessidades. Inclui 14 dias grátis.
            </p>
            <div className="mt-4 inline-flex items-center gap-3 text-sm">
              <span className={!annual ? "text-foreground" : "text-muted-foreground"}>Mensal</span>
              <Switch checked={annual} onCheckedChange={setAnnual} aria-label="Alternar ciclo" />
              <span className={annual ? "text-foreground" : "text-muted-foreground"}>Anual (Economize 20%)</span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Starter */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription>Para indivíduos e pequenos projetos</CardDescription>
                <div className="pt-4">
                  <div className="text-3xl font-bold">
                    R$ {annual ? "30,00" : "35,00"}
                    <span className="text-sm font-normal text-muted-foreground"> /mês</span>
                  </div>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>Acesso a modelos básicos de I.A</li>
                  <li>100.000 tokens por mês</li>
                  <li>1 solicitação por vez</li>
                  <li>Análise básica</li>
                </ul>
                <Button variant="outline" className="mt-6" onClick={() => setShowAuthModal(true)}>
                  Começar teste gratuito
                </Button>
              </CardHeader>
            </Card>

            {/* Professional */}
            <Card className="bg-card border-border ring-1 ring-primary/20">
              <CardHeader>
                <div className="inline-flex self-start -mb-2 translate-y-[-6px] rounded-full bg-primary/10 text-primary text-xs px-3 py-1">
                  Mais Popular
                </div>
                <CardTitle>Profissional</CardTitle>
                <CardDescription>Para profissionais e pequenas equipes</CardDescription>
                <div className="pt-4">
                  <div className="text-3xl font-bold">
                    R$ {annual ? "79,99" : "89,99"}
                    <span className="text-sm font-normal text-muted-foreground"> /mês</span>
                  </div>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>Acesso a todos modelos de I.A</li>
                  <li>1.000.000 de tokens por mês</li>
                  <li>Até 5 solicitações ao mesmo tempo</li>
                  <li>Prioridade no suporte</li>
                  <li>Análises avançadas</li>
                </ul>
                <Button className="mt-6" onClick={() => setShowAuthModal(true)}>
                  Começar teste gratuito
                </Button>
              </CardHeader>
            </Card>

            {/* Enterprise */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Empresarial</CardTitle>
                <CardDescription>Para organizações com necessidades especiais</CardDescription>
                <div className="pt-4">
                  <div className="text-3xl font-bold">Sob Consulta*</div>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>Acesso a todos os modelos</li>
                  <li>Chamadas ilimitadas</li>
                  <li>Suporte 24/7</li>
                  <li>Custom model fine-tuning</li>
                  <li>Infra dedicada e SLA</li>
                </ul>
                <Button variant="outline" className="mt-6" onClick={() => setShowAuthModal(true)}>
                  Entre em contato
                </Button>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Contato/Footer simples */}
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
