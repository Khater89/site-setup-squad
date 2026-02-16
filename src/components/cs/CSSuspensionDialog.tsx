import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";

interface Props {
  providerId: string;
  providerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CSSuspensionDialog = ({ providerId, providerName, open, onOpenChange, onSuccess }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim() || reason.trim().length < 5) {
      toast({ title: "يرجى كتابة سبب لا يقل عن 5 أحرف", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("suspension_requests").insert({
        provider_id: providerId,
        requested_by_id: user!.id,
        reason: reason.trim(),
      });
      if (error) throw error;
      toast({ title: "تم إرسال طلب الإيقاف بنجاح ✅" });
      setReason("");
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>طلب إيقاف مقدم خدمة</DialogTitle>
          <DialogDescription>
            طلب إيقاف: <strong>{providerName}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <label className="text-sm font-medium">سبب الإيقاف</label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="اكتب سبب طلب الإيقاف بالتفصيل..."
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            إلغاء
          </Button>
          <Button
            className="bg-warning text-warning-foreground hover:bg-warning/90"
            onClick={handleSubmit}
            disabled={submitting || reason.trim().length < 5}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "إرسال الطلب"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CSSuspensionDialog;
