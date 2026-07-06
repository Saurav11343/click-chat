import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/validations/auth.validation";
import { MessageCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

import { useAuthStore } from "@/store/useAuthStore";
import { Spinner } from "@/components/ui/spinner";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const { register, isRegisteringUp } = useAuthStore();
  const navigate = useNavigate();
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
    const res = await register(data);
    if (res) {
      navigate("/login");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-9">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Link to="/" className="mx-auto mb-3">
            <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-full transition-opacity hover:opacity-80">
              <MessageCircle />
            </div>
          </Link>

          <CardTitle>Create Account</CardTitle>
          <CardDescription>
            Register to start chatting with your friends.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="firstName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                    <Input
                      {...field}
                      id="firstName"
                      placeholder="John"
                      aria-invalid={fieldState.invalid}
                      autoComplete="given-name"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="lastName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                    <Input
                      {...field}
                      id="lastName"
                      placeholder="Doe"
                      aria-invalid={fieldState.invalid}
                      autoComplete="family-name"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      aria-invalid={fieldState.invalid}
                      autoComplete="email"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="dateOfBirth"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="dateOfBirth">Date of Birth</FieldLabel>
                    <Input
                      {...field}
                      id="dateOfBirth"
                      placeholder="dd-mm-yyyy"
                      type="date"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                      {...field}
                      id="password"
                      type="password"
                      placeholder="********"
                      aria-invalid={fieldState.invalid}
                      autoComplete="new-password"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="confirmPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="confirmPassword">
                      Confirm Password
                    </FieldLabel>
                    <Input
                      {...field}
                      id="confirmPassword"
                      type="password"
                      placeholder="********"
                      aria-invalid={fieldState.invalid}
                      autoComplete="new-password"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Button
                className="w-full"
                type="submit"
                disabled={isRegisteringUp}
              >
                {isRegisteringUp ? (
                  <Spinner className="h-5 w-5" />
                ) : (
                  "Create Account"
                )}
              </Button>
              <p className="text-muted-foreground text-center text-sm">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-primary font-medium hover:underline"
                >
                  Login
                </Link>
              </p>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default Register;
