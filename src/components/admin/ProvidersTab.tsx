import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import ProviderDetailsDrawer, { type ProviderProfile } from "./ProviderDetailsDrawer";

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

const ProvidersTab = () => {
  const { toast } = useToast();
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Details drawer
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null);

  const fetchProviders = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .not("phone", "is", null)
      .order("created_at", { ascending: false });

    if (!profiles) { setLoading(false); return; }

    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "provider");
    const providerIds = new Set(roles?.map((r) => r.user_id) || []);

    // Batch get balances for providers
    const enriched: ProviderProfile[] = [];
    for (const p of profiles) {
      let balance = 0;
      if (providerIds.has(p.user_id)) {
        const { data } = await supabase.rpc("get_provider_balance", { _provider_id: p.user_id });
        balance = data || 0;
      }
      enriched.push({
        ...p,
        available_now: p.available_now ?? false,
        profile_completed: p.profile_completed ?? false,
        hasProviderRole: providerIds.has(p.user_id),
        balance,
      } as ProviderProfile);
    }

    setProviders(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchProviders(); }, []);

  const approveProvider = async (userId: string) => {
    const { error: e1 } = await supabase.from("profiles").update({ provider_status: "approved" }).eq("user_id", userId);
    const { error: e2 } = await supabase.rpc("set_user_role", { target_user_id: userId, new_role: "provider" as any });
    if (e1 || e2) {
      toast({ title: "خطأ", description: (e1 || e2)?.message, variant: "destructive" });
    } else {
      toast({ title: "تمت الموافقة على مقدم الخدمة ✅" });
      fetchProviders();
    }
  };

  const suspendProvider = async (userId: string) => {
    const { error: e1 } = await supabase.from("profiles").update({ provider_status: "suspended" }).eq("user_id", userId);
    const { error: e2 } = await supabase.rpc("remove_user_role", { target_user_id: userId, old_role: "provider" as any });
    if (e1 || e2) {
      toast({ title: "خطأ", description: (e1 || e2)?.message, variant: "destructive" });
    } else {
      toast({ title: "تم إيقاف مقدم الخدمة" });
      fetchProviders();
    }
  };

  const recordSettlement = async (userId: string) => {
    const amount = prompt("أدخل مبلغ التسوية (رقم موجب):");
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    const { error } = await supabase.from("provider_wallet_ledger").insert({
      provider_id: userId, amount: Number(amount), reason: "settlement",
    });
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم تسجيل التسوية" });
      fetchProviders();
    }
  };

  const filtered = providers.filter((p) => {
    if (statusFilter !== "ALL" && p.provider_status !== statusFilter) return false;
    if (typeFilter !== "ALL" && p.role_type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (p.full_name || "").toLowerCase().includes(q) ||
        (p.phone || "").includes(q) ||
        (p.city || "").toLowerCase().includes(q) ||
        (p.specialties || []).some((s) => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-lg font-bold">مقدمو الخدمة ({providers.length})</h2>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9 w-[180px]"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[120px]">
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">الكل</SelectItem>
              <SelectItem value="pending">قيد الانتظار</SelectItem>
              <SelectItem value="approved">معتمد</SelectItem>
              <SelectItem value="suspended">موقوف</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">لا يوجد مقدمو خدمة مطابقون</div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">الهاتف</TableHead>
                <TableHead className="text-right">التخصص</TableHead>
                <TableHead className="text-right">المدينة</TableHead>
                <TableHead className="text-right">الخبرة</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">التوفر</TableHead>
                <TableHead className="text-right">الرصيد</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const status = STATUS_BADGES[p.provider_status] || STATUS_BADGES.pending;
                return (
                  <TableRow
                    key={p.user_id}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => setSelectedProvider(p)}
                  >
                    <TableCell className="font-medium text-sm">
                      {p.full_name || "بدون اسم"}
                    </TableCell>
                    <TableCell className="text-xs" dir="ltr">{p.phone}</TableCell>
                    <TableCell className="text-xs">
                      {ROLE_TYPE_LABELS[p.role_type || ""] || p.role_type || "—"}
                    </TableCell>
                    <TableCell className="text-sm">{p.city || "—"}</TableCell>
                    <TableCell className="text-sm">
                      {p.experience_years != null ? `${p.experience_years} سنة` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${status.className}`}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {p.available_now ? (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-[10px]">متاح</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className={`text-sm font-medium ${p.balance < 0 ? "text-destructive" : "text-success"}`}>
                      {p.hasProviderRole ? `${p.balance} د.أ` : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Provider Details Drawer */}
      <ProviderDetailsDrawer
        provider={selectedProvider}
        open={!!selectedProvider}
        onOpenChange={(open) => { if (!open) setSelectedProvider(null); }}
        onApprove={(id) => { approveProvider(id); setSelectedProvider(null); }}
        onSuspend={(id) => { suspendProvider(id); setSelectedProvider(null); }}
        onSettlement={(id) => { recordSettlement(id); setSelectedProvider(null); }}
      />
    </div>
  );
};

export default ProvidersTab;
