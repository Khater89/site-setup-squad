import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight } from "lucide-react";
import mfnLogo from "@/assets/mfn-logo.png";

const AuthPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, isProvider, loading: authLoading, rolesLoaded } = useAuth();
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in and roles are loaded
  useEffect(() => {
    if (!authLoading && user && rolesLoaded) {
      if (isAdmin) {
        navigate("/admin", { replace: true });
      } else if (isProvider) {
        navigate("/provider", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [user, isAdmin, isProvider, authLoading, rolesLoaded, navigate]);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });
    setLoading(false);
    if (error) {
      toast({ title: "خطأ في تسجيل الدخول", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم تسجيل الدخول بنجاح" });
      // useEffect will handle redirect based on role
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword.length < 6) {
      toast({ title: "خطأ", description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: signupEmail.trim(),
      password: signupPassword,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: signupName.trim() },
      },
    });
    
    if (error) {
      toast({ title: "خطأ في التسجيل", description: error.message, variant: "destructive" });
    } else {
      // Assign customer role
      if (signUpData.user) {
        await supabase.from("user_roles").insert({ user_id: signUpData.user.id, role: "customer" as const });
      }
      toast({ title: "تم التسجيل بنجاح!", description: "تحقق من بريدك الإلكتروني لتأكيد الحساب" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <img src={mfnLogo} alt="MFN" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Medical Field Nation</h1>
          <p className="text-sm text-muted-foreground mt-1">خدمات طبية ميدانية احترافية</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-center">الدخول إلى حسابك</CardTitle>
            <CardDescription className="text-center">سجل دخولك أو أنشئ حساباً جديداً</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
                <TabsTrigger value="signup">حساب جديد</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="البريد الإلكتروني"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    dir="ltr"
                  />
                  <Input
                    type="password"
                    placeholder="كلمة المرور"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    dir="ltr"
                  />
                  <Button type="submit" className="w-full gap-2" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    تسجيل الدخول
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <Input
                    placeholder="الاسم الكامل"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                  />
                  <Input
                    type="email"
                    placeholder="البريد الإلكتروني"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    dir="ltr"
                  />
                  <Input
                    type="password"
                    placeholder="كلمة المرور (6 أحرف على الأقل)"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={6}
                    dir="ltr"
                  />
                  <Button type="submit" className="w-full gap-2" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    إنشاء حساب (مستخدم)
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    هل أنت مقدم خدمة طبية؟{" "}
                    <Link to="/provider/register" className="text-primary hover:underline font-medium">
                      سجّل كمقدم خدمة
                    </Link>
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center space-y-2">
          <Link to="/" className="text-sm text-primary hover:underline">
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
