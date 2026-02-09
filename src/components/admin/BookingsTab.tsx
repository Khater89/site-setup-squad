import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CalendarDays, User, Phone, MapPin, UserCheck } from "lucide-react";
import CSAssignmentDialog from "@/components/cs/CSAssignmentDialog";

interface BookingRow {
  id: string;
  booking_number: string | null;
  customer_name: string;
  customer_phone: string;
  city: string;
  client_address_text: string | null;
  client_lat: number | null;
  client_lng: number | null;
  scheduled_at: string;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  platform_fee: number;
  provider_payout: number;
  agreed_price: number | null;
  internal_note: string | null;
  notes: string | null;
  assigned_provider_id: string | null;
  assigned_by: string | null;
  created_at: string;
  service_id: string;
  services: { name: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-info text-info-foreground",
  CONFIRMED: "bg-primary/20 text-primary",
  ASSIGNED: "bg-warning/20 text-warning-foreground",
  ACCEPTED: "bg-success/20 text-success",
  COMPLETED: "bg-success text-success-foreground",
  CANCELLED: "bg-destructive text-destructive-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "جديد",
  CONFIRMED: "مؤكد",
  ASSIGNED: "تم التعيين",
  ACCEPTED: "مقبول",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي",
};

const BookingsTab = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [providerNames, setProviderNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [assignBooking, setAssignBooking] = useState<BookingRow | null>(null);

  const fetchBookings = async () => {
    const [bookingsRes, profilesRes] = await Promise.all([
      supabase.from("bookings").select("*, services(name)").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name"),
    ]);

    setBookings((bookingsRes.data as unknown as BookingRow[]) || []);

    const pMap: Record<string, string> = {};
    (profilesRes.data || []).forEach((p: any) => { pMap[p.user_id] = p.full_name || "بدون اسم"; });
    setProviderNames(pMap);

    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `تم تحديث الحالة إلى ${STATUS_LABELS[status]}` });
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
            <SelectItem value="ASSIGNED">معيّن</SelectItem>
            <SelectItem value="ACCEPTED">مقبول</SelectItem>
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
                    <p className="font-medium text-sm">
                      {b.services?.name || "خدمة محذوفة"}
                      {b.booking_number && <span className="ms-2 text-[10px] text-muted-foreground" dir="ltr">{b.booking_number}</span>}
                    </p>
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

                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <Badge variant="outline">{b.payment_method}</Badge>
                  <Badge variant="outline">{b.payment_status}</Badge>
                  <span className="text-muted-foreground">المجموع: {b.subtotal} د.أ</span>
                  <span className="text-muted-foreground">العمولة: {b.platform_fee} د.أ</span>
                  {b.agreed_price != null && (
                    <span className="text-success font-medium">المتفق: {b.agreed_price} د.أ</span>
                  )}
                </div>

                {b.notes && <p className="text-xs text-muted-foreground bg-muted rounded p-2">{b.notes}</p>}
                {b.internal_note && (
                  <p className="text-xs bg-warning/10 border border-warning/20 rounded p-2 text-warning-foreground">
                    📝 ملاحظة داخلية: {b.internal_note}
                  </p>
                )}

                {/* Assignment info */}
                {b.assigned_provider_id && (
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <UserCheck className="h-3 w-3" />
                    مُسند إلى: <span className="font-medium">{providerNames[b.assigned_provider_id] || "مزوّد"}</span>
                    {b.assigned_by && <span>({b.assigned_by})</span>}
                  </div>
                )}

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

                  {b.status === "NEW" && !b.assigned_provider_id && (
                    <Button
                      size="sm"
                      className="gap-1 h-8 text-xs"
                      onClick={() => setAssignBooking(b)}
                    >
                      <UserCheck className="h-3 w-3" /> تعيين وتسعير
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assignment Dialog (shared with CS) */}
      {assignBooking && (
        <CSAssignmentDialog
          booking={assignBooking}
          open={!!assignBooking}
          onOpenChange={(open) => { if (!open) setAssignBooking(null); }}
          onAssigned={() => { setAssignBooking(null); fetchBookings(); }}
          serviceName={assignBooking.services?.name || "خدمة"}
        />
      )}
    </div>
  );
};

export default BookingsTab;
