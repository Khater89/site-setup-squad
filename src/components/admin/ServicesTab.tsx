import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Service = Tables<"services">;

const ServicesTab = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({ name: "", city: "", base_price: "" });
  const [saving, setSaving] = useState(false);

  const fetchServices = async () => {
    const { data } = await supabase.from("services").select("*").order("created_at", { ascending: false });
    setServices(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchServices(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", city: "", base_price: "" });
    setDialogOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({ name: s.name, city: s.city || "", base_price: String(s.base_price) });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.base_price) {
      toast({ title: "أكمل البيانات المطلوبة", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      city: form.city.trim() || null,
      base_price: parseFloat(form.base_price),
    };

    if (editing) {
      const { error } = await supabase.from("services").update(payload).eq("id", editing.id);
      if (error) {
        toast({ title: "خطأ في التحديث", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "تم تحديث الخدمة" });
      }
    } else {
      const { error } = await supabase.from("services").insert(payload);
      if (error) {
        toast({ title: "خطأ في الإضافة", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "تمت إضافة الخدمة" });
      }
    }
    setSaving(false);
    setDialogOpen(false);
    fetchServices();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الخدمة؟")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) {
      toast({ title: "خطأ في الحذف", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم حذف الخدمة" });
      fetchServices();
    }
  };

  const toggleActive = async (s: Service) => {
    await supabase.from("services").update({ active: !s.active }).eq("id", s.id);
    fetchServices();
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">إدارة الخدمات ({services.length})</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5" onClick={openAdd}>
              <Plus className="h-4 w-4" />
              إضافة خدمة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "تعديل خدمة" : "إضافة خدمة جديدة"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium">اسم الخدمة *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: طب عام وتشخيص" />
              </div>
              <div>
                <label className="text-sm font-medium">المدينة (اختياري)</label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="مثال: عمان" />
              </div>
              <div>
                <label className="text-sm font-medium">السعر الأساسي (د.أ) *</label>
                <Input type="number" min="0" step="0.5" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} placeholder="50" dir="ltr" />
              </div>
              <Button onClick={handleSave} className="w-full" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editing ? "حفظ التعديلات" : "إضافة"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {services.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">لا توجد خدمات. أضف خدمة جديدة للبدء.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {services.map((s) => (
            <Card key={s.id} className={!s.active ? "opacity-60" : ""}>
              <CardContent className="flex items-center justify-between py-4 px-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.city || "جميع المدن"} · {s.base_price} د.أ
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={s.active} onCheckedChange={() => toggleActive(s)} />
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServicesTab;
