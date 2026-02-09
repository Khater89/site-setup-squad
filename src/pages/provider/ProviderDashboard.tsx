import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Wallet, LogOut, Loader2, CheckCircle, XCircle,
  CalendarDays, MapPin, ClipboardList, Phone,
  MessageCircle, ShieldCheck, Eye, Lock, User, X,
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

const STATUS_LABELS: Record<string, string> = {
  ASSIGNED: "بانتظار القبول",
  ACCEPTED: "مقبول",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي",
};

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
  const { toast } = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<ProviderOrder[]>([]);
  const [serviceNames, setServiceNames] = useState<Record<string, string>>({});
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

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

    // Update last_active_at (fire and forget)
    supabase.from("profiles").update({ last_active_at: new Date().toISOString() } as any).eq("user_id", user.id);

    const { data: svcData } = await supabase.from("services").select("id, name");
    const svcMap: Record<string, string> = {};
    (svcData || []).forEach((s: any) => { svcMap[s.id] = s.name; });
    setServiceNames(svcMap);

    // Only returns orders assigned to this provider (privacy-safe)
    const { data: ordersData } = await supabase.rpc("get_provider_bookings" as any);
    setOrders((ordersData as unknown as ProviderOrder[]) || []);

    const [ledgerRes, balanceRes] = await Promise.all([
      supabase.from("provider_wallet_ledger").select("*").eq("provider_id", user.id).order("created_at", { ascending: false }),
      supabase.rpc("get_provider_balance", { _provider_id: user.id }),
    ]);
    setLedger((ledgerRes.data as LedgerEntry[]) || []);
    setBalance(balanceRes.data || 0);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const isProfileReady = profile?.provider_status === "approved" && profile?.profile_completed;

  /* ── Order Actions ── */

  const acceptOrder = async (id: string) => {
    if (!user) return;
    setActionLoading(id);
    const { error } = await supabase.from("bookings").update({
      accepted_at: new Date().toISOString(),
      status: "ACCEPTED",
    }).eq("id", id).eq("assigned_provider_id", user.id);

    if (!error) {
      await (supabase as any).from("data_access_log").insert({
        booking_id: id, accessed_by: user.id, accessor_role: "provider", action: "accept_order",
      });
      toast({ title: "تم قبول الطلب — بيانات التواصل متاحة الآن ✅" });
      fetchData();
    } else {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
    setActionLoading(null);
  };

  const rejectOrder = async (id: string) => {
    if (!confirm("هل تريد رفض هذا الطلب؟ سيعود للطابور ليتم إسناده لمزوّد آخر.")) return;
    setActionLoading(id);
    const { error } = await supabase.from("bookings").update({
      assigned_provider_id: null,
      status: "NEW",
      accepted_at: null,
      assigned_at: null,
    } as any).eq("id", id);

    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم رفض الطلب — سيتم إعادته للطابور" });
      fetchData();
    }
    setActionLoading(null);
  };

  const markComplete = async (id: string) => {
    const { error } = await supabase.from("bookings").update({ status: "COMPLETED" }).eq("id", id);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم تأكيد إتمام الطلب ✅" });
      fetchData();
    }
  };

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
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      await refreshUserData();
      toast({ title: "تم حفظ التعديلات ✅" });
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
                ? "حسابك قيد المراجعة. يرجى الانتظار حتى تتم الموافقة."
                : "يرجى إكمال ملفك الشخصي أولاً لبدء استقبال الطلبات."}
            </p>
            {profile?.provider_status === "approved" && !profile?.profile_completed && (
              <Link to="/provider/onboarding"><Button>إكمال الملف الشخصي</Button></Link>
            )}
            <div>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5 mt-2">
                <LogOut className="h-4 w-4" /> خروج
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

  const addTool = (t: string) => {
    const trimmed = t.trim();
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
              <h1 className="text-sm font-bold text-foreground">لوحة مقدم الخدمة</h1>
              <p className="text-[10px] text-muted-foreground">{profile?.full_name || user?.email}</p>
            </div>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5">
            <LogOut className="h-4 w-4" /> خروج
          </Button>
        </div>
      </header>

      <main className="container py-6 px-4">
        {/* Balance Card */}
        <Card className="mb-6">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm text-muted-foreground">رصيد المحفظة</p>
              <p className={`text-2xl font-bold ${balance < 0 ? "text-destructive" : "text-success"}`}>{balance} د.أ</p>
            </div>
            <Wallet className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>

        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders" className="gap-1.5 text-xs">
              <ClipboardList className="h-4 w-4" /> طلباتي ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-1.5 text-xs">
              <User className="h-4 w-4" /> ملفي
            </TabsTrigger>
            <TabsTrigger value="wallet" className="gap-1.5 text-xs">
              <Wallet className="h-4 w-4" /> المحفظة
            </TabsTrigger>
          </TabsList>

          {/* ═══ Orders Tab ═══ */}
          <TabsContent value="orders" className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              {["ALL", "ASSIGNED", "ACCEPTED", "COMPLETED"].map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={statusFilter === s ? "default" : "outline"}
                  className="text-xs h-7"
                  onClick={() => setStatusFilter(s)}
                >
                  {s === "ALL" ? "الكل" : STATUS_LABELS[s]}
                  {s !== "ALL" && ` (${orders.filter((o) => o.status === s).length})`}
                </Button>
              ))}
            </div>

            {filteredOrders.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-muted-foreground">لا توجد طلبات مسندة إليك حالياً</CardContent></Card>
            ) : (
              <div className="grid gap-3">
                {filteredOrders.map((o) => (
                  <Card key={o.id}>
                    <CardContent className="py-4 px-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{serviceNames[o.service_id] || "خدمة"}</p>
                          <p className="text-xs text-muted-foreground">
                            {o.customer_display_name || "عميل"}
                            {o.booking_number && <span className="ms-1" dir="ltr">({o.booking_number})</span>}
                          </p>
                        </div>
                        <Badge variant="outline" className={STATUS_COLORS[o.status] || ""}>
                          {STATUS_LABELS[o.status] || o.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(o.scheduled_at).toLocaleDateString("ar-JO", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{o.city}</span>
                        <span className="font-semibold text-primary">
                          {o.agreed_price != null ? `${o.agreed_price} د.أ` : `${o.provider_payout} د.أ`}
                        </span>
                      </div>

                      {/* Contact Details — Only After Acceptance */}
                      {isAccepted(o) ? (
                        <div className="rounded-lg border border-success/20 bg-success/5 p-3 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-success">
                            <ShieldCheck className="h-3.5 w-3.5" /> بيانات التواصل
                          </div>
                          {o.customer_phone && (
                            <p className="text-sm flex items-center gap-1.5">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span dir="ltr">{o.customer_phone}</span>
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
                          اضغط &quot;قبول الطلب&quot; لعرض بيانات التواصل
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
                              قبول الطلب
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1 h-7 text-xs"
                              onClick={() => rejectOrder(o.id)}
                              disabled={actionLoading === o.id}
                            >
                              <XCircle className="h-3 w-3" /> رفض
                            </Button>
                          </>
                        )}
                        {isAccepted(o) && o.status !== "COMPLETED" && (
                          <Button size="sm" className="gap-1 h-7 text-xs flex-1" onClick={() => markComplete(o.id)}>
                            <CheckCircle className="h-3 w-3" /> تأكيد الإتمام
                          </Button>
                        )}
                        {isAccepted(o) && o.customer_phone && (
                          <a
                            href={`https://wa.me/${o.customer_phone.replace(/^0/, "962")}?text=${encodeURIComponent("مرحباً، أنا مقدم الخدمة من MFN.")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="outline" className="gap-1 h-7 text-xs">
                              <MessageCircle className="h-3 w-3" /> واتساب
                            </Button>
                          </a>
                        )}
                      </div>
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
                <h3 className="text-sm font-bold">البيانات الأساسية</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">الاسم:</span> {profile?.full_name}</div>
                  <div><span className="text-muted-foreground">الهاتف:</span> <span dir="ltr">{profile?.phone}</span></div>
                  <div><span className="text-muted-foreground">المدينة:</span> {profile?.city}</div>
                  <div><span className="text-muted-foreground">التخصص:</span> {profile?.role_type}</div>
                  {profile?.date_of_birth && (
                    <div><span className="text-muted-foreground">تاريخ الميلاد:</span> {profile.date_of_birth}</div>
                  )}
                  <div><span className="text-muted-foreground">الخبرة:</span> {profile?.experience_years || 0} سنة</div>
                </div>
                <Link to="/provider/onboarding" className="text-xs text-primary hover:underline">
                  تعديل البيانات الأساسية ←
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">التوفر</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">متاح الآن</span>
                    <Switch checked={availableNow} onCheckedChange={setAvailableNow} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">نطاق التغطية (كم)</label>
                  <Input
                    type="number" min={1} max={100} value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="w-24 mt-1" dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">العنوان</label>
                  <Input
                    value={addressText}
                    onChange={(e) => setAddressText(e.target.value)}
                    placeholder="وصف العنوان" className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4 space-y-4">
                <h3 className="text-sm font-bold">التخصصات</h3>
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

                <h3 className="text-sm font-bold mt-4">الأدوات</h3>
                <div className="flex gap-2">
                  <Input
                    value={toolInput}
                    onChange={(e) => setToolInput(e.target.value)}
                    placeholder="أضف أداة..."
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTool(toolInput); } }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => addTool(toolInput)}>+</Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TOOL_SUGGESTIONS.filter((t) => !tools.includes(t)).slice(0, 3).map((t) => (
                    <Badge key={t} variant="outline" className="cursor-pointer hover:bg-accent text-xs" onClick={() => addTool(t)}>
                      + {t}
                    </Badge>
                  ))}
                </div>
                {tools.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tools.map((t) => (
                      <Badge key={t} variant="secondary" className="gap-1 text-xs">
                        {t} <X className="h-3 w-3 cursor-pointer" onClick={() => setTools(tools.filter((x) => x !== t))} />
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Button className="w-full gap-2" onClick={saveProfile} disabled={profileSaving}>
              {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              حفظ التعديلات
            </Button>
          </TabsContent>

          {/* ═══ Wallet Tab ═══ */}
          <TabsContent value="wallet">
            {ledger.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-muted-foreground">لا توجد حركات في المحفظة</CardContent></Card>
            ) : (
              <div className="grid gap-2">
                {ledger.map((entry) => (
                  <Card key={entry.id}>
                    <CardContent className="flex items-center justify-between py-3 px-4">
                      <div>
                        <p className="text-sm font-medium">
                          {entry.reason === "commission" ? "عمولة" : entry.reason === "settlement" ? "تسوية" : "تعديل"}
                        </p>
                        <p className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleDateString("ar-JO")}</p>
                      </div>
                      <span className={`font-bold text-sm ${entry.amount < 0 ? "text-destructive" : "text-success"}`}>
                        {entry.amount > 0 ? "+" : ""}{entry.amount} د.أ
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ProviderDashboard;
