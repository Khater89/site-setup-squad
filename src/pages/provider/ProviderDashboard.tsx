import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CalendarCheck, Wallet, LogOut, Loader2, CheckCircle, CalendarDays, MapPin } from "lucide-react";
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
  services: { name: string } | null;
}

interface LedgerEntry {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
  booking_id: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  ASSIGNED: "معيّن لك",
  CONFIRMED: "مؤكد",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي",
};

const ProviderDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;

    const [bookingsRes, ledgerRes, balanceRes] = await Promise.all([
      supabase
        .from("bookings")
        .select("*, services(name)")
        .eq("assigned_provider_id", user.id)
        .order("scheduled_at", { ascending: false }),
      supabase
        .from("provider_wallet_ledger")
        .select("*")
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.rpc("get_provider_balance", { _provider_id: user.id }),
    ]);

    setBookings((bookingsRes.data as unknown as BookingRow[]) || []);
    setLedger((ledgerRes.data as LedgerEntry[]) || []);
    setBalance(balanceRes.data || 0);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

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
          <div className="flex items-center gap-3">
            <img src={mfnLogo} alt="MFN" className="h-8" />
            <div>
              <h1 className="text-sm font-bold text-foreground">لوحة مقدم الخدمة</h1>
              <p className="text-[10px] text-muted-foreground">{user?.email}</p>
            </div>
          </div>
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

        <Tabs defaultValue="bookings" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bookings" className="gap-1.5">
              <CalendarCheck className="h-4 w-4" />
              حجوزاتي
            </TabsTrigger>
            <TabsTrigger value="wallet" className="gap-1.5">
              <Wallet className="h-4 w-4" />
              المحفظة
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            {bookings.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-muted-foreground">لا توجد حجوزات مسندة إليك</CardContent></Card>
            ) : (
              <div className="grid gap-3">
                {bookings.map((b) => (
                  <Card key={b.id}>
                    <CardContent className="py-4 px-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{b.services?.name || "خدمة"}</p>
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
                      {(b.status === "ASSIGNED" || b.status === "CONFIRMED") && (
                        <Button size="sm" className="gap-1 h-7 text-xs" onClick={() => markComplete(b.id)}>
                          <CheckCircle className="h-3 w-3" />
                          تأكيد الإتمام
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

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
