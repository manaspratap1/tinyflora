"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import styles from "./page.module.css";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, cartCount, subtotal, shippingFee, total, clearCart } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  const [loading] = useState(false);
  const [error] = useState("");
  const [placedOrder] = useState(null);

  // Auto-fill customer details if already logged in
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCustomerName(data.user.name || "");
            setCustomerEmail(data.user.email || "");
            // If phone exists in DB profile, pre-fill it; otherwise user can enter it now
            if (data.user.phone) {
              setCustomerPhone(data.user.phone);
            }
          }
        }
      } catch {
        // Guest checkout
      }
    }
    loadUser();
  }, []);

  function handlePlaceOrder(e) {
    e.preventDefault();
    // Unresponsive until payment gateway is integrated
  }

  if (placedOrder) {
    return (
      <main className={styles.page}>
        <div className={styles.successCard}>
          <span className={styles.orderBadge}>Order Confirmed #{placedOrder.orderNumber}</span>
          <h2>Thank you, {placedOrder.customerName}!</h2>
          <p>
            Your order for fresh microgreens has been received and scheduled for harvest.
            A confirmation has been prepared for {customerEmail}.
          </p>
          <Link href="/shop" className={styles.button}>
            Explore More Greens →
          </Link>
        </div>
      </main>
    );
  }

  if (cartCount === 0) {
    return (
      <main className={styles.page}>
        <p className={styles.eyebrow}>Checkout</p>
        <h1 className={styles.title}>Your cart is empty</h1>
        <p>You need items in your cart to proceed with checkout.</p>
        <Link href="/shop" className={styles.button} style={{ maxWidth: 220, marginTop: "1.5rem" }}>
          Go to shop
        </Link>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>Checkout</p>
      <h1 className={styles.title}>Complete your order</h1>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.grid}>
        <form onSubmit={handlePlaceOrder} className={styles.card}>
          <h2 className={styles.cardTitle}>Delivery details</h2>

          <div className={styles.formGrid}>
            <div className={styles.formGridFull}>
              <label className={styles.label}>
                Full name
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={styles.input}
                />
              </label>
            </div>

            <label className={styles.label}>
              Email address
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className={styles.input}
              />
            </label>

            <label className={styles.label}>
              Phone number {customerPhone ? "" : "(required for delivery)"}
              <input
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className={styles.input}
              />
            </label>

            <div className={styles.formGridFull}>
              <label className={styles.label}>
                Delivery address
                <textarea
                  required
                  placeholder="Street address, apartment/suite, city, state, postal code"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className={styles.textarea}
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.button}
            style={{ marginTop: "1.5rem" }}
          >
            {loading ? "Placing order..." : `Place order • ₹${total.toFixed(2)}`}
          </button>
        </form>

        <aside className={styles.card}>
          <h2 className={styles.cardTitle}>Order summary ({cartCount})</h2>

          {items.map((item) => (
            <div key={item.id} className={styles.itemLine}>
              <span>
                {item.name} × {item.quantity}
              </span>
              <strong>₹{(Number(item.price) * item.quantity).toFixed(2)}</strong>
            </div>
          ))}

          <div className={styles.row} style={{ marginTop: "1rem" }}>
            <span>Subtotal</span>
            <strong>₹{subtotal.toFixed(2)}</strong>
          </div>

          <div className={styles.row}>
            <span>Shipping</span>
            <strong>{shippingFee === 0 ? "FREE" : `₹${shippingFee.toFixed(2)}`}</strong>
          </div>

          <div className={styles.total}>
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>

          <Link href="/cart" style={{ color: "var(--green)", fontSize: "13px" }}>
            ← Edit cart items
          </Link>
        </aside>
      </div>
    </main>
  );
}