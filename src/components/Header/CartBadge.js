"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import styles from "./Header.module.css";

export default function CartBadge() {
  const { cartCount } = useCart();

  return (
    <Link href="/cart" className={styles.cart} aria-label={`Shopping bag with ${cartCount} items`}>
      <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <path d="M16 10a4 4 0 0 1-8 0"></path>
      </svg>
      <span className={styles.cartCountBadge}>{cartCount}</span>
    </Link>
  );
}