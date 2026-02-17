import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find ACCEPTED bookings where scheduled_at was 15+ minutes ago but no check_in_at
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    const { data: lateBookings } = await supabase
      .from("bookings")
      .select("id, booking_number, assigned_provider_id, scheduled_at, city")
      .eq("status", "ACCEPTED")
      .is("check_in_at", null)
      .lte("scheduled_at", fifteenMinAgo);

    if (!lateBookings || lateBookings.length === 0) {
      return new Response(JSON.stringify({ checked: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get provider names
    const providerIds = [...new Set(lateBookings.map((b: any) => b.assigned_provider_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", providerIds);
    const nameMap: Record<string, string> = {};
    (profiles || []).forEach((p: any) => { nameMap[p.user_id] = p.full_name || "—"; });

    // Check existing notifications to avoid duplicates
    const bookingIds = lateBookings.map((b: any) => b.id);
    const { data: existingNotifs } = await supabase
      .from("staff_notifications")
      .select("booking_id")
      .in("booking_id", bookingIds)
      .like("title", "%تأخر%");
    const alreadyNotified = new Set((existingNotifs || []).map((n: any) => n.booking_id));

    const newNotifs = lateBookings
      .filter((b: any) => !alreadyNotified.has(b.id))
      .map((b: any) => ({
        target_role: "admin",
        title: `⏰ تأخر: ${b.booking_number || b.id.slice(0, 8)}`,
        body: `المزود ${nameMap[b.assigned_provider_id] || "—"} لم يبدأ الخدمة بعد مرور 15 دقيقة من الموعد (${b.city}).`,
        booking_id: b.id,
        provider_id: b.assigned_provider_id,
      }));

    if (newNotifs.length > 0) {
      await supabase.from("staff_notifications").insert(newNotifs);
    }

    return new Response(JSON.stringify({ checked: lateBookings.length, notified: newNotifs.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
