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

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Non autorisé');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !caller) throw new Error('Non autorisé');

    const { data: callerProfile } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', caller.id)
      .single();

    if (!callerProfile?.is_admin) throw new Error('Accès refusé - admin uniquement');

    const { email, password } = await req.json();
    if (!email || !password) throw new Error('email et password requis');

    const { data: authData, error: authError2 } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError2) throw authError2;

    return new Response(
      JSON.stringify({ success: true, user: authData.user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
