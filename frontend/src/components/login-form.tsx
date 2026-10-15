"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const completeLogin = (userEmail: string) => {
    const safeEmail = userEmail.trim();
    const namePart = safeEmail.includes("@") ? safeEmail.split("@")[0] : safeEmail;
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

    try {
      localStorage.setItem(
        "align_auth_user",
        JSON.stringify({ email: safeEmail, name: formattedName })
      );
      // Set 7-day cookie for Next.js middleware routing
      document.cookie = "align_auth=true; path=/; max-age=604800; SameSite=Lax";
    } catch (e) {
      console.warn("Storage error saving auth:", e);
    }

    setIsSuccess(true);
    setTimeout(() => {
      window.location.href = "/";
    }, 700);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      completeLogin(email);
    }, 800);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border border-gray-200/90 dark:border-[#1c2621] shadow-xl backdrop-blur-sm bg-white/95 dark:bg-[#111614]/95">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-10 h-10 rounded-xl bg-emerald-600/10 dark:bg-[#10b981]/15 text-emerald-600 dark:text-[#34d399] flex items-center justify-center mb-2 shadow-2xs">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Login
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="py-6 text-center space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-[#14291f] text-emerald-600 dark:text-[#34d399] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white text-base">
                Welcome back!
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                You are successfully logged in. Redirecting to your workspace...
              </p>
              <Button
                variant="outline"
                className="mt-2 text-xs w-full"
                onClick={() => (window.location.href = "/")}
              >
                Go to Resume Studio
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2 text-left">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2 text-left">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        alert("Password reset instructions sent to your email.");
                      }}
                      className="text-xs text-emerald-600 dark:text-[#34d399] hover:text-emerald-700 dark:hover:text-[#4ade80] underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 h-10 font-bold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <span>Login</span>
                  )}
                </Button>
                <div className="relative my-2 text-center text-xs after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-gray-200 dark:after:border-[#1c2621]">
                  <span className="relative z-10 bg-white dark:bg-[#111614] px-2 text-gray-400 dark:text-gray-500 font-medium">
                    Or continue with
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 h-10 font-medium"
                  onClick={() => {
                    setIsLoading(true);
                    setTimeout(() => {
                      setIsLoading(false);
                      completeLogin("google.user@example.com");
                    }, 800);
                  }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Login with Google</span>
                </Button>
              </div>
              <div className="mt-5 text-center text-xs text-gray-500 dark:text-gray-400">
                Don&apos;t have an account?{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Registration flow opened. You can now login or continue with Google.");
                  }}
                  className="font-semibold text-emerald-600 dark:text-[#34d399] hover:text-emerald-700 dark:hover:text-[#4ade80] underline underline-offset-4"
                >
                  Sign up
                </a>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
