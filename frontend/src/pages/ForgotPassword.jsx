import { useState } from "react";
import { MailCheck, Send } from "lucide-react";
import { Link } from "react-router-dom";

import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/store/useAuthStore";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const requestPasswordReset = useAuthStore((state) => state.requestPasswordReset);
  const isRequesting = useAuthStore((state) => state.isRequestingPasswordReset);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await requestPasswordReset(email.trim());
    if (result.success) setSent(true);
  };

  return (
    <AuthShell>
      <Card className="w-full max-w-md rounded-3xl border-0 shadow-2xl ring-1 ring-foreground/10">
        <CardHeader className="text-center">
          <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            {sent ? <MailCheck className="size-6" /> : <Send className="size-5" />}
          </span>
          <CardTitle>{sent ? "Check your email" : "Forgot your password?"}</CardTitle>
          <CardDescription>
            {sent
              ? "If an account exists for that email, we sent a reset link valid for 30 minutes."
              : "Enter your account email and we’ll send you a secure reset link."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <Button asChild className="w-full"><Link to="/login">Back to login</Link></Button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="h-11 rounded-xl"
              />
              <Button type="submit" className="h-11 w-full rounded-xl" disabled={isRequesting}>
                {isRequesting ? <Spinner className="size-5" /> : "Send reset link"}
              </Button>
              <Button asChild variant="ghost" className="w-full"><Link to="/login">Back to login</Link></Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
