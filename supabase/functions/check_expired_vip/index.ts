import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Verify caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Non autorisé');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !caller) throw new Error('Non autorisé');

    const now = new Date().toISOString();

    const { data: expiredUsers, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id')
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
    }

    return new Response(
      JSON.stringify({ success: true, expired_users: expiredUsers?.length ?? 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
