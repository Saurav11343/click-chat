import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import AuthShell from "@/features/auth/components/AuthShell";
import { GoogleAuthSection } from "@/features/auth/components/GoogleSignInButton";
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
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { registerSchema } from "@/features/auth/schemas/auth.schema";

function PasswordInput({ field, invalid, id, placeholder, visible, onToggle }) {
  return (
    <div className="relative">
      <Input
        {...field}
        id={id}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        aria-invalid={invalid}
        autoComplete="new-password"
        className="h-11 rounded-xl pr-11"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        onClick={onToggle}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  );
}

function Register() {
  const { register, isRegisteringUp } = useAuthStore();
  const googleLogin = useAuthStore((state) => state.googleLogin);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      dateOfBirth: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data) => {
    const result = await register(data);

    if (result?.success) {
      navigate("/check-email", {
        state: {
          email: data.email,
          emailSent: result.emailSent,
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
      <Card className="w-full max-w-xl gap-0 rounded-3xl border-0 py-0 shadow-2xl shadow-primary/5 ring-1 ring-foreground/10">
        <CardHeader className="px-6 pb-6 pt-8 text-center sm:px-8 sm:pt-10">
          <span className="mx-auto mb-4 flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <UserPlus className="size-5" />
          </span>
          <CardTitle className="text-2xl font-semibold tracking-tight">Create your account</CardTitle>
          <CardDescription className="text-base">
            Join ClickChat for direct chats, groups, rich media, and real-time updates.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-8 sm:px-8 sm:pb-10">
          <GoogleAuthSection onCredential={handleGoogleLogin} />

          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className="gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Controller
                  name="firstName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="firstName">First name</FieldLabel>
                      <Input
                        {...field}
                        id="firstName"
                        placeholder="John"
                        aria-invalid={fieldState.invalid}
                        autoComplete="given-name"
                        className="h-11 rounded-xl"
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="lastName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="lastName">Last name</FieldLabel>
                      <Input
                        {...field}
                        id="lastName"
                        placeholder="Doe"
                        aria-invalid={fieldState.invalid}
                        autoComplete="family-name"
                        className="h-11 rounded-xl"
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
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
                  name="dateOfBirth"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="dateOfBirth">Date of birth</FieldLabel>
                      <Input
                        {...field}
                        id="dateOfBirth"
                        type="date"
                        aria-invalid={fieldState.invalid}
                        autoComplete="bday"
                        className="h-11 rounded-xl"
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <PasswordInput
                        field={field}
                        invalid={fieldState.invalid}
                        id="password"
                        placeholder="At least 8 characters"
                        visible={showPassword}
                        onToggle={() => setShowPassword((visible) => !visible)}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="confirmPassword"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
                      <PasswordInput
                        field={field}
                        invalid={fieldState.invalid}
                        id="confirmPassword"
                        placeholder="Repeat your password"
                        visible={showConfirmPassword}
                        onToggle={() => setShowConfirmPassword((visible) => !visible)}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>

              <p className="text-xs leading-5 text-muted-foreground">
                Use at least 8 characters. You must be 13 or older to create an account.
              </p>

              <Button className="h-11 w-full rounded-xl" type="submit" disabled={isRegisteringUp}>
                {isRegisteringUp ? <Spinner className="size-5" /> : "Create account"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
                  Log in
                </Link>
              </p>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}

export default Register;
