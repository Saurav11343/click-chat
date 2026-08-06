import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import AuthShell from "@/features/auth/components/AuthShell";
import { PasswordInput } from "@/features/auth/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/features/auth/store/useAuthStore";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const isResetting = useAuthStore((state) => state.isResettingPassword);
  const token = searchParams.get("token") || "";

  const handleSubmit = async (event) => {
    event.preventDefault();
    const success = await resetPassword({ token, newPassword, confirmPassword });
    if (success) navigate("/login", { replace: true });
  };

  return (
    <AuthShell>
      <Card className="w-full max-w-md rounded-3xl border-0 shadow-2xl ring-1 ring-foreground/10">
        <CardHeader className="text-center">
          <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><KeyRound className="size-6" /></span>
          <CardTitle>Choose a new password</CardTitle>
          <CardDescription>Use at least 8 characters with uppercase, lowercase, and a number.</CardDescription>
        </CardHeader>
        <CardContent>
          {!token ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-destructive">The reset token is missing.</p>
              <Button asChild className="w-full"><Link to="/forgot-password">Request another link</Link></Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <PasswordInput value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password" autoComplete="new-password" minLength={8} maxLength={72} required className="h-11 rounded-xl" />
              <PasswordInput value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" autoComplete="new-password" required className="h-11 rounded-xl" />
              <Button type="submit" className="h-11 w-full rounded-xl" disabled={isResetting || newPassword !== confirmPassword}>
                {isResetting ? "Resetting..." : "Reset password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
