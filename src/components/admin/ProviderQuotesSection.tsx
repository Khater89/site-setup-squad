import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { DollarSign, User, Clock } from "lucide-react";

interface Quote {
  id: string;
  provider_id: string;
  quoted_price: number;
  note: string | null;
  status: string;
  created_at: string;
  provider_name?: string;
  provider_phone?: string;
}

interface Props {
  bookingId: string;
}

const ProviderQuotesSection = ({ bookingId }: Props) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("provider_quotes" as any)
        .select("*")
        .eq("booking_id", bookingId)
        .order("quoted_price", { ascending: true });

      if (data && data.length > 0) {
        // Fetch provider names
        const providerIds = (data as any[]).map((q: any) => q.provider_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, phone")
          .in("user_id", providerIds);

        const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
        const enriched = (data as any[]).map((q: any) => ({
          ...q,
          provider_name: profileMap.get(q.provider_id)?.full_name || "غير معروف",
          provider_phone: profileMap.get(q.provider_id)?.phone || null,
        }));
        setQuotes(enriched);
      } else {
        setQuotes([]);
      }
      setLoading(false);
    };
    fetch();
  }, [bookingId]);

  if (loading) return null;
  if (quotes.length === 0) return null;

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
      <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1">
        <DollarSign className="h-3 w-3" /> عروض الأسعار ({quotes.length})
      </h4>
      {quotes.map((q) => (
        <div key={q.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-2 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <p className="font-medium text-xs">{q.provider_name}</p>
              {q.note && <p className="text-[10px] text-muted-foreground">{q.note}</p>}
            </div>
          </div>
          <div className="text-left">
            <p className="font-bold text-primary">{q.quoted_price.toFixed(2)} JOD</p>
            <p className="text-[9px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {new Date(q.created_at).toLocaleString("ar-JO", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProviderQuotesSection;
