import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  BellOff,
  CalendarDays,
  Check,
  Clock3,
  KeyRound,
  Languages,
  Mail,
  MessageCircle,
  Pencil,
  Quote,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import ProfilePictureUpload from "@/components/profile/ProfilePictureUpload";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/ui/ModeToggle";
import { useAuthStore } from "@/store/useAuthStore";
import { useUserStore } from "@/store/useUserStore";
import { TRANSLATION_LANGUAGES } from "@/lib/languages";
import {
  getPushNotificationState,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from "@/lib/pushNotifications";

function Profile() {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.authUser);
  const changePassword = useAuthStore((state) => state.changePassword);
  const isChangingPassword = useAuthStore(
    (state) => state.isChangingPassword,
  );
  const updateProfile = useUserStore((state) => state.updateProfile);
  const isUpdatingProfile = useUserStore(
    (state) => state.isUpdatingProfile,
  );
  const [editingName, setEditingName] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [firstName, setFirstName] = useState(authUser?.firstName || "");
  const [lastName, setLastName] = useState(authUser?.lastName || "");
  const [bio, setBio] = useState(authUser?.bio || "");
  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState(
    authUser?.preferredLanguage || "en",
  );
  const [pushState, setPushState] = useState({
    supported: true,
    permission: "default",
    subscribed: false,
  });
  const [isUpdatingPush, setIsUpdatingPush] = useState(false);

  useEffect(() => {
    getPushNotificationState()
      .then(setPushState)
      .catch(() => {
        setPushState({
          supported: false,
          permission: "unsupported",
          subscribed: false,
        });
      });
  }, []);

  const fullName = [authUser?.firstName, authUser?.lastName]
    .filter(Boolean)
    .join(" ");

  const statusLabel = authUser?.isOnline
    ? "Online now"
    : authUser?.lastSeen
      ? `Last seen ${formatDateTime(authUser.lastSeen)}`
      : "Offline";

  const handleNameSave = async (event) => {
    event.preventDefault();

    const saved = await updateProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });

    if (saved) {
      setEditingName(false);
    }
  };

  const handleBioSave = async (event) => {
    event.preventDefault();

    const saved = await updateProfile({ bio: bio.trim() });

    if (saved) {
      setEditingBio(false);
    }
  };

  const cancelNameEdit = () => {
    setFirstName(authUser?.firstName || "");
    setLastName(authUser?.lastName || "");
    setEditingName(false);
  };

  const cancelBioEdit = () => {
    setBio(authUser?.bio || "");
    setEditingBio(false);
  };

  const clearPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setEditingPassword(false);
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();

    const changed = await changePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (changed) {
      clearPasswordForm();
    }
  };

  const handleLanguageSave = async () => {
    await updateProfile({ preferredLanguage });
  };

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

  return (
    <div className="min-h-full bg-muted/30">
      <header className="border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-17 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/chat" className="flex items-center gap-2.5" aria-label="Back to ClickChat">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <MessageCircle className="size-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">ClickChat</span>
          </Link>

          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" className="rounded-xl" onClick={() => navigate("/chat")}>
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Back to chats</span>
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-7">
          <p className="text-sm font-medium text-muted-foreground">ACCOUNT</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Your profile</h1>
          <p className="mt-2 text-muted-foreground">
            Your identity and account details across ClickChat.
          </p>
        </div>

        <Card className="relative overflow-hidden rounded-3xl border-0 py-0 shadow-xl shadow-primary/5 ring-1 ring-foreground/10">
          <div className="relative h-36 overflow-hidden bg-primary sm:h-44">
            <div className="absolute -right-12 -top-24 size-64 rounded-full border border-primary-foreground/10" />
            <div className="absolute -bottom-32 left-1/4 size-72 rounded-full border border-primary-foreground/10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_30%,color-mix(in_oklab,var(--primary-foreground)_12%,transparent),transparent_25%)]" />
          </div>

          <CardContent className="px-5 pb-7 sm:px-8 sm:pb-9">
            <div className="relative -mt-16 flex flex-col items-center sm:-mt-18">
              <ProfilePictureUpload />

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <Badge variant="secondary" className="h-7 gap-1.5 px-3">
                  <span className={`size-2 rounded-full ${authUser?.isOnline ? "bg-emerald-500" : "bg-muted-foreground/50"}`} />
                  {statusLabel}
                </Badge>
                {authUser?.isEmailVerified && (
                  <Badge variant="outline" className="h-7 gap-1.5 px-3">
                    <BadgeCheck className="size-3.5 text-emerald-500" />
                    Verified account
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <Card className="rounded-2xl py-6">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Quote className="size-5" />
                  </div>
                  <CardTitle className="text-xl tracking-tight">About you</CardTitle>
                </div>
                {!editingBio && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-xl"
                    onClick={() => setEditingBio(true)}
                    aria-label="Edit bio"
                  >
                    <Pencil className="size-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingBio ? (
                <form onSubmit={handleBioSave}>
                  <textarea
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    maxLength={150}
                    rows={4}
                    autoFocus
                    disabled={isUpdatingProfile}
                    className="w-full resize-none rounded-xl border bg-background px-3 py-2 text-sm outline-none transition-shadow focus-visible:ring-3 focus-visible:ring-ring/50"
                    aria-label="Bio"
                  />
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">
                      {bio.length}/150
                    </span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={cancelBioEdit}
                        disabled={isUpdatingProfile}
                      >
                        <X className="size-4" /> Cancel
                      </Button>
                      <Button type="submit" size="sm" disabled={isUpdatingProfile}>
                        <Check className="size-4" />
                        {isUpdatingProfile ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                </form>
              ) : (
                <p className="text-sm leading-7 text-muted-foreground">
                  {authUser?.bio || "No bio has been added yet."}
                </p>
              )}
              <div className="mt-6 rounded-2xl border bg-muted/30 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium">Protected profile</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Your account is secured through verified authentication and a private session.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl py-6">
            <CardHeader>
              <CardTitle className="text-xl tracking-tight">Account details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {editingName ? (
                  <form
                    onSubmit={handleNameSave}
                    className="rounded-2xl border bg-muted/20 p-4 sm:col-span-2"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        placeholder="First name"
                        maxLength={30}
                        autoFocus
                        disabled={isUpdatingProfile}
                      />
                      <Input
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        placeholder="Last name"
                        maxLength={30}
                        disabled={isUpdatingProfile}
                      />
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={cancelNameEdit}
                        disabled={isUpdatingProfile}
                      >
                        <X className="size-4" /> Cancel
                      </Button>
                      <Button type="submit" size="sm" disabled={isUpdatingProfile}>
                        <Check className="size-4" />
                        {isUpdatingProfile ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <ProfileDetail
                    icon={UserRound}
                    label="Full name"
                    value={fullName || "Not available"}
                    onEdit={() => setEditingName(true)}
                  />
                )}
                <ProfileDetail icon={Mail} label="Email address" value={authUser?.email || "Not available"} />
                <ProfileDetail icon={CalendarDays} label="Date of birth" value={formatDate(authUser?.dateOfBirth)} />
                <ProfileDetail icon={Clock3} label="Member since" value={formatDate(authUser?.createdAt)} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 rounded-2xl py-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Languages className="size-5" />
              </span>
              <div>
                <CardTitle className="text-xl tracking-tight">
                  Preferred language
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Messages are auto-detected and translated into this language.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                value={preferredLanguage}
                onChange={(event) => setPreferredLanguage(event.target.value)}
                className="h-10 min-w-0 flex-1 rounded-xl border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-label="Preferred translation language"
                disabled={isUpdatingProfile}
              >
                {TRANSLATION_LANGUAGES.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                onClick={handleLanguageSave}
                disabled={
                  isUpdatingProfile ||
                  preferredLanguage === (authUser?.preferredLanguage || "en")
                }
                className="rounded-xl"
              >
                <Check className="size-4" />
                {isUpdatingProfile ? "Saving..." : "Save language"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 rounded-2xl py-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {pushState.subscribed ? (
                  <Bell className="size-5" />
                ) : (
                  <BellOff className="size-5" />
                )}
              </span>
              <div>
                <CardTitle className="text-xl tracking-tight">
                  Browser notifications
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Receive new-message alerts when ClickChat is in the background.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 rounded-2xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">
                  {!pushState.supported
                    ? "Not supported by this browser"
                    : pushState.permission === "denied"
                      ? "Blocked in browser settings"
                      : pushState.subscribed
                        ? "Notifications are enabled"
                        : "Notifications are disabled"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  This preference applies only to this browser and device.
                </p>
              </div>
              <Button
                type="button"
                variant={pushState.subscribed ? "outline" : "default"}
                onClick={handlePushToggle}
                disabled={
                  isUpdatingPush ||
                  !pushState.supported ||
                  pushState.permission === "denied"
                }
                className="rounded-xl"
              >
                {pushState.subscribed ? (
                  <BellOff className="size-4" />
                ) : (
                  <Bell className="size-4" />
                )}
                {isUpdatingPush
                  ? "Updating..."
                  : pushState.subscribed
                    ? "Disable"
                    : "Enable"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 rounded-2xl py-6">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <KeyRound className="size-5" />
                </span>
                <div>
                  <CardTitle className="text-xl tracking-tight">Password</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Update the password used to access your account.
                  </p>
                </div>
              </div>
              {!editingPassword && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-xl"
                  onClick={() => setEditingPassword(true)}
                  aria-label="Change password"
                >
                  <Pencil className="size-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          {editingPassword && (
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <PasswordInput
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    placeholder="Current password"
                    autoComplete="current-password"
                    required
                  />
                  <PasswordInput
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="New password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={72}
                    required
                  />
                  <PasswordInput
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Use 8–72 characters with uppercase, lowercase, and a number.
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearPasswordForm}
                    disabled={isChangingPassword}
                  >
                    <X className="size-4" /> Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={
                      isChangingPassword ||
                      !currentPassword ||
                      newPassword.length < 8 ||
                      newPassword !== confirmPassword
                    }
                  >
                    <Check className="size-4" />
                    {isChangingPassword ? "Changing..." : "Change password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          )}
        </Card>
      </main>
    </div>
  );
}

function ProfileDetail({ icon: Icon, label, value, onEdit }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border bg-muted/20 p-4 transition-colors hover:bg-muted/40">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background text-muted-foreground shadow-sm ring-1 ring-foreground/8">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium" title={value}>{value}</p>
      </div>
      {onEdit && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ml-auto shrink-0 rounded-xl"
          onClick={onEdit}
          aria-label={`Edit ${label.toLowerCase()}`}
        >
          <Pencil className="size-4" />
        </Button>
      )}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default Profile;
