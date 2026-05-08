import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials");
    }

    // Create admin user via Supabase Admin API
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "apikey": supabaseServiceKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "admin@prono.com",
        password: "PronoExpert2026!",
        email_confirm: true,
        user_metadata: {
          role: "admin",
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // User might already exist, which is fine
      if (data.code === "user_already_exists") {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Admin user already exists",
            email: "admin@prono.com",
            password: "PronoExpert2026!",
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
      throw new Error(data.message || "Failed to create admin user");
    }

    // Mark user as admin in public.users table
    const userId = data.user.id;

    const markAdminResponse = await fetch(
      `${supabaseUrl}/rest/v1/users?id=eq.${userId}`,
      {
        method: "PATCH",
        headers: {
          "apikey": supabaseServiceKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_admin: true,
        }),
      }
    );

    if (!markAdminResponse.ok) {
      console.error("Failed to mark user as admin");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin user created successfully",
        email: "admin@prono.com",
        password: "PronoExpert2026!",
        userId: userId,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
