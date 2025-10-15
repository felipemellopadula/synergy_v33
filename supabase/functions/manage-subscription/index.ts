import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();
    
    if (!action) {
      throw new Error("action é obrigatório (cancel, reactivate, get_portal_link)");
    }

    // Inicializar Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Autenticar usuário
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Usuário não autenticado");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user?.email) {
      throw new Error("Usuário não autenticado");
    }

    console.log(`[Manage] Ação: ${action} - Usuário: ${user.email}`);

    if (action === "get_portal_link") {
      // Buscar Stripe Customer
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      
      if (customers.data.length === 0) {
        throw new Error("Cliente Stripe não encontrado");
      }

      const customerId = customers.data[0].id;
      const origin = req.headers.get("origin") || "http://localhost:8080";

      // Criar sessão do Customer Portal
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${origin}/dashboard`,
      });

      console.log(`[Manage] Portal criado: ${portalSession.url}`);

      return new Response(
        JSON.stringify({ url: portalSession.url }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (action === "cancel" || action === "reactivate") {
      // Buscar assinatura ativa do usuário
      const { data: subscription } = await supabaseClient
        .from("stripe_subscriptions")
        .select("stripe_subscription_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (!subscription) {
        throw new Error("Assinatura ativa não encontrada");
      }

      const cancelAtPeriodEnd = action === "cancel";

      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: cancelAtPeriodEnd
      });

      await supabaseClient
        .from("stripe_subscriptions")
        .update({ 
          cancel_at_period_end: cancelAtPeriodEnd,
          updated_at: new Date().toISOString()
        })
        .eq("stripe_subscription_id", subscription.stripe_subscription_id);

      console.log(`[Manage] Assinatura ${action === "cancel" ? "cancelada" : "reativada"}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: action === "cancel" ? "Assinatura será cancelada ao final do período" : "Assinatura reativada"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    throw new Error("Ação inválida");

  } catch (error) {
    console.error("[Manage] Erro:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
