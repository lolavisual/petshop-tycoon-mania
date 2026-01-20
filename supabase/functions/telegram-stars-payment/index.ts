import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

// Create invoice for Telegram Stars payment
async function createStarsInvoice(
  chatId: number,
  planId: string,
  planName: string,
  starsPrice: number,
  userId: string
): Promise<{ success: boolean; invoiceLink?: string; error?: string }> {
  try {
    // Create invoice link using Telegram Bot API
    const invoicePayload = {
      chat_id: chatId,
      title: `VIP ${planName}`,
      description: `Премиум подписка ${planName} с эксклюзивными бонусами`,
      payload: JSON.stringify({ planId, userId }),
      provider_token: '', // Empty for Telegram Stars
      currency: 'XTR', // XTR = Telegram Stars
      prices: [{ label: planName, amount: starsPrice }],
    };

    console.log('Creating invoice:', invoicePayload);

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendInvoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoicePayload),
    });

    const result = await response.json();
    console.log('Invoice result:', result);

    if (!result.ok) {
      return { success: false, error: result.description || 'Failed to create invoice' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating invoice:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Create invoice link (for web app)
async function createInvoiceLink(
  planId: string,
  planName: string,
  starsPrice: number,
  userId: string
): Promise<{ success: boolean; invoiceLink?: string; error?: string }> {
  try {
    const invoicePayload = {
      title: `VIP ${planName}`,
      description: `Премиум подписка ${planName} с эксклюзивными бонусами. Множители кликов, пассивного дохода и XP!`,
      payload: JSON.stringify({ planId, userId }),
      provider_token: '', // Empty for Telegram Stars
      currency: 'XTR', // XTR = Telegram Stars
      prices: [{ label: planName, amount: starsPrice }],
    };

    console.log('Creating invoice link:', invoicePayload);

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoicePayload),
    });

    const result = await response.json();
    console.log('Invoice link result:', result);

    if (!result.ok) {
      return { success: false, error: result.description || 'Failed to create invoice link' };
    }

    return { success: true, invoiceLink: result.result };
  } catch (error) {
    console.error('Error creating invoice link:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Handle successful payment
async function handleSuccessfulPayment(
  telegramPaymentChargeId: string,
  payload: string,
  totalAmount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { planId, userId } = JSON.parse(payload);

    console.log('Processing payment:', { planId, userId, totalAmount, telegramPaymentChargeId });

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('premium_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      console.error('Plan not found:', planError);
      return { success: false, error: 'Plan not found' };
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

    // Create subscription
    const { error: subError } = await supabase
      .from('premium_subscriptions')
      .insert({
        user_id: userId,
        plan_type: plan.name,
        stars_paid: totalAmount,
        telegram_payment_id: telegramPaymentChargeId,
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
      });

    if (subError) {
      console.error('Error creating subscription:', subError);
      return { success: false, error: 'Failed to create subscription' };
    }

    // Update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        is_premium: true,
        premium_expires_at: expiresAt.toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    // Add bonuses
    const { data: profile } = await supabase
      .from('profiles')
      .select('crystals, diamonds')
      .eq('id', userId)
      .single();

    if (profile) {
      await supabase
        .from('profiles')
        .update({
          crystals: profile.crystals + plan.crystals_bonus,
          diamonds: profile.diamonds + plan.diamonds_bonus,
        })
        .eq('id', userId);
    }

    // Grant exclusive pet if applicable
    if (plan.exclusive_pet) {
      const { data: existingPet } = await supabase
        .from('user_pets')
        .select('id')
        .eq('user_id', userId)
        .eq('pet_type', plan.exclusive_pet)
        .maybeSingle();

      if (!existingPet) {
        await supabase
          .from('user_pets')
          .insert({
            user_id: userId,
            pet_type: plan.exclusive_pet,
          });
      }
    }

    console.log('Payment processed successfully for user:', userId);
    return { success: true };
  } catch (error) {
    console.error('Error handling payment:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Handle pre-checkout query (required for Telegram payments)
async function answerPreCheckoutQuery(
  preCheckoutQueryId: string,
  ok: boolean,
  errorMessage?: string
): Promise<void> {
  const body: any = {
    pre_checkout_query_id: preCheckoutQueryId,
    ok,
  };

  if (!ok && errorMessage) {
    body.error_message = errorMessage;
  }

  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerPreCheckoutQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Received request:', body);

    // Create invoice for user (from web app)
    if (body.action === 'create_invoice') {
      const { planId, userId, chatId } = body;

      // Get plan details
      const { data: plan, error: planError } = await supabase
        .from('premium_plans')
        .select('*')
        .eq('id', planId)
        .eq('is_active', true)
        .single();

      if (planError || !plan) {
        return new Response(JSON.stringify({ success: false, error: 'Plan not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // If chatId provided, send invoice directly to chat
      if (chatId) {
        const result = await createStarsInvoice(chatId, planId, plan.name_ru, plan.stars_price, userId);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Otherwise create invoice link for web app
      const result = await createInvoiceLink(planId, plan.name_ru, plan.stars_price, userId);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle Telegram webhook updates for payments
    if (body.pre_checkout_query) {
      console.log('Pre-checkout query:', body.pre_checkout_query);
      
      // Always approve pre-checkout for now
      await answerPreCheckoutQuery(body.pre_checkout_query.id, true);
      
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.message?.successful_payment) {
      console.log('Successful payment:', body.message.successful_payment);
      
      const payment = body.message.successful_payment;
      const result = await handleSuccessfulPayment(
        payment.telegram_payment_charge_id,
        payment.invoice_payload,
        payment.total_amount
      );

      if (result.success) {
        // Send confirmation message
        const chatId = body.message.chat.id;
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `🎉 <b>Поздравляем!</b>\n\nВаша VIP-подписка успешно активирована! ✨\n\nТеперь вам доступны:\n• Увеличенные множители\n• Бонусные кристаллы и алмазы\n• Эксклюзивные питомцы\n\nСпасибо за поддержку! 💎`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🎮 Открыть игру', web_app: { url: 'https://petshoptycoon.lovable.app' } }]
              ]
            }
          }),
        });
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get subscription status
    if (body.action === 'get_subscription') {
      const { userId } = body;

      const { data: subscription, error } = await supabase
        .from('premium_subscriptions')
        .select('*, premium_plans:plan_type')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return new Response(JSON.stringify({ success: true, subscription }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin: Get all subscriptions
    if (body.action === 'admin_get_subscriptions') {
      const { page = 1, limit = 20 } = body;
      const offset = (page - 1) * limit;

      const { data: subscriptions, error, count } = await supabase
        .from('premium_subscriptions')
        .select(`
          *,
          profiles:user_id (
            telegram_id,
            username,
            first_name
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      return new Response(JSON.stringify({ 
        success: true, 
        subscriptions, 
        total: count 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin: Cancel subscription
    if (body.action === 'admin_cancel_subscription') {
      const { subscriptionId } = body;

      const { error } = await supabase
        .from('premium_subscriptions')
        .update({ is_active: false })
        .eq('id', subscriptionId);

      if (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin: Get stats
    if (body.action === 'admin_get_stats') {
      const { data: totalSubs } = await supabase
        .from('premium_subscriptions')
        .select('id', { count: 'exact', head: true });

      const { data: activeSubs } = await supabase
        .from('premium_subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString());

      const { data: totalStars } = await supabase
        .from('premium_subscriptions')
        .select('stars_paid');

      const totalRevenue = totalStars?.reduce((sum, s) => sum + (s.stars_paid || 0), 0) || 0;

      return new Response(JSON.stringify({ 
        success: true, 
        stats: {
          totalSubscriptions: totalSubs,
          activeSubscriptions: activeSubs,
          totalStarsEarned: totalRevenue,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
