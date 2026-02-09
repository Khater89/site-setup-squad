import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Phone, MapPin, Briefcase, Navigation, Stethoscope,
  CheckCircle, XCircle, Wallet, Clock, Globe,
} from "lucide-react";

export interface ProviderProfile {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  role_type: string | null;
  provider_status: string;
  available_now: boolean;
  profile_completed: boolean;
  experience_years: number | null;
  tools: string[] | null;
  specialties: string[] | null;
  languages: string[] | null;
  radius_km: number | null;
  address_text: string | null;
  lat: number | null;
  lng: number | null;
  last_active_at: string | null;
  date_of_birth: string | null;
  created_at: string;
  hasProviderRole: boolean;
  balance: number;
}

const ROLE_TYPE_LABELS: Record<string, string> = {
  doctor: "طبيب",
  nurse: "ممرض/ة",
  caregiver: "مقدم رعاية",
  physiotherapist: "أخصائي علاج طبيعي",
};

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending: { label: "قيد الانتظار", className: "bg-warning/10 text-warning border-warning/30" },
  approved: { label: "معتمد", className: "bg-success/10 text-success border-success/30" },
  suspended: { label: "موقوف", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

interface Props {
  provider: ProviderProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (userId: string) => void;
  onSuspend: (userId: string) => void;
  onSettlement: (userId: string) => void;
}

const ProviderDetailsDrawer = ({ provider, open, onOpenChange, onApprove, onSuspend, onSettlement }: Props) => {
  if (!provider) return null;

  const status = STATUS_BADGES[provider.provider_status] || STATUS_BADGES.pending;
  const age = provider.date_of_birth
    ? Math.floor((Date.now() - new Date(provider.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-base">{provider.full_name || "بدون اسم"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          {/* Status & Role */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={status.className}>{status.label}</Badge>
              {provider.available_now && (
                <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">متاح</Badge>
              )}
              {!provider.profile_completed && (
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-xs">ملف غير مكتمل</Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {ROLE_TYPE_LABELS[provider.role_type || ""] || provider.role_type || "—"}
            </span>
          </div>

          {/* Basic Info */}
          <div className="rounded-lg border border-border p-3 space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">البيانات الأساسية</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {provider.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span dir="ltr">{provider.phone}</span>
                </div>
              )}
              {provider.city && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {provider.city}
                </div>
              )}
              {age != null && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {age} سنة
                </div>
              )}
              {provider.experience_years != null && (
                <div className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                  {provider.experience_years} سنة خبرة
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="rounded-lg border border-border p-3 space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">الموقع والنطاق</h4>
            {provider.address_text && (
              <div className="flex items-start gap-1.5 text-sm">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                {provider.address_text}
              </div>
            )}
            {provider.radius_km && (
              <div className="flex items-center gap-1.5 text-sm">
                <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
                نطاق التغطية: {provider.radius_km} كم
              </div>
            )}
            {provider.lat && provider.lng && (
              <p className="text-xs text-muted-foreground" dir="ltr">📍 {provider.lat}, {provider.lng}</p>
            )}
          </div>

          {/* Specialties */}
          {provider.specialties && provider.specialties.length > 0 && (
            <div className="rounded-lg border border-border p-3 space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Stethoscope className="h-3 w-3" /> التخصصات
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {provider.specialties.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tools */}
          {provider.tools && provider.tools.length > 0 && (
            <div className="rounded-lg border border-border p-3 space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">الأدوات والأجهزة</h4>
              <div className="flex flex-wrap gap-1.5">
                {provider.tools.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {provider.languages && provider.languages.length > 0 && (
            <div className="rounded-lg border border-border p-3 space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Globe className="h-3 w-3" /> اللغات
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {provider.languages.map((l) => (
                  <Badge key={l} variant="outline" className="text-xs">{l}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Wallet */}
          {provider.hasProviderRole && (
            <div className="rounded-lg border border-border p-3 space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Wallet className="h-3 w-3" /> المحفظة
              </h4>
              <p className={`text-lg font-bold ${provider.balance < 0 ? "text-destructive" : "text-success"}`}>
                {provider.balance} د.أ
              </p>
            </div>
          )}

          {/* Activity */}
          <div className="rounded-lg border border-border p-3 space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">النشاط</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>تاريخ التسجيل: {new Date(provider.created_at).toLocaleDateString("ar-JO", { year: "numeric", month: "short", day: "numeric" })}</p>
              {provider.last_active_at && (
                <p>آخر نشاط: {new Date(provider.last_active_at).toLocaleDateString("ar-JO", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 flex-wrap">
            {provider.provider_status === "pending" && (
              <Button size="sm" className="gap-1.5 flex-1" onClick={() => onApprove(provider.user_id)}>
                <CheckCircle className="h-4 w-4" /> موافقة
              </Button>
            )}
            {provider.provider_status === "approved" && (
              <>
                <Button size="sm" variant="destructive" className="gap-1.5 flex-1" onClick={() => onSuspend(provider.user_id)}>
                  <XCircle className="h-4 w-4" /> إيقاف
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 flex-1" onClick={() => onSettlement(provider.user_id)}>
                  <Wallet className="h-4 w-4" /> تسوية
                </Button>
              </>
            )}
            {provider.provider_status === "suspended" && (
              <Button size="sm" className="gap-1.5 flex-1" onClick={() => onApprove(provider.user_id)}>
                <CheckCircle className="h-4 w-4" /> إعادة تفعيل
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProviderDetailsDrawer;
