import styles from "./page.module.css";

export default function AboutPage() {
  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>Our story</p>
      <h1 className={styles.title}>Grown with care, for everyday wellness.</h1>
      <p className={styles.text}>
        Tiny Floramicro Greens began with one simple idea: fresh, nutrient-rich greens should be easy to enjoy every day.
        We grow our microgreens in small batches with care, keeping them clean, flavourful and full of life.
      </p>
      <p className={styles.text}>
        From leafy salads to warm meals and smoothies, our greens bring freshness to the table without the fuss.
      </p>
    </main>
  );
}
