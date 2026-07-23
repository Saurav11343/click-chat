import { useEffect, useState } from "react";
import { CheckCircle2, MailCheck, XCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { axiosInstance } from "@/api/axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

const verificationRequests = new Map();

const requestEmailVerification = (token) => {
  if (!verificationRequests.has(token)) {
    const request = axiosInstance
      .get("/auth/verify-email", {
        params: {
          token,
        },
      })
      .catch((error) => {
        verificationRequests.delete(token);

        throw error;
      });

    verificationRequests.set(token, request);
  }

  return verificationRequests.get(token);
};

function VerifyEmail() {
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Verifying your email address...");

  const token = searchParams.get("token");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("The verification token is missing.");
        return;
      }

      try {
        const response = await requestEmailVerification(token);

        setStatus("success");
        setMessage(
          response.data.message || "Your email has been verified successfully.",
        );
      } catch (error) {
        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            "The verification link is invalid or has expired.",
        );
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {status === "verifying" && <MailCheck className="size-6" />}

            {status === "success" && <CheckCircle2 className="size-6" />}

            {status === "error" && <XCircle className="size-6" />}
          </div>

          <CardTitle>
            {status === "verifying" && "Verifying Email"}
            {status === "success" && "Email Verified"}
            {status === "error" && "Verification Failed"}
          </CardTitle>

          <CardDescription>{message}</CardDescription>
        </CardHeader>

        <CardContent>
          {status === "verifying" ? (
            <div className="flex justify-center">
              <Spinner className="size-6" />
            </div>
          ) : (
            <Button asChild className="w-full">
              <Link to="/login">
                {status === "success" ? "Continue to Login" : "Back to Login"}
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default VerifyEmail;
