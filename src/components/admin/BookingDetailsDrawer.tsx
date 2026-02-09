import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  CalendarDays, MapPin, Phone, User, CreditCard, UserCheck,
  MessageCircle, FileText, StickyNote,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export interface BookingRow {
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
  assigned_at: string | null;
  accepted_at: string | null;
  created_at: string;
  service_id: string;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-info/10 text-info border-info/30",
  CONFIRMED: "bg-primary/20 text-primary border-primary/30",
  ASSIGNED: "bg-warning/10 text-warning border-warning/30",
  ACCEPTED: "bg-success/10 text-success border-success/30",
  COMPLETED: "bg-success text-success-foreground",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/30",
};

interface Props {
  booking: BookingRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceName: string;
  providerName: string | null;
  onAssign: (booking: BookingRow) => void;
}

const InfoRow = ({ icon: Icon, label, value, dir }: { icon: any; label: string; value: string | null | undefined; dir?: string }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <span className="text-muted-foreground text-xs">{label}</span>
        <p className="font-medium" dir={dir}>{value}</p>
      </div>
    </div>
  );
};

const BookingDetailsDrawer = ({ booking, open, onOpenChange, serviceName, providerName, onAssign }: Props) => {
  const { t, formatCurrency, formatDate, formatDateTime, formatDateShort } = useLanguage();

  if (!booking) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-base">{t("booking.details.title")}</SheetTitle>
          <SheetDescription dir="ltr" className="text-xs">
            {booking.booking_number || booking.id.slice(0, 8)}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Status & Service */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{serviceName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("booking.details.created")} {formatDate(booking.created_at)}
              </p>
            </div>
            <Badge variant="outline" className={STATUS_COLORS[booking.status] || ""}>
              {t(`status.${booking.status}`)}
            </Badge>
          </div>

          {/* Client Info */}
          <div className="rounded-lg border border-border p-3 space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("booking.details.client_info")}</h4>
            <InfoRow icon={User} label={t("booking.details.client_name")} value={booking.customer_name} />
            <InfoRow icon={Phone} label={t("booking.details.client_phone")} value={booking.customer_phone} dir="ltr" />
            <InfoRow icon={MapPin} label={t("booking.details.client_city")} value={booking.city} />
            <InfoRow icon={MapPin} label={t("booking.details.client_address")} value={booking.client_address_text} />
            {booking.client_lat && booking.client_lng && (
              <p className="text-xs text-muted-foreground" dir="ltr">
                📍 {booking.client_lat}, {booking.client_lng}
              </p>
            )}
          </div>

          {/* Schedule */}
          <div className="rounded-lg border border-border p-3 space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("booking.details.schedule")}</h4>
            <InfoRow
              icon={CalendarDays}
              label={t("booking.details.service_date")}
              value={formatDateTime(booking.scheduled_at)}
            />
          </div>

          {/* Financials */}
          <div className="rounded-lg border border-border p-3 space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("booking.details.financials")}</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">{t("booking.details.subtotal")}</span>
                <p className="font-bold">{formatCurrency(booking.subtotal)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{t("booking.details.platform_fee")}</span>
                <p className="font-bold">{formatCurrency(booking.platform_fee)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{t("booking.details.provider_payout")}</span>
                <p className="font-bold">{formatCurrency(booking.provider_payout)}</p>
              </div>
              {booking.agreed_price != null && (
                <div>
                  <span className="text-xs text-muted-foreground">{t("booking.details.agreed_price")}</span>
                  <p className="font-bold text-success">{formatCurrency(booking.agreed_price)}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                <CreditCard className="h-3 w-3 ms-1 me-1" />
                {t(`payment.${booking.payment_method}`) || booking.payment_method}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {t(`payment.${booking.payment_status}`) || booking.payment_status}
              </Badge>
            </div>
          </div>

          {/* Assignment Info */}
          {booking.assigned_provider_id && (
            <div className="rounded-lg border border-success/20 bg-success/5 p-3 space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("booking.details.assignment")}</h4>
              <InfoRow icon={UserCheck} label={t("booking.details.provider")} value={providerName || t("booking.details.provider")} />
              {booking.assigned_by && (
                <p className="text-xs text-muted-foreground">{t("booking.details.assigned_by")}: {booking.assigned_by}</p>
              )}
              {booking.assigned_at && (
                <p className="text-xs text-muted-foreground">
                  {t("booking.details.assigned_date")}: {formatDateShort(booking.assigned_at)}
                </p>
              )}
              {booking.accepted_at && (
                <p className="text-xs text-success">
                  ✅ {t("booking.details.accepted_date")}: {formatDateShort(booking.accepted_at)}
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          {booking.notes && (
            <div className="rounded-lg border border-border p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                <FileText className="h-3 w-3" /> {t("booking.details.client_notes")}
              </div>
              <p className="text-sm">{booking.notes}</p>
            </div>
          )}

          {booking.internal_note && (
            <div className="rounded-lg border border-warning/20 bg-warning/5 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-warning">
                <StickyNote className="h-3 w-3" /> {t("booking.details.internal_note")}
              </div>
              <p className="text-sm">{booking.internal_note}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {booking.status === "NEW" && !booking.assigned_provider_id && (
              <Button className="flex-1 gap-1.5" onClick={() => onAssign(booking)}>
                <UserCheck className="h-4 w-4" /> {t("booking.details.assign_provider")}
              </Button>
            )}
            <a
              href={`https://wa.me/${booking.customer_phone.replace(/^0/, "962")}?text=${encodeURIComponent(`مرحباً ${booking.customer_name}، نحن من فريق MFN.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button variant="outline" className="w-full gap-1.5">
                <MessageCircle className="h-4 w-4" /> {t("booking.details.whatsapp")}
              </Button>
            </a>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BookingDetailsDrawer;
