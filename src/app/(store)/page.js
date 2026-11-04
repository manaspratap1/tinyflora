import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/ProductCard/ProductCard";
import { SproutIcon, ShieldCheckIcon, HeartIcon } from "@/components/Icons";
import prisma from "@/lib/prisma";
import { products } from "@/data/products";
import styles from "./page.module.css";

const categories = [
  {
    name: "Fresh Microgreens",
    description: "Nutrient-rich greens for everyday meals.",
    image:
      "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=700",
  },
  {
    name: "Microgreens Mixes",
    description: "A colourful mix of fresh flavours.",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=700",
  },
  {
    name: "Fresh Produce",
    description: "Freshness that belongs on every plate.",
    image:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=700",
  },
];

function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <span className={styles.eyebrow}>
          A LITTLE MORE GREEN, EVERY DAY
        </span>

        <h1>
          Freshness,
          <br />
          Grown Naturally.
        </h1>

        <p>
          Discover fresh, vibrant microgreens that bring nutrition,
          flavour and goodness to your everyday meals.
        </p>

        <Link href="/shop" className={styles.primaryButton}>
          Explore Our Greens <span>→</span>
        </Link>
      </div>

      {/* <div className={styles.heroNote}>
        <span>01 / FRESH LIVING</span>
        <span>Grown with care. Served with goodness.</span>
      </div> */}
    </section>
  );
}

function CategorySection() {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeading}>
        <div>
          <span className={styles.eyebrow}>EXPLORE OUR COLLECTION</span>
          <h2>Something fresh for every plate.</h2>
        </div>

        <Link href="/shop" className={styles.textLink}>
          View all products →
        </Link>
      </div>

      <div className={styles.categoryGrid}>
        {categories.map((category) => (
          <Link
            href="/shop"
            className={styles.categoryCard}
            key={category.name}
          >
            <Image
              src={category.image}
              alt={category.name}
              width={700}
              height={500}
              unoptimized
              className={styles.categoryImage}
            />

            <div className={styles.categoryInfo}>
              <h3>{category.name}</h3>
              <p>{category.description}</p>
              <span>Discover →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

async function FeaturedProducts() {
  let featuredProducts = [];
  try {
    featuredProducts = await prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      select: {
        id: true,
        name: true,
        price: true,
        weight: true,
        image: true,
        category: {
          select: { id: true, name: true },
        },
      },
      take: 3,
    });
  } catch {
    // fallback
  }

  if (!featuredProducts || featuredProducts.length === 0) {
    featuredProducts = products.slice(0, 3);
  }

  return (
    <section className={`${styles.section} ${styles.productsSection}`}>
      <div className={styles.sectionHeading}>
        <div>
          <span className={styles.eyebrow}>FRESH FROM OUR COLLECTION</span>
          <h2>Fresh picks for you.</h2>
          <p>Small greens. Big goodness.</p>
        </div>

        <Link href="/shop" className={styles.textLink}>
          Shop all →
        </Link>
      </div>

      <div className={styles.productGrid}>
        {featuredProducts.map((product) => (
          <ProductCard product={product} key={product.id} />
        ))}
      </div>
    </section>
  );
}

function BenefitsSection() {
  const benefits = [
    {
      icon: <SproutIcon size={24} />,
      title: "Fresh by nature",
      description: "A fresh addition to your everyday meals.",
    },
    {
      icon: <ShieldCheckIcon size={24} />,
      title: "Grown with care",
      description: "Thoughtfully grown, one little green at a time.",
    },
    {
      icon: <HeartIcon size={24} />,
      title: "Goodness in every bite",
      description: "Bring colour, flavour and variety to your plate.",
    },
  ];

  return (
    <section className={styles.benefitsSection}>
      <span className={styles.eyebrow}>WHY CHOOSE US</span>
      <h2>A little green goes a long way.</h2>

      <div className={styles.benefitsGrid}>
        {benefits.map((benefit) => (
          <div className={styles.benefit} key={benefit.title}>
            <span className={styles.benefitIcon}>{benefit.icon}</span>
            <h3>{benefit.title}</h3>
            <p>{benefit.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturedProductsPlaceholder() {
  const fallbackList = products.slice(0, 3);
  return (
    <section className={`${styles.section} ${styles.productsSection}`}>
      <div className={styles.sectionHeading}>
        <div>
          <span className={styles.eyebrow}>FRESH FROM OUR COLLECTION</span>
          <h2>Fresh picks for you.</h2>
          <p>Small greens. Big goodness.</p>
        </div>
        <Link href="/shop" className={styles.textLink}>
          Shop all →
        </Link>
      </div>
      <div className={styles.productGrid}>
        {fallbackList.map((product) => (
          <ProductCard product={product} key={product.id} />
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <CategorySection />
      <Suspense fallback={<FeaturedProductsPlaceholder />}>
        <FeaturedProducts />
      </Suspense>
      <BenefitsSection />
    </main>
  );
}