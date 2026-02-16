import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_ROLES = ["admin", "cs"] as const;
type StaffRole = typeof ALLOWED_ROLES[number];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify requester is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if requester has admin role
    const { data: requesterRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!requesterRoles || requesterRoles.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, role: targetRole } = body;

    // Determine which role we're managing (default to "admin" for backward compat)
    const managedRole: StaffRole = ALLOWED_ROLES.includes(targetRole) ? targetRole : "admin";
    const roleLabel = managedRole === "cs" ? "CS agent" : "admin";

    // ── LIST ──
    if (action === "list") {
      const { data: roleRows } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", managedRole);

      if (!roleRows || roleRows.length === 0) {
        return new Response(JSON.stringify({ admins: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const ids = roleRows.map((r) => r.user_id);
      const result = [];
      for (const uid of ids) {
        const { data: { user: u } } = await supabaseAdmin.auth.admin.getUserById(uid);
        if (u) {
          result.push({ user_id: uid, email: u.email });
        }
      }

      return new Response(JSON.stringify({ admins: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── INVITE ──
    if (action === "invite_admin") {
      const { email } = body;
      if (!email?.trim()) {
        return new Response(JSON.stringify({ error: "Email required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: { users }, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
      if (listErr) throw listErr;

      const targetUser = users.find(
        (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
      );

      if (!targetUser) {
        return new Response(
          JSON.stringify({ error: "User not found. They must register first." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: existing } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", targetUser.id)
        .eq("role", managedRole);

      if (existing && existing.length > 0) {
        return new Response(
          JSON.stringify({ error: `User is already a ${roleLabel}` }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: insertErr } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: targetUser.id, role: managedRole });

      if (insertErr) throw insertErr;

      return new Response(
        JSON.stringify({ success: true, user_id: targetUser.id, email: targetUser.email }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── REMOVE ──
    if (action === "remove_admin") {
      const { user_id: targetId } = body;
      if (!targetId) {
        return new Response(JSON.stringify({ error: "user_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // For admin role: prevent removing last admin and self-removal
      if (managedRole === "admin") {
        const { data: allAdmins } = await supabaseAdmin
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin");

        if (!allAdmins || allAdmins.length <= 1) {
          return new Response(
            JSON.stringify({ error: "Cannot remove the last admin" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (targetId === user.id) {
          return new Response(
            JSON.stringify({ error: "Cannot remove yourself" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      const { error: delErr } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", targetId)
        .eq("role", managedRole);

      if (delErr) throw delErr;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("admin-manage-admins error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
