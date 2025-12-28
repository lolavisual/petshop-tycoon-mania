import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret, x-forwarded-for, x-real-ip',
}

// Проверка админа: Telegram ID + Secret Key + IP Whitelist
async function validateAdmin(req: Request, supabaseAdmin: ReturnType<typeof createClient>): Promise<{ valid: boolean; error?: string }> {
  try {
    const adminSecret = req.headers.get('x-admin-secret')
    
    // Получаем IP из заголовков (Cloudflare/Nginx передают реальный IP)
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('x-real-ip') 
      || req.headers.get('cf-connecting-ip')
      || 'unknown'
    
    console.log('Admin auth attempt from IP:', clientIp)

    // Проверяем секрет
    const expectedSecret = Deno.env.get('ADMIN_SECRET_KEY')
    if (!expectedSecret || adminSecret !== expectedSecret) {
      console.log('Invalid admin secret')
      return { valid: false, error: 'Неверный секретный ключ' }
    }

    // Проверяем Telegram ID (из JWT токена)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return { valid: false, error: 'Требуется авторизация' }
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return { valid: false, error: 'Пользователь не авторизован' }
    }

    // Получаем Telegram ID пользователя
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('telegram_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return { valid: false, error: 'Профиль не найден' }
    }

    // Проверяем Telegram ID
    const adminTelegramId = Deno.env.get('ADMIN_TELEGRAM_ID')
    if (!adminTelegramId || profile.telegram_id.toString() !== adminTelegramId) {
      console.log('Invalid Telegram ID:', profile.telegram_id, 'expected:', adminTelegramId)
      return { valid: false, error: 'Недостаточно прав' }
    }

    // Проверяем IP whitelist
    const allowedIpsStr = Deno.env.get('ADMIN_ALLOWED_IPS') || ''
    const allowedIps = allowedIpsStr.split(',').map(ip => ip.trim()).filter(ip => ip)
    
    // Если список пустой - пропускаем проверку IP (для разработки)
    if (allowedIps.length > 0 && !allowedIps.includes(clientIp) && clientIp !== 'unknown') {
      console.log('IP not in whitelist:', clientIp, 'allowed:', allowedIps)
      return { valid: false, error: 'Доступ с данного IP запрещён' }
    }

    console.log('Admin validated successfully:', profile.telegram_id)
    return { valid: true }
  } catch (error) {
    console.error('Admin validation error:', error)
    return { valid: false, error: 'Ошибка проверки доступа' }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Проверяем админа
    const adminCheck = await validateAdmin(req, supabaseAdmin)
    if (!adminCheck.valid) {
      return new Response(
        JSON.stringify({ error: adminCheck.error }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json() as { action?: string; payload?: unknown };
    const { action, payload } = body;
    console.log('Admin action:', action, payload)

    switch (action) {
      // === СТАТИСТИКА ===
      case 'get_stats': {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const monthAgo = new Date(today)
        monthAgo.setDate(monthAgo.getDate() - 30)

        // Общее количество пользователей
        const { count: totalUsers } = await supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        // DAU - активные за сегодня
        const { count: dau } = await supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('last_active_at', today.toISOString())

        // MAU - активные за месяц
        const { count: mau } = await supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('last_active_at', monthAgo.toISOString())

        // Общее количество кликов
        const { data: clicksData } = await supabaseAdmin
          .from('click_logs')
          .select('clicks_count, crystals_earned')
        
        const totalClicks = clicksData?.reduce((sum, c) => sum + c.clicks_count, 0) || 0
        const totalCrystalsEarned = clicksData?.reduce((sum, c) => sum + Number(c.crystals_earned), 0) || 0

        // Статьи на модерации
        const { count: pendingArticles } = await supabaseAdmin
          .from('articles')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')

        // Экономика - сумма валют
        const { data: economyData } = await supabaseAdmin
          .from('profiles')
          .select('crystals, diamonds, stones')
        
        const totalCrystals = economyData?.reduce((sum, p) => sum + Number(p.crystals), 0) || 0
        const totalDiamonds = economyData?.reduce((sum, p) => sum + Number(p.diamonds), 0) || 0
        const totalStones = economyData?.reduce((sum, p) => sum + Number(p.stones), 0) || 0

        // Средний уровень
        const { data: levelData } = await supabaseAdmin
          .from('profiles')
          .select('level')
        
        const avgLevel = levelData?.length 
          ? (levelData.reduce((sum, p) => sum + p.level, 0) / levelData.length).toFixed(1)
          : 0

        // Retention - вернувшиеся на следующий день
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        
        const { count: retainedUsers } = await supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('streak_days', 2)

        const retention = totalUsers && totalUsers > 0 
          ? ((retainedUsers || 0) / totalUsers * 100).toFixed(1)
          : 0

        return new Response(
          JSON.stringify({
            totalUsers: totalUsers || 0,
            dau: dau || 0,
            mau: mau || 0,
            totalClicks,
            totalCrystalsEarned: Math.floor(totalCrystalsEarned),
            pendingArticles: pendingArticles || 0,
            economy: {
              crystals: Math.floor(totalCrystals),
              diamonds: Math.floor(totalDiamonds),
              stones: Math.floor(totalStones)
            },
            avgLevel,
            retention: `${retention}%`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // === ПОЛЬЗОВАТЕЛИ ===
      case 'get_users': {
        const { page = 1, limit = 20, search = '' } = (payload as { page?: number; limit?: number; search?: string } ) || {}
        const offset = (page - 1) * limit

        let query = supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        if (search) {
          query = query.or(`username.ilike.%${search}%,first_name.ilike.%${search}%,telegram_id.eq.${parseInt(search) || 0}`)
        }

        const { data: users, count } = await query

        return new Response(
          JSON.stringify({ users: users || [], total: count || 0, page, limit }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update_user': {
        const { userId, updates } = (payload as { userId?: string; updates?: Record<string, unknown> }) || {}
        
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Не указан пользователь' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Разрешённые поля для обновления
        const allowedFields = ['level', 'xp', 'crystals', 'diamonds', 'stones', 'is_banned', 'passive_rate']
        const safeUpdates: Record<string, unknown> = {}
        
        for (const [key, value] of Object.entries(updates || {} as Record<string, unknown>)) {
          if (allowedFields.includes(key)) {
            safeUpdates[key] = value
          }
        }

        const { error } = await supabaseAdmin
          .from('profiles')
          .update(safeUpdates)
          .eq('id', userId)

        if (error) {
          return new Response(
            JSON.stringify({ error: 'Ошибка обновления' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'ban_user': {
        const { userId, ban } = payload

        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ is_banned: ban })
          .eq('id', userId)

        if (error) {
          return new Response(
            JSON.stringify({ error: 'Ошибка блокировки' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true, banned: ban }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // === СТАТЬИ ===
      case 'get_articles': {
        const { status = 'pending', page = 1, limit = 20 } = payload || {}
        const offset = (page - 1) * limit

        const { data: articles, count } = await supabaseAdmin
          .from('articles')
          .select(`
            *,
            profiles:author_id (username, first_name, telegram_id)
          `, { count: 'exact' })
          .eq('status', status)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        return new Response(
          JSON.stringify({ articles: articles || [], total: count || 0, page, limit }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'moderate_article': {
        const { articleId, action: modAction, reason } = payload

        if (!articleId || !['approve', 'reject'].includes(modAction)) {
          return new Response(
            JSON.stringify({ error: 'Неверные параметры' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const newStatus = modAction === 'approve' ? 'approved' : 'rejected'

        // Получаем статью
        const { data: article } = await supabaseAdmin
          .from('articles')
          .select('author_id, reward_given')
          .eq('id', articleId)
          .single()

        if (!article) {
          return new Response(
            JSON.stringify({ error: 'Статья не найдена' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Обновляем статью
        const { error: updateError } = await supabaseAdmin
          .from('articles')
          .update({
            status: newStatus,
            rejection_reason: modAction === 'reject' ? reason : null,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', articleId)

        if (updateError) {
          return new Response(
            JSON.stringify({ error: 'Ошибка модерации' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Выдаём награду за одобренную статью
        if (modAction === 'approve' && !article.reward_given) {
          const ARTICLE_REWARD = 1000 // алмазов

          // Получаем текущие алмазы и обновляем
          const { data: authorProfile } = await supabaseAdmin
            .from('profiles')
            .select('diamonds')
            .eq('id', article.author_id)
            .single()

          if (authorProfile) {
            await supabaseAdmin
              .from('profiles')
              .update({ diamonds: Number(authorProfile.diamonds) + ARTICLE_REWARD })
              .eq('id', article.author_id)
          }

          await supabaseAdmin
            .from('articles')
            .update({ reward_given: true })
            .eq('id', articleId)
        }

        return new Response(
          JSON.stringify({ success: true, status: newStatus }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // === РАССЫЛКА ===
      case 'broadcast': {
        const { message, segment } = payload

        if (!message) {
          return new Response(
            JSON.stringify({ error: 'Сообщение не указано' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        let query = supabaseAdmin
          .from('profiles')
          .select('telegram_id')
          .eq('is_banned', false)

        // Применяем сегментацию
        if (segment?.minLevel) {
          query = query.gte('level', segment.minLevel)
        }
        if (segment?.minStreak) {
          query = query.gte('streak_days', segment.minStreak)
        }

        const { data: users } = await query

        // В реальности здесь была бы отправка через Telegram Bot API
        // Для демо просто возвращаем количество получателей
        console.log(`Broadcast to ${users?.length || 0} users: ${message}`)

        return new Response(
          JSON.stringify({ 
            success: true, 
            recipients: users?.length || 0,
            message: 'Рассылка запланирована (требуется Telegram Bot API)'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // === МАССОВЫЕ ОПЕРАЦИИ ===
      case 'bulk_give_currency': {
        const { currency, amount, segment } = payload

        if (!currency || !amount || amount <= 0) {
          return new Response(
            JSON.stringify({ error: 'Неверные параметры' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        let query = supabaseAdmin
          .from('profiles')
          .select('id, crystals, diamonds, stones')
          .eq('is_banned', false)

        if (segment?.minLevel) {
          query = query.gte('level', segment.minLevel)
        }

        const { data: users } = await query

        if (!users || users.length === 0) {
          return new Response(
            JSON.stringify({ error: 'Пользователи не найдены' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Обновляем пользователей
        for (const user of users) {
          const currentValue = Number(user[currency as keyof typeof user]) || 0
          await supabaseAdmin
            .from('profiles')
            .update({ [currency]: currentValue + amount })
            .eq('id', user.id)
        }

        return new Response(
          JSON.stringify({ success: true, updated: users.length }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Неизвестное действие' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error in admin:', error)
    return new Response(
      JSON.stringify({ error: 'Внутренняя ошибка сервера' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
