"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./product.module.css";
import AddToCart from "./AddToCart";
import { products as fallbackProducts } from "@/data/products";

export default function ProductPage({ id }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    async function fetchProduct() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/products/" + id, {
          signal: controller.signal,
        });

        if (response.status === 404) {
          notFound();
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load product from server");
        }

        const data = await response.json();
        setProduct(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          // If backend DB is not yet running, check fallback data for graceful local dev
          const fallback = fallbackProducts.find((p) => String(p.id) === String(id));
          if (fallback) {
            setProduct(fallback);
          } else {
            setError(err.message || "Something went wrong loading this product");
          }
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchProduct();

    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <main className={styles.page}>
        <p>Loading fresh microgreens...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.page}>
        <p className={styles.errorMessage}>{error}</p>
        <Link href="/shop" className={styles.backLink}>
          ← Back to collection
        </Link>
      </main>
    );
  }

  if (!product) return null;

  const inStock = product.stock > 0;
  const imageSrc = product.image || "/images/product-placeholder.png";
  const categoryName = product.category?.name || "Microgreens";
  const formattedPrice = Number(product.price).toFixed(2);

  return (
    <main className={styles.page}>
      <div className={styles.breadcrumb}>
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/shop">Shop</Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>

      <section className={styles.product}>
        <div className={styles.imageWrapper}>
          <Image
            src={imageSrc}
            alt={product.name}
            width={800}
            height={800}
            priority
            unoptimized
            className={styles.image}
          />
        </div>

        <div className={styles.details}>
          <span className={styles.category}>{categoryName}</span>

          <h1>{product.name}</h1>

          <p className={styles.price}>₹{formattedPrice}</p>

          {product.weight && (
            <p className={styles.weight}>Pack size: {product.weight}</p>
          )}

          <div className={styles.description}>
            {product.description || "Freshly grown, vibrant microgreens."}
          </div>

          <p className={!inStock ? styles.outOfStock : styles.stock}>
            {inStock ? "In Stock" : "Out of Stock"}
          </p>

          <AddToCart product={product} />

          <Link href="/shop" className={styles.backLink}>
            ← Continue shopping
          </Link>
        </div>
      </section>
    </main>
  );
}