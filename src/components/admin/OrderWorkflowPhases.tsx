import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Phone, MessageCircle, UserCheck, Loader2, MapPin,
  DollarSign, Handshake, Users, CheckCircle, Lock, AlertTriangle,
  Briefcase,
} from "lucide-react";
import type { BookingRow } from "./BookingDetailsDrawer";

/* ── Types ── */

interface NearestProvider {
  provider_id: string;
  full_name: string;
  city: string;
  distance_km: number;
  available_now: boolean;
  phone: string;
  role_type: string;
  experience_years: number;
}

interface ProviderRow {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  role_type: string | null;
  provider_status: string;
  available_now: boolean;
  profile_completed: boolean;
  experience_years: number | null;
  specialties: string[] | null;
  radius_km: number | null;
  lat: number | null;
  lng: number | null;
}

const ROLE_TYPE_LABELS: Record<string, string> = {
  doctor: "طبيب",
  nurse: "ممرض/ة",
  caregiver: "مقدم رعاية",
  physiotherapist: "أخصائي علاج طبيعي",
};

const CITY_ALIASES: Record<string, string[]> = {
  amman: ["عمان", "amman", "عمّان"],
  irbid: ["اربد", "إربد", "irbid"],
  zarqa: ["الزرقاء", "zarqa", "الزرقا"],
  aqaba: ["العقبة", "aqaba"],
  salt: ["السلط", "salt"],
  madaba: ["مادبا", "madaba"],
  jerash: ["جرش", "jerash"],
  ajloun: ["عجلون", "ajloun"],
  karak: ["الكرك", "karak"],
  tafilah: ["الطفيلة", "tafilah"],
  maan: ["معان", "maan"],
  mafraq: ["المفرق", "mafraq"],
};

const normalizeCity = (city: string) =>
  city?.toLowerCase().trim().replace(/[\u0650\u064E\u064F\u0651\u0652\u064B\u064C\u064D]/g, "");

const citiesMatch = (city1: string | null, city2: string) => {
  if (!city1) return false;
  const n1 = normalizeCity(city1);
  const n2 = normalizeCity(city2);
  if (n1.includes(n2) || n2.includes(n1)) return true;
  for (const aliases of Object.values(CITY_ALIASES)) {
    const na = aliases.map(normalizeCity);
    if (na.some((a) => n1.includes(a) || a.includes(n1)) && na.some((a) => n2.includes(a) || a.includes(n2)))
      return true;
  }
  return false;
};

interface Props {
  booking: BookingRow;
  serviceName: string;
  servicePrice: number | null;
  onWorkflowChange: () => void;
}

