import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { giftId } = await req.json();
    
    if (!giftId) {
      return new Response(JSON.stringify({ error: 'Missing giftId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get gift
    const { data: gift, error: giftError } = await supabase
      .from('gifts')
      .select('*')
      .eq('id', giftId)
      .eq('to_user_id', user.id)
      .single();

    if (giftError || !gift) {
      return new Response(JSON.stringify({ error: 'Gift not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (gift.is_claimed) {
      return new Response(JSON.stringify({ error: 'Gift already claimed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get receiver's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('crystals, diamonds, xp, gifts_received')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Add gift to receiver
    const updateData: Record<string, number> = {
      gifts_received: (profile.gifts_received || 0) + 1,
    };

    if (gift.gift_type === 'crystals') {
      updateData.crystals = Number(profile.crystals) + Number(gift.amount);
    } else if (gift.gift_type === 'diamonds') {
      updateData.diamonds = Number(profile.diamonds) + Number(gift.amount);
    } else if (gift.gift_type === 'xp') {
      updateData.xp = Number(profile.xp) + Number(gift.amount);
    }

    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (updateProfileError) {
      console.error('Error updating profile:', updateProfileError);
      return new Response(JSON.stringify({ error: 'Failed to claim gift' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark gift as claimed
    const { error: claimError } = await supabase
      .from('gifts')
      .update({
        is_claimed: true,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', giftId);

    if (claimError) {
      console.error('Error claiming gift:', claimError);
      return new Response(JSON.stringify({ error: 'Failed to update gift status' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Gift ${giftId} claimed by ${user.id}: ${gift.amount} ${gift.gift_type}`);

    return new Response(JSON.stringify({
      success: true,
      amount: gift.amount,
      giftType: gift.gift_type,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error claiming gift:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
