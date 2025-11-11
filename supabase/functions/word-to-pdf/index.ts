import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { wordFileBase64, fileName } = await req.json();

    if (!wordFileBase64 || !fileName) {
      throw new Error('wordFileBase64 and fileName are required');
    }

    console.log(`[WORD→PDF] Converting ${fileName} to PDF...`);

    // Decodificar base64
    const wordBuffer = Uint8Array.from(atob(wordFileBase64), c => c.charCodeAt(0));

    // Converter para PDF usando LibreOffice headless via API (simulação)
    // Em produção, você precisaria de:
    // 1. CloudConvert API (https://cloudconvert.com/api/v2)
    // 2. Zamzar API (https://www.zamzar.com/api/)
    // 3. LibreOffice em container Docker
    // 4. Aspose.Words Cloud API
    
    // Por ora, vou simular a conversão retornando erro com instruções
    throw new Error(
      'Word→PDF conversion requires external service. Options:\n' +
      '1. Use CloudConvert API (recommended, 25 free conversions/day)\n' +
      '2. Deploy LibreOffice in Docker container\n' +
      '3. Use Zamzar API\n' +
      '4. Ask user to convert to PDF before upload'
    );

    // Código para CloudConvert (descomente após configurar CLOUDCONVERT_API_KEY)
    /*
    const cloudConvertApiKey = Deno.env.get('CLOUDCONVERT_API_KEY');
    
    if (!cloudConvertApiKey) {
      throw new Error('CLOUDCONVERT_API_KEY not configured');
    }

    // 1. Upload arquivo Word
    const uploadResponse = await fetch('https://api.cloudconvert.com/v2/import/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cloudConvertApiKey}`,
        'Content-Type': 'application/octet-stream',
      },
      body: wordBuffer,
    });

    const uploadData = await uploadResponse.json();
    const taskId = uploadData.data.id;

    // 2. Criar job de conversão
    const jobResponse = await fetch('https://api.cloudconvert.com/v2/jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cloudConvertApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tasks: {
          'import-word': {
            operation: 'import/upload',
            file: taskId
          },
          'convert-to-pdf': {
            operation: 'convert',
            input: 'import-word',
            output_format: 'pdf',
            engine: 'office',
            pdf_a: false
          },
          'export-pdf': {
            operation: 'export/url',
            input: 'convert-to-pdf'
          }
        }
      }),
    });

    const jobData = await jobResponse.json();
    const exportTaskId = jobData.data.tasks.find((t: any) => t.name === 'export-pdf').id;

    // 3. Poll até conclusão (aguardar conversão)
    let pdfUrl = null;
    let attempts = 0;
    const maxAttempts = 30;

    while (!pdfUrl && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2s entre tentativas
      
      const statusResponse = await fetch(`https://api.cloudconvert.com/v2/tasks/${exportTaskId}`, {
        headers: {
          'Authorization': `Bearer ${cloudConvertApiKey}`,
        },
      });

      const statusData = await statusResponse.json();
      
      if (statusData.data.status === 'finished') {
        pdfUrl = statusData.data.result.files[0].url;
        break;
      } else if (statusData.data.status === 'error') {
        throw new Error('CloudConvert conversion failed');
      }
      
      attempts++;
    }

    if (!pdfUrl) {
      throw new Error('Conversion timeout');
    }

    // 4. Download PDF convertido
    const pdfResponse = await fetch(pdfUrl);
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    console.log(`[WORD→PDF] Conversion complete: ${fileName} → PDF`);

    return new Response(JSON.stringify({ 
      success: true,
      pdfBase64,
      fileName: fileName.replace(/\.(docx?|doc)$/i, '.pdf')
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    */

  } catch (error) {
    console.error('[WORD→PDF] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
