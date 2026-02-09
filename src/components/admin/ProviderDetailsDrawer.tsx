import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Phone, MapPin, Briefcase, Navigation, Stethoscope,
  CheckCircle, XCircle, Wallet, Clock, Globe,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

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

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/30",
  approved: "bg-success/10 text-success border-success/30",
  suspended: "bg-destructive/10 text-destructive border-destructive/30",
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
  const { t, formatCurrency, formatDate, formatDateShort } = useLanguage();

  if (!provider) return null;

  const age = provider.date_of_birth
    ? Math.floor((Date.now() - new Date(provider.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const roleTypeLabel = provider.role_type
    ? (t(`role_type.${provider.role_type}`) !== `role_type.${provider.role_type}` ? t(`role_type.${provider.role_type}`) : provider.role_type)
    : "—";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-base">{provider.full_name || t("admin.providers.no_name")}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          {/* Status & Role */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={STATUS_COLORS[provider.provider_status] || ""}>
                {t(`provider_status.${provider.provider_status}`)}
              </Badge>
              {provider.available_now && (
                <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">
                  {t("admin.providers.available")}
                </Badge>
              )}
              {!provider.profile_completed && (
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-xs">
                  {t("provider.details.profile_incomplete")}
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{roleTypeLabel}</span>
          </div>

          {/* Basic Info */}
          <div className="rounded-lg border border-border p-3 space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("provider.details.basic_info")}</h4>
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
                  {age} {t("admin.providers.years")}
                </div>
              )}
              {provider.experience_years != null && (
                <div className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                  {provider.experience_years} {t("admin.providers.years")}
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="rounded-lg border border-border p-3 space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("provider.details.location")}</h4>
            {provider.address_text && (
              <div className="flex items-start gap-1.5 text-sm">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                {provider.address_text}
              </div>
            )}
            {provider.radius_km && (
              <div className="flex items-center gap-1.5 text-sm">
                <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
                {t("provider.details.coverage_radius")}: {provider.radius_km} {t("provider.details.km")}
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
                <Stethoscope className="h-3 w-3" /> {t("provider.details.specialties")}
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
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("provider.details.tools")}</h4>
              <div className="flex flex-wrap gap-1.5">
                {provider.tools.map((tool) => (
                  <Badge key={tool} variant="outline" className="text-xs">{tool}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {provider.languages && provider.languages.length > 0 && (
            <div className="rounded-lg border border-border p-3 space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Globe className="h-3 w-3" /> {t("provider.details.languages")}
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
                <Wallet className="h-3 w-3" /> {t("provider.details.wallet")}
              </h4>
              <p className={`text-lg font-bold ${provider.balance < 0 ? "text-destructive" : "text-success"}`}>
                {formatCurrency(provider.balance)}
              </p>
            </div>
          )}

          {/* Activity */}
          <div className="rounded-lg border border-border p-3 space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("provider.details.activity")}</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>{t("provider.details.registered")}: {formatDate(provider.created_at)}</p>
              {provider.last_active_at && (
                <p>{t("provider.details.last_active")}: {formatDateShort(provider.last_active_at)}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 flex-wrap">
            {provider.provider_status === "pending" && (
              <Button size="sm" className="gap-1.5 flex-1" onClick={() => onApprove(provider.user_id)}>
                <CheckCircle className="h-4 w-4" /> {t("provider.details.approve")}
              </Button>
            )}
            {provider.provider_status === "approved" && (
              <>
                <Button size="sm" variant="destructive" className="gap-1.5 flex-1" onClick={() => onSuspend(provider.user_id)}>
                  <XCircle className="h-4 w-4" /> {t("provider.details.suspend")}
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 flex-1" onClick={() => onSettlement(provider.user_id)}>
                  <Wallet className="h-4 w-4" /> {t("provider.details.settlement")}
                </Button>
              </>
            )}
            {provider.provider_status === "suspended" && (
              <Button size="sm" className="gap-1.5 flex-1" onClick={() => onApprove(provider.user_id)}>
                <CheckCircle className="h-4 w-4" /> {t("provider.details.reactivate")}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProviderDetailsDrawer;
