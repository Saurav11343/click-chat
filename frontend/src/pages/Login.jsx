import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import AuthShell from "@/components/auth/AuthShell";
import { GoogleAuthSection } from "@/components/auth/GoogleSignInButton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/store/useAuthStore";
import { loginSchema } from "@/validations/auth.validation";

function Login() {
  const navigate = useNavigate();
  const { login, isLoggingIn } = useAuthStore();
  const googleLogin = useAuthStore((state) => state.googleLogin);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    const result = await login(data);

    if (result?.success) {
      navigate("/chat");
      return;
    }

    if (result?.requiresEmailVerification) {
      navigate("/check-email", {
        state: {
          email: data.email,
          emailSent: true,
          initialCooldown: 0,
        },
      });
    }
  };

  const handleGoogleLogin = async (credential) => {
    if (await googleLogin(credential)) {
      navigate("/chat");
    }
  };

  return (
    <AuthShell>
      <Card className="w-full max-w-md gap-0 rounded-3xl border-0 py-0 shadow-2xl shadow-primary/5 ring-1 ring-foreground/10">
        <CardHeader className="px-6 pb-6 pt-8 text-center sm:px-8 sm:pt-10">
          <span className="mx-auto mb-4 flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <LogIn className="size-5" />
          </span>
          <CardTitle className="text-2xl font-semibold tracking-tight">Welcome back</CardTitle>
          <CardDescription className="text-base">
            Enter your details to continue to your conversations.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-8 sm:px-8 sm:pb-10">
          <GoogleAuthSection onCredential={handleGoogleLogin} />

          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className="gap-5">
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="email">Email address</FieldLabel>
                    <Input
                      {...field}
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      aria-invalid={fieldState.invalid}
                      autoComplete="email"
                      className="h-11 rounded-xl"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <div className="relative">
                      <Input
                        {...field}
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        aria-invalid={fieldState.invalid}
                        autoComplete="current-password"
                        className="h-11 rounded-xl pr-11"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowPassword((visible) => !visible)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </Button>
                    </div>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    <Link
                      to="/forgot-password"
                      className="self-end text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </Field>
                )}
              />

              <Button className="h-11 w-full rounded-xl" type="submit" disabled={isLoggingIn}>
                {isLoggingIn ? <Spinner className="size-5" /> : "Log in"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                New to ClickChat?{" "}
                <Link to="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
                  Create an account
                </Link>
              </p>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}

export default Login;
