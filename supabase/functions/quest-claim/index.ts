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

    const { userQuestId } = await req.json();
    
    if (!userQuestId) {
      return new Response(JSON.stringify({ error: 'Missing userQuestId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Claiming quest ${userQuestId} for user ${user.id}`);

    // Get user quest with quest details
    const { data: userQuest, error: questError } = await supabase
      .from('user_daily_quests')
      .select('*, quest:daily_quests(*)')
      .eq('id', userQuestId)
      .eq('user_id', user.id)
      .single();

    if (questError || !userQuest) {
      console.error('Quest not found:', questError);
      return new Response(JSON.stringify({ error: 'Quest not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!userQuest.is_completed) {
      return new Response(JSON.stringify({ error: 'Quest not completed yet' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (userQuest.reward_claimed) {
      return new Response(JSON.stringify({ error: 'Reward already claimed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const quest = userQuest.quest;
    
    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('crystals, diamonds, xp, level')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found:', profileError);
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate new values
    const newCrystals = Number(profile.crystals) + Number(quest.reward_crystals);
    const newDiamonds = Number(profile.diamonds) + Number(quest.reward_diamonds);
    const newXp = Number(profile.xp) + Number(quest.reward_xp);

    // Update profile with rewards
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        crystals: newCrystals,
        diamonds: newDiamonds,
        xp: newXp,
      })
      .eq('id', user.id);

    if (updateProfileError) {
      console.error('Failed to update profile:', updateProfileError);
      return new Response(JSON.stringify({ error: 'Failed to update profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark quest reward as claimed
    const { error: updateQuestError } = await supabase
      .from('user_daily_quests')
      .update({
        reward_claimed: true,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', userQuestId);

    if (updateQuestError) {
      console.error('Failed to update quest:', updateQuestError);
      return new Response(JSON.stringify({ error: 'Failed to update quest' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Quest ${userQuestId} claimed successfully. Rewards: ${quest.reward_crystals} crystals, ${quest.reward_diamonds} diamonds, ${quest.reward_xp} XP`);

    return new Response(JSON.stringify({
      success: true,
      rewards: {
        crystals: quest.reward_crystals,
        diamonds: quest.reward_diamonds,
        xp: quest.reward_xp,
      },
      newTotals: {
        crystals: newCrystals,
        diamonds: newDiamonds,
        xp: newXp,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error claiming quest:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
