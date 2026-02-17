import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Loader2, Search, TrendingUp, AlertTriangle, Wallet, DollarSign,
  ArrowDownCircle, ArrowUpCircle, CalendarDays,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProviderDebt {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  role_type: string | null;
  balance: number;
}

interface LedgerEntry {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
  booking_id: string | null;
  booking_number?: string | null;
}

const FinanceTab = () => {
  const { t, formatCurrency, formatDateShort, isRTL } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<ProviderDebt[]>([]);
  const [search, setSearch] = useState("");
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);

  // Detail drawer
  const [selectedProvider, setSelectedProvider] = useState<ProviderDebt | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);

    // Get all providers (exclude anyone who also has admin or cs role)
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "provider");
    const providerIds = (roles || []).map((r) => r.user_id);
    if (providerIds.length === 0) { setLoading(false); return; }

    // Filter out admin/cs users
    const { data: staffRoles } = await supabase.from("user_roles").select("user_id").in("role", ["admin", "cs"]);
    const staffIds = new Set((staffRoles || []).map((r) => r.user_id));
    const pureProviderIds = providerIds.filter((id) => !staffIds.has(id));
    if (pureProviderIds.length === 0) { setLoading(false); return; }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, phone, city, role_type")
      .in("user_id", pureProviderIds);

    // Get balances
    const enriched: ProviderDebt[] = [];
    let debt = 0;
    for (const p of (profiles || [])) {
      const { data: bal } = await supabase.rpc("get_provider_balance", { _provider_id: p.user_id });
      const balance = bal || 0;
      enriched.push({ ...p, balance });
      if (balance < 0) debt += Math.abs(balance);
    }
    enriched.sort((a, b) => a.balance - b.balance);
    setProviders(enriched);
    setTotalDebt(debt);

    // Today's earnings (completed bookings today)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: completedToday } = await supabase
      .from("bookings")
      .select("agreed_price, provider_share, actual_duration_minutes")
      .eq("status", "COMPLETED")
      .gte("completed_at", todayStart.toISOString());

    let earnings = 0;
    for (const b of (completedToday || [])) {
      if (b.agreed_price != null && b.provider_share != null && b.actual_duration_minutes != null) {
        const hours = Math.max(1, Math.ceil(b.actual_duration_minutes / 60));
        const clientTotal = b.agreed_price + (b.agreed_price * 0.5 * Math.max(0, hours - 1));
        const providerTotal = b.provider_share + (b.provider_share * 0.5 * Math.max(0, hours - 1));
        earnings += (clientTotal - providerTotal);
      }
    }
    setTodayEarnings(earnings);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openProviderLedger = async (provider: ProviderDebt) => {
    setSelectedProvider(provider);
    setLedgerLoading(true);

    const { data: entries } = await supabase
      .from("provider_wallet_ledger")
      .select("*")
      .eq("provider_id", provider.user_id)
      .order("created_at", { ascending: false });

    // Enrich with booking numbers
    const bookingIds = (entries || []).filter((e) => e.booking_id).map((e) => e.booking_id!);
    let bookingMap: Record<string, string> = {};
    if (bookingIds.length > 0) {
      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, booking_number")
        .in("id", bookingIds);
      for (const b of (bookings || [])) {
        bookingMap[b.id] = b.booking_number || b.id.slice(0, 8);
      }
    }

    setLedger((entries || []).map((e) => ({
      ...e,
      booking_number: e.booking_id ? bookingMap[e.booking_id] || null : null,
    })));
    setLedgerLoading(false);
  };

  const recordSettlement = async () => {
    if (!selectedProvider) return;
    const amount = prompt(t("provider.details.settlement_prompt"));
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    const { error } = await supabase.from("provider_wallet_ledger").insert({
      provider_id: selectedProvider.user_id, amount: Number(amount), reason: "settlement",
    });
    if (error) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("provider.details.settlement_success") });
      openProviderLedger(selectedProvider);
      fetchData();
    }
  };

  const filtered = providers.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (p.full_name || "").toLowerCase().includes(q)
      || (p.phone || "").includes(q)
      || (p.city || "").toLowerCase().includes(q);
  });

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-success/30 bg-success/5">
          <CardContent className="py-4 px-5">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-success" />
              <div>
                <p className="text-xs text-muted-foreground">{t("finance.today_earnings")}</p>
                <p className="text-xl font-bold text-success">{formatCurrency(todayEarnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4 px-5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-xs text-muted-foreground">{t("finance.total_debt")}</p>
                <p className="text-xl font-bold text-destructive">{formatCurrency(totalDebt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4 px-5">
            <div className="flex items-center gap-3">
              <Wallet className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{t("finance.providers_with_debt")}</p>
                <p className="text-xl font-bold text-primary">{providers.filter((p) => p.balance < 0).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold">{t("finance.title")}</h2>
        <div className="relative ms-auto">
          <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
          <Input
            placeholder={t("admin.providers.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${isRTL ? "pr-9" : "pl-9"} w-[200px]`}
          />
        </div>
      </div>

      {/* Provider Debt Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>{t("admin.providers.col.name")}</TableHead>
              <TableHead>{t("admin.providers.col.phone")}</TableHead>
              <TableHead>{t("admin.providers.col.city")}</TableHead>
              <TableHead>{t("admin.providers.col.type")}</TableHead>
              <TableHead>{t("finance.debt_amount")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow
                key={p.user_id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => openProviderLedger(p)}
              >
                <TableCell className="font-medium text-sm">{p.full_name || "—"}</TableCell>
                <TableCell className="text-xs" dir="ltr">{p.phone || "—"}</TableCell>
                <TableCell className="text-sm">{p.city || "—"}</TableCell>
                <TableCell className="text-xs">
                  {t(`role_type.${p.role_type || ""}`) !== `role_type.${p.role_type || ""}` ? t(`role_type.${p.role_type}`) : p.role_type || "—"}
                </TableCell>
                <TableCell>
                  <span className={`text-sm font-bold ${p.balance < 0 ? "text-destructive" : p.balance > 0 ? "text-success" : "text-muted-foreground"}`}>
                    {formatCurrency(p.balance)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Provider Ledger Drawer */}
      <Sheet open={!!selectedProvider} onOpenChange={(open) => { if (!open) setSelectedProvider(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle>{selectedProvider?.full_name || "—"}</SheetTitle>
            <SheetDescription>{t("finance.ledger_title")}</SheetDescription>
          </SheetHeader>

          {selectedProvider && (
            <div className="space-y-4">
              {/* Balance summary */}
              <Card className={`border ${(selectedProvider.balance < 0) ? "border-destructive/30 bg-destructive/5" : "border-success/30 bg-success/5"}`}>
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <span className="text-sm font-medium">{t("finance.current_balance")}</span>
                  <span className={`text-lg font-bold ${selectedProvider.balance < 0 ? "text-destructive" : "text-success"}`}>
                    {formatCurrency(selectedProvider.balance)}
                  </span>
                </CardContent>
              </Card>

              {/* Settlement button */}
              <Button variant="outline" className="w-full gap-1.5" onClick={recordSettlement}>
                <DollarSign className="h-4 w-4" /> {t("provider.details.settlement")}
              </Button>

              {/* Ledger entries */}
              {ledgerLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
              ) : ledger.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">{t("provider.wallet.no_transactions")}</p>
              ) : (
                <div className="space-y-2">
                  {ledger.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      {entry.amount < 0 ? (
                        <ArrowDownCircle className="h-5 w-5 text-destructive shrink-0" />
                      ) : (
                        <ArrowUpCircle className="h-5 w-5 text-success shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px]">
                            {entry.reason === "platform_fee" ? t("finance.reason.platform_fee") :
                             entry.reason === "settlement" ? t("provider.wallet.settlement") :
                             entry.reason}
                          </Badge>
                          {entry.booking_number && (
                            <span className="text-[10px] text-muted-foreground" dir="ltr">{entry.booking_number}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          <CalendarDays className="h-3 w-3 inline me-1" />
                          {formatDateShort(entry.created_at)}
                        </p>
                      </div>
                      <span className={`text-sm font-bold ${entry.amount < 0 ? "text-destructive" : "text-success"}`}>
                        {entry.amount > 0 ? "+" : ""}{formatCurrency(entry.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default FinanceTab;
