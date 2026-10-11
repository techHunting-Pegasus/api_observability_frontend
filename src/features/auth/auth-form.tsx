"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { errorMessage } from "@/lib/api/client";
import { useAuth } from "./auth-provider";

const loginSchema = z.object({
  email: z.string().min(1, "Enter your email").email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
const signupSchema = loginSchema
  .extend({
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" });

type FormValues = { email: string; password: string; confirmPassword?: string };

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const { login, signup, token, ready } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(isSignup ? signupSchema : loginSchema) });

  useEffect(() => {
    if (ready && token) router.replace("/dashboard");
  }, [ready, token, router]);

  async function onSubmit(v: FormValues) {
    setServerError(null);
    try {
      if (isSignup) await signup(v.email, v.password, v.confirmPassword ?? "");
      else await login(v.email, v.password);
      router.replace("/dashboard");
    } catch (e) {
      setServerError(errorMessage(e));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-white">
            <Activity className="h-4 w-4" />
          </span>
          <span className="text-base font-semibold tracking-tight">API Observability</span>
        </div>
        <div className="rounded-xl border border-line bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight">{isSignup ? "Create your account" : "Sign in"}</h1>
          <p className="mt-1 text-sm text-ink-soft">{isSignup ? "Start monitoring your app's API traffic." : "Use your dashboard account to continue."}</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-4">
            {serverError && (
              <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {serverError}
              </div>
            )}
            <Field label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
            </Field>
            <Field label="Password" htmlFor="password" error={errors.password?.message}>
              <Input id="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} aria-invalid={!!errors.password} {...register("password")} />
            </Field>
            {isSignup && (
              <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
                <Input id="confirmPassword" type="password" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...register("confirmPassword")} />
              </Field>
            )}
            <Button type="submit" variant="primary" className="w-full" loading={isSubmitting}>
              {isSubmitting ? (isSignup ? "Creating account..." : "Signing in...") : isSignup ? "Create account" : "Sign in"}
            </Button>
          </form>
        </div>
        <p className="mt-4 text-center text-sm text-ink-soft">
          {isSignup ? "Already have an account?" : "New here?"}{" "}
          <Link href={isSignup ? "/login" : "/signup"} className="font-medium text-brand hover:underline">
            {isSignup ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </div>
    </div>
  );
}
