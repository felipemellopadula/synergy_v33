// Caminho: supabase/functions/ai-chat/index.ts

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- INTERFACES ---
interface ChatFile {
  name: string;
  type: string;
  pdfContent?: string;
}

interface ChatRequest {
  message: string;
  model: string;
  files?: ChatFile[];
}

// --- FUNÇÕES AUXILIARES DE FATIAMENTO (CHUNKING) ---
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 3.5); // Aproximação segura para português
}

function splitIntoChunks(text: string, maxChars: number): string[] {
  const chunks = [];
  for (let i = 0; i < text.length; i += maxChars) {
    chunks.push(text.slice(i, i + maxChars));
  }
  return chunks;
}


// --- LÓGICA PRINCIPAL DA FUNÇÃO ---
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, model, files }: ChatRequest = await req.json();
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY não foi encontrada.");
    }
    if (!model) {
      throw new Error('O modelo é obrigatório.');
    }

    // --- TRADUÇÃO DE MODELOS (Mantida para compatibilidade) ---
    let apiModel = model;
    if (model.includes('gpt-5-mini') || model.includes('gpt-5-nano')) apiModel = 'gpt-4o-mini';
    else if (model.includes('gpt-5')) apiModel = 'gpt-4o';
    else if (model.includes('gpt-4.1')) apiModel = 'gpt-4-turbo';

    console.log(`Model mapping: '${model}' -> '${apiModel}'`);
    
    // --- LÓGICA DE CONTEÚDO ---
    let fullContent = message;
    let isPdfRequest = false;
    let fileName = '';

    if (files && files.length > 0 && files[0].pdfContent) {
        fileName = files[0].name;
        isPdfRequest = true;
        // O frontend já monta o prompt otimizado para PDF, então usamos ele
        fullContent = files[0].pdfContent;
    }
    
    if (!fullContent || !fullContent.trim()) {
        throw new Error("A mensagem para a IA está vazia.");
    }

    // --- A SOLUÇÃO: LÓGICA DE FATIAMENTO (CHUNKING) ---
    const INPUT_TOKEN_LIMIT = 15000; // Limite seguro e agressivo de 15k tokens, como na imagem.
    const estimatedTokens = estimateTokenCount(fullContent);
    
    let processedMessage = fullContent;
    let responsePrefix = '';

    console.log(`Tokens estimados: ${estimatedTokens}. Limite de processamento: ${INPUT_TOKEN_LIMIT}`);

    if (isPdfRequest && estimatedTokens > INPUT_TOKEN_LIMIT) {
      const maxChars = INPUT_TOKEN_LIMIT * 3.5;
      const chunks = splitIntoChunks(fullContent, maxChars);
      
      console.log(`PDF grande detectado. Fatiado em ${chunks.length} partes. Processando a primeira parte.`);

      responsePrefix = `⚠️ **Atenção:** O documento "${fileName}" é muito grande. Para evitar exceder os limites da API, a análise abaixo foi feita com base **apenas no início do documento**.\n\n---\n\n`;
      
      // Monta a mensagem para a IA analisar apenas o primeiro pedaço.
      processedMessage = chunks[0];
    }
    
    // --- MONTAGEM E ENVIO DA REQUISIÇÃO PARA A OPENAI ---
    const requestBody = {
      model: apiModel,
      messages: [
        { role: 'system', content: 'Você é um assistente prestativo, especializado em analisar documentos e responder em português do Brasil.' },
        { role: 'user', content: processedMessage }
      ],
      max_tokens: 4096,
      temperature: 0.5,
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Erro na API da OpenAI: ${errorBody}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content ?? 'Desculpe, não consegui obter uma resposta.';
    const finalResponse = responsePrefix + generatedText;

    // A sua UI espera um objeto com `content` e `reasoning`, então vamos manter esse formato
    return new Response(JSON.stringify({ response: { content: finalResponse, reasoning: null } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro fatal na função ai-chat:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});