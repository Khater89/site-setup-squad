import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarCheck, Wallet, LogOut, Loader2, CheckCircle,
  CalendarDays, MapPin, ClipboardList, UserCheck, Phone,
  MessageCircle, ShieldCheck, Eye, Lock,
} from "lucide-react";
import mfnLogo from "@/assets/mfn-logo.png";

/* ── Types ── */

interface ProviderBooking {
  id: string;
  booking_number: string | null;
  service_id: string;
  city: string;
  scheduled_at: string;
  status: string;
  provider_payout: number;
  subtotal: number;
  assigned_provider_id: string | null;
  assigned_at: string | null;
  accepted_at: string | null;
  created_at: string;
  customer_display_name: string | null;
  customer_phone: string | null;
  client_address_text: string | null;
  client_lat: number | null;
  client_lng: number | null;
  notes: string | null;
}

interface LedgerEntry {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
  booking_id: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  NEW: "جديد",
  ASSIGNED: "معيّن",
  ACCEPTED: "مقبول",
  CONFIRMED: "مؤكد",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي",
};

/* ── Component ── */

const ProviderDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [allBookings, setAllBookings] = useState<ProviderBooking[]>([]);
  const [serviceNames, setServiceNames] = useState<Record<string, string>>({});
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /* ── Data fetching ── */

  const fetchData = async () => {
    if (!user) return;

    const { data: svcData } = await supabase.from("services").select("id, name");
    const svcMap: Record<string, string> = {};
    (svcData || []).forEach((s: any) => { svcMap[s.id] = s.name; });
    setServiceNames(svcMap);

    // Privacy-safe: masks contact details until accepted
    const { data: bookingsData } = await supabase.rpc("get_provider_bookings" as any);
    setAllBookings((bookingsData as unknown as ProviderBooking[]) || []);

    const [ledgerRes, balanceRes] = await Promise.all([
      supabase
        .from("provider_wallet_ledger")
        .select("*")
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.rpc("get_provider_balance", { _provider_id: user.id }),
    ]);

    setLedger((ledgerRes.data as LedgerEntry[]) || []);
    setBalance(balanceRes.data || 0);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  /* ── Derived lists ── */

  const availableBookings = allBookings.filter(
    (b) => b.status === "NEW" && !b.assigned_provider_id
  );
  const myBookings = allBookings.filter(
    (b) => b.assigned_provider_id === user?.id
  );

  const isProfileReady = profile?.provider_status === "approved" && profile?.profile_completed;

  /* ── Actions ── */

  const assignToMe = async (bookingId: string) => {
    if (!user) return;
    setActionLoading(bookingId);

    const { error } = await supabase
      .from("bookings")
      .update({
        assigned_provider_id: user.id,
        status: "ASSIGNED",
        assigned_at: new Date().toISOString(),
        assigned_by: "provider_self",
      })
      .eq("id", bookingId)
      .eq("status", "NEW")
      .is("assigned_provider_id", null);

    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم إسناد الطلب إليك بنجاح ✅" });
      fetchData();
    }
    setActionLoading(null);
  };

  const acceptBooking = async (bookingId: string) => {
    if (!user) return;
    setActionLoading(bookingId);

    const { error } = await supabase
      .from("bookings")
      .update({
        accepted_at: new Date().toISOString(),
        status: "ACCEPTED",
      })
      .eq("id", bookingId)
      .eq("assigned_provider_id", user.id);

    if (!error) {
      // Log data access for privacy audit
      await (supabase as any).from("data_access_log").insert({
        booking_id: bookingId,
        accessed_by: user.id,
        accessor_role: "provider",
        action: "accept_booking",
      });
      toast({ title: "تم قبول الطلب — بيانات التواصل متاحة الآن ✅" });
      fetchData();
    } else {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
    setActionLoading(null);
  };

  const markComplete = async (bookingId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "COMPLETED" })
      .eq("id", bookingId);

    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم تحديث الحجز كمكتمل ✅" });
      fetchData();
    }
  };

  const releaseBooking = async (bookingId: string) => {
    if (!confirm("هل تريد إلغاء إسنادك لهذا الطلب؟")) return;
    const { error } = await supabase
      .from("bookings")
      .update({ assigned_provider_id: null, status: "NEW", accepted_at: null })
      .eq("id", bookingId);

    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم إلغاء الإسناد" });
      fetchData();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  /* ── Guards ── */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isProfileReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-10 space-y-4">
            <p className="text-sm text-muted-foreground">
              {profile?.provider_status !== "approved"
                ? "حسابك قيد المراجعة. يرجى الانتظار حتى تتم الموافقة."
                : "يرجى إكمال ملفك الشخصي أولاً لبدء استقبال الطلبات."}
            </p>
            {profile?.provider_status === "approved" && !profile?.profile_completed && (
              <Link to="/provider/onboarding">
                <Button>إكمال الملف الشخصي</Button>
              </Link>
            )}
            <div>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5 mt-2">
                <LogOut className="h-4 w-4" />
                خروج
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAccepted = (b: ProviderBooking) => !!b.accepted_at;

  /* ── Render ── */

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={mfnLogo} alt="MFN" className="h-8" />
            <div>
              <h1 className="text-sm font-bold text-foreground">لوحة مقدم الخدمة</h1>
              <p className="text-[10px] text-muted-foreground">{profile?.full_name || user?.email}</p>
            </div>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5">
            <LogOut className="h-4 w-4" />
            خروج
          </Button>
        </div>
      </header>

      <main className="container py-6 px-4">
        {/* Balance Card */}
        <Card className="mb-6">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm text-muted-foreground">رصيد المحفظة</p>
              <p className={`text-2xl font-bold ${balance < 0 ? "text-destructive" : "text-success"}`}>
                {balance} د.أ
              </p>
            </div>
            <Wallet className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>

        <Tabs defaultValue="available" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available" className="gap-1.5 text-xs">
              <ClipboardList className="h-4 w-4" />
              متاحة ({availableBookings.length})
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-1.5 text-xs">
              <CalendarCheck className="h-4 w-4" />
              حجوزاتي ({myBookings.length})
            </TabsTrigger>
            <TabsTrigger value="wallet" className="gap-1.5 text-xs">
              <Wallet className="h-4 w-4" />
              المحفظة
            </TabsTrigger>
          </TabsList>

          {/* ═══ Available Requests — Limited Data ═══ */}
          <TabsContent value="available">
            {availableBookings.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  لا توجد طلبات متاحة حالياً في منطقتك
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {availableBookings.map((b) => (
                  <Card key={b.id}>
                    <CardContent className="py-4 px-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{serviceNames[b.service_id] || "خدمة"}</p>
                          <p className="text-xs text-muted-foreground">
                            {b.customer_display_name || "عميل"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className="bg-info/10 text-info border-info/30">
                            {STATUS_LABELS[b.status] || b.status}
                          </Badge>
                          {b.booking_number && (
                            <span className="text-[10px] text-muted-foreground" dir="ltr">{b.booking_number}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(b.scheduled_at).toLocaleDateString("ar-JO", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{b.city}</span>
                        <span className="font-medium text-primary">{b.provider_payout} د.أ</span>
                      </div>
                      {/* Privacy notice */}
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        بيانات التواصل مخفية — تظهر بعد القبول
                      </div>
                      <Button
                        size="sm"
                        className="gap-1.5 w-full"
                        onClick={() => assignToMe(b.id)}
                        disabled={actionLoading === b.id}
                      >
                        {actionLoading === b.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <UserCheck className="h-3 w-3" />
                        )}
                        إسناد لي
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ═══ My Bookings — Accept/Reveal Flow ═══ */}
          <TabsContent value="bookings">
            {myBookings.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-muted-foreground">لا توجد حجوزات مسندة إليك</CardContent></Card>
            ) : (
              <div className="grid gap-3">
                {myBookings.map((b) => (
                  <Card key={b.id}>
                    <CardContent className="py-4 px-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{serviceNames[b.service_id] || "خدمة"}</p>
                          <p className="text-xs text-muted-foreground">
                            {b.customer_display_name || "عميل"}
                            {b.booking_number && <span className="ms-1" dir="ltr">({b.booking_number})</span>}
                          </p>
                        </div>
                        <Badge variant="outline" className={
                          b.status === "ACCEPTED" ? "bg-success/10 text-success border-success/30" : ""
                        }>
                          {STATUS_LABELS[b.status] || b.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{new Date(b.scheduled_at).toLocaleDateString("ar-JO")}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{b.city}</span>
                        <span>الحصة: {b.provider_payout} د.أ</span>
                      </div>

                      {/* Contact Details — Only After Acceptance */}
                      {isAccepted(b) ? (
                        <div className="rounded-lg border border-success/20 bg-success/5 p-3 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-success">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            بيانات التواصل
                          </div>
                          {b.customer_phone && (
                            <p className="text-sm flex items-center gap-1.5">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span dir="ltr">{b.customer_phone}</span>
                            </p>
                          )}
                          {b.client_address_text && (
                            <p className="text-sm flex items-center gap-1.5">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {b.client_address_text}
                            </p>
                          )}
                          {b.notes && <p className="text-xs bg-muted rounded p-2 mt-1">{b.notes}</p>}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5">
                          <Lock className="h-3.5 w-3.5" />
                          اضغط &quot;قبول الطلب&quot; لعرض بيانات التواصل
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap">
                        {b.status === "ASSIGNED" && !isAccepted(b) && (
                          <Button
                            size="sm"
                            className="gap-1 h-7 text-xs flex-1 bg-success hover:bg-success/90"
                            onClick={() => acceptBooking(b.id)}
                            disabled={actionLoading === b.id}
                          >
                            {actionLoading === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                            قبول الطلب
                          </Button>
                        )}
                        {isAccepted(b) && (b.status === "ACCEPTED" || b.status === "ASSIGNED") && (
                          <Button size="sm" className="gap-1 h-7 text-xs flex-1" onClick={() => markComplete(b.id)}>
                            <CheckCircle className="h-3 w-3" />
                            تأكيد الإتمام
                          </Button>
                        )}
                        {(b.status === "ASSIGNED" || b.status === "ACCEPTED") && (
                          <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" onClick={() => releaseBooking(b.id)}>
                            إلغاء الإسناد
                          </Button>
                        )}
                        {isAccepted(b) && b.customer_phone && (
                          <a
                            href={`https://wa.me/${b.customer_phone.replace(/^0/, "962")}?text=${encodeURIComponent(`مرحباً ${b.customer_display_name || ""}, أنا مقدم الخدمة من MFN. تم تأكيد حجزك.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="outline" className="gap-1 h-7 text-xs">
                              <MessageCircle className="h-3 w-3" />
                              واتساب
                            </Button>
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ═══ Wallet ═══ */}
          <TabsContent value="wallet">
            {ledger.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-muted-foreground">لا توجد حركات في المحفظة</CardContent></Card>
            ) : (
              <div className="grid gap-2">
                {ledger.map((entry) => (
                  <Card key={entry.id}>
                    <CardContent className="flex items-center justify-between py-3 px-4">
                      <div>
                        <p className="text-sm font-medium">
                          {entry.reason === "commission" ? "عمولة" : entry.reason === "settlement" ? "تسوية" : "تعديل"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.created_at).toLocaleDateString("ar-JO")}
                        </p>
                      </div>
                      <span className={`font-bold text-sm ${entry.amount < 0 ? "text-destructive" : "text-success"}`}>
                        {entry.amount > 0 ? "+" : ""}{entry.amount} د.أ
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ProviderDashboard;
