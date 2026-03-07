import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const now = new Date().toISOString();

    const { data: expiredUsers, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, email, vip_expires_at')
      .eq('is_vip', true)
      .not('vip_expires_at', 'is', null)
      .lt('vip_expires_at', now);

    if (fetchError) throw fetchError;

    if (expiredUsers && expiredUsers.length > 0) {
      const userIds = expiredUsers.map(user => user.id);

      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ is_vip: false, vip_expires_at: null })
        .in('id', userIds);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({
          success: true,
          message: `${expiredUsers.length} utilisateur(s) VIP expiré(s) ont été mis à jour`,
          expired_users: expiredUsers.length
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Aucun VIP expiré',
        expired_users: 0
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
