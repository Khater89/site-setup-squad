import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, Phone, MapPin, Briefcase, Navigation,
  Search, Stethoscope,
} from "lucide-react";

/* ── Types ── */

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
  specialties: string[] | null;
  radius_km: number | null;
  address_text: string | null;
  lat: number | null;
  lng: number | null;
  last_active_at: string | null;
  languages: string[] | null;
}

const ROLE_TYPE_LABELS: Record<string, string> = {
  doctor: "طبيب",
  nurse: "ممرض/ة",
  caregiver: "مقدم رعاية",
  physiotherapist: "أخصائي علاج طبيعي",
};

const CSProviderDirectory = () => {
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [availableFilter, setAvailableFilter] = useState("ALL");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .not("phone", "is", null)
        .order("created_at", { ascending: false });
      setProviders((data as unknown as ProviderRow[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = providers.filter((p) => {
    if (typeFilter !== "ALL" && p.role_type !== typeFilter) return false;
    if (availableFilter === "available" && !p.available_now) return false;
    if (availableFilter === "approved" && p.provider_status !== "approved") return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (p.full_name || "").toLowerCase().includes(q) ||
        (p.city || "").toLowerCase().includes(q) ||
        (p.phone || "").includes(q) ||
        (p.specialties || []).some((s) => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو المدينة أو التخصص..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="النوع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">كل الأنواع</SelectItem>
            <SelectItem value="doctor">طبيب</SelectItem>
            <SelectItem value="nurse">ممرض/ة</SelectItem>
            <SelectItem value="caregiver">مقدم رعاية</SelectItem>
            <SelectItem value="physiotherapist">علاج طبيعي</SelectItem>
          </SelectContent>
        </Select>
        <Select value={availableFilter} onValueChange={setAvailableFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">الكل</SelectItem>
            <SelectItem value="available">متاح الآن</SelectItem>
            <SelectItem value="approved">معتمد</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} مزوّد</p>

      {/* Provider Cards */}
      {filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">لا يوجد مزوّدون مطابقون</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((p) => (
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
                      <Badge variant="outline" className="bg-success/10 text-success border-success/30">متاح</Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  {p.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" /> <span dir="ltr">{p.phone}</span>
                    </span>
                  )}
                  {p.experience_years != null && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" /> {p.experience_years} سنة
                    </span>
                  )}
                  {p.radius_km && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> نطاق {p.radius_km} كم
                    </span>
                  )}
                  {p.lat && p.lng && (
                    <span className="flex items-center gap-1">
                      <Navigation className="h-3 w-3" /> موقع مسجل
                    </span>
                  )}
                  {!p.profile_completed && (
                    <span className="text-warning">الملف غير مكتمل</span>
                  )}
                </div>

                {/* Specialties */}
                {p.specialties && p.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <Stethoscope className="h-3 w-3 text-muted-foreground mt-0.5" />
                    {p.specialties.map((s) => (
                      <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                    ))}
                  </div>
                )}

                {/* Tools */}
                {p.tools && p.tools.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.tools.map((t) => (
                      <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                )}

                {p.address_text && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {p.address_text}
                  </p>
                )}

                {p.last_active_at && (
                  <p className="text-[10px] text-muted-foreground">
                    آخر نشاط: {new Date(p.last_active_at).toLocaleDateString("ar-JO", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CSProviderDirectory;
