import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Награды за стрики
const STREAK_REWARDS = {
  3: 50,   // 3 дня = 50 камней
  7: 150,  // 7 дней = 150 камней
  14: 400  // 14 дней = 400 камней
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

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Требуется авторизация' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
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

    const now = new Date()
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    
    // Проверяем, был ли уже сундук сегодня
    if (profile.last_chest_claim) {
      const lastClaim = new Date(profile.last_chest_claim)
      const lastClaimUTC = new Date(Date.UTC(
        lastClaim.getUTCFullYear(), 
        lastClaim.getUTCMonth(), 
        lastClaim.getUTCDate()
      ))
      
      if (lastClaimUTC.getTime() >= todayUTC.getTime()) {
        // Вычисляем время до следующего сундука
        const tomorrow = new Date(todayUTC)
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
        const msUntilNext = tomorrow.getTime() - now.getTime()
        
        return new Response(
          JSON.stringify({ 
            error: 'Сундук уже получен сегодня',
            nextChestIn: Math.ceil(msUntilNext / 1000),
            canClaim: false
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Вычисляем стрик
    let newStreakDays = 1
    let streakBonus = 0
    
    if (profile.last_streak_date) {
      const lastStreak = new Date(profile.last_streak_date)
      const lastStreakUTC = new Date(Date.UTC(
        lastStreak.getUTCFullYear(),
        lastStreak.getUTCMonth(),
        lastStreak.getUTCDate()
      ))
      
      const yesterdayUTC = new Date(todayUTC)
      yesterdayUTC.setUTCDate(yesterdayUTC.getUTCDate() - 1)
      
      if (lastStreakUTC.getTime() === yesterdayUTC.getTime()) {
        // Продолжаем стрик
        newStreakDays = profile.streak_days + 1
      }
      // Иначе стрик сбрасывается до 1
    }

    // Проверяем награду за стрик
    if (STREAK_REWARDS[newStreakDays as keyof typeof STREAK_REWARDS]) {
      streakBonus = STREAK_REWARDS[newStreakDays as keyof typeof STREAK_REWARDS]
    }

    // Базовая награда из сундука
    const baseCrystals = 100 + Math.floor(Math.random() * 50) // 100-150
    const totalCrystals = baseCrystals

    // Обновляем профиль
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        crystals: Number(profile.crystals) + totalCrystals,
        stones: Number(profile.stones) + streakBonus,
        last_chest_claim: now.toISOString(),
        streak_days: newStreakDays,
        last_streak_date: todayUTC.toISOString().split('T')[0],
        last_active_at: now.toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Ошибка обновления профиля' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        crystalsEarned: totalCrystals,
        stonesEarned: streakBonus,
        streakDays: newStreakDays,
        streakMilestone: STREAK_REWARDS[newStreakDays as keyof typeof STREAK_REWARDS] ? newStreakDays : null,
        newCrystals: Number(profile.crystals) + totalCrystals,
        newStones: Number(profile.stones) + streakBonus
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in game-chest:', error)
    return new Response(
      JSON.stringify({ error: 'Внутренняя ошибка сервера' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
