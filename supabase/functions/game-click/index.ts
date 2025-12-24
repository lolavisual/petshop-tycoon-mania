import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Анти-чит: максимум 15 кликов в секунду
const RATE_LIMIT_CLICKS = 15
const RATE_LIMIT_WINDOW_MS = 1000

// Хранилище для rate limiting (в production использовать Redis)
const clickRateMap = new Map<string, { count: number; windowStart: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userRate = clickRateMap.get(userId)
  
  if (!userRate || now - userRate.windowStart > RATE_LIMIT_WINDOW_MS) {
    clickRateMap.set(userId, { count: 1, windowStart: now })
    return true
  }
  
  if (userRate.count >= RATE_LIMIT_CLICKS) {
    return false
  }
  
  userRate.count++
  return true
}

// Формула XP для следующего уровня
function calculateXpForNextLevel(level: number): number {
  return Math.floor(150 * Math.pow(1.4, level - 1))
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Получаем текущего пользователя
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Требуется авторизация' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Проверяем rate limit
    if (!checkRateLimit(user.id)) {
      console.log(`Rate limit exceeded for user ${user.id}`)
      return new Response(
        JSON.stringify({ error: 'Слишком много кликов! Подождите немного.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Получаем профиль пользователя
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile error:', profileError)
      return new Response(
        JSON.stringify({ error: 'Профиль не найден' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (profile.is_banned) {
      return new Response(
        JSON.stringify({ error: 'Ваш аккаунт заблокирован' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Начисляем ресурсы
    const crystalsEarned = 1
    const xpEarned = 0.5

    let newCrystals = Number(profile.crystals) + crystalsEarned
    let newXp = Number(profile.xp) + xpEarned
    let newLevel = profile.level
    let leveledUp = false
    let newAccessory = null

    // Проверяем повышение уровня
    const xpForNext = calculateXpForNextLevel(newLevel)
    if (newXp >= xpForNext) {
      newXp -= xpForNext
      newLevel++
      leveledUp = true

      // Проверяем получение аксессуара каждые 5 уровней
      if (newLevel % 5 === 0 || newLevel === 15) {
        const { data: accessories } = await supabaseClient
          .from('accessories')
          .select('*')
          .lte('required_level', newLevel)
          .order('required_level', { ascending: false })
          .limit(1)

        if (accessories && accessories.length > 0) {
          const accessory = accessories[0]
          
          // Проверяем, есть ли уже этот аксессуар
          const { data: existing } = await supabaseClient
            .from('user_accessories')
            .select('id')
            .eq('user_id', user.id)
            .eq('accessory_id', accessory.id)
            .single()

          if (!existing) {
            await supabaseClient
              .from('user_accessories')
              .insert({
                user_id: user.id,
                accessory_id: accessory.id,
                is_equipped: accessory.name === 'santa_hat' // Шапка Санты автоматически надевается
              })
            
            newAccessory = accessory
          }
        }
      }
    }

    // Обновляем профиль
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        crystals: newCrystals,
        xp: newXp,
        level: newLevel,
        last_active_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Ошибка обновления профиля' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Логируем клик
    await supabaseClient
      .from('click_logs')
      .insert({
        user_id: user.id,
        clicks_count: 1,
        crystals_earned: crystalsEarned,
        xp_earned: xpEarned
      })

    const response = {
      success: true,
      crystals: newCrystals,
      xp: newXp,
      level: newLevel,
      xpForNext: calculateXpForNextLevel(newLevel),
      crystalsEarned,
      xpEarned,
      leveledUp,
      newAccessory
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in game-click:', error)
    return new Response(
      JSON.stringify({ error: 'Внутренняя ошибка сервера' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
