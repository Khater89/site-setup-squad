import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CalendarDays, User, Phone, MapPin } from "lucide-react";

interface BookingRow {
  id: string;
  customer_name: string;
  customer_phone: string;
  city: string;
  scheduled_at: string;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  platform_fee: number;
  provider_payout: number;
  notes: string | null;
  assigned_provider_id: string | null;
  created_at: string;
  services: { name: string } | null;
}

interface ProviderOption {
  user_id: string;
  full_name: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-info text-info-foreground",
  CONFIRMED: "bg-primary/20 text-primary",
  ASSIGNED: "bg-warning/20 text-warning-foreground",
  COMPLETED: "bg-success text-success-foreground",
  CANCELLED: "bg-destructive text-destructive-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "جديد",
  CONFIRMED: "مؤكد",
  ASSIGNED: "تم التعيين",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي",
};

const BookingsTab = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  const fetchBookings = async () => {
    const query = supabase
      .from("bookings")
      .select("*, services(name)")
      .order("created_at", { ascending: false });

    const { data } = await query;
    setBookings((data as unknown as BookingRow[]) || []);
    setLoading(false);
  };

  const fetchProviders = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "provider");
    if (roles && roles.length > 0) {
      const ids = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", ids)
        .eq("provider_status", "approved");
      setProviders(profiles || []);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchProviders();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `تم تحديث الحالة إلى ${STATUS_LABELS[status]}` });
      fetchBookings();
    }
  };

  const assignProvider = async (bookingId: string, providerId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ assigned_provider_id: providerId, status: "ASSIGNED" })
      .eq("id", bookingId);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم تعيين مقدم الخدمة" });
      fetchBookings();
    }
  };

  const filtered = filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter);

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">الحجوزات ({bookings.length})</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">الكل</SelectItem>
            <SelectItem value="NEW">جديد</SelectItem>
            <SelectItem value="CONFIRMED">مؤكد</SelectItem>
            <SelectItem value="ASSIGNED">معيّن</SelectItem>
            <SelectItem value="COMPLETED">مكتمل</SelectItem>
            <SelectItem value="CANCELLED">ملغي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">لا توجد حجوزات</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((b) => (
            <Card key={b.id}>
              <CardContent className="py-4 px-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{b.services?.name || "خدمة محذوفة"}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" />{b.customer_name}</span>
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{b.customer_phone}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{b.city}</span>
                    </div>
                  </div>
                  <Badge className={STATUS_COLORS[b.status] || ""}>{STATUS_LABELS[b.status] || b.status}</Badge>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  {new Date(b.scheduled_at).toLocaleDateString("ar-JO", {
                    weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline">{b.payment_method}</Badge>
                  <Badge variant="outline">{b.payment_status}</Badge>
                  <span className="text-muted-foreground">المجموع: {b.subtotal} د.أ</span>
                  <span className="text-muted-foreground">العمولة: {b.platform_fee} د.أ</span>
                </div>

                {b.notes && <p className="text-xs text-muted-foreground bg-muted rounded p-2">{b.notes}</p>}

                <div className="flex items-center gap-2 pt-1">
                  <Select value={b.status} onValueChange={(v) => updateStatus(b.id, v)}>
                    <SelectTrigger className="h-8 text-xs w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {providers.length > 0 && (
                    <Select
                      value={b.assigned_provider_id || ""}
                      onValueChange={(v) => assignProvider(b.id, v)}
                    >
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue placeholder="تعيين مقدم خدمة" />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map((p) => (
                          <SelectItem key={p.user_id} value={p.user_id}>
                            {p.full_name || p.user_id.slice(0, 8)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingsTab;
