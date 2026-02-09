import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, Search, UserCheck } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import BookingDetailsDrawer, { type BookingRow } from "./BookingDetailsDrawer";
import CSAssignmentDialog from "@/components/cs/CSAssignmentDialog";

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-info/10 text-info border-info/30",
  CONFIRMED: "bg-primary/20 text-primary border-primary/30",
  ASSIGNED: "bg-warning/10 text-warning border-warning/30",
  ACCEPTED: "bg-success/10 text-success border-success/30",
  COMPLETED: "bg-success text-success-foreground",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/30",
};

const FILTER_STATUSES = ["ALL", "NEW", "ASSIGNED", "ACCEPTED", "COMPLETED", "CANCELLED"];

const BookingsTab = () => {
  const { toast } = useToast();
  const { t, formatCurrency, formatDateShort, isRTL } = useLanguage();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [serviceNames, setServiceNames] = useState<Record<string, string>>({});
  const [providerNames, setProviderNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null);
  const [assignBooking, setAssignBooking] = useState<BookingRow | null>(null);

  const fetchBookings = async () => {
    const [bookingsRes, servicesRes, profilesRes] = await Promise.all([
      supabase.from("bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("services").select("id, name"),
      supabase.from("profiles").select("user_id, full_name"),
    ]);

    setBookings((bookingsRes.data as unknown as BookingRow[]) || []);

    const svcMap: Record<string, string> = {};
    (servicesRes.data || []).forEach((s: any) => { svcMap[s.id] = s.name; });
    setServiceNames(svcMap);

    const pMap: Record<string, string> = {};
    (profilesRes.data || []).forEach((p: any) => { pMap[p.user_id] = p.full_name || t("admin.providers.no_name"); });
    setProviderNames(pMap);

    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, []);

  const filtered = bookings.filter((b) => {
    if (filter !== "ALL" && b.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        b.customer_name.toLowerCase().includes(q) ||
        b.customer_phone.includes(q) ||
        b.city.toLowerCase().includes(q) ||
        (b.booking_number || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAssignFromDetails = (booking: BookingRow) => {
    setSelectedBooking(null);
    setAssignBooking(booking);
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-lg font-bold">{t("admin.bookings.title")} ({bookings.length})</h2>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
            <Input
              placeholder={t("admin.bookings.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${isRTL ? "pr-9" : "pl-9"} w-[200px]`}
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILTER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "ALL" ? t("admin.bookings.filter_all") : t(`status.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">{t("admin.bookings.no_bookings")}</div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>{t("admin.bookings.col.number")}</TableHead>
                <TableHead>{t("admin.bookings.col.service")}</TableHead>
                <TableHead>{t("admin.bookings.col.customer")}</TableHead>
                <TableHead>{t("admin.bookings.col.city")}</TableHead>
                <TableHead>{t("admin.bookings.col.date")}</TableHead>
                <TableHead>{t("admin.bookings.col.amount")}</TableHead>
                <TableHead>{t("admin.bookings.col.status")}</TableHead>
                <TableHead>{t("admin.bookings.col.provider")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => (
                <TableRow
                  key={b.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setSelectedBooking(b)}
                >
                  <TableCell className="text-xs font-mono" dir="ltr">
                    {b.booking_number || b.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {serviceNames[b.service_id] || "—"}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{b.customer_name}</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">{b.customer_phone}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{b.city}</TableCell>
                  <TableCell className="text-xs">
                    {formatDateShort(b.scheduled_at)}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {b.agreed_price != null ? (
                      <span className="text-success">{formatCurrency(b.agreed_price)}</span>
                    ) : (
                      formatCurrency(b.subtotal)
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[b.status] || ""}`}>
                      {t(`status.${b.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {b.assigned_provider_id ? (
                      <span className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3 text-success" />
                        {providerNames[b.assigned_provider_id] || "—"}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <BookingDetailsDrawer
        booking={selectedBooking}
        open={!!selectedBooking}
        onOpenChange={(open) => { if (!open) setSelectedBooking(null); }}
        serviceName={selectedBooking ? serviceNames[selectedBooking.service_id] || t("provider.dashboard.service") : ""}
        providerName={selectedBooking?.assigned_provider_id ? providerNames[selectedBooking.assigned_provider_id] || null : null}
        onAssign={handleAssignFromDetails}
      />

      {assignBooking && (
        <CSAssignmentDialog
          booking={assignBooking}
          open={!!assignBooking}
          onOpenChange={(open) => { if (!open) setAssignBooking(null); }}
          onAssigned={() => { setAssignBooking(null); fetchBookings(); }}
          serviceName={serviceNames[assignBooking.service_id] || t("provider.dashboard.service")}
        />
      )}
    </div>
  );
};

export default BookingsTab;
