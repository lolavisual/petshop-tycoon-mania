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
    const { accessoryId, equip } = await req.json()

    if (!accessoryId) {
      return new Response(
        JSON.stringify({ error: 'Не указан аксессуар' }),
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

    // Проверяем, что аксессуар куплен
    const { data: userAccessory, error: accError } = await supabaseClient
      .from('user_accessories')
      .select(`
        id,
        is_equipped,
        accessories (
          id,
          name,
          name_ru,
          category
        )
      `)
      .eq('user_id', user.id)
      .eq('accessory_id', accessoryId)
      .single()

    if (accError || !userAccessory) {
      return new Response(
        JSON.stringify({ error: 'Аксессуар не найден в инвентаре' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const accessory = userAccessory.accessories as any
    const shouldEquip = equip !== undefined ? equip : !userAccessory.is_equipped

    if (shouldEquip) {
      // Снимаем другие аксессуары той же категории
      const { data: sameCategory } = await supabaseClient
        .from('user_accessories')
        .select(`
          id,
          accessories!inner (category)
        `)
        .eq('user_id', user.id)
        .eq('is_equipped', true)

      if (sameCategory) {
        for (const item of sameCategory) {
          const itemAcc = item.accessories as any
          if (itemAcc?.category === accessory.category) {
            await supabaseClient
              .from('user_accessories')
              .update({ is_equipped: false })
              .eq('id', item.id)
          }
        }
      }
    }

    // Обновляем статус экипировки
    const { error: updateError } = await supabaseClient
      .from('user_accessories')
      .update({ is_equipped: shouldEquip })
      .eq('id', userAccessory.id)

    if (updateError) {
      console.error('Update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Ошибка экипировки' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`User ${user.id} ${shouldEquip ? 'equipped' : 'unequipped'} accessory ${accessoryId}`)

    return new Response(
      JSON.stringify({
        success: true,
        equipped: shouldEquip,
        accessory: accessory.name_ru
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in accessory-equip:', error)
    return new Response(
      JSON.stringify({ error: 'Внутренняя ошибка сервера' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
