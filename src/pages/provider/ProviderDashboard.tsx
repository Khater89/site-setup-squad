import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Wallet, LogOut, Loader2, CheckCircle, XCircle,
  CalendarDays, MapPin, ClipboardList, Phone,
  MessageCircle, ShieldCheck, Eye, Lock, User, X,
  History, Ban,
} from "lucide-react";
import mfnLogo from "@/assets/mfn-logo.png";

/* ── Types ── */

interface ProviderOrder {
  id: string;
  booking_number: string | null;
  service_id: string;
  city: string;
  scheduled_at: string;
  status: string;
  provider_payout: number;
  subtotal: number;
  agreed_price: number | null;
  assigned_provider_id: string | null;
  assigned_at: string | null;
  accepted_at: string | null;
  created_at: string;
  customer_display_name: string | null;
  customer_phone: string | null;
  client_address_text: string | null;
  client_lat: number | null;
  client_lng: number | null;
  notes: string | null;
}

interface LedgerEntry {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
  booking_id: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: "bg-warning/10 text-warning border-warning/30",
  ACCEPTED: "bg-info/10 text-info border-info/30",
  COMPLETED: "bg-success/10 text-success border-success/30",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/30",
};

const SPECIALTY_OPTIONS = [
  "باطني", "أطفال", "جروح", "قسطرة", "حقن وريدي",
  "علاج طبيعي", "رعاية مسنين", "تمريض منزلي",
  "قياس ضغط وسكر", "تحاليل منزلية",
];

const TOOL_SUGGESTIONS = ["جهاز ضغط", "سماعة طبية", "جهاز سكر", "أدوات تضميد", "جهاز أكسجين", "حقن وريدي"];

/* ── Component ── */

