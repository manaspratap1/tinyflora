"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../login/page.module.css";

export default function SignupPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Guard: If already logged in, redirect away from signup page
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
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create account");
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth-changed"));
      }

      router.replace("/shop");
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
      <p className={styles.eyebrow}>Create Account</p>
      <h1 className={styles.title}>Join Tiny Floramicro</h1>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          Full name
          <input
            type="text"
            required
            autoComplete="name"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
          />
        </label>

        <label className={styles.label}>
          Email address
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
          />
        </label>

        <label className={styles.label}>
          Phone number (optional)
          <input
            type="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={styles.input}
          />
        </label>

        <label className={styles.label}>
          Password (min 6 characters)
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />
        </label>

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? "Creating account..." : "Sign up →"}
        </button>

        <p className={styles.switchText}>
          Already have an account?
          <Link href="/login" className={styles.switchLink}>
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}
