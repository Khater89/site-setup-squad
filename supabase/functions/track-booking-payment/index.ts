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
    const { booking_number, phone, payment_method } = await req.json();

    if (!booking_number || !phone || !payment_method) {
      return new Response(JSON.stringify({ error: "missing_fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["CASH", "INSURANCE", "CLIQ", "APPLE_PAY"].includes(payment_method)) {
      return new Response(JSON.stringify({ error: "invalid_payment_method" }), {
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
      .select("id, booking_number, status, assigned_provider_id, payment_method, payment_status, agreed_price, provider_share, calculated_total")
      .eq("booking_number", booking_number.trim().toUpperCase())
      .single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: "not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (booking.status !== "COMPLETED") {
      return new Response(JSON.stringify({ error: "not_completed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Payment lock: once confirmed, cannot change
    if (booking.payment_status === "PAYMENT_METHOD_SET") {
      return new Response(JSON.stringify({ error: "already_set", payment_method: booking.payment_method }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify phone
    const { data: contact } = await supabase
      .from("booking_contacts")
      .select("customer_phone")
      .eq("booking_id", booking.id)
      .single();

    const storedPhone = contact?.customer_phone?.replace(/[\s\-]/g, "").trim() || "";
    if (!storedPhone || (!normalizedPhone.endsWith(storedPhone.slice(-7)) && !storedPhone.endsWith(normalizedPhone.slice(-7)))) {
      return new Response(JSON.stringify({ error: "phone_mismatch" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update payment method
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ payment_method, payment_status: "PAYMENT_METHOD_SET" })
      .eq("id", booking.id);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If CliQ, credit provider's share to their wallet (platform received payment directly)
    if (payment_method === "CLIQ" && booking.assigned_provider_id && booking.provider_share) {
      // Calculate provider's total share based on actual duration
      let providerTotal = booking.provider_share;
      // The provider share is already calculated at completion time via calc_escalating_price
      // Credit positive amount to provider wallet
      await supabase.from("provider_wallet_ledger").insert({
        provider_id: booking.assigned_provider_id,
        amount: providerTotal,
        reason: "cliq_payment_credit",
        booking_id: booking.id,
      });

      // Notify provider about credit
      await supabase.from("staff_notifications").insert({
        title: "💳 تم استلام دفعة CliQ",
        body: `تم استلام دفعة CliQ للطلب ${booking.booking_number}. تمت إضافة حصتك (${providerTotal} د.أ) لمحفظتك وتسوية المديونية تلقائياً.`,
        target_role: "provider",
        provider_id: booking.assigned_provider_id,
        booking_id: booking.id,
      });

      // Notify admin
      await supabase.from("staff_notifications").insert({
        title: `💳 دفع CliQ — ${booking.booking_number}`,
        body: `اختار العميل الدفع عبر CliQ. تمت إضافة حصة المزود (${providerTotal} د.أ) لمحفظته تلقائياً.`,
        target_role: "admin",
        booking_id: booking.id,
      });
    }

    // If CASH or INSURANCE, send financial notification to provider
    if ((payment_method === "CASH" || payment_method === "INSURANCE") && booking.assigned_provider_id) {
      const methodLabel = payment_method === "CASH" ? "نقداً" : "تأمين طبي";
      await supabase.from("staff_notifications").insert({
        title: "💰 تنبيه مالي: مستحقات جديدة",
        body: `تم اختيار الدفع "${methodLabel}" للطلب ${booking.booking_number}. تم تسجيل حصة المنصة كمديونية في محفظتك. يرجى التسوية خلال 24 ساعة.`,
        target_role: "provider",
        provider_id: booking.assigned_provider_id,
        booking_id: booking.id,
      });

      // Also notify admin
      await supabase.from("staff_notifications").insert({
        title: `💰 دفع ${methodLabel} — ${booking.booking_number}`,
        body: `اختار العميل الدفع "${methodLabel}". تم تسجيل مستحقات المنصة في محفظة المزود.`,
        target_role: "admin",
        booking_id: booking.id,
      });
    }

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
