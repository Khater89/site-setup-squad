import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  MessageCircle,
} from "lucide-react";
import mfnLogo from "@/assets/mfn-logo.png";

interface BookingRow {
  id: string;
  customer_name: string;
  customer_phone: string;
  city: string;
  scheduled_at: string;
  status: string;
  payment_method: string;
  subtotal: number;
  provider_payout: number;
  notes: string | null;
  assigned_provider_id: string | null;
  service_id: string;
}

interface LedgerEntry {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
  booking_id: string | null;
}

interface ServiceName {
  id: string;
  name: string;
}

const STATUS_LABELS: Record<string, string> = {
  NEW: "جديد",
  ASSIGNED: "معيّن",
  CONFIRMED: "مؤكد",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي",
};

const ProviderDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [myBookings, setMyBookings] = useState<BookingRow[]>([]);
  const [availableBookings, setAvailableBookings] = useState<BookingRow[]>([]);
  const [serviceNames, setServiceNames] = useState<Record<string, string>>({});
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;

    // Fetch service names for display
    const { data: svcData } = await supabase.from("services").select("id, name");
    const svcMap: Record<string, string> = {};
    (svcData || []).forEach((s: any) => { svcMap[s.id] = s.name; });
    setServiceNames(svcMap);

    // Fetch my assigned bookings
    const { data: myData } = await supabase
      .from("bookings")
      .select("*")
      .eq("assigned_provider_id", user.id)
      .order("scheduled_at", { ascending: false });
    setMyBookings((myData as unknown as BookingRow[]) || []);

    // Fetch available (unassigned, NEW) bookings
    // Provider can see bookings matching their city
    const { data: availData } = await supabase
      .from("bookings")
      .select("*")
      .eq("status", "NEW")
      .is("assigned_provider_id", null)
      .order("scheduled_at", { ascending: true });
    
    // Filter by provider's city if available
    let filtered = (availData as unknown as BookingRow[]) || [];
    if (profile?.city) {
      filtered = filtered.filter((b) => b.city.includes(profile.city!) || profile.city!.includes(b.city));
    }
    setAvailableBookings(filtered);

    // Wallet
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

  const assignToMe = async (bookingId: string) => {
    if (!user) return;
    setAssigning(bookingId);

    const { error } = await supabase
      .from("bookings")
      .update({
        assigned_provider_id: user.id,
        status: "ASSIGNED",
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
    setAssigning(null);
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
      .update({ assigned_provider_id: null, status: "NEW" })
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

          {/* Available Requests */}
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
                          <p className="text-xs text-muted-foreground">{b.customer_name}</p>
                        </div>
                        <Badge variant="outline" className="bg-info/10 text-info border-info/30">
                          {STATUS_LABELS[b.status] || b.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(b.scheduled_at).toLocaleDateString("ar-JO", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{b.city}</span>
                        <span className="font-medium text-primary">{b.provider_payout} د.أ</span>
                      </div>
                      {b.notes && <p className="text-xs bg-muted rounded p-2">{b.notes}</p>}
                      <Button
                        size="sm"
                        className="gap-1.5 w-full"
                        onClick={() => assignToMe(b.id)}
                        disabled={assigning === b.id}
                      >
                        {assigning === b.id ? (
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

          {/* My Bookings */}
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
                          <p className="text-xs text-muted-foreground">{b.customer_name} · {b.customer_phone}</p>
                        </div>
                        <Badge variant="outline">{STATUS_LABELS[b.status] || b.status}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{new Date(b.scheduled_at).toLocaleDateString("ar-JO")}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{b.city}</span>
                        <span>الحصة: {b.provider_payout} د.أ</span>
                      </div>
                      {b.notes && <p className="text-xs bg-muted rounded p-2">{b.notes}</p>}
                      <div className="flex gap-2">
                        {(b.status === "ASSIGNED" || b.status === "CONFIRMED") && (
                          <>
                            <Button size="sm" className="gap-1 h-7 text-xs flex-1" onClick={() => markComplete(b.id)}>
                              <CheckCircle className="h-3 w-3" />
                              تأكيد الإتمام
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" onClick={() => releaseBooking(b.id)}>
                              إلغاء الإسناد
                            </Button>
                          </>
                        )}
                        <a
                          href={`https://wa.me/${b.customer_phone.replace(/^0/, "962")}?text=${encodeURIComponent(`مرحباً ${b.customer_name}، أنا مقدم الخدمة من MFN. تم تأكيد حجزك.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="outline" className="gap-1 h-7 text-xs">
                            <MessageCircle className="h-3 w-3" />
                            واتساب
                          </Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Wallet */}
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
