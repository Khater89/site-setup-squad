import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, CheckCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StaffNotification {
  id: string;
  target_role: string;
  title: string;
  body: string | null;
  booking_id: string | null;
  provider_id: string | null;
  read: boolean;
  created_at: string;
}

const NotificationBell = () => {
  const { t, formatDateShort } = useLanguage();
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("staff_notifications" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifications((data as unknown as StaffNotification[]) || []);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = async (id: string) => {
    await supabase.from("staff_notifications" as any).update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("staff_notifications" as any).update({ read: true }).in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <h4 className="text-sm font-bold">{t("notifications.title")}</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-6" onClick={markAllRead}>
              <CheckCircle className="h-3 w-3 me-1" /> {t("notifications.mark_read")}
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[300px]">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t("notifications.no_notifications")}</p>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-3 py-2.5 cursor-pointer hover:bg-accent/50 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                  onClick={() => markRead(n.id)}
                >
                  <p className="text-xs font-medium">{n.title}</p>
                  {n.body && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">{formatDateShort(n.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
