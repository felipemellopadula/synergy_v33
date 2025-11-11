import { supabase } from '@/integrations/supabase/client';
import type { LayoutElement, ExtractedTable } from './PdfProcessor';

export interface WordVisionResult {
  success: boolean;
  content?: string;
  layout?: LayoutElement[];
  tables?: ExtractedTable[];
  pageCount?: number;
  error?: string;
}

export class WordVisionProcessor {
  /**
   * Processa documento Word com Vision API para máxima qualidade
   * Fluxo: Word → PDF (backend) → Vision API (páginas)
   */
  static async processWithVision(
    file: File,
    onProgress?: (current: number, total: number, status: string) => void
  ): Promise<WordVisionResult> {
    try {
      console.log('🔬 Starting Word Vision API processing...');
      
      if (onProgress) {
        onProgress(1, 10, 'Convertendo Word para PDF...');
      }

      // 1. Converter arquivo para base64
      const base64 = await this.fileToBase64(file);
      
      // 2. Converter Word→PDF no backend
      const { data: conversionData, error: conversionError } = await supabase.functions.invoke(
        'word-to-pdf',
        {
          body: {
            wordFileBase64: base64,
            fileName: file.name
          }
        }
      );

      if (conversionError || !conversionData?.success) {
        throw new Error(
          conversionData?.error || 
          conversionError?.message || 
          'Falha na conversão Word→PDF. Configure CLOUDCONVERT_API_KEY ou use upload de PDF.'
        );
      }

      if (onProgress) {
        onProgress(2, 10, 'Convertido para PDF com sucesso!');
      }

      // 3. Processar PDF com PdfProcessor (usa Vision API automaticamente)
      const { PdfProcessor } = await import('./PdfProcessor');
      
      // Converter base64 de volta para File
      const pdfBlob = this.base64ToBlob(conversionData.pdfBase64, 'application/pdf');
      const pdfFile = new File([pdfBlob], conversionData.fileName, { type: 'application/pdf' });
      
      // Processar com pipeline Vision API do PDF
      const pdfResult = await PdfProcessor.processPdf(
        pdfFile,
        false, // useFullOCR
        (current, total, status) => {
          if (onProgress) {
            // Offset progress: 2-10 para processamento PDF
            onProgress(current + 2, 10, status);
          }
        }
      );

      if (!pdfResult.success) {
        throw new Error(pdfResult.error || 'Falha ao processar PDF com Vision API');
      }

      console.log('✅ Word Vision API processing complete');

      return {
        success: true,
        content: pdfResult.content,
        layout: pdfResult.layout,
        tables: pdfResult.tables,
        pageCount: pdfResult.pageCount
      };

    } catch (error: any) {
      console.error('[WordVision] Error:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido no processamento Vision'
      };
    }
  }

  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private static base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }
}
