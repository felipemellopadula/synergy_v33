import { MessageCircle, ArrowLeft, Paperclip, Mic, Globe, Star, Trash2, Plus, ChevronDown, ChevronUp, Copy, Menu, ArrowUp, ArrowDown, MoreHorizontal, Edit3, Square, Check, FileText, File, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import React, { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ModelSelector } from "@/components/ModelSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserProfile } from "@/components/UserProfile";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTokens } from "@/hooks/useTokens";
import { supabase } from "@/integrations/supabase/client";
import { PdfProcessor } from "@/utils/PdfProcessor";
import { WordProcessor } from "@/utils/WordProcessor";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

// --- INTERFACES ---
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  model?: string;
  reasoning?: string;
  isStreaming?: boolean;
  files?: { name: string; type: string; url?: string }[];
}

interface ChatConversation {
  id: string;
  user_id: string;
  title: string;
  messages: any[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

// --- COMPONENTES FILHOS ---

interface ConversationSidebarProps {
  conversations: ChatConversation[];
  currentConversationId: string | null;
  onSelectConversation: (conv: ChatConversation) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onToggleFavorite: (conv: ChatConversation) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  isMobile?: boolean;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onToggleFavorite,
  onRenameConversation,
  isMobile = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleRename = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newTitle = prompt("Digite o novo título da conversa:");
    if (newTitle && newTitle.trim()) {
      onRenameConversation(id, newTitle.trim());
    }
  };

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderItem = (conv: ChatConversation) => (
    <div
      key={conv.id}
      className={`group relative rounded-lg p-3 cursor-pointer transition-colors duration-200 ${
        currentConversationId === conv.id ? "bg-muted" : "hover:bg-muted/50"
      }`}
      onClick={() => onSelectConversation(conv)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground truncate">{conv.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(conv.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleFavorite(conv); }}>
                <Star className={`h-4 w-4 mr-2 ${conv.is_favorite ? 'text-yellow-500' : ''}`} />
                {conv.is_favorite ? 'Desfavoritar' : 'Favoritar'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => handleRename(e, conv.id)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Renomear
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDeleteConversation(conv.id); }} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
  
  const favorites = filteredConversations.filter(c => c.is_favorite);
  const recents = filteredConversations.filter(c => !c.is_favorite);

  return (
    <div className="flex flex-col h-full bg-background border-r border-border">
      <div className="p-4 border-b border-border flex flex-col gap-4 flex-shrink-0">
        <Button onClick={onNewConversation} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Novo Chat
        </Button>
        <input
          placeholder="Pesquisar conversas..."
          className="w-full h-9 rounded-md border bg-muted px-3 text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
            {favorites.length > 0 && (
                <>
                    <h4 className="px-3 py-2 text-xs font-semibold text-muted-foreground">Favoritos</h4>
                    {favorites.map(conv => isMobile ? <SheetClose asChild key={conv.id}>{renderItem(conv)}</SheetClose> : renderItem(conv))}
                </>
            )}
            <h4 className="px-3 py-2 text-xs font-semibold text-muted-foreground">Recentes</h4>
            {recents.map(conv => isMobile ? <SheetClose asChild key={conv.id}>{renderItem(conv)}</SheetClose> : renderItem(conv))}
            
            {filteredConversations.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">Nenhuma conversa encontrada.</p>
            )}
        </div>
      </ScrollArea>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

const Chat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading } = useAuth();
  const { consumeTokens, getModelDisplayName, tokenBalance } = useTokens();
  const isMobile = useIsMobile();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  
  // Funções básicas
  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [loading, user, navigate]);

