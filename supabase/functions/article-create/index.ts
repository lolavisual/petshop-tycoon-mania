import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MIN_CONTENT_LENGTH = 50

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { title, content } = await req.json()

    // Валидация
    if (!title || !title.trim()) {
      return new Response(
        JSON.stringify({ error: 'Заголовок обязателен' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!content || content.trim().length < MIN_CONTENT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Минимум ${MIN_CONTENT_LENGTH} символов в тексте статьи` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Требуется авторизация' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Проверяем профиль
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('is_banned')
      .eq('id', user.id)
      .single()

    if (profile?.is_banned) {
      return new Response(
        JSON.stringify({ error: 'Ваш аккаунт заблокирован' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Проверяем, нет ли уже pending статьи от этого пользователя (лимит 3)
    const { count: pendingCount } = await supabaseClient
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', user.id)
      .eq('status', 'pending')

    if (pendingCount && pendingCount >= 3) {
      return new Response(
        JSON.stringify({ error: 'У вас уже 3 статьи на модерации. Дождитесь их проверки.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Создаём статью
    const { data: article, error: insertError } = await supabaseClient
      .from('articles')
      .insert({
        author_id: user.id,
        title: title.trim(),
        content: content.trim(),
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Ошибка создания статьи' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Article created by user ${user.id}: ${article.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        article: {
          id: article.id,
          title: article.title,
          status: article.status,
          created_at: article.created_at
        },
        message: 'Статья отправлена на модерацию! После одобрения вы получите 1000 💎💎'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in article-create:', error)
    return new Response(
      JSON.stringify({ error: 'Внутренняя ошибка сервера' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
