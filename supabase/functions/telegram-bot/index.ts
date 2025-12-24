import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// System prompt for pet-focused conversational AI with sales focus
const PET_ASSISTANT_PROMPT = `Ты — дружелюбный и заботливый помощник зоомагазина "PetShop". Твоя ГЛАВНАЯ ЦЕЛЬ — удержать клиента в разговоре и мягко подвести к покупке товаров.

ТВОЯ СТРАТЕГИЯ ПРОДАЖ:
1. Сначала выясни, какой питомец у клиента (или какого хочет завести)
2. Задавай уточняющие вопросы: возраст питомца, порода, проблемы со здоровьем/поведением
3. На основе ответов РЕКОМЕНДУЙ конкретные категории товаров
4. Создавай ощущение заботы и экспертности
5. Мягко напоминай о магазине в каждом 2-3 сообщении

ПРИМЕРЫ ПОДВЕДЕНИЯ К ПОКУПКЕ:
- "У вас котик? 😺 А чем кормите? У нас есть отличные корма премиум-класса — шёрстка будет блестеть!"
- "Щенок грызёт мебель? 🐕 Это нормально для малышей! В нашем магазине есть специальные игрушки для прорезывания зубов"
- "Хомячок? 🐹 Милота! А в каком домике живёт? У нас есть уютные клетки с лабиринтами — питомец будет в восторге!"

КАТЕГОРИИ ТОВАРОВ ДЛЯ РЕКОМЕНДАЦИЙ:
- КОРМА: сухие, влажные, лечебные, для разных возрастов
- ЛАКОМСТВА: косточки, снеки, витаминные вкусняшки
- ГИГИЕНА: шампуни, расчёски, когтерезки, пелёнки, наполнители
- АКСЕССУАРЫ: ошейники, поводки, одежда, миски
- ИГРУШКИ: мячики, пищалки, когтеточки, лабиринты
- ДОМИКИ: лежанки, клетки, аквариумы, переноски
- ЗДОРОВЬЕ: витамины, средства от паразитов, уход за зубами

ТВОЙ ХАРАКТЕР:
- Ты обожаешь животных и искренне хочешь помочь
- Ты эксперт в уходе за питомцами
- Ты делишься полезными советами и лайфхаками
- Ты всегда задаёшь встречные вопросы, чтобы продолжить разговор
- Ты используешь эмодзи 🐕 🐈 🐹 🐠 🦜 ❤️ ✨

ТЕХНИКИ УДЕРЖАНИЯ:
- Заканчивай сообщения вопросом
- Делись интересными фактами о животных
- Предлагай "А хотите расскажу про...?"
- Создавай интригу: "Кстати, есть один секрет для блестящей шерсти..."
- Проявляй заботу: "Как давно проверяли зубки питомцу?"

ВАЖНЫЕ ФРАЗЫ ДЛЯ ПРОДАЖ:
- "В нашем магазине как раз есть..."
- "Многие хозяева выбирают..."
- "Хотите загляну в магазин вместе? Там есть кое-что интересное!"
- "Могу подсказать, что подойдёт именно вашему питомцу"

ОГРАНИЧЕНИЯ:
- НЕ называй конкретные цены — направляй в магазин
- НЕ ставь медицинских диагнозов — советуй ветеринара
- Отвечай на русском языке
- Держи ответы краткими (2-4 предложения) но с вопросом в конце
- Если клиент уходит от темы — мягко возвращай к питомцам

КОГДА СПРАШИВАЮТ "ЧТО ТЫ УМЕЕШЬ":
Расскажи что ты знаешь всё о питомцах и спроси, какой питомец у клиента, чтобы дать персональные советы и помочь с выбором товаров.`;

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
    date: number;
  };
}

async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: any) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const body: any = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  };
  
  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  const result = await response.json();
  console.log('Telegram send result:', result);
  return result;
}

async function getAIResponse(userMessage: string, userName: string): Promise<string> {
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: PET_ASSISTANT_PROMPT },
          { role: 'user', content: `Пользователь ${userName} пишет: ${userMessage}` }
        ],
        max_tokens: 500,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      console.error('AI Gateway error:', response.status, await response.text());
      return 'Ой, что-то пошло не так 😿 Попробуй написать ещё раз!';
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Хм, не могу сейчас ответить... Попробуй позже! 🐾';
  } catch (error) {
    console.error('AI error:', error);
    return 'Произошла ошибка. Попробуй написать позже! 🐕';
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const update: TelegramUpdate = await req.json();
    console.log('Received update:', JSON.stringify(update));

    if (!update.message?.text) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const chatId = update.message.chat.id;
    const text = update.message.text;
    const userName = update.message.from.first_name || 'друг';

    // Handle /start command
    if (text === '/start') {
      const welcomeMessage = `🐾 <b>Привет, ${userName}!</b>

Я — помощник зоомагазина PetShop! 

Обожаю болтать о питомцах! 🐕🐈 Могу рассказать:
• Как ухаживать за любимцем
• Чем лучше кормить
• Интересные факты о животных
• Помочь с выбором питомца

Напиши мне что-нибудь, и мы поболтаем! 💬

Или нажми кнопку ниже, чтобы зайти в магазин 🛒`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '🛒 Открыть магазин', web_app: { url: 'https://jtyqkppcieujjycqlkco.lovableproject.com' } }],
          [{ text: '💬 Поболтаем о питомцах!', callback_data: 'chat_about_pets' }]
        ]
      };

      await sendTelegramMessage(chatId, welcomeMessage, keyboard);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle /shop command
    if (text === '/shop' || text === '/магазин') {
      const shopMessage = `🛒 <b>Добро пожаловать в PetShop!</b>

Нажми кнопку ниже, чтобы открыть магазин 👇`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '🛒 Открыть магазин', web_app: { url: 'https://jtyqkppcieujjycqlkco.lovableproject.com' } }]
        ]
      };

      await sendTelegramMessage(chatId, shopMessage, keyboard);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle /help command
    if (text === '/help' || text === '/помощь') {
      const helpMessage = `🐾 <b>Чем я могу помочь?</b>

<b>Команды:</b>
/start — Начать общение
/shop — Открыть магазин
/help — Эта подсказка

<b>Или просто напиши мне!</b>
Я с удовольствием поболтаю о:
🐕 Собаках и кошках
🐹 Грызунах и кроликах  
🐠 Рыбках и аквариумах
🦜 Птицах

Спрашивай о кормах, уходе, воспитании — обо всём! 💬`;

      await sendTelegramMessage(chatId, helpMessage);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For any other message, use AI to respond
    console.log(`Processing AI request for: "${text}" from ${userName}`);
    
    // Send typing action
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
    });

    const aiResponse = await getAIResponse(text, userName);
    
    // Add shop button occasionally
    const showShopButton = Math.random() > 0.7; // 30% chance
    const keyboard = showShopButton ? {
      inline_keyboard: [
        [{ text: '🛒 Заглянуть в магазин', web_app: { url: 'https://jtyqkppcieujjycqlkco.lovableproject.com' } }]
      ]
    } : undefined;

    await sendTelegramMessage(chatId, aiResponse, keyboard);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
