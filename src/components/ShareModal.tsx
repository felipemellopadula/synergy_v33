import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Copy, 
  Check, 
  MessageCircle, 
  Send, 
  Twitter, 
  Facebook, 
  Linkedin,
  Mail,
  QrCode,
  Download
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  description?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  url,
  title = "Imagem gerada por IA",
  description = "Confira esta imagem incrível!"
}) => {
  const [copied, setCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500 hover:bg-green-600',
      url: `https://wa.me/?text=${encodedDescription}%20${encodedUrl}`,
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'bg-blue-500 hover:bg-blue-600',
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedDescription}`,
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-sky-500 hover:bg-sky-600',
      url: `https://twitter.com/intent/tweet?text=${encodedDescription}&url=${encodedUrl}`,
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-700 hover:bg-blue-800',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600 hover:bg-gray-700',
      url: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%20${encodedUrl}`,
    },
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Erro ao copiar link");
    }
  };

  const handleShare = (shareUrl: string) => {
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  const handleDownloadQrCode = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedUrl}`;
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = 'qrcode.png';
    link.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar</DialogTitle>
          <DialogDescription>
            Escolha como deseja compartilhar esta imagem
          </DialogDescription>
        </DialogHeader>

        {/* Opções de compartilhamento */}
        <div className="grid grid-cols-3 gap-3 py-4">
          {shareOptions.map((option) => (
            <button
              key={option.name}
              onClick={() => handleShare(option.url)}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg text-white transition-all ${option.color}`}
            >
              <option.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{option.name}</span>
            </button>
          ))}
        </div>

        {/* QR Code */}
        <div className="border-t border-border pt-4">
          <button
            onClick={() => setShowQrCode(!showQrCode)}
            className="flex items-center gap-2 w-full p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            <QrCode className="h-5 w-5" />
            <span className="font-medium">QR Code</span>
          </button>
          
          {showQrCode && (
            <div className="mt-3 flex flex-col items-center gap-3">
              <div className="bg-white p-3 rounded-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodedUrl}`}
                  alt="QR Code"
                  className="w-[150px] h-[150px]"
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadQrCode}>
                <Download className="h-4 w-4 mr-2" />
                Baixar QR Code
              </Button>
            </div>
          )}
        </div>

        {/* Copiar link */}
        <div className="flex items-center gap-2 pt-4 border-t border-border">
          <Input
            value={url}
            readOnly
            className="flex-1 text-sm bg-muted"
          />
          <Button
            size="icon"
            variant="outline"
            onClick={handleCopyLink}
            className="shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
