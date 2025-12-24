import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// HMAC-SHA256 валидация Telegram initData
async function validateTelegramData(initData: string, botToken: string): Promise<{ valid: boolean; data?: Record<string, string> }> {
  try {
    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get('hash')
    
    if (!hash) {
      return { valid: false }
    }
    
    urlParams.delete('hash')
    
    // Сортируем параметры
    const sortedParams = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')
    
    // Создаём секретный ключ
    const encoder = new TextEncoder()
    const secretKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode('WebAppData'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const secretKeyData = await crypto.subtle.sign(
      'HMAC',
      secretKey,
      encoder.encode(botToken)
    )
    
    // Создаём HMAC из данных
    const dataKey = await crypto.subtle.importKey(
      'raw',
      secretKeyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      dataKey,
      encoder.encode(sortedParams)
    )
    
    const calculatedHash = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    if (calculatedHash !== hash) {
      return { valid: false }
    }
    
    // Проверяем TTL (24 часа)
    const authDate = urlParams.get('auth_date')
    if (authDate) {
      const authTimestamp = parseInt(authDate) * 1000
      const now = Date.now()
      const ttl = 24 * 60 * 60 * 1000 // 24 часа
      
      if (now - authTimestamp > ttl) {
        return { valid: false }
      }
    }
    
    // Парсим данные пользователя
    const data: Record<string, string> = {}
    for (const [key, value] of urlParams.entries()) {
      data[key] = value
    }
    
    return { valid: true, data }
  } catch (error) {
    console.error('Validation error:', error)
    return { valid: false }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { initData } = await req.json()
    
    if (!initData) {
      return new Response(
        JSON.stringify({ error: 'Отсутствуют данные авторизации' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not configured')
      return new Response(
        JSON.stringify({ error: 'Сервер не настроен' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Валидируем данные Telegram
    const validation = await validateTelegramData(initData, botToken)
    
    if (!validation.valid || !validation.data) {
      return new Response(
        JSON.stringify({ error: 'Неверные данные авторизации' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Парсим данные пользователя
    const userDataStr = validation.data.user
    if (!userDataStr) {
      return new Response(
        JSON.stringify({ error: 'Данные пользователя не найдены' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const telegramUser = JSON.parse(userDataStr)
    const telegramId = telegramUser.id

    // Создаём сервисный клиент
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Ищем существующий профиль
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('telegram_id', telegramId)
      .single()

    let userId: string

    if (existingProfile) {
      userId = existingProfile.id
      
      // Обновляем данные пользователя
      await supabaseAdmin
        .from('profiles')
        .update({
          username: telegramUser.username,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          last_active_at: new Date().toISOString()
        })
        .eq('id', userId)
    } else {
      // Создаём нового пользователя
      const email = `tg_${telegramId}@petshop.tycoon`
      const password = crypto.randomUUID()
      
      const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      })
      
      if (signUpError || !authData.user) {
        console.error('SignUp error:', signUpError)
        return new Response(
          JSON.stringify({ error: 'Ошибка создания пользователя' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      userId = authData.user.id
      
      // Создаём профиль
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          telegram_id: telegramId,
          username: telegramUser.username,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name
        })
      
      if (profileError) {
        console.error('Profile creation error:', profileError)
      }
    }

    // Генерируем магическую ссылку для получения токена
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: `tg_${telegramId}@petshop.tycoon`
    })

    if (linkError || !linkData) {
      console.error('Link error:', linkError)
      return new Response(
        JSON.stringify({ error: 'Ошибка генерации токена' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Извлекаем токен из ссылки
    const url = new URL(linkData.properties.action_link)
    const token = url.searchParams.get('token') || ''

    return new Response(
      JSON.stringify({
        success: true,
        token,
        tokenType: 'magiclink',
        user: {
          id: userId,
          telegramId,
          username: telegramUser.username,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in telegram-auth:', error)
    return new Response(
      JSON.stringify({ error: 'Внутренняя ошибка сервера' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
