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
  const [isRecording, setIsRecording] = useState(false);
  const [isWebSearchMode, setIsWebSearchMode] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState<Map<string, string>>(new Map());
  const [processedPdfs, setProcessedPdfs] = useState<Map<string, string>>(new Map());
  const [processedWords, setProcessedWords] = useState<Map<string, string>>(new Map());
  const [fileProcessingStatus, setFileProcessingStatus] = useState<Map<string, 'processing' | 'completed' | 'error'>>(new Map());
  const [processedDocuments, setProcessedDocuments] = useState<Map<string, { content: string; type: string; pages?: number; fileSize?: number }>>(new Map());
  const [comparativeAnalysisEnabled, setComparativeAnalysisEnabled] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [expandedReasoning, setExpandedReasoning] = useState<{ [key: string]: boolean }>({});
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto" ref={chatContainerRef}>
              {/* Chat content */}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Chat;
