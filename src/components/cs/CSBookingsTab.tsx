import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarDays, MapPin, Search, Filter, Phone,
  MessageCircle, UserCheck, Loader2,
} from "lucide-react";
import CSAssignmentDialog from "./CSAssignmentDialog";

/* ── Types ── */

export interface BookingRow {
  id: string;
  booking_number: string | null;
  customer_display_name: string | null;
  city: string;
  client_address_text: string | null;
  client_lat: number | null;
  client_lng: number | null;
  scheduled_at: string;
  status: string;
  payment_method: string;
  subtotal: number;
  platform_fee: number;
  provider_payout: number;
  agreed_price: number | null;
  internal_note: string | null;
  notes: string | null;
  assigned_provider_id: string | null;
  assigned_by: string | null;
  assigned_at: string | null;
  accepted_at: string | null;
  service_id: string;
  // From booking_contacts join
  customer_name?: string | null;
  customer_phone?: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  NEW: "جديد",
  ASSIGNED: "معيّن",
  ACCEPTED: "مقبول",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي",
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-info/10 text-info border-info/30",
  ASSIGNED: "bg-warning/10 text-warning border-warning/30",
  ACCEPTED: "bg-success/10 text-success border-success/30",
  COMPLETED: "bg-success/10 text-success border-success/30",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/30",
};

const CSBookingsTab = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [serviceNames, setServiceNames] = useState<Record<string, string>>({});
  const [providerNames, setProviderNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Assignment dialog
  const [assignBooking, setAssignBooking] = useState<BookingRow | null>(null);

  const fetchData = useCallback(async () => {
    const [bookingsRes, contactsRes, servicesRes, profilesRes] = await Promise.all([
      supabase.from("bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("booking_contacts").select("*"),
      supabase.from("services").select("id, name"),
      supabase.from("profiles").select("user_id, full_name"),
    ]);

    const contactMap: Record<string, any> = {};
    (contactsRes.data || []).forEach((c: any) => { contactMap[c.booking_id] = c; });

    const merged = (bookingsRes.data || []).map((b: any) => {
      const contact = contactMap[b.id];
      return {
        ...b,
        customer_name: contact?.customer_name || b.customer_display_name || "",
        customer_phone: contact?.customer_phone || "",
        client_address_text: contact?.client_address_text || null,
      };
    });
    setBookings(merged as BookingRow[]);

    const svcMap: Record<string, string> = {};
    (servicesRes.data || []).forEach((s: any) => { svcMap[s.id] = s.name; });
    setServiceNames(svcMap);

    const pMap: Record<string, string> = {};
    (profilesRes.data || []).forEach((p: any) => { pMap[p.user_id] = p.full_name || "بدون اسم"; });
    setProviderNames(pMap);

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (b.customer_name || "").toLowerCase().includes(q) ||
        (b.customer_phone || "").includes(q) ||
        b.city.toLowerCase().includes(q) ||
        (b.booking_number || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `تم تحديث الحالة إلى ${STATUS_LABELS[status]}` });
      fetchData();
    }
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو الهاتف أو المدينة أو رقم الحجز..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <Filter className="h-4 w-4 ml-1" />
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

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">لا توجد حجوزات مطابقة</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filteredBookings.map((b) => (
            <Card key={b.id}>
              <CardContent className="py-4 px-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {serviceNames[b.service_id] || "خدمة"}
                      {b.booking_number && (
                        <span className="ms-2 text-[10px] text-muted-foreground" dir="ltr">{b.booking_number}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {b.customer_name || b.customer_display_name || "—"} · <span dir="ltr">{b.customer_phone || "—"}</span>
                    </p>
                  </div>
                  <Badge variant="outline" className={STATUS_COLORS[b.status] || ""}>
                    {STATUS_LABELS[b.status] || b.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {new Date(b.scheduled_at).toLocaleDateString("ar-JO", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{b.city}</span>
                  <span className="font-medium text-primary">{b.subtotal} د.أ</span>
                  {b.agreed_price != null && (
                    <span className="text-success font-medium">المتفق: {b.agreed_price} د.أ</span>
                  )}
                </div>

                {b.client_address_text && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0" /> {b.client_address_text}
                  </p>
                )}
                {b.notes && <p className="text-xs bg-muted rounded p-2">{b.notes}</p>}
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

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  {b.status === "NEW" && !b.assigned_provider_id && (
                    <Button
                      size="sm"
                      className="gap-1 h-7 text-xs"
                      onClick={() => setAssignBooking(b)}
                    >
                      <UserCheck className="h-3 w-3" /> تعيين مزوّد وتسعير
                    </Button>
                  )}

                  {b.status !== "COMPLETED" && b.status !== "CANCELLED" && (
                    <Select onValueChange={(v) => updateStatus(b.id, v)}>
                      <SelectTrigger className="h-7 text-xs w-28">
                        <SelectValue placeholder="تغيير الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <a
                    href={`https://wa.me/${(b.customer_phone || "").replace(/^0/, "962")}?text=${encodeURIComponent(`مرحباً ${b.customer_name || ""}، نحن من فريق MFN.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline" className="gap-1 h-7 text-xs">
                      <MessageCircle className="h-3 w-3" /> واتساب
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assignment Dialog */}
      {assignBooking && (
        <CSAssignmentDialog
          booking={assignBooking}
          open={!!assignBooking}
          onOpenChange={(open) => { if (!open) setAssignBooking(null); }}
          onAssigned={() => { setAssignBooking(null); fetchData(); }}
          serviceName={serviceNames[assignBooking.service_id] || "خدمة"}
        />
      )}
    </div>
  );
};

export default CSBookingsTab;
