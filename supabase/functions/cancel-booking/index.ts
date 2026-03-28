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

    const normalizedPhone = phone.replace(/[\s\-]/g, "").trim();

    // Find booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, booking_number, status, scheduled_at, assigned_provider_id, service_id, customer_display_name")
      .eq("booking_number", booking_number.trim().toUpperCase())
      .single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: "not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify phone
    const { data: contact } = await supabase
      .from("booking_contacts")
      .select("customer_phone, customer_name")
      .eq("booking_id", booking.id)
      .single();

    const storedPhone = contact?.customer_phone?.replace(/[\s\-]/g, "").trim() || "";
    if (!storedPhone || (!normalizedPhone.endsWith(storedPhone.slice(-7)) && !storedPhone.endsWith(normalizedPhone.slice(-7)))) {
      return new Response(JSON.stringify({ error: "phone_mismatch" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check cancellable statuses
    const cancellableStatuses = ["NEW", "CONFIRMED", "ASSIGNED", "ACCEPTED"];
    if (!cancellableStatuses.includes(booking.status)) {
      return new Response(JSON.stringify({ error: "not_cancellable", reason: "status" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check 2-hour rule
    const scheduledTime = new Date(booking.scheduled_at).getTime();
    const twoHoursBefore = scheduledTime - 2 * 60 * 60 * 1000;
    if (Date.now() >= twoHoursBefore) {
      return new Response(JSON.stringify({ error: "not_cancellable", reason: "too_close" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cancel the booking
    await supabase
      .from("bookings")
      .update({ status: "CANCELLED" })
      .eq("id", booking.id);

    // Get service name
    const { data: service } = await supabase
      .from("services")
      .select("name")
      .eq("id", booking.service_id)
      .single();

    // Insert cancellation notification for admin
    const customerName = contact?.customer_name || booking.customer_display_name || "عميل";
    await supabase
      .from("staff_notifications")
      .insert({
        target_role: "admin",
        title: `❌ إلغاء طلب من العميل`,
        body: `العميل: ${customerName}\nرقم الحجز: ${booking.booking_number}\nالخدمة: ${service?.name || "غير محدد"}\nالموعد: ${new Date(booking.scheduled_at).toLocaleString("ar-JO")}`,
        booking_id: booking.id,
      });

    // Add to booking history
    await supabase
      .from("booking_history")
      .insert({
        booking_id: booking.id,
        action: "CANCELLED",
        performed_by: "00000000-0000-0000-0000-000000000000",
        performer_role: "customer",
        note: "تم الإلغاء من قبل العميل عبر صفحة التتبع",
      });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
