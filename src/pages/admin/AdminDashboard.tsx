import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Package, CalendarCheck, Users, Settings, LogOut } from "lucide-react";
import mfnLogo from "@/assets/mfn-logo.png";
import ServicesTab from "@/components/admin/ServicesTab";
import BookingsTab from "@/components/admin/BookingsTab";
import ProvidersTab from "@/components/admin/ProvidersTab";
import SettingsTab from "@/components/admin/SettingsTab";

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={mfnLogo} alt="MFN" className="h-8" />
            <div>
              <h1 className="text-sm font-bold text-foreground">لوحة الإدارة</h1>
              <p className="text-[10px] text-muted-foreground">{user?.email}</p>
            </div>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5">
            <LogOut className="h-4 w-4" />
            خروج
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container py-6 px-4">
        <Tabs defaultValue="services" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="services" className="flex flex-col gap-1 py-2 text-xs">
              <Package className="h-4 w-4" />
              الخدمات
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex flex-col gap-1 py-2 text-xs">
              <CalendarCheck className="h-4 w-4" />
              الحجوزات
            </TabsTrigger>
            <TabsTrigger value="providers" className="flex flex-col gap-1 py-2 text-xs">
              <Users className="h-4 w-4" />
              مقدمو الخدمة
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex flex-col gap-1 py-2 text-xs">
              <Settings className="h-4 w-4" />
              الإعدادات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services">
            <ServicesTab />
          </TabsContent>
          <TabsContent value="bookings">
            <BookingsTab />
          </TabsContent>
          <TabsContent value="providers">
            <ProvidersTab />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
