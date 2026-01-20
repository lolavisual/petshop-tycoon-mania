import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to fetch products for recommendations
async function fetchProductsForRecommendation(): Promise<string> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: products, error } = await supabase
      .from('pet_products')
      .select('id, name, name_ru, category, price, description_ru, image_url')
      .eq('in_stock', true)
      .limit(50);
    
    if (error || !products) return '';
    
    const productList = products.map(p => 
      `- ID:${p.id} | ${p.name_ru} | Категория: ${p.category} | Цена: ${p.price}₽ | ${p.description_ru || ''}`
    ).join('\n');
    
    return `\n\nДоступные товары в магазине для рекомендаций:\n${productList}`;
  } catch (e) {
    console.error('Error fetching products:', e);
    return '';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, options } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Messages array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Lovable AI not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if images are present (for product recommendations)
    const hasImages = messages.some((msg: { content: string | Array<{ type: string }> }) => 
      Array.isArray(msg.content) && msg.content.some((part: { type: string }) => part.type === 'image_url')
    );

    // Fetch products for recommendations when analyzing images
    let productContext = '';
    if (hasImages && options?.includeProductRecommendations !== false) {
      productContext = await fetchProductsForRecommendation();
    }

    // Default system prompt for pet shop assistant with product recommendations
    const baseSystemPrompt = options?.systemPrompt || `Ты — дружелюбный и знающий помощник зоомагазина PetShop. 
Ты помогаешь с вопросами о:
- Уходе за питомцами (кормление, здоровье, воспитание)
- Выборе товаров для животных
- Рекомендациях по породам
- Игровых советах для PetShop Tycoon

Отвечай кратко и по делу, используй эмодзи для дружелюбности.`;

    // Enhanced prompt for image analysis with product recommendations
    const imageAnalysisInstructions = hasImages ? `

ВАЖНО: При анализе фото питомца:
1. Определи породу/вид животного
2. Оцени примерный возраст
3. Отметь видимые особенности (окрас, размер)
4. Дай рекомендации по уходу

ОБЯЗАТЕЛЬНО: В конце ответа добавь секцию рекомендаций товаров в формате:
---PRODUCT_RECOMMENDATIONS---
[{"id": "product_id", "reason": "Почему этот товар подходит"}]
---END_RECOMMENDATIONS---

Выбери 2-4 наиболее подходящих товара из списка ниже, основываясь на виде/породе питомца.${productContext}` : '';

    const systemPrompt = baseSystemPrompt + imageAnalysisInstructions;

    // Process messages to handle image content
    const processedMessages = messages.map((msg: { role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }) => {
      if (typeof msg.content === 'string') {
        return msg;
      }
      // Handle multimodal content (text + images)
      if (Array.isArray(msg.content)) {
        return {
          role: msg.role,
          content: msg.content.map((part: { type: string; text?: string; image_url?: { url: string } }) => {
            if (part.type === 'text') {
              return { type: 'text', text: part.text };
            }
            if (part.type === 'image_url') {
              return { type: 'image_url', image_url: part.image_url };
            }
            return part;
          })
        };
      }
      return msg;
    });

    const allMessages = [
      { role: 'system', content: systemPrompt },
      ...processedMessages
    ];
    
    // Use Gemini 2.5 Pro for multimodal (images), otherwise flash for speed
    const model = hasImages 
      ? 'google/gemini-2.5-pro' 
      : (options?.model || 'google/gemini-3-flash-preview');

    console.log(`Lovable AI chat with model: ${model}, hasImages: ${hasImages}`);

    // For streaming (only for text-only requests)
    if (options?.stream && !hasImages) {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: allMessages,
          max_tokens: options?.maxTokens || 1000,
          temperature: options?.temperature || 0.7,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Lovable AI error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ success: false, error: 'Credits exhausted. Please add funds.' }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: false, error: 'AI service error' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    // Non-streaming (required for images)
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: allMessages,
        max_tokens: options?.maxTokens || 2000, // Increased for product recommendations
        temperature: options?.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ success: false, error: 'Credits exhausted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: false, error: 'AI service error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';
    let productRecommendations: Array<{id: string, reason: string}> = [];

    // Extract product recommendations from response
    const recMatch = content.match(/---PRODUCT_RECOMMENDATIONS---\n?([\s\S]*?)\n?---END_RECOMMENDATIONS---/);
    if (recMatch) {
      try {
        productRecommendations = JSON.parse(recMatch[1].trim());
        // Remove the recommendation markers from the displayed content
        content = content.replace(/---PRODUCT_RECOMMENDATIONS---[\s\S]*?---END_RECOMMENDATIONS---/, '').trim();
      } catch (e) {
        console.error('Error parsing product recommendations:', e);
      }
    }

    console.log('Lovable AI response received, recommendations:', productRecommendations.length);
    return new Response(
      JSON.stringify({
        success: true,
        content,
        productRecommendations,
        model: data.model,
        usage: data.usage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in Lovable AI chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process chat';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
