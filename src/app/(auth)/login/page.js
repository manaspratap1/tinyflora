"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCurrentUser(data.user);
          }
        }
      } catch {
        // Not logged in or server offline
      } finally {
        setCheckingAuth(false);
      }
    }
    checkSession();
  }, []);

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

      setCurrentUser(data.user);

      // Route admin users straight to /admin dashboard, customers to /shop
      if (data.user.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/shop");
      }
      router.refresh();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    }
  }

  if (checkingAuth) {
    return (
      <main className={styles.page}>
        <p>Checking authentication...</p>
      </main>
    );
  }

  if (currentUser) {
    const isAdmin = currentUser.role === "ADMIN";
    return (
      <main className={styles.page}>
        <div className={styles.loggedInCard}>
          <p className={styles.eyebrow}>{isAdmin ? "Administrator Portal" : "Customer Account"}</p>
          <h1 className={styles.title}>Hello, {currentUser.name}</h1>
          <p>Signed in as {currentUser.email}</p>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginBottom: "1.5rem" }}>
            {isAdmin && (
              <Link href="/admin" className={styles.button} style={{ background: "var(--forest)" }}>
                Open Admin Dashboard →
              </Link>
            )}
            <Link href="/shop" className={styles.button} style={{ background: "transparent", color: "var(--forest)", border: "1px solid var(--forest)" }}>
              Go to Shop
            </Link>
          </div>

          <button type="button" onClick={handleLogout} className={styles.button} style={{ background: "#fdf2f2", color: "#991b1b" }}>
            Log out
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>Sign In</p>
      <h1 className={styles.title}>Welcome back</h1>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          Email address or username
          <input
            type="text"
            required
            autoComplete="username"
            placeholder="you@example.com or 'demo'"
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
          {loading ? "Signing in..." : "Continue →"}
        </button>

        <p className={styles.switchText}>
          Don&apos;t have an account?
          <Link href="/signup" className={styles.switchLink}>
            Sign up
          </Link>
        </p>
      </form>
    </main>
  );
}