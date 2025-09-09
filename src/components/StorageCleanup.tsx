import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, RefreshCw, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CleanupStats {
  totalFiles: number;
  deletedFiles: number;
  freedSpaceMB: number;
  errors: string[];
}

interface CleanupResult {
  success: boolean;
  stats: CleanupStats;
  message: string;
  timestamp: string;
}

export const StorageCleanup: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<CleanupResult | null>(null);

  const handleManualCleanup = async () => {
    setIsLoading(true);
    try {
      console.log('Starting manual storage cleanup...');
      
      const { data, error } = await supabase.functions.invoke('storage-cleanup', {
        body: { 
          manual: true, 
          triggered_by: 'admin_manual',
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error('Storage cleanup error:', error);
        toast.error(`Erro na função de limpeza: ${error.message}`);
        return;
      }

      console.log('Storage cleanup completed:', data);
      
      if (data && data.success) {
        const result: CleanupResult = {
          success: true,
          stats: {
            totalFiles: data.stats?.totalFiles || 0,
            deletedFiles: data.stats?.deletedFiles || 0,
            freedSpaceMB: parseFloat((data.stats?.freedSpaceMB || 0).toFixed(2)),
            errors: data.stats?.errors || []
          },
          message: data.message || 'Limpeza concluída com sucesso',
          timestamp: new Date().toISOString()
        };
        
        setLastCleanup(result);
        
        if (result.stats.deletedFiles > 0) {
          toast.success(
            `🗑️ Limpeza concluída! ${result.stats.deletedFiles} arquivos removidos, ${result.stats.freedSpaceMB}MB liberados.`,
            { duration: 5000 }
          );
        } else {
          toast.success("✅ Limpeza concluída! Nenhum arquivo antigo encontrado para remover.");
        }
      } else {
        const errorMsg = data?.error || data?.message || 'Erro desconhecido na limpeza';
        toast.error(`❌ Limpeza falhou: ${errorMsg}`);
        
        setLastCleanup({
          success: false,
          stats: { totalFiles: 0, deletedFiles: 0, freedSpaceMB: 0, errors: [errorMsg] },
          message: errorMsg,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error: any) {
      console.error('Manual cleanup failed:', error);
      const errorMsg = error?.message || 'Falha na comunicação com o servidor';
      toast.error(`❌ Falha na limpeza: ${errorMsg}`);
      
      setLastCleanup({
        success: false,
        stats: { totalFiles: 0, deletedFiles: 0, freedSpaceMB: 0, errors: [errorMsg] },
        message: errorMsg,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (result: CleanupResult) => {
    if (result.success) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Sucesso</Badge>;
    } else {
      return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Falhou</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Limpeza de Storage
        </CardTitle>
        <CardDescription>
          Gerencie o espaço de storage removendo arquivos antigos (&gt;7 dias) automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={handleManualCleanup}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {isLoading ? 'Limpando...' : 'Limpar Agora'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-muted-foreground">Limpeza Automática</div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Diária às 2:00 UTC</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Política de Retenção</div>
            <div>Arquivos {'>'}7 dias</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Buckets Monitorados</div>
            <div>images, documents, user-videos, video-refs</div>
          </div>
        </div>

        {lastCleanup && (
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Última Limpeza</h4>
              {getStatusBadge(lastCleanup)}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total de Arquivos</div>
                <div className="font-medium">{lastCleanup.stats.totalFiles}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Arquivos Removidos</div>
                <div className="font-medium text-red-600">{lastCleanup.stats.deletedFiles}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Espaço Liberado</div>
                <div className="font-medium text-green-600">{lastCleanup.stats.freedSpaceMB}MB</div>
              </div>
              <div>
                <div className="text-muted-foreground">Timestamp</div>
                <div className="font-medium text-xs">
                  {new Date(lastCleanup.timestamp).toLocaleString('pt-BR')}
                </div>
              </div>
            </div>

            {lastCleanup.stats.errors && lastCleanup.stats.errors.length > 0 && (
              <div className="mt-2">
                <div className="text-muted-foreground text-sm mb-1">Erros:</div>
                <div className="text-xs bg-red-50 p-2 rounded border">
                  {lastCleanup.stats.errors.map((error, index) => (
                    <div key={index} className="text-red-700">{error}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          ⚠️ A limpeza remove permanentemente arquivos antigos. Esta ação não pode ser desfeita.
        </div>
      </CardContent>
    </Card>
  );
};