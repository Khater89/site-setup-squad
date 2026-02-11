import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_ATTEMPTS = 5;
const GOOGLE_APPS_SCRIPT_URL = Deno.env.get("GOOGLE_APPS_SCRIPT_URL") || "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Parse optional body for specific IDs (manual resend)
    let specificIds: string[] | null = null;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body.ids && Array.isArray(body.ids)) {
          specificIds = body.ids;
        }
      } catch {
        // no body is fine
      }
    }

    // Fetch pending/failed rows ready for retry
    let query = supabaseAdmin
      .from("booking_outbox")
      .select("*")
      .in("status", ["pending", "failed"])
      .lte("next_retry_at", new Date().toISOString())
      .lt("attempts", MAX_ATTEMPTS)
      .order("created_at", { ascending: true })
      .limit(50);

    if (specificIds && specificIds.length > 0) {
      query = supabaseAdmin
        .from("booking_outbox")
        .select("*")
        .in("id", specificIds)
        .in("status", ["pending", "failed"])
        .limit(50);
    }

    const { data: rows, error: fetchErr } = await query;

    if (fetchErr) {
      console.error("Fetch outbox error:", fetchErr);
      return new Response(
        JSON.stringify({ error: fetchErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: "No pending rows" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!GOOGLE_APPS_SCRIPT_URL) {
      return new Response(
        JSON.stringify({ error: "GOOGLE_APPS_SCRIPT_URL not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sent = 0;
    let failed = 0;

    for (const row of rows) {
      try {
        const resp = await fetch(GOOGLE_APPS_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(row.payload),
        });

        if (resp.ok || resp.status === 302 || resp.status === 200) {
          await supabaseAdmin
            .from("booking_outbox")
            .update({ status: "sent", last_error: null, updated_at: new Date().toISOString() })
            .eq("id", row.id);
          sent++;
        } else {
          throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
        }
      } catch (err) {
        const attempts = (row.attempts || 0) + 1;
        const backoffMinutes = Math.pow(2, attempts);
        const nextRetry = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString();
        const newStatus = attempts >= MAX_ATTEMPTS ? "failed" : "pending";

        await supabaseAdmin
          .from("booking_outbox")
          .update({
            status: newStatus,
            attempts,
            last_error: err instanceof Error ? err.message : String(err),
            next_retry_at: nextRetry,
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ processed: rows.length, sent, failed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Process outbox error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
