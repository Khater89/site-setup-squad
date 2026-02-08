import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, CheckCircle, Clock, XCircle } from "lucide-react";
import mfnLogo from "@/assets/mfn-logo.png";

const ProviderRegister = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading: authLoading, isProvider, refreshUserData } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      setPhone(profile.phone || "");
      setCity(profile.city || "");
    }
  }, [profile]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If provider already approved, redirect to dashboard
  if (isProvider && profile?.provider_status === "approved") {
    navigate("/provider");
    return null;
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src={mfnLogo} alt="MFN" className="h-10 mx-auto mb-3" />
            <CardTitle>التسجيل كمقدم خدمة</CardTitle>
            <CardDescription>يجب تسجيل الدخول أولاً لتقديم طلب الانضمام</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link to="/auth">
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                تسجيل الدخول / إنشاء حساب
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !city.trim()) {
      toast({ title: "أكمل جميع البيانات", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
        provider_status: "pending",
      })
      .eq("user_id", user.id);

    setSaving(false);

    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      await refreshUserData();
      toast({ title: "تم إرسال طلبك بنجاح! سيتم مراجعته من قبل الإدارة." });
    }
  };

  const statusIcon = {
    pending: <Clock className="h-6 w-6 text-warning" />,
    approved: <CheckCircle className="h-6 w-6 text-success" />,
    suspended: <XCircle className="h-6 w-6 text-destructive" />,
  };

  const statusMessage = {
    pending: "طلبك قيد المراجعة. سيتم إشعارك عند الموافقة.",
    approved: "تمت الموافقة على طلبك! يمكنك الوصول للوحة التحكم.",
    suspended: "تم إيقاف حسابك. تواصل مع الإدارة.",
  };

  // Already submitted (has phone filled)
  if (profile?.phone && profile?.city) {
    const st = profile.provider_status as keyof typeof statusIcon;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-2">{statusIcon[st]}</div>
            <CardTitle>حالة طلبك</CardTitle>
            <CardDescription>{statusMessage[st]}</CardDescription>
          </CardHeader>
          {st === "approved" && (
            <CardFooter className="justify-center">
              <Link to="/provider">
                <Button>الذهاب للوحة التحكم</Button>
              </Link>
            </CardFooter>
          )}
          <CardFooter className="justify-center">
            <Link to="/" className="text-sm text-primary hover:underline">العودة للرئيسية</Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <img src={mfnLogo} alt="MFN" className="h-10 mx-auto mb-3" />
          <h1 className="text-xl font-bold">التسجيل كمقدم خدمة</h1>
          <p className="text-sm text-muted-foreground mt-1">أكمل بياناتك للانضمام لفريقنا الطبي</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">الاسم الكامل *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم الثلاثي" required />
              </div>
              <div>
                <label className="text-sm font-medium">رقم الهاتف *</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" required dir="ltr" />
              </div>
              <div>
                <label className="text-sm font-medium">المدينة *</label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="مثال: عمان" required />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                إرسال طلب الانضمام
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link to="/" className="text-sm text-primary hover:underline">العودة للصفحة الرئيسية</Link>
        </div>
      </div>
    </div>
  );
};

export default ProviderRegister;
