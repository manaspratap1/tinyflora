
import Link from "next/link";
import Image from "next/image";
import styles from "./ProductCard.module.css";

export default function ProductCard({ product }) {
  const imageSrc = product.image || "/images/product-placeholder.png";
  const price = Number(product.price);

  return (
    <article className={styles.card}>
      <Link
        href={`/products/${product.id}`}
        className={styles.imageLink}
      >
        <Image
          src={imageSrc}
          alt={product.name}
          width={700}
          height={700}
          className={styles.image}
          unoptimized
        />

        <span className={styles.tag}>Fresh pick</span>
      </Link>

      <div className={styles.info}>
        <div>
          <h3>{product.name}</h3>
          {product.weight && <p>{product.weight}</p>}
        </div>

        <strong>
          ₹{Number.isFinite(price) ? price.toFixed(2) : "—"}
        </strong>
      </div>

      {product.description && (
        <p className={styles.description}>
          {product.description}
        </p>
      )}

      <Link
        href={`/products/${product.id}`}
        className={styles.button}
      >
        View product
      </Link>
    </article>
  );
}
