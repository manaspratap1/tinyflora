
import ShopContent from "./ShopContent";
import styles from "./shop.module.css";

export const metadata = {
  title: "Shop Fresh Microgreens",
  description: "Explore our collection of fresh microgreens.",
};

export default function ShopPage() {
  return (
    <main className={styles.page}>
      <section className={styles.banner}>
        <span className={styles.eyebrow}>OUR COLLECTION</span>
        <h1>Fresh greens, thoughtfully grown.</h1>
        <p>Discover something fresh for your everyday meals.</p>
      </section>

      <ShopContent />
    </main>
  );
}
