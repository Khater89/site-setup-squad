import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, User, Clock, Star, CheckCheck, XCircle, ArrowUpDown, Phone, MessageCircle, UserCheck, ChevronDown, ChevronUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface Quote {
  id: string;
  provider_id: string;
  quoted_price: number;
  note: string | null;
  status: string;
  created_at: string;
  provider_name?: string;
  provider_phone?: string;
  provider_number?: number | null;
  provider_city?: string | null;
  provider_specialties?: string[] | null;
  provider_experience_years?: number | null;
  provider_role_type?: string | null;
  provider_avatar_url?: string | null;
}

interface ProviderStats {
  completed: number;
  cancelled: number;
  avgRating: number | null;
  ratingCount: number;
}

type SortMode = "price" | "rating";

interface Props {
  bookingId: string;
  onSelectQuote?: (providerId: string, quotedPrice: number) => void;
  onDirectAssign?: (providerId: string, providerName: string, quotedPrice: number) => void;
}

const ProviderQuotesSection = ({ bookingId, onSelectQuote, onDirectAssign }: Props) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerStats, setProviderStats] = useState<Record<string, ProviderStats>>({});
  const [sortMode, setSortMode] = useState<SortMode>("price");
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("provider_quotes" as any)
        .select("*")
        .eq("booking_id", bookingId)
        .order("quoted_price", { ascending: true });

      if (data && data.length > 0) {
        const providerIds = (data as any[]).map((q: any) => q.provider_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, phone, provider_number, city, specialties, experience_years, role_type, avatar_url")
          .in("user_id", providerIds);

        const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
        const enriched = (data as any[]).map((q: any) => {
          const profile = profileMap.get(q.provider_id);
          return {
            ...q,
            provider_name: profile?.full_name || "غير معروف",
            provider_phone: profile?.phone || null,
            provider_number: profile?.provider_number || null,
            provider_city: profile?.city || null,
            provider_specialties: profile?.specialties || null,
            provider_experience_years: profile?.experience_years || null,
            provider_role_type: profile?.role_type || null,
            provider_avatar_url: profile?.avatar_url || null,
          };
        });
        setQuotes(enriched);

        // Fetch stats for these providers
        const [bookingsRes, ratingsRes, clientCancelRes] = await Promise.all([
          supabase.from("bookings").select("id, assigned_provider_id, status")
            .in("assigned_provider_id", providerIds)
            .in("status", ["COMPLETED", "CANCELLED", "REJECTED"]),
          supabase.from("provider_ratings" as any).select("provider_id, rating")
            .in("provider_id", providerIds),
          supabase.from("booking_history").select("booking_id")
            .eq("action", "CANCELLED").eq("performer_role", "customer"),
        ]);

        const clientCancelledIds = new Set((clientCancelRes.data || []).map((h: any) => h.booking_id));

        const statsMap: Record<string, ProviderStats> = {};
        (bookingsRes.data || []).forEach((b: any) => {
          const pid = b.assigned_provider_id;
          if (!pid) return;
          if (!statsMap[pid]) statsMap[pid] = { completed: 0, cancelled: 0, avgRating: null, ratingCount: 0 };
          if (b.status === "COMPLETED") statsMap[pid].completed++;
          else if (!clientCancelledIds.has(b.id)) statsMap[pid].cancelled++;
        });
        (ratingsRes.data || []).forEach((r: any) => {
          const pid = r.provider_id;
          if (!statsMap[pid]) statsMap[pid] = { completed: 0, cancelled: 0, avgRating: null, ratingCount: 0 };
          statsMap[pid].ratingCount++;
          statsMap[pid].avgRating = statsMap[pid].avgRating
            ? (statsMap[pid].avgRating! * (statsMap[pid].ratingCount - 1) + r.rating) / statsMap[pid].ratingCount
            : r.rating;
        });
        setProviderStats(statsMap);
      } else {
        setQuotes([]);
      }
      setLoading(false);
    };
    fetch();
  }, [bookingId]);

  const sortedQuotes = useMemo(() => {
    return [...quotes].sort((a, b) => {
      if (sortMode === "price") return a.quoted_price - b.quoted_price;
      const rA = providerStats[a.provider_id]?.avgRating ?? 0;
      const rB = providerStats[b.provider_id]?.avgRating ?? 0;
      return rB - rA; // highest rating first
    });
  }, [quotes, sortMode, providerStats]);

  if (loading) return null;
  if (quotes.length === 0) return null;

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1">
          <DollarSign className="h-3 w-3" /> عروض الأسعار ({quotes.length})
        </h4>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={sortMode === "price" ? "default" : "outline"}
            className="h-5 text-[9px] px-2 gap-0.5"
            onClick={() => setSortMode("price")}
          >
            <ArrowUpDown className="h-2.5 w-2.5" /> السعر
          </Button>
          <Button
            size="sm"
            variant={sortMode === "rating" ? "default" : "outline"}
            className="h-5 text-[9px] px-2 gap-0.5"
            onClick={() => setSortMode("rating")}
          >
            <Star className="h-2.5 w-2.5" /> التقييم
          </Button>
        </div>
      </div>
      {sortedQuotes.map((q) => {
        const stats = providerStats[q.provider_id];
        const isExpanded = expandedQuoteId === q.id;
        return (
          <div
            key={q.id}
            className="rounded-lg border border-border bg-background text-sm space-y-0 overflow-hidden"
          >
            {/* Quote header - clickable to expand */}
            <div
              className="p-2.5 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setExpandedQuoteId(isExpanded ? null : q.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-xs">{q.provider_name}</p>
                      {q.provider_number && (
                        <Badge variant="outline" className="text-[8px] px-1 py-0 font-mono">
                          #{q.provider_number}
                        </Badge>
                      )}
                    </div>
                    {q.note && <p className="text-[10px] text-muted-foreground">{q.note}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-left">
                    <p className="font-bold text-primary">{q.quoted_price.toFixed(2)} JOD</p>
                    <p className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(q.created_at).toLocaleString("ar-JO", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
              </div>

              {/* Provider stats */}
              <TooltipProvider>
                <div className="flex items-center gap-3 text-[10px] border-t border-border/50 pt-1 mt-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-0.5 text-success">
                        <CheckCheck className="h-2.5 w-2.5" />
                        <span className="font-semibold">{stats?.completed || 0}</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>طلبات مكتملة</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-0.5 text-destructive">
                        <XCircle className="h-2.5 w-2.5" />
                        <span className="font-semibold">{stats?.cancelled || 0}</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>طلبات ملغاة/مرفوضة</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-0.5 text-warning">
                        <Star className="h-2.5 w-2.5 fill-current" />
                        <span className="font-semibold">{stats?.avgRating ? stats.avgRating.toFixed(1) : "—"}</span>
                        {stats?.ratingCount ? <span className="text-muted-foreground">({stats.ratingCount})</span> : null}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>تقييم العملاء</TooltipContent>
                  </Tooltip>
                  <span className="ms-auto text-primary text-[9px] font-medium">اضغط لعرض البروفايل ↓</span>
                </div>
              </TooltipProvider>
            </div>

            {/* Expanded profile + assign */}
            {isExpanded && (
              <div className="border-t border-border bg-muted/20 p-3 space-y-3">
                {/* Provider profile details */}
                <div className="space-y-2">
                  <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">بروفايل المزود</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {q.provider_role_type && (
                      <div>
                        <span className="text-muted-foreground">التخصص:</span>
                        <p className="font-medium">{q.provider_role_type}</p>
                      </div>
                    )}
                    {q.provider_city && (
                      <div>
                        <span className="text-muted-foreground">المدينة:</span>
                        <p className="font-medium">{q.provider_city}</p>
                      </div>
                    )}
                    {q.provider_experience_years != null && (
                      <div>
                        <span className="text-muted-foreground">سنوات الخبرة:</span>
                        <p className="font-medium">{q.provider_experience_years} سنوات</p>
                      </div>
                    )}
                    {q.provider_specialties && q.provider_specialties.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">التخصصات:</span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {q.provider_specialties.map((s, i) => (
                            <Badge key={i} variant="outline" className="text-[9px] px-1.5 py-0">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact buttons */}
                {q.provider_phone && (
                  <div className="flex gap-2">
                    <a href={`tel:${q.provider_phone}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full gap-1 h-7 text-xs">
                        <Phone className="h-3 w-3" /> اتصال {q.provider_number ? `#${q.provider_number}` : ""}
                      </Button>
                    </a>
                    <a href={`https://wa.me/${q.provider_phone.replace(/^0/, "962")}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button size="sm" variant="outline" className="w-full gap-1 h-7 text-xs">
                        <MessageCircle className="h-3 w-3" /> واتساب
                      </Button>
                    </a>
                  </div>
                )}

                {/* Direct assign button */}
                {onDirectAssign && (
                  <Button
                    size="sm"
                    className="w-full gap-1.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDirectAssign(q.provider_id, q.provider_name || "غير معروف", q.quoted_price);
                    }}
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    إسناد الطلب لهذا المزود مباشرة
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProviderQuotesSection;
