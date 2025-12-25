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

    const { toUserId, giftType, amount, message } = await req.json();
    
    if (!toUserId || !giftType || !amount) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (toUserId === user.id) {
      return new Response(JSON.stringify({ error: 'Cannot send gift to yourself' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if users are friends
    const { data: friendship, error: friendError } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${toUserId}),and(user_id.eq.${toUserId},friend_id.eq.${user.id})`)
      .eq('status', 'accepted')
      .maybeSingle();

    if (!friendship) {
      return new Response(JSON.stringify({ error: 'You can only send gifts to friends' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get sender's profile
    const { data: senderProfile, error: senderError } = await supabase
      .from('profiles')
      .select('crystals, diamonds, gifts_sent')
      .eq('id', user.id)
      .single();

    if (senderError || !senderProfile) {
      return new Response(JSON.stringify({ error: 'Sender profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if sender has enough currency
    const giftCost = Number(amount);
    if (giftType === 'crystals' && Number(senderProfile.crystals) < giftCost) {
      return new Response(JSON.stringify({ error: 'Not enough crystals' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (giftType === 'diamonds' && Number(senderProfile.diamonds) < giftCost) {
      return new Response(JSON.stringify({ error: 'Not enough diamonds' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Deduct from sender
    const updateField = giftType === 'crystals' ? 'crystals' : 'diamonds';
    const newAmount = Number(senderProfile[updateField]) - giftCost;
    
    const { error: updateSenderError } = await supabase
      .from('profiles')
      .update({ 
        [updateField]: newAmount,
        gifts_sent: senderProfile.gifts_sent ? senderProfile.gifts_sent + 1 : 1
      })
      .eq('id', user.id);

    if (updateSenderError) {
      console.error('Error updating sender:', updateSenderError);
      return new Response(JSON.stringify({ error: 'Failed to send gift' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create gift
    const { data: gift, error: giftError } = await supabase
      .from('gifts')
      .insert({
        from_user_id: user.id,
        to_user_id: toUserId,
        gift_type: giftType,
        amount: giftCost,
        message: message || null,
      })
      .select()
      .single();

    if (giftError) {
      console.error('Error creating gift:', giftError);
      return new Response(JSON.stringify({ error: 'Failed to create gift' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Gift sent from ${user.id} to ${toUserId}: ${giftCost} ${giftType}`);

    return new Response(JSON.stringify({
      success: true,
      gift,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error sending gift:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
