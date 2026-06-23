"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { GrindCtrlMark } from "@/components/brand/grindctrl-mark";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Unable to sign in.");
      setLoading(false);
      return;
    }

    const next = searchParams.get("next") ?? "/dashboard";
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={submit}>
      <div className="mb-7">
        <div className="mb-6 flex items-center gap-2.5 text-foreground lg:hidden">
          <GrindCtrlMark size={24} title="GrindCTRL" />
          <span className="font-display text-lg font-extrabold tracking-tight">GrindCTRL</span>
        </div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground">Sign in</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Welcome back to your dashboard.</p>
      </div>

      <div className="space-y-4">
        <Field label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass(Boolean(error))}
            required
          />
        </Field>
        <Field label="Password" htmlFor="password" error={error}>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass(Boolean(error))}
            required
          />
        </Field>
      </div>

      <Button type="submit" className="mt-6 w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Sign in
      </Button>
    </form>
  );
}


