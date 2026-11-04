"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { CheckIcon, AlertCircleIcon } from "@/components/Icons";
import styles from "./product.module.css";

export default function AddToCart({ product }) {
  const router = useRouter();
  const { items, addToCart } = useCart();
  const [status, setStatus] = useState({ type: "", message: "" });

  if (!product || product.stock <= 0) {
    return (
      <div className={styles.outOfStockAlert}>
        This item is currently out of stock. Please check back soon!
      </div>
    );
  }

  // Check if item is already in cart
  const isInCart = items.some((item) => String(item.id) === String(product.id));

  function handleAddToCart() {
    try {
      addToCart(product);
      setStatus({ type: "success", message: "Added to your cart successfully!" });
      setTimeout(() => setStatus({ type: "", message: "" }), 3500);
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Could not add item to cart" });
    }
  }

  function handleBuyNow() {
    try {
      if (!isInCart) {
        addToCart(product);
      }
      router.push("/checkout");
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Failed to proceed to checkout" });
    }
  }

  return (
    <div className={styles.actionsContainer}>
      <div className={styles.buttonGroup}>
        {isInCart ? (
          <Link href="/cart" className={styles.goToCartButton}>
            <svg
              className={styles.btnIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span>Go to cart</span>
            <span className={styles.arrowIcon}>→</span>
          </Link>
        ) : (
          <button
            type="button"
            className={styles.cartButton}
            onClick={handleAddToCart}
          >
            Add to cart
          </button>
        )}

        <button
          type="button"
          className={styles.buyNowButton}
          onClick={handleBuyNow}
        >
          Buy now
        </button>
      </div>

      {status.message && (
        <p
          role="status"
          className={status.type === "error" ? styles.errorMessage : styles.statusMessage}
        >
          {status.type === "success" ? (
            <CheckIcon size={14} style={{ marginRight: "0.35rem" }} />
          ) : (
            <AlertCircleIcon size={14} style={{ marginRight: "0.35rem" }} />
          )}
          {status.message}
        </p>
      )}
    </div>
  );
}
