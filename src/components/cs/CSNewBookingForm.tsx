import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Loader2 } from "lucide-react";

interface ServiceRow {
  id: string;
  name: string;
  category: string;
  base_price: number;
  active: boolean;
}

const CSNewBookingForm = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    city: "",
    client_address_text: "",
    client_lat: "",
    client_lng: "",
    service_id: "",
    scheduled_at: "",
    notes: "",
  });

  useEffect(() => {
    supabase.from("services").select("*").order("name").then(({ data }) => {
      setServices((data as unknown as ServiceRow[]) || []);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { customer_name, customer_phone, city, service_id, scheduled_at } = form;
    if (!customer_name.trim() || !customer_phone.trim() || !city.trim() || !service_id || !scheduled_at) {
      toast({ title: "أكمل جميع البيانات الإلزامية", variant: "destructive" });
      return;
    }

    const service = services.find((s) => s.id === service_id);
    if (!service) return;

    setCreating(true);
    const { error } = await supabase.from("bookings").insert({
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      city: city.trim(),
      client_address_text: form.client_address_text.trim() || null,
      client_lat: form.client_lat ? parseFloat(form.client_lat) : null,
      client_lng: form.client_lng ? parseFloat(form.client_lng) : null,
      service_id,
      scheduled_at: new Date(scheduled_at).toISOString(),
      notes: form.notes.trim() || null,
      subtotal: service.base_price,
      payment_method: "CASH",
      status: "NEW",
      customer_user_id: null,
    } as any);

    setCreating(false);
    if (error) {
      toast({ title: "خطأ في إنشاء الحجز", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم إنشاء الحجز بنجاح ✅" });
      setForm({
        customer_name: "", customer_phone: "", city: "",
        client_address_text: "", client_lat: "", client_lng: "",
        service_id: "", scheduled_at: "", notes: "",
      });
    }
  };

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">إنشاء حجز هاتفي</CardTitle>
        <CardDescription>أنشئ حجزاً نيابة عن العميل عبر الهاتف</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">اسم العميل *</label>
              <Input value={form.customer_name} onChange={(e) => update("customer_name", e.target.value)} placeholder="الاسم الكامل" required />
            </div>
            <div>
              <label className="text-sm font-medium">رقم الهاتف *</label>
              <Input value={form.customer_phone} onChange={(e) => update("customer_phone", e.target.value)} placeholder="07XXXXXXXX" required dir="ltr" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">المدينة *</label>
              <Input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="مثال: عمان" required />
            </div>
            <div>
              <label className="text-sm font-medium">الخدمة *</label>
              <Select value={form.service_id} onValueChange={(v) => update("service_id", v)}>
                <SelectTrigger><SelectValue placeholder="اختر خدمة" /></SelectTrigger>
                <SelectContent>
                  {services.filter((s) => s.active).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} — {s.base_price} د.أ</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">العنوان التفصيلي</label>
            <Input value={form.client_address_text} onChange={(e) => update("client_address_text", e.target.value)} placeholder="الحي، الشارع، رقم المبنى" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">خط العرض (Lat)</label>
              <Input type="number" step="any" value={form.client_lat} onChange={(e) => update("client_lat", e.target.value)} placeholder="31.9539" dir="ltr" />
            </div>
            <div>
              <label className="text-sm font-medium">خط الطول (Lng)</label>
              <Input type="number" step="any" value={form.client_lng} onChange={(e) => update("client_lng", e.target.value)} placeholder="35.9106" dir="ltr" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">موعد الخدمة *</label>
            <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => update("scheduled_at", e.target.value)} required dir="ltr" />
          </div>

          <div>
            <label className="text-sm font-medium">ملاحظات</label>
            <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="تفاصيل إضافية..." rows={3} />
          </div>

          <Button type="submit" className="w-full gap-2" disabled={creating}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            إنشاء الحجز
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CSNewBookingForm;
