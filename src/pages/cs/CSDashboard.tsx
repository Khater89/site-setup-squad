import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarCheck, Users, PlusCircle, LogOut, Loader2,
  UserCheck, Phone, MapPin, CalendarDays, Search,
  MessageCircle, Filter, Briefcase, Clock,
} from "lucide-react";
import mfnLogo from "@/assets/mfn-logo.png";
import { useNavigate } from "react-router-dom";

interface BookingRow {
  id: string;
  customer_name: string;
  customer_phone: string;
  city: string;
  scheduled_at: string;
  status: string;
  payment_method: string;
  subtotal: number;
  provider_payout: number;
  notes: string | null;
  assigned_provider_id: string | null;
  assigned_by: string | null;
  service_id: string;
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
  tools: string[] | null;
  radius_km: number | null;
  address_text: string | null;
}

interface ServiceRow {
  id: string;
  name: string;
  category: string;
  base_price: number;
  active: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  NEW: "جديد",
  ASSIGNED: "معيّن",
  CONFIRMED: "مؤكد",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي",
};

const ROLE_TYPE_LABELS: Record<string, string> = {
  doctor: "طبيب",
  nurse: "ممرض/ة",
  caregiver: "مقدم رعاية",
  physiotherapist: "أخصائي علاج طبيعي",
};

const CSDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [serviceNames, setServiceNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // New booking form
  const [newBooking, setNewBooking] = useState({
    customer_name: "",
    customer_phone: "",
    city: "",
    service_id: "",
    scheduled_at: "",
    notes: "",
  });
  const [creatingBooking, setCreatingBooking] = useState(false);

  // Assignment dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null);
  const [assigning, setAssigning] = useState(false);

  const fetchData = useCallback(async () => {
    const [bookingsRes, providersRes, servicesRes] = await Promise.all([
      supabase.from("bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*"),
      supabase.from("services").select("*").order("name"),
    ]);

    setBookings((bookingsRes.data as unknown as BookingRow[]) || []);

    // Filter to only show providers (those with provider role_type or status)
    const allProfiles = (providersRes.data || []) as unknown as ProviderRow[];
    const providerProfiles = allProfiles.filter(
      (p) => p.role_type || p.provider_status !== "pending"
    );
    setProviders(providerProfiles);

    const svcData = (servicesRes.data || []) as unknown as ServiceRow[];
    setServices(svcData);
    const svcMap: Record<string, string> = {};
    svcData.forEach((s) => { svcMap[s.id] = s.name; });
    setServiceNames(svcMap);

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        b.customer_name.toLowerCase().includes(q) ||
        b.customer_phone.includes(q) ||
        b.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Get available providers for a booking's city
  const getMatchingProviders = (city: string) => {
    return providers
      .filter(
        (p) =>
          p.provider_status === "approved" &&
          p.profile_completed &&
          p.city?.toLowerCase().includes(city.toLowerCase())
      )
      .sort((a, b) => {
        // Prefer available_now
        if (a.available_now && !b.available_now) return -1;
        if (!a.available_now && b.available_now) return 1;
        return 0;
      });
  };

  const handleAssign = async (providerId: string) => {
    if (!selectedBooking) return;
    setAssigning(true);

    const { error } = await supabase
      .from("bookings")
      .update({
        assigned_provider_id: providerId,
        status: "ASSIGNED",
        assigned_at: new Date().toISOString(),
        assigned_by: "cs",
      })
      .eq("id", selectedBooking.id);

    setAssigning(false);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم الإسناد بنجاح ✅" });
      setAssignDialogOpen(false);
      setSelectedBooking(null);
      fetchData();
    }
  };

  const handleAssignNearest = async (booking: BookingRow) => {
    const matching = getMatchingProviders(booking.city);
    if (matching.length === 0) {
      toast({ title: "لا يوجد مزوّدون متاحون في هذه المدينة", variant: "destructive" });
      return;
    }
    // Pick the first available (nearest by sort)
    const nearest = matching[0];
    setAssigning(true);

    const { error } = await supabase
      .from("bookings")
      .update({
        assigned_provider_id: nearest.user_id,
        status: "ASSIGNED",
        assigned_at: new Date().toISOString(),
        assigned_by: "cs_auto",
      })
      .eq("id", booking.id);

    setAssigning(false);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `تم الإسناد تلقائياً إلى ${nearest.full_name || "مزوّد"} ✅` });
      fetchData();
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const { customer_name, customer_phone, city, service_id, scheduled_at } = newBooking;
    if (!customer_name.trim() || !customer_phone.trim() || !city.trim() || !service_id || !scheduled_at) {
      toast({ title: "أكمل جميع البيانات الإلزامية", variant: "destructive" });
      return;
    }

    const service = services.find((s) => s.id === service_id);
    if (!service) return;

    setCreatingBooking(true);

    const { error } = await supabase.from("bookings").insert({
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      city: city.trim(),
      service_id,
      scheduled_at: new Date(scheduled_at).toISOString(),
      notes: newBooking.notes.trim() || null,
      subtotal: service.base_price,
      payment_method: "CASH",
      status: "NEW",
      customer_user_id: null,
    });

    setCreatingBooking(false);
    if (error) {
      toast({ title: "خطأ في إنشاء الحجز", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم إنشاء الحجز بنجاح ✅" });
      setNewBooking({ customer_name: "", customer_phone: "", city: "", service_id: "", scheduled_at: "", notes: "" });
      fetchData();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={mfnLogo} alt="MFN" className="h-8" />
            <div>
              <h1 className="text-sm font-bold text-foreground">لوحة خدمة العملاء</h1>
              <p className="text-[10px] text-muted-foreground">{user?.email}</p>
            </div>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5">
            <LogOut className="h-4 w-4" />
            خروج
          </Button>
        </div>
      </header>

      <main className="container py-6 px-4">
        <Tabs defaultValue="bookings" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bookings" className="gap-1.5 text-xs">
              <CalendarCheck className="h-4 w-4" />
              الحجوزات ({bookings.length})
            </TabsTrigger>
            <TabsTrigger value="providers" className="gap-1.5 text-xs">
              <Users className="h-4 w-4" />
              المزوّدون ({providers.filter((p) => p.provider_status === "approved").length})
            </TabsTrigger>
            <TabsTrigger value="new-booking" className="gap-1.5 text-xs">
              <PlusCircle className="h-4 w-4" />
              حجز جديد
            </TabsTrigger>
          </TabsList>

          {/* ========== Bookings Tab ========== */}
          <TabsContent value="bookings" className="space-y-4">
            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم أو الهاتف أو المدينة..."
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
                  <SelectItem value="CONFIRMED">مؤكد</SelectItem>
                  <SelectItem value="COMPLETED">مكتمل</SelectItem>
                  <SelectItem value="CANCELLED">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredBookings.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  لا توجد حجوزات مطابقة
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {filteredBookings.map((b) => (
                  <Card key={b.id}>
                    <CardContent className="py-4 px-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{serviceNames[b.service_id] || "خدمة"}</p>
                          <p className="text-xs text-muted-foreground">
                            {b.customer_name} · <span dir="ltr">{b.customer_phone}</span>
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            b.status === "NEW"
                              ? "bg-info/10 text-info border-info/30"
                              : b.status === "COMPLETED"
                              ? "bg-success/10 text-success border-success/30"
                              : ""
                          }
                        >
                          {STATUS_LABELS[b.status] || b.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(b.scheduled_at).toLocaleDateString("ar-JO", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{b.city}</span>
                        <span className="font-medium text-primary">{b.subtotal} د.أ</span>
                        {b.assigned_by && <span className="text-muted-foreground">إسناد: {b.assigned_by}</span>}
                      </div>
                      {b.notes && <p className="text-xs bg-muted rounded p-2">{b.notes}</p>}

                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap">
                        {b.status === "NEW" && !b.assigned_provider_id && (
                          <>
                            <Button
                              size="sm"
                              className="gap-1 h-7 text-xs"
                              onClick={() => handleAssignNearest(b)}
                              disabled={assigning}
                            >
                              {assigning ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserCheck className="h-3 w-3" />}
                              إسناد للأقرب
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 h-7 text-xs"
                              onClick={() => {
                                setSelectedBooking(b);
                                setAssignDialogOpen(true);
                              }}
                            >
                              إسناد يدوي
                            </Button>
                          </>
                        )}
                        <a
                          href={`https://wa.me/${b.customer_phone.replace(/^0/, "962")}?text=${encodeURIComponent(`مرحباً ${b.customer_name}، نحن من فريق MFN.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="outline" className="gap-1 h-7 text-xs">
                            <MessageCircle className="h-3 w-3" />
                            واتساب
                          </Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ========== Providers Tab ========== */}
          <TabsContent value="providers" className="space-y-4">
            {providers.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  لا يوجد مزوّدون مسجلون
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {providers.map((p) => (
                  <Card key={p.user_id}>
                    <CardContent className="py-4 px-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{p.full_name || "بدون اسم"}</p>
                          <p className="text-xs text-muted-foreground">
                            {ROLE_TYPE_LABELS[p.role_type || ""] || p.role_type || "—"} · {p.city || "—"}
                          </p>
                        </div>
                        <div className="flex gap-1.5">
                          <Badge
                            variant="outline"
                            className={
                              p.provider_status === "approved"
                                ? "bg-success/10 text-success border-success/30"
                                : p.provider_status === "pending"
                                ? "bg-warning/10 text-warning border-warning/30"
                                : "bg-destructive/10 text-destructive border-destructive/30"
                            }
                          >
                            {p.provider_status === "approved" ? "معتمد" : p.provider_status === "pending" ? "قيد المراجعة" : "معلّق"}
                          </Badge>
                          {p.available_now && (
                            <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                              متاح الآن
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {p.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span dir="ltr">{p.phone}</span>
                          </span>
                        )}
                        {p.experience_years != null && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {p.experience_years} سنة خبرة
                          </span>
                        )}
                        {p.radius_km && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            نطاق {p.radius_km} كم
                          </span>
                        )}
                        {!p.profile_completed && (
                          <span className="text-warning">الملف غير مكتمل</span>
                        )}
                      </div>
                      {p.tools && p.tools.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {p.tools.map((t) => (
                            <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                          ))}
                        </div>
                      )}
                      {p.address_text && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {p.address_text}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ========== New Booking Tab ========== */}
          <TabsContent value="new-booking">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">إنشاء حجز هاتفي</CardTitle>
                <CardDescription>أنشئ حجزاً نيابة عن العميل عبر الهاتف</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateBooking} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">اسم العميل *</label>
                      <Input
                        value={newBooking.customer_name}
                        onChange={(e) => setNewBooking({ ...newBooking, customer_name: e.target.value })}
                        placeholder="الاسم الكامل"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">رقم الهاتف *</label>
                      <Input
                        value={newBooking.customer_phone}
                        onChange={(e) => setNewBooking({ ...newBooking, customer_phone: e.target.value })}
                        placeholder="07XXXXXXXX"
                        required
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">المدينة *</label>
                      <Input
                        value={newBooking.city}
                        onChange={(e) => setNewBooking({ ...newBooking, city: e.target.value })}
                        placeholder="مثال: عمان"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">الخدمة *</label>
                      <Select
                        value={newBooking.service_id}
                        onValueChange={(v) => setNewBooking({ ...newBooking, service_id: v })}
                      >
                        <SelectTrigger><SelectValue placeholder="اختر خدمة" /></SelectTrigger>
                        <SelectContent>
                          {services.filter((s) => s.active).map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name} — {s.base_price} د.أ
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">موعد الخدمة *</label>
                    <Input
                      type="datetime-local"
                      value={newBooking.scheduled_at}
                      onChange={(e) => setNewBooking({ ...newBooking, scheduled_at: e.target.value })}
                      required
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">ملاحظات</label>
                    <Textarea
                      value={newBooking.notes}
                      onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                      placeholder="تفاصيل إضافية..."
                      rows={3}
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={creatingBooking}>
                    {creatingBooking ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                    إنشاء الحجز
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إسناد يدوي للطلب</DialogTitle>
            <DialogDescription>
              اختر مزوّد خدمة لإسناد الطلب إليه في {selectedBooking?.city}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {selectedBooking && getMatchingProviders(selectedBooking.city).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                لا يوجد مزوّدون معتمدون ومكتملو الملف في هذه المدينة
              </p>
            )}
            {selectedBooking && getMatchingProviders(selectedBooking.city).map((p) => (
              <Card key={p.user_id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{p.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ROLE_TYPE_LABELS[p.role_type || ""] || ""} · {p.experience_years || 0} سنة
                      {p.available_now && " · متاح الآن"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="gap-1 h-7 text-xs"
                    onClick={() => handleAssign(p.user_id)}
                    disabled={assigning}
                  >
                    {assigning ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserCheck className="h-3 w-3" />}
                    إسناد
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CSDashboard;