  const loadConversations = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao carregar conversas:', error);
        return;
      }
      
      const formattedConversations = (data || []).map(conv => ({
        ...conv,
        messages: Array.isArray(conv.messages) ? conv.messages : []
      }));
      
      setConversations(formattedConversations);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
  };

  const handleSelectConversation = (conv: ChatConversation) => {
    setCurrentConversationId(conv.id);
    const formattedMessages = conv.messages.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
    setMessages(formattedMessages);
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await supabase.from('chat_conversations').delete().eq('id', id);
      await loadConversations();
      if (currentConversationId === id) {
        handleNewConversation();
      }
      toast({ title: "Conversa deletada com sucesso" });
    } catch (error) {
      toast({ title: "Erro ao deletar conversa", variant: "destructive" });
    }
  };

  const handleToggleFavorite = async (conv: ChatConversation) => {
    try {
      await supabase
        .from('chat_conversations')
        .update({ is_favorite: !conv.is_favorite })
        .eq('id', conv.id);
      await loadConversations();
    } catch (error) {
      toast({ title: "Erro ao atualizar favorito", variant: "destructive" });
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      await supabase
        .from('chat_conversations')
        .update({ title: newTitle })
        .eq('id', id);
      await loadConversations();
    } catch (error) {
      toast({ title: "Erro ao renomear conversa", variant: "destructive" });
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedModel || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInputValue('');

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: inputValue,
          model: selectedModel,
        }
      });

      if (error) throw error;

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || 'Erro ao processar resposta',
        sender: 'bot',
        timestamp: new Date(),
        model: selectedModel,
      };

      setMessages(prev => [...prev, botMessage]);

      // Salvar conversa
      const updatedMessages = [...messages, userMessage, botMessage];
      const title = currentConversationId ? conversations.find(c => c.id === currentConversationId)?.title || inputValue.slice(0, 50) : inputValue.slice(0, 50);

      // Converter messages para formato compatível com JSON
      const messagesForDb = updatedMessages.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender,
        timestamp: msg.timestamp.toISOString(),
        model: msg.model,
        reasoning: msg.reasoning,
        isStreaming: msg.isStreaming,
        files: msg.files
      }));

      if (currentConversationId) {
        await supabase
          .from('chat_conversations')
          .update({ 
            messages: messagesForDb as any,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentConversationId);
      } else {
        const { data: newConv } = await supabase
          .from('chat_conversations')
          .insert({
            user_id: user.id,
            title: title,
            messages: messagesForDb as any,
            is_favorite: false
          })
          .select()
          .single();
        
        if (newConv) {
          setCurrentConversationId(newConv.id);
        }
      }

      await loadConversations();
      await consumeTokens(selectedModel, inputValue);

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Desktop */}
      {!isMobile && (
        <div className="w-80 flex-shrink-0">
          <ConversationSidebar
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
            onToggleFavorite={handleToggleFavorite}
            onRenameConversation={handleRenameConversation}
          />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-background p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <SheetHeader className="p-4">
                    <SheetTitle>Conversas</SheetTitle>
                  </SheetHeader>
                  <ConversationSidebar
                    conversations={conversations}
                    currentConversationId={currentConversationId}
                    onSelectConversation={handleSelectConversation}
                    onNewConversation={handleNewConversation}
                    onDeleteConversation={handleDeleteConversation}
                    onToggleFavorite={handleToggleFavorite}
                    onRenameConversation={handleRenameConversation}
                    isMobile={true}
                  />
                </SheetContent>
              </Sheet>
            )}
            
            <div className="flex items-center gap-2">
              <MessageCircle className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Chat</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ModelSelector selectedModel={selectedModel} onModelSelect={setSelectedModel} />
            <ThemeToggle />
            <UserProfile />
          </div>
        </header>

        {/* Messages Area */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h2 className="text-2xl font-semibold mb-2">Bem-vindo ao Chat</h2>
                  <p className="text-muted-foreground max-w-md">
                    Comece uma nova conversa selecionando um modelo e digitando sua mensagem.
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`rounded-lg p-4 ${
                          message.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        {message.model && (
                          <div className="text-xs mt-2 opacity-70">
                            {getModelDisplayName(message.model)}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {message.timestamp.toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                    <Avatar className={`w-8 h-8 ${message.sender === 'user' ? 'order-1' : 'order-2'}`}>
                      <AvatarFallback>
                        {message.sender === 'user' ? profile?.name?.[0] || 'U' : 'AI'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={selectedModel ? "Digite sua mensagem..." : "Selecione um modelo primeiro"}
                  disabled={!selectedModel || isLoading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 min-h-[44px] max-h-32 resize-none"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || !selectedModel || isLoading}
                  size="icon"
                  className="h-11 w-11"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Chat;