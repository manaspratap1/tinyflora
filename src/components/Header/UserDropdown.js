"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./Header.module.css";

function UserDropdownInner() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    async function verifySession() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!isMounted) return;
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || null);
        } else {
          setUser(null);
        }
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    verifySession();

    function handleAuthEvent() {
      verifySession();
    }
    window.addEventListener("auth-changed", handleAuthEvent);
    window.addEventListener("focus", handleAuthEvent);

    return () => {
      isMounted = false;
      window.removeEventListener("auth-changed", handleAuthEvent);
      window.removeEventListener("focus", handleAuthEvent);
    };
  }, [pathname]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setIsOpen(false);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth-changed"));
      }
      router.push("/shop");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    }
  }

  if (loading) {
    return (
      <div className={styles.iconLink}>
        <svg
          className={styles.iconSvg}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
    );
  }

  // Guest view: Link directly to login
  if (!user) {
    return (
      <Link href="/login" className={styles.iconLink} aria-label="Sign In or Account">
        <svg
          className={styles.iconSvg}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </Link>
    );
  }

  // Calculate initials from name (e.g. "Jane Doe" -> "JD")
  const initials = (user.name && user.name.trim())
    ? user.name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((n) => n[0].toUpperCase())
        .slice(0, 2)
        .join("")
    : (user.email ? user.email[0].toUpperCase() : "U");

  const isAdmin = user.role === "ADMIN";

  return (
    <div className={styles.userDropdownContainer} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={styles.userAvatarBtn}
        aria-label="User Account Menu"
        aria-expanded={isOpen}
      >
        {initials}
      </button>

      {isOpen && (
        <div className={styles.userDropdownMenu}>
          <div className={styles.dropdownHeader}>
            <div className={styles.dropdownName}>{user.name || "My Account"}</div>
            <div className={styles.dropdownEmail}>{user.email}</div>
            {isAdmin && <span className={styles.adminPill}>Admin</span>}
          </div>

          <div className={styles.dropdownDivider} />

          {/* Profile non-responsive menu item */}
          <button
            type="button"
            className={styles.dropdownStaticItem}
            onClick={(e) => e.preventDefault()}
          >
            My Profile
          </button>

          {isAdmin && (
            <Link
              href="/admin"
              className={styles.dropdownItem}
              onClick={() => setIsOpen(false)}
            >
              <span>Dashboard</span>
              <span style={{ fontSize: "12px", opacity: 0.7 }}>↗</span>
            </Link>
          )}

          <div className={styles.dropdownDivider} />

          <button
            type="button"
            onClick={handleLogout}
            className={`${styles.dropdownItem} ${styles.dropdownLogout}`}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default function UserDropdown() {
  return (
    <Suspense
      fallback={
        <div className={styles.userDropdownContainer}>
          <div className={styles.avatarButton} aria-label="Account">
            <svg
              className={styles.iconSvg}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        </div>
      }
    >
      <UserDropdownInner />
    </Suspense>
  );
}