const ProviderDashboard = () => {
  const { user, profile, signOut, refreshUserData } = useAuth();
  const { t, formatCurrency, formatDateShort, formatDate } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<ProviderOrder[]>([]);
  const [serviceNames, setServiceNames] = useState<Record<string, string>>({});
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [coordinatorPhone, setCoordinatorPhone] = useState<string | null>(null);
  const [cancelDialogOrder, setCancelDialogOrder] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [completeDialogOrder, setCompleteDialogOrder] = useState<string | null>(null);

  // Profile editing state
  const [availableNow, setAvailableNow] = useState(false);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [tools, setTools] = useState<string[]>([]);
  const [toolInput, setToolInput] = useState("");
  const [radiusKm, setRadiusKm] = useState(20);
  const [addressText, setAddressText] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setAvailableNow(profile.available_now || false);
      setSpecialties(profile.specialties || []);
      setTools(profile.tools || []);
      setRadiusKm(profile.radius_km || 20);
      setAddressText(profile.address_text || "");
    }
  }, [profile]);

  /* ── Data fetching ── */

  const fetchData = async () => {
    if (!user) return;

    supabase.from("profiles").update({ last_active_at: new Date().toISOString() } as any).eq("user_id", user.id);

    const { data: svcData } = await supabase.from("services").select("id, name");
    const svcMap: Record<string, string> = {};
    (svcData || []).forEach((s: any) => { svcMap[s.id] = s.name; });
    setServiceNames(svcMap);

    const { data: ordersData } = await supabase.rpc("get_provider_bookings" as any);
    setOrders((ordersData as unknown as ProviderOrder[]) || []);

    const [ledgerRes, balanceRes, settingsRes] = await Promise.all([
      supabase.from("provider_wallet_ledger").select("*").eq("provider_id", user.id).order("created_at", { ascending: false }),
      supabase.rpc("get_provider_balance", { _provider_id: user.id }),
      supabase.from("platform_settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    setLedger((ledgerRes.data as LedgerEntry[]) || []);
    setBalance(balanceRes.data || 0);
    if (settingsRes.data) {
      setCoordinatorPhone((settingsRes.data as any).coordinator_phone || null);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const isProfileReady = profile?.provider_status === "approved" && profile?.profile_completed;

  /* ── Order Actions ── */

  const logHistory = async (bookingId: string, action: string, note?: string) => {
    if (!user) return;
    await (supabase as any).from("booking_history").insert({
      booking_id: bookingId, action, performed_by: user.id, performer_role: "provider", note,
    });
  };

  const acceptOrder = async (id: string) => {
    if (!user) return;
    setActionLoading(id);
    try {
      const { error } = await supabase.from("bookings").update({
        accepted_at: new Date().toISOString(),
        status: "ACCEPTED",
      }).eq("id", id).eq("assigned_provider_id", user.id);

      if (error) throw error;

      await logHistory(id, "ACCEPTED", "تم قبول الطلب من قبل المزود");
      toast({ title: t("provider.dashboard.accepted_toast") });
      await fetchData();
      // Auto-load history for this order
      const { data } = await (supabase as any).from("booking_history").select("*").eq("booking_id", id).order("created_at", { ascending: true });
      setHistoryMap((prev) => ({ ...prev, [id]: data || [] }));
    } catch (err: any) {
      console.error("Accept error:", err);
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    }
    setActionLoading(null);
  };

  const rejectOrder = async (id: string) => {
    if (!confirm(t("provider.dashboard.reject_confirm"))) return;
    setActionLoading(id);
    try {
      await logHistory(id, "REJECTED", "تم رفض الطلب من قبل المزود");
      const { error } = await supabase.from("bookings").update({
        assigned_provider_id: null,
        status: "NEW",
        accepted_at: null,
        assigned_at: null,
      } as any).eq("id", id);
      if (error) throw error;
      toast({ title: t("provider.dashboard.rejected_toast") });
      await fetchData();
    } catch (err: any) {
      console.error("Reject error:", err);
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    }
    setActionLoading(null);
  };

  const confirmComplete = async () => {
    const id = completeDialogOrder;
    if (!id || !user) return;
    setCompleteDialogOrder(null);
    setActionLoading(id);
    try {
      const { error } = await supabase.from("bookings").update({ status: "COMPLETED" }).eq("id", id).eq("assigned_provider_id", user.id);
      if (error) throw error;
      await logHistory(id, "COMPLETED", "تم إكمال الطلب");
      toast({ title: t("provider.dashboard.completed_toast") });
      await fetchData();
      const { data } = await (supabase as any).from("booking_history").select("*").eq("booking_id", id).order("created_at", { ascending: true });
      setHistoryMap((prev) => ({ ...prev, [id]: data || [] }));
    } catch (err: any) {
      console.error("Complete error:", err);
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    }
    setActionLoading(null);
  };

  const confirmCancel = async () => {
    const id = cancelDialogOrder;
    if (!id || !user) return;
    const reason = cancelReason.trim() || "بدون سبب";
    setCancelDialogOrder(null);
    setCancelReason("");
    setActionLoading(id);
    try {
      const { error } = await supabase.from("bookings").update({ status: "CANCELLED" }).eq("id", id).eq("assigned_provider_id", user.id);
      if (error) throw error;
      await logHistory(id, "CANCELLED", `سبب الإلغاء: ${reason}`);
      toast({ title: "تم إلغاء الطلب" });
      await fetchData();
      const { data } = await (supabase as any).from("booking_history").select("*").eq("booking_id", id).order("created_at", { ascending: true });
      setHistoryMap((prev) => ({ ...prev, [id]: data || [] }));
    } catch (err: any) {
      console.error("Cancel error:", err);
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    }
    setActionLoading(null);
  };

  // History state
  const [historyMap, setHistoryMap] = useState<Record<string, any[]>>({});

  const loadHistory = async (bookingId: string) => {
    const { data } = await (supabase as any).from("booking_history").select("*").eq("booking_id", bookingId).order("created_at", { ascending: true });
    setHistoryMap((prev) => ({ ...prev, [bookingId]: data || [] }));
  };

  // Load history for all orders on mount
  useEffect(() => {
    if (orders.length > 0) {
      orders.forEach((o) => loadHistory(o.id));
    }
  }, [orders.length]);

  /* ── Profile Save ── */

  const saveProfile = async () => {
    if (!user) return;
    setProfileSaving(true);
    const { error } = await supabase.from("profiles").update({
      available_now: availableNow,
      specialties: specialties.length > 0 ? specialties : null,
      tools: tools.length > 0 ? tools : null,
      radius_km: radiusKm,
      address_text: addressText.trim(),
    } as any).eq("user_id", user.id);

    setProfileSaving(false);
    if (error) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } else {
      await refreshUserData();
      toast({ title: t("provider.dashboard.profile_saved") });
    }
  };

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  /* ── Guards ── */

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!isProfileReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-10 space-y-4">
            <p className="text-sm text-muted-foreground">
              {profile?.provider_status !== "approved"
                ? t("provider.dashboard.pending_review")
                : t("provider.dashboard.complete_profile")}
            </p>
            {profile?.provider_status === "approved" && !profile?.profile_completed && (
              <Link to="/provider/onboarding"><Button>{t("provider.dashboard.go_complete_profile")}</Button></Link>
            )}
            <div>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5 mt-2">
                <LogOut className="h-4 w-4" /> {t("action.logout")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredOrders = statusFilter === "ALL" ? orders : orders.filter((o) => o.status === statusFilter);
  const isAccepted = (o: ProviderOrder) => !!o.accepted_at;

  const toggleSpecialty = (s: string) => {
    setSpecialties((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const addTool = (toolName: string) => {
    const trimmed = toolName.trim();
    if (trimmed && !tools.includes(trimmed)) setTools([...tools, trimmed]);
    setToolInput("");
  };

  /* ── Render ── */

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={mfnLogo} alt="MFN" className="h-8" />
            <div>
              <h1 className="text-sm font-bold text-foreground">{t("provider.dashboard.title")}</h1>
              <p className="text-[10px] text-muted-foreground">{profile?.full_name || user?.email}</p>
            </div>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5">
            <LogOut className="h-4 w-4" /> {t("action.logout")}
          </Button>
        </div>
      </header>

      <main className="container py-6 px-4">
        {/* Balance Card */}
        <Card className="mb-6">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("provider.dashboard.wallet_balance")}</p>
              <p className={`text-2xl font-bold ${balance < 0 ? "text-destructive" : "text-success"}`}>{formatCurrency(balance)}</p>
            </div>
            <Wallet className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>

        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders" className="gap-1.5 text-xs">
              <ClipboardList className="h-4 w-4" /> {t("provider.dashboard.tab.orders")} ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-1.5 text-xs">
              <User className="h-4 w-4" /> {t("provider.dashboard.tab.profile")}
            </TabsTrigger>
            <TabsTrigger value="wallet" className="gap-1.5 text-xs">
              <Wallet className="h-4 w-4" /> {t("provider.dashboard.tab.wallet")}
            </TabsTrigger>
          </TabsList>

          {/* ═══ Orders Tab ═══ */}
          <TabsContent value="orders" className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              {["ALL", "ASSIGNED", "ACCEPTED", "COMPLETED", "CANCELLED"].map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={statusFilter === s ? "default" : "outline"}
                  className="text-xs h-7"
                  onClick={() => setStatusFilter(s)}
                >
                  {t(`provider.status.${s}`)}
                  {s !== "ALL" && ` (${orders.filter((o) => o.status === s).length})`}
                </Button>
              ))}
            </div>

            {filteredOrders.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-muted-foreground">{t("provider.dashboard.no_orders")}</CardContent></Card>
            ) : (
              <div className="grid gap-3">
                {filteredOrders.map((o) => (
                  <Card key={o.id}>
                    <CardContent className="py-4 px-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{serviceNames[o.service_id] || t("provider.dashboard.service")}</p>
                          <p className="text-xs text-muted-foreground">
                            {o.customer_display_name || t("provider.dashboard.customer")}
                            {o.booking_number && <span className="ms-1" dir="ltr">({o.booking_number})</span>}
                          </p>
                        </div>
                        <Badge variant="outline" className={STATUS_COLORS[o.status] || ""}>
                          {t(`provider.status.${o.status}`) || o.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {formatDateShort(o.scheduled_at)}
                        </span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{o.city}</span>
                        <span className="font-semibold text-primary">
                          {o.agreed_price != null ? formatCurrency(o.agreed_price) : formatCurrency(o.provider_payout)}
                        </span>
                      </div>

                      {/* Contact Details — Only After Acceptance */}
                      {isAccepted(o) ? (
                        <div className="rounded-lg border border-success/20 bg-success/5 p-3 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-success">
                            <ShieldCheck className="h-3.5 w-3.5" /> {t("provider.dashboard.contact_info")}
                          </div>
                          {/* Coordinator phone instead of customer phone */}
                          {coordinatorPhone && (
                            <p className="text-sm flex items-center gap-1.5">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{t("provider.dashboard.coordinator_phone")}:</span>
                              <span dir="ltr" className="font-medium">{coordinatorPhone}</span>
                            </p>
                          )}
                          {o.client_address_text && (
                            <p className="text-sm flex items-center gap-1.5">
                              <MapPin className="h-3 w-3 text-muted-foreground" /> {o.client_address_text}
                            </p>
                          )}
                          {o.notes && <p className="text-xs bg-muted rounded p-2 mt-1">{o.notes}</p>}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5">
                          <Lock className="h-3.5 w-3.5" />
                          {t("provider.dashboard.press_accept")}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap">
                        {o.status === "ASSIGNED" && !isAccepted(o) && (
                          <>
                            <Button
                              size="sm"
                              className="gap-1 h-7 text-xs flex-1 bg-success hover:bg-success/90"
                              onClick={() => acceptOrder(o.id)}
                              disabled={actionLoading === o.id}
                            >
                              {actionLoading === o.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                              {t("provider.dashboard.accept")}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1 h-7 text-xs"
                              onClick={() => rejectOrder(o.id)}
                              disabled={actionLoading === o.id}
                            >
                              <XCircle className="h-3 w-3" /> {t("provider.dashboard.reject")}
                            </Button>
                          </>
                        )}
                        {isAccepted(o) && o.status !== "COMPLETED" && o.status !== "CANCELLED" && (
                          <>
                            <Button size="sm" className="gap-1 h-7 text-xs flex-1" onClick={() => setCompleteDialogOrder(o.id)} disabled={actionLoading === o.id}>
                              {actionLoading === o.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />} {t("provider.dashboard.complete")}
                            </Button>
                            <Button size="sm" variant="destructive" className="gap-1 h-7 text-xs" onClick={() => setCancelDialogOrder(o.id)} disabled={actionLoading === o.id}>
                              <Ban className="h-3 w-3" /> إلغاء
                            </Button>
                          </>
                        )}
                        {isAccepted(o) && coordinatorPhone && (
                          <a
                            href={`https://wa.me/${coordinatorPhone.replace(/^0/, "962")}?text=${encodeURIComponent(`مرحباً، أنا مقدم الخدمة من MFN بخصوص الطلب ${o.booking_number || o.id.slice(0, 8)}.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="outline" className="gap-1 h-7 text-xs">
                              <MessageCircle className="h-3 w-3" /> {t("provider.dashboard.whatsapp_coordinator")}
                            </Button>
                          </a>
                        )}
                      </div>

                      {/* History timeline - always visible */}
                      {(historyMap[o.id] || []).length > 0 && (
                        <div className="border border-border rounded-lg p-3 space-y-2 bg-muted/30">
                          <h5 className="text-xs font-bold text-muted-foreground flex items-center gap-1"><History className="h-3 w-3" /> سجل الطلب</h5>
                          {(historyMap[o.id] || []).map((h: any) => (
                            <div key={h.id} className="flex items-start gap-2 text-xs">
                              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                                h.action === "ACCEPTED" ? "bg-success" :
                                h.action === "CANCELLED" ? "bg-destructive" :
                                h.action === "COMPLETED" ? "bg-primary" : "bg-warning"
                              }`} />
                              <div>
                                <span className="font-medium">{
                                  h.action === "ACCEPTED" ? "✅ قبول" :
                                  h.action === "COMPLETED" ? "✅ إكمال" :
                                  h.action === "CANCELLED" ? "❌ إلغاء" :
                                  h.action === "REJECTED" ? "↩️ رفض" : h.action
                                }</span>
                                {h.note && <span className="text-muted-foreground ms-1">— {h.note}</span>}
                                <p className="text-[10px] text-muted-foreground" dir="ltr">{new Date(h.created_at).toLocaleString("ar-JO")}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ═══ Profile Tab ═══ */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardContent className="py-4 space-y-2">
                <h3 className="text-sm font-bold">{t("provider.details.basic_info")}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">{t("booking.details.client_name")}:</span> {profile?.full_name}</div>
                  <div><span className="text-muted-foreground">{t("booking.details.client_phone")}:</span> <span dir="ltr">{profile?.phone}</span></div>
                  <div><span className="text-muted-foreground">{t("booking.details.client_city")}:</span> {profile?.city}</div>
                  <div><span className="text-muted-foreground">{t("admin.providers.col.type")}:</span> {profile?.role_type ? t(`role_type.${profile.role_type}`) : "—"}</div>
                  {profile?.date_of_birth && (
                    <div><span className="text-muted-foreground">{t("provider.details.registered")}:</span> {profile.date_of_birth}</div>
                  )}
                  <div><span className="text-muted-foreground">{t("admin.providers.col.experience")}:</span> {profile?.experience_years || 0} {t("admin.providers.years")}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">{t("provider.profile.availability")}</h3>
                  <Switch checked={availableNow} onCheckedChange={setAvailableNow} />
                </div>
                <div>
                  <label className="text-sm font-medium">{t("provider.profile.radius")} ({t("provider.details.km")})</label>
                  <Input
                    type="number" min={1} max={100} value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="w-24 mt-1" dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t("provider.profile.address")}</label>
                  <Input
                    value={addressText}
                    onChange={(e) => setAddressText(e.target.value)}
                    placeholder={t("provider.profile.address_placeholder")} className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4 space-y-4">
                <h3 className="text-sm font-bold">{t("provider.profile.specialties")}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {SPECIALTY_OPTIONS.map((s) => (
                    <Badge
                      key={s}
                      variant={specialties.includes(s) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleSpecialty(s)}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>

                <h3 className="text-sm font-bold mt-4">{t("provider.profile.tools")}</h3>
                <div className="flex gap-2">
                  <Input
                    value={toolInput}
                    onChange={(e) => setToolInput(e.target.value)}
                    placeholder={t("provider.profile.add_tool")}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTool(toolInput); } }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => addTool(toolInput)}>+</Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TOOL_SUGGESTIONS.filter((ts) => !tools.includes(ts)).slice(0, 3).map((ts) => (
                    <Badge key={ts} variant="outline" className="cursor-pointer hover:bg-accent text-xs" onClick={() => addTool(ts)}>
                      + {ts}
                    </Badge>
                  ))}
                </div>
                {tools.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tools.map((toolItem) => (
                      <Badge key={toolItem} variant="secondary" className="gap-1 text-xs">
                        {toolItem} <X className="h-3 w-3 cursor-pointer" onClick={() => setTools(tools.filter((x) => x !== toolItem))} />
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Button className="w-full gap-2" onClick={saveProfile} disabled={profileSaving}>
              {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              {t("provider.profile.save")}
            </Button>
          </TabsContent>

          {/* ═══ Wallet Tab ═══ */}
          <TabsContent value="wallet">
            <h3 className="text-sm font-bold mb-3">{t("provider.wallet.history")}</h3>
            {ledger.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-muted-foreground">{t("provider.wallet.no_transactions")}</CardContent></Card>
            ) : (
              <div className="grid gap-2">
                {ledger.map((entry) => (
                  <Card key={entry.id}>
                    <CardContent className="flex items-center justify-between py-3 px-4">
                      <div>
                        <p className="text-sm font-medium">
                          {entry.reason === "commission" ? t("provider.wallet.commission") : entry.reason === "settlement" ? t("provider.wallet.settlement") : entry.reason}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(entry.created_at)}</p>
                      </div>
                      <span className={`font-bold text-sm ${entry.amount < 0 ? "text-destructive" : "text-success"}`}>
                        {entry.amount > 0 ? "+" : ""}{formatCurrency(entry.amount)}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Complete Confirmation Dialog */}
      <AlertDialog open={!!completeDialogOrder} onOpenChange={(open) => { if (!open) setCompleteDialogOrder(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد إكمال الطلب</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد أنك أتممت هذا الطلب بنجاح؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmComplete}>نعم، تم الإكمال</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Dialog with Reason */}
      <Dialog open={!!cancelDialogOrder} onOpenChange={(open) => { if (!open) { setCancelDialogOrder(null); setCancelReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إلغاء الطلب</DialogTitle>
            <DialogDescription>يرجى إدخال سبب الإلغاء</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="اكتب سبب الإلغاء هنا..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="min-h-[80px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCancelDialogOrder(null); setCancelReason(""); }}>تراجع</Button>
            <Button variant="destructive" onClick={confirmCancel}>تأكيد الإلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderDashboard;
