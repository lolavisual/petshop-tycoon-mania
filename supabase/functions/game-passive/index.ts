import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_PASSIVE_HOURS = 8 // Максимум 8 часов пассивного дохода
const OFFLINE_PENALTY_DAYS = 10 // После 10 дней оффлайн
const OFFLINE_PENALTY_XP = 0.3 // -30% XP

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
    const lastClaim = new Date(profile.last_passive_claim)
    const lastActive = new Date(profile.last_active_at)
    
    // Вычисляем время оффлайн
    const offlineMs = now.getTime() - lastClaim.getTime()
    const offlineHours = Math.min(offlineMs / (1000 * 60 * 60), MAX_PASSIVE_HOURS)
    
    if (offlineHours < 0.1) { // Минимум 6 минут
      return new Response(
        JSON.stringify({ 
          error: 'Недостаточно времени для накопления',
          minTimeMinutes: 6,
          crystalsAvailable: 0
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Вычисляем пассивный доход
    const passiveRate = Number(profile.passive_rate) // кристаллов в секунду
    const passiveSeconds = offlineHours * 60 * 60
    let crystalsEarned = Math.floor(passiveRate * passiveSeconds)

    // Проверяем штраф за долгий оффлайн
    const daysSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    let xpPenalty = 0
    
    if (daysSinceActive >= OFFLINE_PENALTY_DAYS) {
      // Применяем штраф XP
      const currentXp = Number(profile.xp)
      xpPenalty = Math.floor(currentXp * OFFLINE_PENALTY_XP)
    }

    // Обновляем профиль
    const newXp = Math.max(0, Number(profile.xp) - xpPenalty)
    
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        crystals: Number(profile.crystals) + crystalsEarned,
        xp: newXp,
        last_passive_claim: now.toISOString(),
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
        crystalsEarned,
        hoursOffline: Math.round(offlineHours * 10) / 10,
        xpPenalty,
        hadPenalty: xpPenalty > 0,
        newCrystals: Number(profile.crystals) + crystalsEarned,
        newXp
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in game-passive:', error)
    return new Response(
      JSON.stringify({ error: 'Внутренняя ошибка сервера' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
