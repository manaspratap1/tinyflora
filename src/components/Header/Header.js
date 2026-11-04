import { Suspense } from "react";
import Link from "next/link";
import CartBadge from "./CartBadge";
import UserDropdown from "./UserDropdown";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        <span className={styles.brandIcon}></span>
        <span>Tiny Flora Microgreens</span>
      </Link>

      <nav className={styles.navigation}>
        <Link href="/">Home</Link>
        <Link href="/shop">Shop</Link>
        <Link href="/about">Our Story</Link>
        <Link href="/contact">Contact</Link>
      </nav>

      <div className={styles.actions}>
        <Link href="/shop" className={styles.iconLink} aria-label="Search collection">
          <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </Link>
        <Suspense fallback={null}>
          <UserDropdown />
        </Suspense>
        <CartBadge />
      </div>
    </header>
  );
}