"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Guard: If already logged in, redirect away from login page
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            if (data.user.role === "ADMIN") {
              router.replace("/admin");
            } else {
              router.replace("/shop");
            }
            return;
          }
        }
      } catch {
        // Not logged in
      } finally {
        setCheckingAuth(false);
      }
    }
    checkSession();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to log in");
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth-changed"));
      }

      // Route admin users straight to /admin dashboard, customers to /shop
      if (data.user.role === "ADMIN") {
        router.replace("/admin");
      } else {
        router.replace("/shop");
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <main className={styles.page}>
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
          Verifying session...
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>Customer &amp; Management Portal</p>
      <h1 className={styles.title}>Sign in to your account</h1>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          Email address
          <input
            type="text"
            required
            autoComplete="username"
            placeholder="hello@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
          />
        </label>

        <label className={styles.label}>
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />
        </label>

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className={styles.switchAuth}>
        <span>Don&apos;t have an account? </span>
        <Link href="/signup" className={styles.switchLink}>
          Create account
        </Link>
      </div>
    </main>
  );
}
