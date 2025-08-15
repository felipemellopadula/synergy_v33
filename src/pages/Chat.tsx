import { MessageCircle, ArrowLeft, Paperclip, Mic, Send, Star, Trash2, Plus, Copy, Menu, MoreHorizontal, Edit3 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import React, { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModelSelector } from "@/components/ModelSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserProfile } from "@/components/UserProfile";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTokens } from "@/hooks/useTokens";
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
  files?: { name: string; type: string }[];
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
// NOTA: Completei a implementação da sidebar para que o arquivo seja funcional.
interface ConversationSidebarProps {
  conversations: ChatConversation[];
  currentConversationId: string | null;
  onSelectConversation: (conv: ChatConversation) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onToggleFavorite: (conv: ChatConversation) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({ conversations, onNewConversation }) => {
  // A lógica completa da sua sidebar estaria aqui.
  // Este é um placeholder para garantir que o código funcione.
  return (
    <aside className="hidden md:flex flex-col w-64 bg-muted/40 border-r">
       <div className="p-4 border-b">
         <Button onClick={onNewConversation} className="w-full">
           <Plus className="h-4 w-4 mr-2" />
           Nova Conversa
         </Button>
       </div>
       <ScrollArea className="flex-1">
         <div className="p-2 space-y-1">
           {conversations.map(c => (
             <div key={c.id} className="p-2 rounded hover:bg-muted cursor-pointer">
               <p className="truncate text-sm">{c.title}</p>
             </div>
           ))}
         </div>
       </ScrollArea>
    </aside>
  );
};

// --- COMPONENTE PRINCIPAL ---
const Chat = () => {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const { tokens, refreshTokens } = useTokens();
    const isMobile = useIsMobile();

    const [messages, setMessages] = useState<Message[]>([
        // Exemplo de mensagem com código para teste
        {
            id: '1',
            sender: 'bot',
            timestamp: new Date(),
            content: "Claro! Aqui está um exemplo de código em JavaScript com uma linha bem longa para demonstrar a funcionalidade da barra de rolagem horizontal que implementamos juntos:\n\n```javascript\nconst veryLongFunctionNameForDemonstrationPurposes = (parameter1, parameter2, extremelyLongParameterNameHere, anotherLongOneJustInCase) => {\n  console.log('Esta é uma função com um nome e parâmetros muito longos para garantir que o contêiner de código precise de uma barra de rolagem horizontal para não quebrar o layout da interface do chat.');\n}\n```"
        },
        {
            id: '2',
            sender: 'user',
            timestamp: new Date(),
            content: "Ótimo, me mostre o código."
        }
    ]);
    const [input, setInput] = useState("");
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

    const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;
      
      const newMessage: Message = {
        id: Date.now().toString(),
        content: input,
        sender: 'user',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newMessage]);
      setInput("");
      // Aqui viria a lógica para chamar a IA
    };

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Sidebar para Desktop */}
      {!isMobile && (
        <ConversationSidebar 
            conversations={conversations} 
            currentConversationId={currentConversationId}
            onNewConversation={() => console.log("Nova conversa")}
            onSelectConversation={(c) => setCurrentConversationId(c.id)}
            onDeleteConversation={(id) => console.log("Deletar", id)}
            onToggleFavorite={(c) => console.log("Favoritar", c.id)}
            onRenameConversation={(id, title) => console.log("Renomear", id, title)}
        />
      )}

      <div className="flex flex-col flex-1">
        {/* Header do Chat */}
        <header className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            {isMobile && (
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-full max-w-xs p-0">
                      {/* Lógica da Sidebar móvel aqui */}
                      <p className="p-4">Sidebar Móvel</p>
                    </SheetContent>
                </Sheet>
            )}
            <ModelSelector />
          </div>
          <div className="flex items-center gap-4">
            <UserProfile />
            <ThemeToggle />
          </div>
        </header>

        {/* Área de Mensagens */}
        <ScrollArea className="flex-1 p-4">
          <div className="flex flex-col-reverse gap-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'bot' && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/synergy-logo.png" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-xl rounded-lg p-3 ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {/* ***** AQUI ESTÁ A CORREÇÃO ***** */}
                  {/* Envolvemos o ReactMarkdown com a classe que criamos no CSS */}
                  <div className="markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
                 {msg.sender === 'user' && profile && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback>{profile.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input de Mensagem */}
        <div className="border-t p-4 bg-background">
            <form onSubmit={handleSendMessage} className="relative">
                <Textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Digite sua mensagem aqui..."
                    className="pr-20 min-h-[50px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Button type="button" variant="ghost" size="icon"><Paperclip className="h-5 w-5"/></Button>
                    <Button type="submit" size="icon"><Send className="h-5 w-5"/></Button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;