"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./Header.module.css";

export default function UserDropdown() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch {
        // Guest mode
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

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
      router.push("/shop");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    }
  }

  if (loading) {
    return (
      <div className={styles.iconLink}>
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </div>
    );
  }

  // Guest view: Link directly to login
  if (!user) {
    return (
      <Link href="/login" className={styles.iconLink} aria-label="Sign In or Account">
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </Link>
    );
  }

  // Calculate initials from name (e.g. "Jane Doe" -> "JD")
  const initials = user.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0].toUpperCase())
        .slice(0, 2)
        .join("")
    : user.email[0].toUpperCase();

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
            <div className={styles.dropdownName}>{user.name}</div>
            <div className={styles.dropdownEmail}>{user.email}</div>
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
              Dashboard
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