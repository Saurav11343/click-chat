import { useEffect, useState } from "react";
import { ArrowLeft, Bell, BellOff, Check, KeyRound, Languages, MessageCircle, Settings2, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { PasswordInput } from "@/components/auth/PasswordInput";
import { AppearanceSettings } from "@/components/profile/AppearanceSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeToggle } from "@/components/ui/ModeToggle";
import { TRANSLATION_LANGUAGES } from "@/lib/languages";
import {
  getPushNotificationState,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from "@/lib/pushNotifications";
import { useAuthStore } from "@/store/useAuthStore";
import { useUserStore } from "@/store/useUserStore";

function Settings() {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.authUser);
  const changePassword = useAuthStore((state) => state.changePassword);
  const isChangingPassword = useAuthStore((state) => state.isChangingPassword);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const isUpdatingProfile = useUserStore((state) => state.isUpdatingProfile);
  const [preferredLanguage, setPreferredLanguage] = useState(authUser?.preferredLanguage || "en");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pushState, setPushState] = useState({ supported: true, permission: "default", subscribed: false });
  const [isUpdatingPush, setIsUpdatingPush] = useState(false);

  useEffect(() => {
    getPushNotificationState().then(setPushState).catch(() => {
      setPushState({ supported: false, permission: "unsupported", subscribed: false });
    });
  }, []);

  const handleLanguageSave = async () => updateProfile({ preferredLanguage });

  const handlePushToggle = async () => {
    setIsUpdatingPush(true);
    try {
      if (pushState.subscribed) {
        await unsubscribeFromPushNotifications();
        toast.success("Push notifications disabled on this browser.");
      } else {
        await subscribeToPushNotifications();
        toast.success("Push notifications enabled on this browser.");
      }
      setPushState(await getPushNotificationState());
    } catch (error) {
      toast.error(error.message || "Unable to update push notifications.");
      setPushState(await getPushNotificationState());
    } finally {
      setIsUpdatingPush(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    const changed = await changePassword({ currentPassword, newPassword, confirmPassword });
    if (changed) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="min-h-full bg-muted/30">
      <header className="border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-17 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/chat" className="flex items-center gap-2.5" aria-label="Back to ClickChat">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"><MessageCircle className="size-5" /></span>
            <span className="text-lg font-semibold tracking-tight">ClickChat</span>
          </Link>
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" className="rounded-xl" onClick={() => navigate("/chat")}><ArrowLeft className="size-4" /><span className="hidden sm:inline">Back to chats</span></Button>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-7">
          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Settings2 className="size-4" /> SETTINGS</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Preferences and security</h1>
          <p className="mt-2 text-muted-foreground">Control how ClickChat looks, communicates, and protects your account.</p>
        </div>

        <AppearanceSettings />

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl py-6">
            <CardHeader><SettingTitle icon={Languages} title="Language" description="Choose the target language used for message translation." /></CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row">
              <select value={preferredLanguage} onChange={(event) => setPreferredLanguage(event.target.value)} className="h-10 min-w-0 flex-1 rounded-xl border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" aria-label="Preferred translation language" disabled={isUpdatingProfile}>
                {TRANSLATION_LANGUAGES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
              </select>
              <Button type="button" onClick={handleLanguageSave} disabled={isUpdatingProfile || preferredLanguage === (authUser?.preferredLanguage || "en")}><Check className="size-4" />{isUpdatingProfile ? "Saving..." : "Save"}</Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl py-6">
            <CardHeader><SettingTitle icon={pushState.subscribed ? Bell : BellOff} title="Browser notifications" description="Receive alerts while ClickChat is in the background." /></CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 rounded-2xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-sm font-medium">{getPushLabel(pushState)}</p><p className="mt-1 text-xs text-muted-foreground">Applies only to this browser and device.</p></div>
                <Button type="button" variant={pushState.subscribed ? "outline" : "default"} onClick={handlePushToggle} disabled={isUpdatingPush || !pushState.supported || pushState.permission === "denied"}>{pushState.subscribed ? <BellOff className="size-4" /> : <Bell className="size-4" />}{isUpdatingPush ? "Updating..." : pushState.subscribed ? "Disable" : "Enable"}</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 rounded-2xl py-6">
          <CardHeader><SettingTitle icon={KeyRound} title="Password and security" description="Change the password used to access your account." /></CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <PasswordInput value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Current password" autoComplete="current-password" required />
                <PasswordInput value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password" autoComplete="new-password" minLength={8} maxLength={72} required />
                <PasswordInput value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" autoComplete="new-password" required />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">Use 8–72 characters with uppercase, lowercase, and a number.</p>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => { setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }} disabled={isChangingPassword}><X className="size-4" /> Clear</Button>
                  <Button type="submit" disabled={isChangingPassword || !currentPassword || newPassword.length < 8 || newPassword !== confirmPassword}><Check className="size-4" />{isChangingPassword ? "Changing..." : "Change password"}</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function SettingTitle({ icon: Icon, title, description }) {
  return <div className="flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span><div><CardTitle className="text-xl tracking-tight">{title}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{description}</p></div></div>;
}

function getPushLabel(state) {
  if (!state.supported) return "Not supported by this browser";
  if (state.permission === "denied") return "Blocked in browser settings";
  return state.subscribed ? "Notifications are enabled" : "Notifications are disabled";
}

export default Settings;
