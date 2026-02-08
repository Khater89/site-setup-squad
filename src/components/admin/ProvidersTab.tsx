import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Wallet } from "lucide-react";

interface ProviderProfile {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  provider_status: string;
  created_at: string;
  hasProviderRole: boolean;
  balance: number;
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending: { label: "قيد الانتظار", className: "bg-warning/20 text-warning-foreground" },
  approved: { label: "معتمد", className: "bg-success text-success-foreground" },
  suspended: { label: "موقوف", className: "bg-destructive text-destructive-foreground" },
};

const ProvidersTab = () => {
  const { toast } = useToast();
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProviders = async () => {
    // Get all profiles that have filled in their info (potential providers)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .not("phone", "is", null)
      .order("created_at", { ascending: false });

    if (!profiles) {
      setLoading(false);
      return;
    }

    // Get all provider roles
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "provider");
    const providerIds = new Set(roles?.map((r) => r.user_id) || []);

    // Get balances for providers
    const enriched: ProviderProfile[] = [];
    for (const p of profiles) {
      let balance = 0;
      if (providerIds.has(p.user_id)) {
        const { data } = await supabase.rpc("get_provider_balance", { _provider_id: p.user_id });
        balance = data || 0;
      }
      enriched.push({
        ...p,
        hasProviderRole: providerIds.has(p.user_id),
        balance,
      });
    }

    setProviders(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchProviders(); }, []);

  const approveProvider = async (userId: string) => {
    // Update provider_status
    const { error: e1 } = await supabase
      .from("profiles")
      .update({ provider_status: "approved" })
      .eq("user_id", userId);

    // Add provider role via RPC
    const { error: e2 } = await supabase.rpc("set_user_role", {
      target_user_id: userId,
      new_role: "provider" as any,
    });

    if (e1 || e2) {
      toast({ title: "خطأ", description: (e1 || e2)?.message, variant: "destructive" });
    } else {
      toast({ title: "تمت الموافقة على مقدم الخدمة ✅" });
      fetchProviders();
    }
  };

  const suspendProvider = async (userId: string) => {
    const { error: e1 } = await supabase
      .from("profiles")
      .update({ provider_status: "suspended" })
      .eq("user_id", userId);

    const { error: e2 } = await supabase.rpc("remove_user_role", {
      target_user_id: userId,
      old_role: "provider" as any,
    });

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
      provider_id: userId,
      amount: Number(amount),
      reason: "settlement",
    });

    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم تسجيل التسوية" });
      fetchProviders();
    }
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">مقدمو الخدمة ({providers.length})</h2>

      {providers.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">لا يوجد مقدمو خدمة مسجلون بعد</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {providers.map((p) => {
            const status = STATUS_BADGES[p.provider_status] || STATUS_BADGES.pending;
            return (
              <Card key={p.user_id}>
                <CardContent className="py-4 px-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{p.full_name || "بدون اسم"}</p>
                      <p className="text-xs text-muted-foreground">{p.phone} · {p.city || "—"}</p>
                    </div>
                    <Badge className={status.className}>{status.label}</Badge>
                  </div>

                  {p.hasProviderRole && (
                    <div className="flex items-center gap-1 mt-2 text-xs">
                      <Wallet className="h-3 w-3" />
                      <span>الرصيد: <strong className={p.balance < 0 ? "text-destructive" : "text-success"}>{p.balance} د.أ</strong></span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3">
                    {p.provider_status === "pending" && (
                      <Button size="sm" variant="default" className="gap-1 h-7 text-xs" onClick={() => approveProvider(p.user_id)}>
                        <CheckCircle className="h-3 w-3" />
                        موافقة
                      </Button>
                    )}
                    {p.provider_status === "approved" && (
                      <>
                        <Button size="sm" variant="destructive" className="gap-1 h-7 text-xs" onClick={() => suspendProvider(p.user_id)}>
                          <XCircle className="h-3 w-3" />
                          إيقاف
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" onClick={() => recordSettlement(p.user_id)}>
                          <Wallet className="h-3 w-3" />
                          تسوية
                        </Button>
                      </>
                    )}
                    {p.provider_status === "suspended" && (
                      <Button size="sm" variant="default" className="gap-1 h-7 text-xs" onClick={() => approveProvider(p.user_id)}>
                        <CheckCircle className="h-3 w-3" />
                        إعادة تفعيل
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProvidersTab;
