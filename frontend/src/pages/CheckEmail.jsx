import { useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/store/useAuthStore";

function CheckEmail() {
  const location = useLocation();

  const email = location.state?.email;
  const initialEmailSent = location.state?.emailSent ?? true;

  const [emailWasSent, setEmailWasSent] = useState(initialEmailSent);

  const [cooldown, setCooldown] = useState(
    () => location.state?.initialCooldown ?? (initialEmailSent ? 60 : 0),
  );
  const resendVerificationEmail = useAuthStore(
    (state) => state.resendVerificationEmail,
  );

  const isResendingVerification = useAuthStore(
    (state) => state.isResendingVerification,
  );

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldown((currentCooldown) => Math.max(currentCooldown - 1, 0));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [cooldown]);

  const handleResend = async () => {
    if (!email || cooldown > 0 || isResendingVerification) {
      return;
    }

    const result = await resendVerificationEmail(email);

    if (result.success) {
      setEmailWasSent(true);
      setCooldown(60);
      return;
    }

    if (result.retryAfter > 0) {
      setCooldown(result.retryAfter);
    }
  };

  const resendButtonText = () => {
    if (isResendingVerification) {
      return "Sending...";
    }

    if (cooldown > 0) {
      return `Resend in ${cooldown}s`;
    }

    return "Resend verification email";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <MailCheck className="size-6" />
          </div>

          <CardTitle>
            {emailWasSent ? "Check Your Email" : "Email Could Not Be Sent"}
          </CardTitle>

          <CardDescription>
            {emailWasSent ? (
              <>
                We sent a verification link
                {email ? (
                  <>
                    {" "}
                    to <span className="font-medium">{email}</span>
                  </>
                ) : (
                  " to your email address"
                )}
                . Open the link to activate your ClickChat account.
              </>
            ) : (
              "Your account was created, but the verification email could not be sent."
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {emailWasSent && (
            <p className="text-center text-sm text-muted-foreground">
              The link expires after 24 hours. Check your spam folder if you
              cannot find the email.
            </p>
          )}

          {email ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={cooldown > 0 || isResendingVerification}
              onClick={handleResend}
            >
              {isResendingVerification && <Spinner className="mr-2 size-4" />}

              {resendButtonText()}
            </Button>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Return to login and enter your email to request another
              verification message.
            </p>
          )}

          <Button asChild className="w-full">
            <Link to="/login">Go to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default CheckEmail;
