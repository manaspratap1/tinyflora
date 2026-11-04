
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard/ProductCard";
import styles from "./shop.module.css";

const PAGE_SIZE = 9;

export default function ShopContent() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch categories once
  useEffect(() => {
    const controller = new AbortController();

    async function fetchCategories() {
      try {
        const response = await fetch("/api/categories", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Could not load categories");
        }

        const data = await response.json();
        setCategories(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Category fetch error:", err);
        }
      }
    }

    fetchCategories();

    return () => controller.abort();
  }, []);

  // Fetch products whenever filters or page change
  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        sortBy,
        sortOrder,
      });

      if (search) params.set("search", search);
      if (categoryId) params.set("categoryId", categoryId);
      if (minPrice !== "") params.set("minPrice", minPrice);
      if (maxPrice !== "") params.set("maxPrice", maxPrice);

      try {
        const response = await fetch(`/api/products?${params.toString()}`, {
          signal: controller.signal,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Could not load products");
        }

        setProducts(result.data);
        setPagination(result.pagination);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Something went wrong");
          setProducts([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => controller.abort();
  }, [page, search, categoryId, minPrice, maxPrice, sortBy, sortOrder]);

  function updateFilter(setter, value) {
    setter(value);
    setPage(1);
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setCategoryId("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  }

  return (
    <section className={styles.content}>
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>FRESH PICKS</span>
          <h2>Shop all greens</h2>
        </div>

        <span>
          {pagination.total} products
        </span>
      </div>

      <div className={styles.toolbar}>
        <input
          type="search"
          placeholder="Search microgreens..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          aria-label="Search products"
          className={styles.searchInput}
        />

        <select
          value={categoryId}
          onChange={(event) =>
            updateFilter(setCategoryId, event.target.value)
          }
          aria-label="Filter by category"
          className={styles.filterSelect}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          min="0"
          placeholder="Min ₹"
          value={minPrice}
          onChange={(event) =>
            updateFilter(setMinPrice, event.target.value)
          }
          aria-label="Minimum price"
          className={styles.priceInput}
        />

        <input
          type="number"
          min="0"
          placeholder="Max ₹"
          value={maxPrice}
          onChange={(event) =>
            updateFilter(setMaxPrice, event.target.value)
          }
          aria-label="Maximum price"
          className={styles.priceInput}
        />

        <select
          value={`${sortBy}:${sortOrder}`}
          onChange={(event) => {
            const [field, order] = event.target.value.split(":");
            setSortBy(field);
            setSortOrder(order);
            setPage(1);
          }}
          aria-label="Sort products"
          className={styles.filterSelect}
        >
          <option value="createdAt:desc">Newest</option>
          <option value="price:asc">Price: Low to high</option>
          <option value="price:desc">Price: High to low</option>
          <option value="name:asc">Name: A to Z</option>
        </select>

        <button
          type="button"
          onClick={clearFilters}
          className={styles.clearButton}
        >
          Clear filters
        </button>
      </div>

      {error && (
        <div className={styles.errorState}>
          <p>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      )}

      {!error && loading && (
        <div className={styles.loadingState}>
          <p>Finding fresh greens...</p>
        </div>
      )}

      {!error && !loading && products.length > 0 && (
        <>
          <div className={styles.productGrid}>
            {products.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>

          <div className={styles.pagination}>
            <button
              type="button"
              disabled={!pagination.hasPreviousPage || loading}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </button>

            <span>
              Page {page} of {pagination.totalPages}
            </span>

            <button
              type="button"
              disabled={!pagination.hasNextPage || loading}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}

      {!error && !loading && products.length === 0 && (
        <div className={styles.emptyState}>
          <h3>Our fresh collection is on its way.</h3>
          <p>
            {search || categoryId || minPrice || maxPrice
              ? "No products match your filters. Try changing your search."
              : "We're preparing something green for you."}
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className={styles.clearButton}
          >
            Clear filters
          </button>

          <Link href="/" className={styles.backLink}>
            Return home →
          </Link>
        </div>
      )}
    </section>
  );
}
