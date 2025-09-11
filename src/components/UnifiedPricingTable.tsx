import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PricingData {
  input: number;
  output: number;
}

interface ImagePricingData {
  cost: number;
}

interface UnifiedPricingTableProps {
  selectedProvider: 'openai' | 'gemini' | 'claude' | 'grok' | 'deepseek' | 'image' | 'todos';
  openaiPricing: Record<string, PricingData>;
  geminiPricing: Record<string, PricingData>;
  claudePricing: Record<string, PricingData>;
  grokPricing: Record<string, PricingData>;
  deepseekPricing: Record<string, PricingData>;
  imagePricing: Record<string, ImagePricingData>;
}

export default function UnifiedPricingTable({ 
  selectedProvider, 
  openaiPricing, 
  geminiPricing, 
  claudePricing, 
  grokPricing,
  deepseekPricing,
  imagePricing
}: UnifiedPricingTableProps) {
  
  const getAllModels = () => {
    const models: Array<{
      name: string;
      provider: string;
      pricing: PricingData;
      color: string;
    }> = [];

    if (selectedProvider === 'todos' || selectedProvider === 'openai') {
      Object.entries(openaiPricing).forEach(([model, pricing]) => {
        models.push({
          name: model,
          provider: 'OpenAI',
          pricing,
          color: 'text-blue-400'
        });
      });
    }

    if (selectedProvider === 'todos' || selectedProvider === 'gemini') {
      Object.entries(geminiPricing).forEach(([model, pricing]) => {
        models.push({
          name: model,
          provider: 'Google Gemini',
          pricing,
          color: 'text-green-400'
        });
      });
    }

    if (selectedProvider === 'todos' || selectedProvider === 'claude') {
      Object.entries(claudePricing).forEach(([model, pricing]) => {
        models.push({
          name: model,
          provider: 'Anthropic Claude',
          pricing,
          color: 'text-purple-400'
        });
      });
    }

    if (selectedProvider === 'todos' || selectedProvider === 'grok') {
      Object.entries(grokPricing).forEach(([model, pricing]) => {
        models.push({
          name: model,
          provider: 'xAI Grok',
          pricing,
          color: 'text-orange-400'
        });
      });
    }

    if (selectedProvider === 'todos' || selectedProvider === 'deepseek') {
      Object.entries(deepseekPricing).forEach(([model, pricing]) => {
        models.push({
          name: model,
          provider: 'DeepSeek',
          pricing,
          color: 'text-blue-400'
        });
      });
    }

    if (selectedProvider === 'todos' || selectedProvider === 'image') {
      Object.entries(imagePricing).forEach(([model, pricingData]) => {
        models.push({
          name: model,
          provider: 'Modelos de Imagem',
          pricing: { input: pricingData.cost, output: 0 }, // Image models don't have output tokens
          color: 'text-pink-400'
        });
      });
    }

    return models;
  };

  const models = getAllModels();

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">Modelo</TableHead>
            <TableHead className="text-left">Provedor</TableHead>
            <TableHead className="text-right">Entrada (USD/1M tokens)</TableHead>
            <TableHead className="text-right">Saída (USD/1M tokens)</TableHead>
            <TableHead className="text-right">Custo por Token (Entrada)</TableHead>
            <TableHead className="text-right">Custo por Token (Saída)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {models.map((model, index) => {
            const isGeminiModel = model.provider === 'Google Gemini';
            const isImageModel = model.provider === 'Modelos de Imagem';
            
            let inputPrice: number;
            let outputPrice: number;
            let inputCostPerToken: number;
            let outputCostPerToken: number;
            
            if (isImageModel) {
              // For image models, show cost per image instead of per token
              inputPrice = model.pricing.input;
              outputPrice = 0;
              inputCostPerToken = model.pricing.input;
              outputCostPerToken = 0;
            } else if (isGeminiModel) {
              inputPrice = model.pricing.input * 1_000_000;
              outputPrice = model.pricing.output * 1_000_000;
              inputCostPerToken = model.pricing.input;
              outputCostPerToken = model.pricing.output;
            } else {
              inputPrice = model.pricing.input;
              outputPrice = model.pricing.output;
              inputCostPerToken = model.pricing.input / 1_000_000;
              outputCostPerToken = model.pricing.output / 1_000_000;
            }

            return (
              <TableRow key={`${model.provider}-${model.name}-${index}`}>
                <TableCell className="font-medium">{model.name}</TableCell>
                <TableCell className={`text-sm ${model.color}`}>{model.provider}</TableCell>
                <TableCell className={`text-right ${model.color}`}>
                  {isImageModel ? `$${inputPrice.toFixed(4)} por imagem` : `$${inputPrice.toFixed(2)}`}
                </TableCell>
                <TableCell className={`text-right ${model.color}`}>
                  {isImageModel ? '-' : `$${outputPrice.toFixed(2)}`}
                </TableCell>
                <TableCell className={`text-right ${model.color}`}>
                  {isImageModel ? `$${inputCostPerToken.toFixed(4)}` : `$${inputCostPerToken.toFixed(10)}`}
                </TableCell>
                <TableCell className={`text-right ${model.color}`}>
                  {isImageModel ? '-' : `$${outputCostPerToken.toFixed(10)}`}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}