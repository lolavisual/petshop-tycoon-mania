import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { itemId, itemType, quantity = 1 } = await req.json()

    if (!itemId || !itemType) {
      return new Response(
        JSON.stringify({ error: 'Не указан товар' }),
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

    // Получаем профиль
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

    let item: any
    let priceCrystals = 0
    let priceDiamonds = 0
    let effectType: string | null = null
    let effectValue: number | null = null

    if (itemType === 'accessory') {
      // Покупка аксессуара
      const { data: accessory, error: accError } = await supabaseClient
        .from('accessories')
        .select('*')
        .eq('id', itemId)
        .single()

      if (accError || !accessory) {
        return new Response(
          JSON.stringify({ error: 'Аксессуар не найден' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      item = accessory

      // Проверяем уровень
      if (profile.level < accessory.required_level) {
        return new Response(
          JSON.stringify({ error: `Требуется уровень ${accessory.required_level}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Проверяем, не куплен ли уже
      const { data: existing } = await supabaseClient
        .from('user_accessories')
        .select('id')
        .eq('user_id', user.id)
        .eq('accessory_id', itemId)
        .single()

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'Аксессуар уже куплен' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      priceCrystals = Number(accessory.price_crystals)
      priceDiamonds = Number(accessory.price_diamonds)

    } else if (itemType === 'shop_item') {
      // Покупка товара из магазина
      const { data: shopItem, error: itemError } = await supabaseClient
        .from('shop_items')
        .select('*')
        .eq('id', itemId)
        .eq('is_active', true)
        .single()

      if (itemError || !shopItem) {
        return new Response(
          JSON.stringify({ error: 'Товар не найден' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      item = shopItem

      // Проверяем уровень
      if (profile.level < shopItem.required_level) {
        return new Response(
          JSON.stringify({ error: `Требуется уровень ${shopItem.required_level}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      priceCrystals = Number(shopItem.price_crystals)
      priceDiamonds = Number(shopItem.price_diamonds)
      effectType = shopItem.effect_type
      effectValue = shopItem.effect_value ? Number(shopItem.effect_value) : null

      // Применяем скидку для Golden Card
      if (shopItem.is_golden && shopItem.discount_percent > 0) {
        const discount = shopItem.discount_percent / 100
        priceCrystals = Math.floor(priceCrystals * (1 - discount))
        priceDiamonds = Math.floor(priceDiamonds * (1 - discount))
      }

      // Умножаем на количество
      priceCrystals *= quantity
      priceDiamonds *= quantity
    } else {
      return new Response(
        JSON.stringify({ error: 'Неверный тип товара' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Проверяем баланс
    const userCrystals = Number(profile.crystals)
    const userDiamonds = Number(profile.diamonds)

    if (priceCrystals > 0 && userCrystals < priceCrystals) {
      return new Response(
        JSON.stringify({ error: `Недостаточно кристаллов. Нужно: ${priceCrystals}, есть: ${Math.floor(userCrystals)}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (priceDiamonds > 0 && userDiamonds < priceDiamonds) {
      return new Response(
        JSON.stringify({ error: `Недостаточно алмазов. Нужно: ${priceDiamonds}, есть: ${Math.floor(userDiamonds)}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Списываем валюту и применяем эффект
    const updates: Record<string, any> = {
      crystals: userCrystals - priceCrystals,
      diamonds: userDiamonds - priceDiamonds,
      last_active_at: new Date().toISOString()
    }

    // Применяем эффект товара
    if (effectType === 'passive_rate' && effectValue) {
      updates.passive_rate = Number(profile.passive_rate) + effectValue
    }

    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (updateError) {
      console.error('Update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Ошибка покупки' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Записываем покупку
    if (itemType === 'accessory') {
      await supabaseClient
        .from('user_accessories')
        .insert({
          user_id: user.id,
          accessory_id: itemId,
          is_equipped: false
        })
    } else {
      await supabaseClient
        .from('user_purchases')
        .insert({
          user_id: user.id,
          item_id: itemId,
          quantity
        })
    }

    console.log(`User ${user.id} purchased ${itemType} ${itemId} for ${priceCrystals} crystals, ${priceDiamonds} diamonds`)

    return new Response(
      JSON.stringify({
        success: true,
        item: item.name_ru,
        priceCrystals,
        priceDiamonds,
        newCrystals: updates.crystals,
        newDiamonds: updates.diamonds,
        effectApplied: effectType ? { type: effectType, value: effectValue } : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in shop-purchase:', error)
    return new Response(
      JSON.stringify({ error: 'Внутренняя ошибка сервера' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