const OrderWorkflowPhases = ({ booking, serviceName, servicePrice, onWorkflowChange }: Props) => {
  const { t, formatCurrency } = useLanguage();
  const { isAdmin } = useAuth();

  // Phase 1 state
  const [clientPrice, setClientPrice] = useState(booking.agreed_price ?? servicePrice ?? 0);
  const [providerShare, setProviderShare] = useState(booking.provider_share ?? 0);
  const [internalNote, setInternalNote] = useState(booking.internal_note || "");
  const [savingPrice, setSavingPrice] = useState(false);

  // Phase 2 state
  const [contactRevealed, setContactRevealed] = useState(false);
  const [confirmingDeal, setConfirmingDeal] = useState(false);

  // Phase 3/4 state
  const [nearestProviders, setNearestProviders] = useState<NearestProvider[]>([]);
  const [fallbackProviders, setFallbackProviders] = useState<ProviderRow[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(booking.assigned_provider_id);
  const [assigning, setAssigning] = useState(false);

  // Phase completion checks
  const isPricingDone = booking.agreed_price != null && booking.provider_share != null;
  const isDealDone = !!booking.deal_confirmed_at;
  const isAssigned = !!booking.assigned_provider_id && booking.status === "ASSIGNED";

  // Fetch providers when phase 3 becomes available
  useEffect(() => {
    if (isDealDone && !isAssigned) fetchProviders();
  }, [isDealDone]);

  const fetchProviders = async () => {
    setLoadingProviders(true);
    if (booking.client_lat && booking.client_lng) {
      const { data } = await supabase.rpc("find_nearest_providers" as any, {
        _lat: booking.client_lat,
        _lng: booking.client_lng,
        _limit: 10,
      });
      setNearestProviders((data as NearestProvider[]) || []);
    }
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .eq("provider_status", "approved")
      .eq("profile_completed", true);
    setFallbackProviders((profiles as unknown as ProviderRow[]) || []);
    setLoadingProviders(false);
  };

  /* ── Phase 1: Save pricing ── */
  const savePricing = async () => {
    if (clientPrice <= 0) {
      toast.error("السعر للعميل يجب أن يكون أكبر من صفر");
      return;
    }
    if (providerShare < 0) {
      toast.error("حصة المزود يجب أن تكون صفر أو أكثر");
      return;
    }
    if (providerShare > clientPrice) {
      toast.error("حصة المزود لا يمكن أن تتجاوز السعر للعميل");
      return;
    }
    setSavingPrice(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          agreed_price: clientPrice,
          provider_share: providerShare,
          internal_note: internalNote.trim() || null,
        } as any)
        .eq("id", booking.id);
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("booking_history").insert({
          booking_id: booking.id,
          action: "PRICED",
          performed_by: user.id,
          performer_role: isAdmin ? "admin" : "cs",
          note: `تسعير: ${clientPrice} د.أ للعميل — ${providerShare} د.أ للمزود`,
        });
      }
      toast.success(t("workflow.pricing_saved"));
      onWorkflowChange();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingPrice(false);
    }
  };

  /* ── Phase 2: Confirm deal ── */
  const confirmDeal = async () => {
    setConfirmingDeal(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("bookings")
        .update({
          deal_confirmed_at: now,
          deal_confirmed_by: isAdmin ? "admin" : "cs",
        } as any)
        .eq("id", booking.id);
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("booking_history").insert({
          booking_id: booking.id,
          action: "DEAL_CONFIRMED",
          performed_by: user.id,
          performer_role: isAdmin ? "admin" : "cs",
          note: "تمت الموافقة من العميل على السعر",
        });
      }
      toast.success(t("workflow.deal_confirmed"));
      onWorkflowChange();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setConfirmingDeal(false);
    }
  };

  /* ── Phase 4: Assign provider ── */
  const handleAssign = async () => {
    if (!selectedProvider) return;
    setAssigning(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("bookings")
        .update({
          assigned_provider_id: selectedProvider,
          status: "ASSIGNED",
          assigned_at: now,
          assigned_by: isAdmin ? "admin" : "cs",
        } as any)
        .eq("id", booking.id);
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("booking_history").insert({
          booking_id: booking.id,
          action: "ASSIGNED",
          performed_by: user.id,
          performer_role: isAdmin ? "admin" : "cs",
          note: `تم الإسناد — ${clientPrice} د.أ للعميل — ${providerShare} د.أ للمزود`,
        });
      }

      toast.success(t("workflow.assigned_success"), {
        description: t("workflow.phase4.reminder"),
        duration: 8000,
      });
      onWorkflowChange();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAssigning(false);
    }
  };

  // Provider lists
  const nearestIds = new Set(nearestProviders.map((p) => p.provider_id));
  const sameCityProviders = fallbackProviders.filter(
    (p) => !nearestIds.has(p.user_id) && citiesMatch(p.city, booking.city)
  );
  const otherCityProviders = fallbackProviders.filter(
    (p) => !nearestIds.has(p.user_id) && !citiesMatch(p.city, booking.city)
  );

  const getProviderWhatsAppMsg = (providerName: string) =>
    `مرحباً ${providerName}، لدينا طلب خدمة ${serviceName} في منطقة ${booking.city}. هل أنت متاح لقبولها؟`;

  const profit = clientPrice - providerShare;

  const ProviderCard = ({ id, name, phone, city, roleType, experienceYears, distanceKm, availableNow }: {
    id: string; name: string; phone: string | null; city: string | null;
    roleType: string | null; experienceYears: number | null; distanceKm?: number; availableNow: boolean;
  }) => (
    <Card
      className={`transition-colors ${selectedProvider === id ? "ring-2 ring-primary bg-primary/5" : "hover:bg-accent/50"}`}
    >
      <CardContent className="py-2.5 px-3 space-y-1.5">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setSelectedProvider(id)}
        >
          <div>
            <p className="text-sm font-medium">{name || "—"}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{ROLE_TYPE_LABELS[roleType || ""] || ""}</span>
              {city && <><span>·</span><span>{city}</span></>}
              <span>·</span><span>{experienceYears || 0} سنة</span>
              {availableNow && (
                <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-[10px] py-0">
                  متاح
                </Badge>
              )}
            </div>
          </div>
          {distanceKm != null && (
            <span className="text-sm font-bold text-primary">{distanceKm} كم</span>
          )}
        </div>
        {/* Contact buttons */}
        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
          {phone && (
            <a href={`tel:${phone}`}>
              <Button size="sm" variant="outline" className="gap-1 h-6 text-[10px]">
                <Phone className="h-3 w-3" /> اتصال
              </Button>
            </a>
          )}
          {phone && (
            <a
              href={`https://wa.me/${phone.replace(/^0/, "962")}?text=${encodeURIComponent(getProviderWhatsAppMsg(name))}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="outline" className="gap-1 h-6 text-[10px]">
                <MessageCircle className="h-3 w-3" /> واتساب
              </Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* ═══ Phase 1: Pricing ═══ */}
      <div className={`rounded-lg border p-3 space-y-3 ${isPricingDone ? "border-success/30 bg-success/5" : "border-primary/30 bg-primary/5"}`}>
        <div className="flex items-center gap-2">
          {isPricingDone ? <CheckCircle className="h-4 w-4 text-success" /> : <DollarSign className="h-4 w-4 text-primary" />}
          <h4 className="text-sm font-bold">{t("workflow.phase1.title")}</h4>
          {isPricingDone && <Badge variant="outline" className="text-[10px] bg-success/10 text-success">✓</Badge>}
        </div>

        {!isPricingDone ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">{t("workflow.phase1.client_price")} *</label>
                <Input
                  type="number" min={0} step="0.5" value={clientPrice}
                  onChange={(e) => setClientPrice(Number(e.target.value))}
                  dir="ltr" className="h-8 mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium">{t("workflow.phase1.provider_share")} *</label>
                <Input
                  type="number" min={0} step="0.5" value={providerShare}
                  onChange={(e) => setProviderShare(Number(e.target.value))}
                  dir="ltr" className="h-8 mt-1"
                />
              </div>
            </div>
            {clientPrice > 0 && providerShare >= 0 && (
              <p className="text-xs text-muted-foreground">
                {t("workflow.phase1.platform_profit")}: <strong className={profit >= 0 ? "text-success" : "text-destructive"}>{formatCurrency(profit)}</strong>
              </p>
            )}
            <div>
              <label className="text-xs font-medium">ملاحظة داخلية</label>
              <Textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="ملاحظة لا تظهر للمزوّد أو العميل..."
                rows={2} className="mt-1"
              />
            </div>
            <Button size="sm" className="w-full gap-1.5" onClick={savePricing} disabled={savingPrice}>
              {savingPrice ? <Loader2 className="h-3 w-3 animate-spin" /> : <DollarSign className="h-3 w-3" />}
              {t("workflow.phase1.save")}
            </Button>
          </>
        ) : (
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">{t("workflow.phase1.client_price")}</span>
              <p className="font-bold">{formatCurrency(booking.agreed_price!)}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">{t("workflow.phase1.provider_share")}</span>
              <p className="font-bold">{formatCurrency(booking.provider_share!)}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">{t("workflow.phase1.platform_profit")}</span>
              <p className={`font-bold ${(booking.agreed_price! - booking.provider_share!) >= 0 ? "text-success" : "text-destructive"}`}>
                {formatCurrency(booking.agreed_price! - booking.provider_share!)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Phase 2: Client Agreement ═══ */}
      <div className={`rounded-lg border p-3 space-y-3 ${!isPricingDone ? "opacity-50 pointer-events-none border-muted" : isDealDone ? "border-success/30 bg-success/5" : "border-primary/30 bg-primary/5"}`}>
        <div className="flex items-center gap-2">
          {isDealDone ? <CheckCircle className="h-4 w-4 text-success" /> : !isPricingDone ? <Lock className="h-4 w-4 text-muted-foreground" /> : <Handshake className="h-4 w-4 text-primary" />}
          <h4 className="text-sm font-bold">{t("workflow.phase2.title")}</h4>
          {isDealDone && <Badge variant="outline" className="text-[10px] bg-success/10 text-success">✓</Badge>}
        </div>

        {isPricingDone && !isDealDone && (
          <>
            {!contactRevealed ? (
              <Button
                size="sm" variant="outline" className="w-full gap-1.5"
                onClick={() => setContactRevealed(true)}
              >
                <Phone className="h-3 w-3" /> {t("workflow.phase2.call_client")}
              </Button>
            ) : (
              <div className="rounded-lg border border-border p-2 space-y-1">
                <p className="text-sm font-medium">{booking.customer_name || booking.customer_display_name || "—"}</p>
                <p className="text-sm" dir="ltr">{booking.customer_phone || "—"}</p>
                <div className="flex gap-1.5 mt-1">
                  <a href={`tel:${booking.customer_phone || ""}`}>
                    <Button size="sm" variant="outline" className="gap-1 h-6 text-[10px]">
                      <Phone className="h-3 w-3" /> اتصال
                    </Button>
                  </a>
                  <a
                    href={`https://wa.me/${(booking.customer_phone || "").replace(/^0/, "962")}?text=${encodeURIComponent(`مرحباً ${booking.customer_name || ""}، نحن من فريق MFN. السعر المقترح للخدمة: ${clientPrice} د.أ`)}`}
                    target="_blank" rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline" className="gap-1 h-6 text-[10px]">
                      <MessageCircle className="h-3 w-3" /> واتساب
                    </Button>
                  </a>
                </div>
              </div>
            )}

            <Button
              size="sm" className="w-full gap-1.5"
              onClick={confirmDeal}
              disabled={!contactRevealed || confirmingDeal}
            >
              {confirmingDeal ? <Loader2 className="h-3 w-3 animate-spin" /> : <Handshake className="h-3 w-3" />}
              {t("workflow.phase2.deal_done")}
            </Button>
          </>
        )}

        {isDealDone && (
          <p className="text-xs text-success">✅ {t("workflow.deal_confirmed")}</p>
        )}
      </div>

      {/* ═══ Phase 3: Provider Matching ═══ */}
      <div className={`rounded-lg border p-3 space-y-3 ${!isDealDone ? "opacity-50 pointer-events-none border-muted" : isAssigned ? "border-success/30 bg-success/5" : "border-primary/30 bg-primary/5"}`}>
        <div className="flex items-center gap-2">
          {isAssigned ? <CheckCircle className="h-4 w-4 text-success" /> : !isDealDone ? <Lock className="h-4 w-4 text-muted-foreground" /> : <Users className="h-4 w-4 text-primary" />}
          <h4 className="text-sm font-bold">{t("workflow.phase3.title")}</h4>
          {isAssigned && <Badge variant="outline" className="text-[10px] bg-success/10 text-success">✓</Badge>}
        </div>

        {isDealDone && !isAssigned && (
          <>
            {loadingProviders ? (
              <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {nearestProviders.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground font-medium">🎯 {t("workflow.phase3.nearest")}:</p>
                    {nearestProviders.map((p) => (
                      <ProviderCard
                        key={p.provider_id} id={p.provider_id} name={p.full_name}
                        phone={p.phone} city={p.city} roleType={p.role_type}
                        experienceYears={p.experience_years} distanceKm={p.distance_km}
                        availableNow={p.available_now}
                      />
                    ))}
                  </div>
                )}
                {sameCityProviders.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground font-medium">📍 {t("workflow.phase3.same_city")}:</p>
                    {sameCityProviders.map((p) => (
                      <ProviderCard
                        key={p.user_id} id={p.user_id} name={p.full_name || "—"}
                        phone={p.phone} city={p.city} roleType={p.role_type}
                        experienceYears={p.experience_years} availableNow={p.available_now || false}
                      />
                    ))}
                  </div>
                )}
                {otherCityProviders.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground font-medium">🌍 {t("workflow.phase3.other_cities")}:</p>
                    {otherCityProviders.map((p) => (
                      <ProviderCard
                        key={p.user_id} id={p.user_id} name={p.full_name || "—"}
                        phone={p.phone} city={p.city} roleType={p.role_type}
                        experienceYears={p.experience_years} availableNow={p.available_now || false}
                      />
                    ))}
                  </div>
                )}
                {nearestProviders.length === 0 && sameCityProviders.length === 0 && otherCityProviders.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">{t("workflow.phase3.no_providers")}</p>
                )}
              </div>
            )}

            {/* Phase 4: Assign button */}
            <Button
              className="w-full gap-1.5"
              onClick={handleAssign}
              disabled={!selectedProvider || assigning}
            >
              {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
              {t("workflow.phase4.assign")} — {formatCurrency(clientPrice)}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderWorkflowPhases;
