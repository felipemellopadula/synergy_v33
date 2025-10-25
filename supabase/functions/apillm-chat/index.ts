import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = "https://api.apillm.com";
const CHAT_ENDPOINT = `${BASE_URL}/chat/completions`;

// Function to estimate token count (optimized for Portuguese)
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 3.2); // More accurate for Portuguese
}

// Function to split text into chunks
function splitIntoChunks(text: string, maxTokens: number): string[] {
  const maxChars = maxTokens * 3.2;
  const chunks = [];
  
  for (let i = 0; i < text.length; i += maxChars) {
    chunks.push(text.slice(i, i + maxChars));
  }
  
  return chunks;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, model = 'llama-3.2-8b-instruct', files } = await req.json();
    
    console.log('APILLM Chat - Request received:', {
      model,
      messageLength: message?.length || 0,
      messagePreview: message?.substring(0, 200) + '...',
      hasMessage: !!message
    });
    
    const apillmApiKey = Deno.env.get('APILLM_API_KEY');
    if (!apillmApiKey) {
      throw new Error('APILLM_API_KEY não configurada');
    }

    // Define token limits for APILLM models
    const getModelLimits = (modelName: string) => {
      if (modelName.includes('deepseek')) return { input: 120000, output: 4096 };
      if (modelName.includes('llama-4')) return { input: 120000, output: 4096 };
      if (modelName.includes('llama-3.3')) return { input: 120000, output: 4096 };
      if (modelName.includes('llama-3.2')) return { input: 120000, output: 4096 };
      if (modelName.includes('llama-3.1')) return { input: 120000, output: 4096 };
      return { input: 30000, output: 4096 }; // Default for other models
    };

    const limits = getModelLimits(model);
    
    // Log files information
    if (files && files.length > 0) {
      console.log('📄 Files received:', files.map((f: any) => ({ 
        name: f.name, 
        type: f.type, 
        hasPdfContent: !!f.pdfContent,
        hasWordContent: !!f.wordContent
      })));
    }
    
    // Process PDF and DOC files if present
    let finalMessage = message;
    if (files && files.length > 0) {
      const fileContents = [];
      
      files.forEach((file: any) => {
        if (file.pdfContent) {
          fileContents.push(`[PDF: ${file.name}]\n\n${file.pdfContent}`);
        }
        if (file.wordContent) {
          fileContents.push(`[Word: ${file.name}]\n\n${file.wordContent}`);
        }
      });
      
      if (fileContents.length > 0) {
        finalMessage = `${message}\n\n${fileContents.join('\n\n---\n\n')}`;
        console.log('📊 Message with files:', finalMessage.length, 'characters');
      }
    }
    
    const estimatedTokens = estimateTokenCount(finalMessage);
    
    console.log('📊 Token estimation:', { 
      estimatedTokens, 
      inputLimit: limits.input, 
      model,
      messageLength: finalMessage.length,
      hasFiles: files && files.length > 0
    });

    let processedMessage = finalMessage;
    let chunkResponses: string[] = [];

    // If message is too large, process ALL chunks with Map-Reduce
    if (estimatedTokens > limits.input * 0.6) {
      console.log('📄 Large document detected, processing ALL chunks...');
      
      const maxChunkTokens = Math.floor(limits.input * 0.5);
      const chunks = splitIntoChunks(finalMessage, maxChunkTokens);
      
      if (chunks.length > 1) {
        console.log(`🔄 Processing ${chunks.length} chunks...`);
        
        for (let i = 0; i < chunks.length; i++) {
          console.log(`🔄 Processing chunk ${i+1}/${chunks.length}...`);
          
          const chunkResponse = await fetch(CHAT_ENDPOINT, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apillmApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: model,
              messages: [
                { role: 'system', content: 'Você é um assistente de IA prestativo.' },
                { role: 'user', content: `Analise esta parte (${i+1}/${chunks.length}) do documento:\n\n${chunks[i]}` }
              ],
              max_tokens: limits.output,
              temperature: 0.7,
              stream: false
            }),
          });
          
          if (!chunkResponse.ok) {
            const errorData = await chunkResponse.text();
            console.error(`❌ Chunk ${i+1} error:`, errorData);
            throw new Error(`Erro no chunk ${i+1}: ${chunkResponse.status}`);
          }
          
          const chunkData = await chunkResponse.json();
          const chunkText = chunkData.choices?.[0]?.message?.content || '';
          chunkResponses.push(chunkText);
          console.log(`✅ Chunk ${i+1} processed:`, chunkText.length, 'characters');
        }
        
        // Consolidate all responses
        console.log('🔄 Consolidating', chunkResponses.length, 'chunk responses...');
        processedMessage = `Consolidar as análises das ${chunks.length} partes:\n\n${
          chunkResponses.map((r, i) => `PARTE ${i+1}:\n${r}`).join('\n\n---\n\n')
        }\n\nPergunta original: ${message}`;
      }
    }

    console.log('Sending request to APILLM with model:', model);

    const response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apillmApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente de IA prestativo, preciso e versátil.'
          },
          {
            role: 'user',
            content: processedMessage
          }
        ],
        max_tokens: limits.output,
        temperature: 0.7,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('APILLM API error:', errorData);
      throw new Error(`Erro da API APILLM: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    let generatedText = data.choices?.[0]?.message?.content || 'Não foi possível gerar resposta';
    
    // Normalize line breaks to standard \n
    generatedText = generatedText
      .replace(/\r\n/g, '\n')  // Normalize CRLF to LF
      .replace(/\r/g, '\n');   // Convert any remaining CR to LF

    console.log('APILLM response received successfully');

    // Record token usage in database  
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (token) {
      try {
        // Get user info from JWT
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        const { data: { user } } = await supabase.auth.getUser(token);
        const userId = user?.id;
        
        if (userId) {
          // Calculate token usage - 3.2 characters = 1 token (optimized for Portuguese)
          const inputTokens = Math.ceil((finalMessage?.length || 0) / 3.2);
          const outputTokens = Math.ceil(generatedText.length / 3.2);
          const totalTokens = inputTokens + outputTokens;
          
          console.log('Recording APILLM token usage:', {
            userId,
            model,
            inputTokens,
            outputTokens,
            totalTokens
          });

          // Save token usage to database
          const { error: tokenError } = await supabase
            .from('token_usage')
            .insert({
              user_id: userId,
              model_name: model,
              tokens_used: totalTokens,
              input_tokens: inputTokens,
              output_tokens: outputTokens,
              message_content: message?.length > 1000 
                ? message.substring(0, 1000) + '...' 
                : message,
              ai_response_content: generatedText.length > 2000
                ? generatedText.substring(0, 2000) + '...'
                : generatedText,
              created_at: new Date().toISOString()
            });

          if (tokenError) {
            console.error('Error saving token usage:', tokenError);
          } else {
            console.log('Token usage recorded successfully');
          }
        }
      } catch (tokenRecordError) {
        console.error('Error recording token usage:', tokenRecordError);
      }
    }

    // Create document context for follow-ups
    let documentContext = null;
    if (chunkResponses.length > 0) {
      const compactSummary = generatedText.length > 2000 
        ? generatedText.substring(0, 2000) + '...\n\n[Resposta completa disponível no histórico]'
        : generatedText;
      
      documentContext = {
        summary: compactSummary,
        totalChunks: chunkResponses.length,
        fileNames: files?.map((f: any) => f.name),
        estimatedTokens: estimateTokenCount(finalMessage),
        processedAt: new Date().toISOString()
      };
      
      console.log('📄 Document context created:', {
        fileNames: documentContext.fileNames,
        totalChunks: documentContext.totalChunks,
        tokens: documentContext.estimatedTokens
      });
    }

    return new Response(JSON.stringify({ 
      response: generatedText,
      documentContext 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro na função apillm-chat:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});