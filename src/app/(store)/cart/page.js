"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import styles from "./page.module.css";

export default function CartPage() {
  const { items, cartCount, subtotal, shippingFee, total, updateQuantity, removeFromCart } = useCart();

  if (cartCount === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.emptyState}>
          <p className={styles.eyebrow}>Your bag</p>
          <h1 className={styles.title}>Your cart is empty.</h1>
          <p className={styles.text}>
            Add a few fresh microgreens and bring home living nutrition to your kitchen.
          </p>
          <Link href="/shop" className={styles.button}>
            Explore our collection
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>Your bag</p>
      <h1 className={styles.title}>Review your picks ({cartCount})</h1>

      <div className={styles.cartLayout}>
        <div className={styles.itemsList}>
          {items.map((item) => {
            const imageSrc = item.image || "/images/product-placeholder.png";
            const linePrice = (Number(item.price) * item.quantity).toFixed(2);

            return (
              <div key={item.id} className={styles.cartItem}>
                <Image
                  src={imageSrc}
                  alt={item.name}
                  width={100}
                  height={100}
                  unoptimized
                  className={styles.itemImage}
                />

                <div className={styles.itemDetails}>
                  <h3>{item.name}</h3>
                  {item.weight && <p className={styles.itemWeight}>Pack: {item.weight}</p>}
                  <p className={styles.itemPrice}>₹{Number(item.price).toFixed(2)} each</p>
                </div>

                <div className={styles.itemActions}>
                  <div className={styles.quantityControls}>
                    <button
                      type="button"
                      className={styles.qtyButton}
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className={styles.quantityText}>{item.quantity}</span>
                    <button
                      type="button"
                      className={styles.qtyButton}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <strong className={styles.itemPrice}>₹{linePrice}</strong>

                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <aside className={styles.summaryCard}>
          <h2 className={styles.summaryTitle}>Order summary</h2>

          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>

          <div className={styles.summaryRow}>
            <span>Estimated delivery</span>
            <span>{shippingFee === 0 ? "FREE" : `₹${shippingFee.toFixed(2)}`}</span>
          </div>

          {subtotal < 500 && (
            <p className={styles.freeShippingNote}>
              Add ₹{(500 - subtotal).toFixed(2)} more to qualify for <strong>Free Delivery</strong>!
            </p>
          )}

          <div className={styles.totalRow}>
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>

          <Link href="/checkout" className={styles.checkoutButton}>
            Proceed to checkout →
          </Link>

          <Link href="/shop" className={styles.continueShopping}>
            ← Continue shopping
          </Link>
        </aside>
      </div>
    </main>
  );
}