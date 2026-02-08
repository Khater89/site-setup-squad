import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, CheckCircle, Clock, XCircle, ArrowRight } from "lucide-react";
import mfnLogo from "@/assets/mfn-logo.png";

const ROLE_TYPES = [
  { value: "doctor", label: "طبيب" },
  { value: "nurse", label: "ممرض/ممرضة" },
  { value: "caregiver", label: "مقدم رعاية" },
  { value: "physiotherapist", label: "أخصائي علاج طبيعي" },
];

const ProviderRegister = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading: authLoading, isProvider, refreshUserData } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [roleType, setRoleType] = useState("");
  const [licenseId, setLicenseId] = useState("");
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"register" | "login">("register");

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      setPhone(profile.phone || "");
      setCity(profile.city || "");
      setDob(profile.date_of_birth || "");
      setRoleType(profile.role_type || "");
    }
  }, [profile]);

  // Redirect approved + profile-completed providers to dashboard
  useEffect(() => {
    if (isProvider && profile?.provider_status === "approved" && profile?.profile_completed) {
      navigate("/provider");
    }
  }, [isProvider, profile, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ---- Already logged in ----
  if (user) {
    // If provider has submitted details, show status
    if (profile?.phone && profile?.city && profile?.role_type) {
      const st = (profile.provider_status || "pending") as "pending" | "approved" | "suspended";
      const statusConfig = {
        pending: { icon: <Clock className="h-6 w-6 text-warning" />, message: "طلبك قيد المراجعة. سيتم إشعارك عند الموافقة." },
        approved: { icon: <CheckCircle className="h-6 w-6 text-success" />, message: profile.profile_completed ? "تمت الموافقة! يمكنك الوصول للوحة التحكم." : "تمت الموافقة! أكمل ملفك الشخصي للبدء." },
        suspended: { icon: <XCircle className="h-6 w-6 text-destructive" />, message: "تم إيقاف حسابك. تواصل مع الإدارة." },
      };
      const config = statusConfig[st] || statusConfig.pending;

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <img src={mfnLogo} alt="MFN" className="h-10 mx-auto mb-3" />
              <div className="mx-auto mb-2">{config.icon}</div>
              <CardTitle>حالة طلبك</CardTitle>
              <CardDescription>{config.message}</CardDescription>
            </CardHeader>
            {st === "approved" && !profile.profile_completed && (
              <CardFooter className="justify-center">
                <Link to="/provider/onboarding">
                  <Button>إكمال الملف الشخصي</Button>
                </Link>
              </CardFooter>
            )}
            {st === "approved" && profile.profile_completed && (
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

    // Show application form (logged in, needs to fill details)
    const handleApplicationSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || !phone.trim() || !city.trim() || !dob || !roleType) {
        toast({ title: "أكمل جميع البيانات الإلزامية", variant: "destructive" });
        return;
      }

      setSaving(true);
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: name.trim(),
          phone: phone.trim(),
          city: city.trim(),
          date_of_birth: dob,
          role_type: roleType,
          license_id: licenseId.trim() || null,
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

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <img src={mfnLogo} alt="MFN" className="h-10 mx-auto mb-3" />
            <h1 className="text-xl font-bold">أكمل بيانات الانضمام</h1>
            <p className="text-sm text-muted-foreground mt-1">أكمل بياناتك للانضمام لفريقنا الطبي</p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleApplicationSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">الاسم الكامل *</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم الثلاثي" required />
                </div>
                <div>
                  <label className="text-sm font-medium">رقم الهاتف *</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" required dir="ltr" />
                </div>
                <div>
                  <label className="text-sm font-medium">تاريخ الميلاد *</label>
                  <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required dir="ltr" />
                </div>
                <div>
                  <label className="text-sm font-medium">التخصص *</label>
                  <Select value={roleType} onValueChange={setRoleType}>
                    <SelectTrigger><SelectValue placeholder="اختر تخصصك" /></SelectTrigger>
                    <SelectContent>
                      {ROLE_TYPES.map((rt) => (
                        <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">المدينة *</label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="مثال: عمان" required />
                </div>
                <div>
                  <label className="text-sm font-medium">رقم الرخصة المهنية (اختياري)</label>
                  <Input value={licenseId} onChange={(e) => setLicenseId(e.target.value)} placeholder="إن وُجد" dir="ltr" />
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
  }

  // ---- Not logged in: Registration / Login ----
  const handleDirectRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !city.trim() || !email.trim() || !password.trim() || !dob || !roleType) {
      toast({ title: "أكمل جميع البيانات الإلزامية", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "خطأ", description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
      return;
    }

    setSaving(true);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name.trim() },
      },
    });

    if (signUpError) {
      toast({ title: "خطأ في التسجيل", description: signUpError.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    const newUser = signUpData.user;
    if (!newUser) {
      toast({ title: "تحقق من بريدك الإلكتروني لتأكيد الحساب", description: "بعد التأكيد، عد لهذه الصفحة لإكمال التسجيل." });
      setSaving(false);
      return;
    }

    // Update profile with provider details
    await supabase
      .from("profiles")
      .update({
        full_name: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
        date_of_birth: dob,
        role_type: roleType,
        license_id: licenseId.trim() || null,
        provider_status: "pending",
      })
      .eq("user_id", newUser.id);

    // Add provider role
    await supabase.from("user_roles").insert({ user_id: newUser.id, role: "provider" as const });

    await refreshUserData();
    setSaving(false);
    toast({ title: "تم التسجيل بنجاح! ✅", description: "طلبك قيد المراجعة من الإدارة." });
  };

  const handleProviderLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({ title: "أدخل البريد وكلمة المرور", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    setSaving(false);
    if (error) {
      toast({ title: "خطأ في تسجيل الدخول", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم تسجيل الدخول بنجاح" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <img src={mfnLogo} alt="MFN" className="h-10 mx-auto mb-3" />
          <h1 className="text-xl font-bold">
            {mode === "register" ? "التسجيل كمقدم خدمة" : "دخول مقدم الخدمة"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "register" ? "أنشئ حسابك مباشرة وانضم لفريقنا الطبي" : "سجّل دخولك للوصول للوحة التحكم"}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {mode === "register" ? (
              <form onSubmit={handleDirectRegister} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">الاسم الكامل *</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم الثلاثي" required />
                </div>
                <div>
                  <label className="text-sm font-medium">البريد الإلكتروني *</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" required dir="ltr" />
                </div>
                <div>
                  <label className="text-sm font-medium">كلمة المرور *</label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6 أحرف على الأقل" required minLength={6} dir="ltr" />
                </div>
                <div>
                  <label className="text-sm font-medium">رقم الهاتف *</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" required dir="ltr" />
                </div>
                <div>
                  <label className="text-sm font-medium">تاريخ الميلاد *</label>
                  <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required dir="ltr" />
                </div>
                <div>
                  <label className="text-sm font-medium">التخصص *</label>
                  <Select value={roleType} onValueChange={setRoleType}>
                    <SelectTrigger><SelectValue placeholder="اختر تخصصك" /></SelectTrigger>
                    <SelectContent>
                      {ROLE_TYPES.map((rt) => (
                        <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">المدينة *</label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="مثال: عمان" required />
                </div>
                <div>
                  <label className="text-sm font-medium">رقم الرخصة المهنية (اختياري)</label>
                  <Input value={licenseId} onChange={(e) => setLicenseId(e.target.value)} placeholder="إن وُجد" dir="ltr" />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  إنشاء حساب مقدم خدمة
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  لديك حساب بالفعل؟{" "}
                  <button type="button" onClick={() => setMode("login")} className="text-primary hover:underline font-medium">
                    تسجيل الدخول
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleProviderLogin} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">البريد الإلكتروني</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" required dir="ltr" />
                </div>
                <div>
                  <label className="text-sm font-medium">كلمة المرور</label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" required dir="ltr" />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  تسجيل الدخول
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  ليس لديك حساب؟{" "}
                  <button type="button" onClick={() => setMode("register")} className="text-primary hover:underline font-medium">
                    إنشاء حساب جديد
                  </button>
                </p>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="text-center space-y-2">
          <Link to="/" className="text-sm text-primary hover:underline">العودة للصفحة الرئيسية</Link>
          <p className="text-xs text-muted-foreground">
            هل أنت عميل؟{" "}
            <Link to="/auth" className="text-primary hover:underline font-medium">
              سجّل دخول كعميل
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProviderRegister;
