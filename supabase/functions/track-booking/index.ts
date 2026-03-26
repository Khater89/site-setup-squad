import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { booking_number, phone } = await req.json();

    if (!booking_number || !phone) {
      return new Response(JSON.stringify({ error: "booking_number and phone are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Normalize phone: strip spaces/dashes
    const normalizedPhone = phone.replace(/[\s\-]/g, "").trim();

    // Find booking by booking_number
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, booking_number, status, service_id, city, scheduled_at, created_at, rejected_at, completed_at, assigned_provider_id, subtotal, agreed_price, calculated_total")
      .eq("booking_number", booking_number.trim().toUpperCase())
      .single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: "not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify phone from booking_contacts
    const { data: contact } = await supabase
      .from("booking_contacts")
      .select("customer_phone")
      .eq("booking_id", booking.id)
      .single();

    const storedPhone = contact?.customer_phone?.replace(/[\s\-]/g, "").trim() || "";

    if (!storedPhone || !normalizedPhone.endsWith(storedPhone.slice(-7)) && !storedPhone.endsWith(normalizedPhone.slice(-7))) {
      return new Response(JSON.stringify({ error: "phone_mismatch" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch history
    const { data: history } = await supabase
      .from("booking_history")
      .select("action, created_at, note")
      .eq("booking_id", booking.id)
      .order("created_at", { ascending: true });

    // Fetch service name
    const { data: service } = await supabase
      .from("services")
      .select("name")
      .eq("id", booking.service_id)
      .single();

    // Fetch rating if completed
    let rating = null;
    if (booking.status === "COMPLETED") {
      const { data: r } = await supabase
        .from("provider_ratings")
        .select("rating, comment")
        .eq("booking_id", booking.id)
        .maybeSingle();
      rating = r;
    }

    return new Response(JSON.stringify({
      booking: {
        id: booking.id,
        booking_number: booking.booking_number,
        status: booking.status,
        city: booking.city,
        scheduled_at: booking.scheduled_at,
        created_at: booking.created_at,
        service_name: service?.name || "خدمة",
        subtotal: booking.agreed_price || booking.subtotal,
        calculated_total: booking.calculated_total,
      },
      history: history || [],
      rating,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
