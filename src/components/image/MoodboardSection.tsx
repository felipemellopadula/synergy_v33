import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Palette,
  Plus,
  Trash2,
  Upload,
  X,
  Loader2,
  Check,
  Image as ImageIcon,
  Edit2,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Moodboard, MoodboardImage } from '@/hooks/useMoodboards';

interface MoodboardSectionProps {
  moodboards: Moodboard[];
  selectedMoodboard: Moodboard | null;
  moodboardImages: MoodboardImage[];
  isLoading: boolean;
  isUploadingImages: boolean;
  onSelectMoodboard: (moodboard: Moodboard | null) => void;
  onCreateMoodboard: (name: string, description?: string) => Promise<Moodboard | null>;
  onUpdateMoodboard: (id: string, updates: Partial<Moodboard>) => Promise<boolean>;
  onDeleteMoodboard: (id: string) => Promise<boolean>;
  onAddImages: (moodboardId: string, files: File[]) => Promise<number>;
  onRemoveImage: (imageId: string) => Promise<boolean>;
}

export const MoodboardSection = ({
  moodboards,
  selectedMoodboard,
  moodboardImages,
  isLoading,
  isUploadingImages,
  onSelectMoodboard,
  onCreateMoodboard,
  onUpdateMoodboard,
  onDeleteMoodboard,
  onAddImages,
  onRemoveImage,
}: MoodboardSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<Moodboard | null>(null);
  const [newMoodboardName, setNewMoodboardName] = useState('');
  const [editingMoodboard, setEditingMoodboard] = useState<Moodboard | null>(null);
  const [editName, setEditName] = useState('');
  const [viewingMoodboard, setViewingMoodboard] = useState<Moodboard | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    if (!newMoodboardName.trim()) return;
    const moodboard = await onCreateMoodboard(newMoodboardName.trim());
    if (moodboard) {
      setNewMoodboardName('');
      setShowCreateDialog(false);
      setViewingMoodboard(moodboard);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteDialog) return;
    await onDeleteMoodboard(showDeleteDialog.id);
    setShowDeleteDialog(null);
    if (viewingMoodboard?.id === showDeleteDialog.id) {
      setViewingMoodboard(null);
    }
  };

  const handleEdit = async () => {
    if (!editingMoodboard || !editName.trim()) return;
    await onUpdateMoodboard(editingMoodboard.id, { name: editName.trim() });
    setEditingMoodboard(null);
    setEditName('');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !viewingMoodboard) return;
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      await onAddImages(viewingMoodboard.id, files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectMoodboard = (moodboard: Moodboard) => {
    if (selectedMoodboard?.id === moodboard.id) {
      onSelectMoodboard(null);
    } else {
      onSelectMoodboard(moodboard);
    }
  };

  // Se estiver vendo um moodboard específico
  if (viewingMoodboard) {
    return (
      <div className="border-t">
        {/* Header com navegação */}
        <div className="flex items-center gap-2 p-3 border-b">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewingMoodboard(null)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{viewingMoodboard.name}</h3>
            <p className="text-xs text-muted-foreground">
              {viewingMoodboard.image_count}/14 imagens
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setEditingMoodboard(viewingMoodboard);
              setEditName(viewingMoodboard.name);
            }}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={() => setShowDeleteDialog(viewingMoodboard)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Grid de imagens */}
        <div className="p-3">
          <div className="grid grid-cols-3 gap-2">
            {/* Botão de adicionar */}
            <Button
              variant="outline"
              className="aspect-square h-auto flex flex-col items-center justify-center gap-1 border-dashed"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImages || viewingMoodboard.image_count >= 14}
            >
              {isUploadingImages ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span className="text-[9px]">Adicionar</span>
                </>
              )}
            </Button>

            {/* Imagens existentes */}
            {moodboardImages.map((img) => (
              <div
                key={img.id}
                className="relative aspect-square rounded-md overflow-hidden group"
              >
                <img
                  src={img.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => onRemoveImage(img.id)}
                  className="absolute top-0.5 right-0.5 p-1 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-2.5 w-2.5 text-white" />
                </button>
              </div>
            ))}
          </div>

          {/* Botão de selecionar */}
          <Button
            className="w-full mt-3"
            size="sm"
            variant={selectedMoodboard?.id === viewingMoodboard.id ? "secondary" : "default"}
            onClick={() => handleSelectMoodboard(viewingMoodboard)}
            disabled={viewingMoodboard.image_count === 0}
          >
            {selectedMoodboard?.id === viewingMoodboard.id ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1.5" />
                Selecionado
              </>
            ) : (
              'Usar este Moodboard'
            )}
          </Button>
        </div>

        {/* Input de arquivo oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Dialog de editar */}
        <Dialog open={!!editingMoodboard} onOpenChange={() => setEditingMoodboard(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Moodboard</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingMoodboard(null)}>
                Cancelar
              </Button>
              <Button onClick={handleEdit} disabled={!editName.trim()}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de excluir */}
        <AlertDialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir moodboard?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Todas as imagens deste moodboard serão excluídas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Seção colapsável de moodboards
  return (
    <>
      <div className="border-t">
        {/* Header clicável */}
        <button
          className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">Moodboards</span>
            {selectedMoodboard && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                Ativo
              </Badge>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Conteúdo expandido */}
        {isExpanded && (
          <div className="px-4 pb-4">
            {/* Botão criar novo */}
            <Button
              size="sm"
              variant="outline"
              className="w-full mb-3"
              onClick={() => setShowCreateDialog(true)}
              disabled={moodboards.length >= 10}
            >
              <Plus className="h-4 w-4 mr-1" />
              Novo Moodboard
            </Button>

            {/* Lista de moodboards */}
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : moodboards.length === 0 ? (
              <div className="text-center py-4">
                <Palette className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">
                  Defina estilos visuais para suas gerações
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {moodboards.map((moodboard) => (
                  <div
                    key={moodboard.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                      selectedMoodboard?.id === moodboard.id
                        ? "bg-primary/10 ring-1 ring-primary/30"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setViewingMoodboard(moodboard)}
                  >
                    {/* Preview */}
                    <div className="w-10 h-10 rounded-md overflow-hidden bg-muted shrink-0">
                      {moodboard.preview_url ? (
                        <img
                          src={moodboard.preview_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs truncate">{moodboard.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {moodboard.image_count} {moodboard.image_count === 1 ? 'imagem' : 'imagens'}
                      </p>
                    </div>

                    {/* Indicador de selecionado */}
                    {selectedMoodboard?.id === moodboard.id && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialog de criar */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Moodboard</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Ex: Estilo Vintage"
                value={newMoodboardName}
                onChange={(e) => setNewMoodboardName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!newMoodboardName.trim()}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
