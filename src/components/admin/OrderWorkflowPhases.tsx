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
  Briefcase, Edit2,
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
  onWorkflowChange: () => void;   // close drawer + refetch
  onDataRefresh?: () => void;      // refetch only, keep drawer open
}

const OrderWorkflowPhases = ({ booking, serviceName, servicePrice, onWorkflowChange, onDataRefresh }: Props) => {
  const { t, formatCurrency } = useLanguage();
  const { isAdmin } = useAuth();

  // Phase 1 state
  const [clientAgreed, setClientAgreed] = useState(!!booking.deal_confirmed_at);
  const [clientPrice, setClientPrice] = useState(booking.agreed_price ?? servicePrice ?? 0);
  const [editingClientPrice, setEditingClientPrice] = useState(false);
  const [savingClientPrice, setSavingClientPrice] = useState(false);
  const [internalNote, setInternalNote] = useState(booking.internal_note || "");

  // Phase 2/3 state
  const [showProviders, setShowProviders] = useState(false);
  const [nearestProviders, setNearestProviders] = useState<NearestProvider[]>([]);
  const [fallbackProviders, setFallbackProviders] = useState<ProviderRow[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(booking.assigned_provider_id);
  const [providerAgreed, setProviderAgreed] = useState(false);
  const [providerShare, setProviderShare] = useState(booking.provider_share ?? 0);
  const [editingProviderShare, setEditingProviderShare] = useState(false);
  const [savingProviderShare, setSavingProviderShare] = useState(false);

  // Phase 4 state
  const [assigning, setAssigning] = useState(false);

  // Coordinator phones
  const [coordinatorPhones, setCoordinatorPhones] = useState<{ phone1: string; phone2: string }>({ phone1: "", phone2: "" });
  const [selectedCoordinator, setSelectedCoordinator] = useState<"1" | "2">("1");

  useEffect(() => {
    supabase.from("platform_settings").select("coordinator_phone, coordinator_phone_2").eq("id", 1).single()
      .then(({ data }) => {
        if (data) setCoordinatorPhones({ phone1: data.coordinator_phone || "", phone2: data.coordinator_phone_2 || "" });
      });
  }, []);

  // Phase completion checks
  const isClientPriceSaved = booking.agreed_price != null;
  const isClientDealDone = !!booking.deal_confirmed_at;
  const isProviderShareSaved = booking.provider_share != null;
  const isAssigned = !!booking.assigned_provider_id && booking.status === "ASSIGNED";

  // Refresh helper (keeps drawer open)
  const refresh = () => onDataRefresh ? onDataRefresh() : onWorkflowChange();

  // Fetch providers
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

  /* ── Phase 1: Mark client agreed ── */
  const markClientAgreed = async () => {
    setClientAgreed(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("bookings")
        .update({ deal_confirmed_at: now, deal_confirmed_by: isAdmin ? "admin" : "cs" } as any)
        .eq("id", booking.id);
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("booking_history").insert({
          booking_id: booking.id,
          action: "DEAL_CONFIRMED",
          performed_by: user.id,
          performer_role: isAdmin ? "admin" : "cs",
          note: "تم الاتفاق مع العميل هاتفياً",
        });
      }
      toast.success("تم تأكيد الاتفاق مع العميل ✅");
    } catch (err: any) {
      toast.error(err.message);
      setClientAgreed(false);
    }
  };

  /* ── Phase 1: Save client price ── */
  const saveClientPrice = async () => {
    if (clientPrice <= 0) { toast.error("السعر يجب أن يكون أكبر من صفر"); return; }
    setSavingClientPrice(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          agreed_price: clientPrice,
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
          note: `سعر العميل: ${clientPrice} د.أ`,
        });
      }
      toast.success("تم حفظ سعر العميل ✅");
      setEditingClientPrice(false);
      refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingClientPrice(false);
    }
  };

  /* ── Phase 2: Open provider list ── */
  const openProviderList = () => {
    setShowProviders(true);
    fetchProviders();
  };

  /* ── Phase 3: Save provider share ── */
  const saveProviderShare = async () => {
    if (providerShare < 0) { toast.error("حصة المزود يجب أن تكون صفر أو أكثر"); return; }
    if (providerShare > clientPrice) { toast.error("حصة المزود لا يمكن أن تتجاوز السعر للعميل"); return; }
    setSavingProviderShare(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ provider_share: providerShare } as any)
        .eq("id", booking.id);
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("booking_history").insert({
          booking_id: booking.id,
          action: "PROVIDER_SHARE_SET",
          performed_by: user.id,
          performer_role: isAdmin ? "admin" : "cs",
          note: `حصة المزود: ${providerShare} د.أ`,
        });
      }
      toast.success("تم حفظ حصة المزود ✅");
      setEditingProviderShare(false);
      refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingProviderShare(false);
    }
  };

  /* ── Phase 4: Final assignment ── */
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

      toast.success("تم الإسناد بنجاح ✅", {
        description: "يرجى متابعة قبول المزود للطلب",
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

  const coordinatorPhone = selectedCoordinator === "2" && coordinatorPhones.phone2
    ? coordinatorPhones.phone2 : coordinatorPhones.phone1;

  const getProviderWhatsAppMsg = (providerName: string) =>
    `مرحباً ${providerName}، معك فريق Site Setup Squad.\nلدينا طلب خدمة *${serviceName}* في منطقة *${booking.city}*.\nحصتك المتفق عليها للساعة الأولى: *${formatCurrency(providerShare)}*.\nهل أنت متاح؟`;

  const profit = (isClientPriceSaved ? booking.agreed_price! : clientPrice) - providerShare;

  // Coordinator selector
  const CoordinatorSelector = () => {
    if (!coordinatorPhones.phone2) return null;
    return (
      <div className="flex items-center gap-2 text-xs mb-1">
        <span className="text-muted-foreground">إرسال عبر:</span>
        <button
          className={`px-2 py-0.5 rounded ${selectedCoordinator === "1" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          onClick={() => setSelectedCoordinator("1")}
        >منسق 1</button>
        <button
          className={`px-2 py-0.5 rounded ${selectedCoordinator === "2" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          onClick={() => setSelectedCoordinator("2")}
        >منسق 2</button>
      </div>
    );
  };

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
            {phone && <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">📞 {phone}</p>}
          </div>
          {distanceKm != null && (
            <span className="text-sm font-bold text-primary">{distanceKm} كم</span>
          )}
        </div>
        {/* Contact buttons */}
        <div className="flex gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
          {phone && (
            <a href={`tel:${phone}`}>
              <Button size="sm" variant="outline" className="gap-1 h-6 text-[10px]">
                <Phone className="h-3 w-3" /> اتصال
              </Button>
            </a>
          )}
          {phone && (
            <>
              <CoordinatorSelector />
              <a
                href={`https://wa.me/${(coordinatorPhone || phone).replace(/^0/, "962")}?text=${encodeURIComponent(getProviderWhatsAppMsg(name))}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="outline" className="gap-1 h-6 text-[10px]">
                  <MessageCircle className="h-3 w-3" /> واتساب
                </Button>
              </a>
            </>
          )}
          {/* Select this provider */}
          {selectedProvider !== id && (
            <Button size="sm" variant="ghost" className="gap-1 h-6 text-[10px]" onClick={() => setSelectedProvider(id)}>
              اختيار
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* ═══ Phase 1: Client Negotiation ═══ */}
      <div className={`rounded-lg border p-3 space-y-3 ${(isClientDealDone || clientAgreed) && isClientPriceSaved ? "border-success/30 bg-success/5" : "border-primary/30 bg-primary/5"}`}>
        <div className="flex items-center gap-2">
          {(isClientDealDone || clientAgreed) && isClientPriceSaved
            ? <CheckCircle className="h-4 w-4 text-success" />
            : <Handshake className="h-4 w-4 text-primary" />}
          <h4 className="text-sm font-bold">المرحلة 1: الاتفاق مع العميل</h4>
          {(isClientDealDone || clientAgreed) && isClientPriceSaved && <Badge variant="outline" className="text-[10px] bg-success/10 text-success">✓</Badge>}
        </div>

        {/* Client contact info */}
        <div className="rounded-lg border border-border p-2 space-y-1">
          <p className="text-sm font-medium">{booking.customer_name || booking.customer_display_name || "—"}</p>
          <p className="text-sm" dir="ltr">{booking.customer_phone || "—"}</p>
          <div className="flex gap-1.5 mt-1">
            {booking.customer_phone && (
              <a href={`tel:${booking.customer_phone}`}>
                <Button size="sm" variant="outline" className="gap-1 h-6 text-[10px]">
                  <Phone className="h-3 w-3" /> اتصال
                </Button>
              </a>
            )}
            {booking.customer_phone && (
              <a
                href={`https://wa.me/${booking.customer_phone.replace(/^0/, "962")}?text=${encodeURIComponent(`مرحباً ${booking.customer_name || ""}، نحن من فريق MFN.`)}`}
                target="_blank" rel="noopener noreferrer"
              >
                <Button size="sm" variant="outline" className="gap-1 h-6 text-[10px]">
                  <MessageCircle className="h-3 w-3" /> واتساب
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* Client agreement button */}
        {!isClientDealDone && !clientAgreed && (
          <Button size="sm" className="w-full gap-1.5" onClick={markClientAgreed}>
            <Handshake className="h-3 w-3" /> تم الاتفاق مع العميل
          </Button>
        )}

        {/* Client price input (shown after agreement) */}
        {(isClientDealDone || clientAgreed) && (
          <>
            {!isClientPriceSaved || editingClientPrice ? (
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-medium">سعر العميل (د.أ) *</label>
                  <Input
                    type="number" min={0} step="0.5" value={clientPrice}
                    onChange={(e) => setClientPrice(Number(e.target.value))}
                    dir="ltr" className="h-8 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">ملاحظة داخلية</label>
                  <Textarea
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    placeholder="ملاحظة لا تظهر للمزوّد أو العميل..."
                    rows={2} className="mt-1"
                  />
                </div>
                <Button size="sm" className="w-full gap-1.5" onClick={saveClientPrice} disabled={savingClientPrice}>
                  {savingClientPrice ? <Loader2 className="h-3 w-3 animate-spin" /> : <DollarSign className="h-3 w-3" />}
                  حفظ سعر العميل
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">سعر العميل</span>
                  <p className="font-bold">{formatCurrency(booking.agreed_price!)}</p>
                </div>
                <Button size="sm" variant="ghost" className="gap-1 h-7 text-xs" onClick={() => setEditingClientPrice(true)}>
                  <Edit2 className="h-3 w-3" /> تعديل
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══ Phase 2: Assign Trigger ═══ */}
      <div className={`rounded-lg border p-3 space-y-3 ${!isClientPriceSaved ? "opacity-50 pointer-events-none border-muted" : showProviders || isAssigned ? "border-success/30 bg-success/5" : "border-primary/30 bg-primary/5"}`}>
        <div className="flex items-center gap-2">
          {showProviders || isAssigned
            ? <CheckCircle className="h-4 w-4 text-success" />
            : !isClientPriceSaved ? <Lock className="h-4 w-4 text-muted-foreground" /> : <Users className="h-4 w-4 text-primary" />}
          <h4 className="text-sm font-bold">المرحلة 2: إسناد الطلب</h4>
          {isAssigned && <Badge variant="outline" className="text-[10px] bg-success/10 text-success">✓</Badge>}
        </div>

        {isClientPriceSaved && !showProviders && !isAssigned && (
          <Button size="sm" className="w-full gap-1.5" onClick={openProviderList}>
            <Users className="h-3 w-3" /> عرض المزودين المتاحين
          </Button>
        )}

        {isAssigned && (
          <p className="text-xs text-success">✅ تم إسناد الطلب</p>
        )}
      </div>

      {/* ═══ Phase 3: Provider Negotiation ═══ */}
      {(showProviders && !isAssigned) && (
        <div className="rounded-lg border p-3 space-y-3 border-primary/30 bg-primary/5">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-bold">المرحلة 3: الاتفاق مع المزود</h4>
          </div>

          {/* Provider list */}
          {loadingProviders ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {nearestProviders.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium">🎯 الأقرب (حسب المسافة):</p>
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
                  <p className="text-xs text-muted-foreground font-medium">📍 في نفس المدينة:</p>
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
                  <p className="text-xs text-muted-foreground font-medium">🌍 مزوّدون في مدن أخرى:</p>
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
                <p className="text-sm text-muted-foreground text-center py-4">لا يوجد مزوّدون معتمدون</p>
              )}
            </div>
          )}

          {/* Provider agreed button */}
          {selectedProvider && !providerAgreed && !isProviderShareSaved && (
            <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={() => setProviderAgreed(true)}>
              <Handshake className="h-3 w-3" /> تم الاتفاق مع المزود
            </Button>
          )}

          {/* Provider share input (shown after provider agreement) */}
          {selectedProvider && (providerAgreed || isProviderShareSaved) && (
            <>
              {!isProviderShareSaved || editingProviderShare ? (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium">حصة المزود (د.أ) *</label>
                    <Input
                      type="number" min={0} step="0.5" value={providerShare}
                      onChange={(e) => setProviderShare(Number(e.target.value))}
                      dir="ltr" className="h-8 mt-1"
                    />
                  </div>
                  {clientPrice > 0 && providerShare >= 0 && (
                    <p className="text-xs text-muted-foreground">
                      ربح المنصة: <strong className={profit >= 0 ? "text-success" : "text-destructive"}>{formatCurrency(profit)}</strong>
                    </p>
                  )}
                  <Button size="sm" className="w-full gap-1.5" onClick={saveProviderShare} disabled={savingProviderShare}>
                    {savingProviderShare ? <Loader2 className="h-3 w-3 animate-spin" /> : <DollarSign className="h-3 w-3" />}
                    حفظ حصة المزود
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="grid grid-cols-3 gap-2 flex-1">
                    <div>
                      <span className="text-xs text-muted-foreground">سعر العميل</span>
                      <p className="font-bold text-sm">{formatCurrency(booking.agreed_price!)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">حصة المزود</span>
                      <p className="font-bold text-sm">{formatCurrency(booking.provider_share!)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">ربح المنصة</span>
                      <p className={`font-bold text-sm ${(booking.agreed_price! - booking.provider_share!) >= 0 ? "text-success" : "text-destructive"}`}>
                        {formatCurrency(booking.agreed_price! - booking.provider_share!)}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="gap-1 h-7 text-xs" onClick={() => setEditingProviderShare(true)}>
                    <Edit2 className="h-3 w-3" /> تعديل
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══ Phase 4: Final Assignment ═══ */}
      {showProviders && !isAssigned && selectedProvider && isProviderShareSaved && (
        <div className="rounded-lg border p-3 space-y-3 border-warning/30 bg-warning/5">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-warning" />
            <h4 className="text-sm font-bold">المرحلة 4: تأكيد الإسناد</h4>
          </div>
          <Button
            className="w-full gap-1.5"
            onClick={handleAssign}
            disabled={assigning}
          >
            {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
            تأكيد الإسناد — {formatCurrency(clientPrice)} للعميل / {formatCurrency(providerShare)} للمزود
          </Button>
        </div>
      )}
    </div>
  );
};

export default OrderWorkflowPhases;
