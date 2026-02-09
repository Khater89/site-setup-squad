import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, Save, Percent, Wallet, AlertTriangle, Phone } from "lucide-react";

const SettingsTab = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    platform_fee_percent: 10,
    deposit_percent: 20,
    provider_debt_limit: -20,
    coordinator_phone: "",
  });

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("platform_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (data) {
      setSettings({
        platform_fee_percent: data.platform_fee_percent,
        deposit_percent: data.deposit_percent,
        provider_debt_limit: data.provider_debt_limit,
        coordinator_phone: (data as any).coordinator_phone || "",
      });
    }
    setLoading(false);
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("platform_settings")
      .update({
        platform_fee_percent: settings.platform_fee_percent,
        deposit_percent: settings.deposit_percent,
        provider_debt_limit: settings.provider_debt_limit,
        coordinator_phone: settings.coordinator_phone.trim() || null,
      } as any)
      .eq("id", 1);

    setSaving(false);
    if (error) {
      toast({ title: t("settings.save_error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("settings.saved") });
    }
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">{t("settings.title")}</h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Percent className="h-5 w-5 text-primary" />
            نسبة عمولة المنصة
          </CardTitle>
          <CardDescription>النسبة المئوية التي تأخذها المنصة من كل حجز</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={settings.platform_fee_percent}
              onChange={(e) => setSettings({ ...settings, platform_fee_percent: parseFloat(e.target.value) || 0 })}
              className="w-24"
              dir="ltr"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-5 w-5 text-primary" />
            نسبة العربون
          </CardTitle>
          <CardDescription>النسبة المئوية المطلوبة كعربون عند الدفع بالعربون</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              max="100"
              step="1"
              value={settings.deposit_percent}
              onChange={(e) => setSettings({ ...settings, deposit_percent: parseFloat(e.target.value) || 0 })}
              className="w-24"
              dir="ltr"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-warning" />
            حد دين مقدم الخدمة
          </CardTitle>
          <CardDescription>الحد الأدنى لرصيد المحفظة قبل منع تعيين حجوزات جديدة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              max="0"
              step="1"
              value={settings.provider_debt_limit}
              onChange={(e) => setSettings({ ...settings, provider_debt_limit: parseFloat(e.target.value) || 0 })}
              className="w-24"
              dir="ltr"
            />
            <span className="text-sm text-muted-foreground">د.أ</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-5 w-5 text-primary" />
            {t("settings.coordinator_phone")}
          </CardTitle>
          <CardDescription>{t("settings.coordinator_phone_desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="tel"
            value={settings.coordinator_phone}
            onChange={(e) => setSettings({ ...settings, coordinator_phone: e.target.value })}
            placeholder="07XXXXXXXX"
            className="w-48"
            dir="ltr"
          />
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="gap-2" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {t("settings.save")}
      </Button>
    </div>
  );
};

export default SettingsTab;
