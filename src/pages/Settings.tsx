import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Save, Camera } from "lucide-react";
import ModelUsageChart from "@/components/settings/ModelUsageChart";
import SettingsStats from "@/components/settings/SettingsStats";
import { Moon, Sun } from "lucide-react";
import { ArrowLeft, ImageIcon } from "lucide-react"; // Importações para o header

// Componente ThemeToggle: Alterna entre modo dark e light
export const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(true); // Corrigido: remoção de parêntese extra

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="relative h-10 w-10 rounded-full border-border bg-card hover:bg-accent transition-all duration-300"
    >
      <Sun className={`h-4 w-4 transition-all duration-300 ${
        isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
      }`} />
      <Moon className={`absolute h-4 w-4 transition-all duration-300 ${
        isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
      }`} />
      <span className="sr-only">Alternar tema</span>
    </Button>
  );
};

// Componente UserProfile: Exibe avatar e nome do usuário baseado no contexto de autenticação
const UserProfile = () => {
  const { profile } = useAuth();

  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={profile?.avatar_url || undefined} alt="Foto de perfil" />
        <AvatarFallback>{profile?.name?.[0] || "U"}</AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium text-foreground">{profile?.name || "Usuário"}</span>
    </div>
  );
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, updateProfile, refreshProfile, loading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Efeito para configurar meta tags da página
  useEffect(() => {
    document.title = "Configurações da Conta | AI Chat";
    const desc = "Atualize foto, nome, email e telefone. Veja seu plano Profissional, tokens do mês e quando renovam.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = `${window.location.origin}/settings`;
  }, []);

  // Efeito para carregar dados do perfil
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
      setAvatarPreview(profile.avatar_url || null);
    }
  }, [profile]);

  // Redireciona se não autenticado
  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  // Cálculo do ciclo de tokens
  const { cycleStart, cycleEnd, nextReset } = useMemo(() => {
    if (!profile?.created_at) {
      const now = new Date();
      const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return { cycleStart: now, cycleEnd: end, nextReset: end };
    }
    const created = new Date(profile.created_at);
    const now = new Date();
    let start = new Date(created);
    const add30 = (d: Date) => new Date(d.getTime() + 30 * 24 * 60 * 60 * 1000);
    while (now >= add30(start)) {
      start = add30(start);
    }
    const end = add30(start);
    return { cycleStart: start, cycleEnd: end, nextReset: end };
  }, [profile?.created_at]);

  // Função para formatar data
  const formatDate = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // Função para alterar avatar (upload para Supabase)
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(`${profile.id}/${file.name}`, file);
      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);
      const publicUrl = publicUrlData.publicUrl;

      const updates = { avatar_url: publicUrl };
      const { error: updateError } = await updateProfile(updates);
      if (updateError) throw updateError;

      setAvatarPreview(publicUrl);
      await refreshProfile();
      toast({ title: "Foto atualizada", description: "Sua foto de perfil foi alterada." });
    } catch (err) {
      console.error(err);
      toast({ title: "Erro", description: "Não foi possível atualizar a foto.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Função para salvar alterações no perfil
  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const updates: any = { name, phone, email };

      if (email && email !== profile.email) {
        const { error: authErr } = await supabase.auth.updateUser({ email: email.trim().toLowerCase() });
        if (authErr) throw authErr;
        toast({ title: "Email atualizado", description: "Verifique sua caixa de entrada para confirmar a alteração." });
      }

      const { error } = await updateProfile(updates);
      if (error) throw error;

      await refreshProfile();
      toast({ title: "Configurações salvas", description: "Suas informações foram atualizadas." });
    } catch (err) {
      console.error(err);
      toast({ title: "Erro", description: "Não foi possível salvar as alterações.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Carregando...</div>;
  }

  const planLabel = "Profissional"; // Pode ser dinâmico se necessário

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header fixo e responsivo */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="flex items-center gap-2 hover:bg-muted">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <ImageIcon className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Configurações</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <UserProfile />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content com grid responsiva */}
      <main className="container mx-auto px-4 py-8">
        <section className="grid grid-cols-1 lg:grid-cols-[1fr,auto] gap-8">
          {/* Card de Perfil: adapta-se em mobile */}
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seção de avatar: flex responsivo */}
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarPreview || profile?.avatar_url || undefined} alt="Foto de perfil do usuário" />
                    <AvatarFallback>{profile?.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="w-full">
                  <Label htmlFor="avatar" className="block mb-2">Foto</Label>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="w-full" />
                    <Button type="button" variant="secondary" className="w-full sm:w-auto">
                      <Camera className="h-4 w-4 mr-2" /> Trocar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Formulário: grid responsiva */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              {/* Botão de salvar: alinhado à direita */}
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" /> {saving ? "Salvando..." : "Salvar alterações"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Seção de stats e gráfico: empilha em mobile */}
          <div className="space-y-6 w-full">
            <SettingsStats
              planLabel={planLabel}
              tokensRemaining={profile.tokens_remaining}
              cycleStart={cycleStart}
              cycleEnd={cycleEnd}
              nextReset={nextReset}
            />
            {/* Gráfico: wrapper responsivo com overflow */}
            <div className="w-full h-auto overflow-auto">
              <ModelUsageChart cycleStart={cycleStart} cycleEnd={cycleEnd} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SettingsPage;
