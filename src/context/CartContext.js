"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

const CartContext = createContext(null);

const STORAGE_KEY = "tinyflora-cart";

let cart = [];
let initialized = false;
const listeners = new Set();
const EMPTY_ARRAY = [];

function emitChange() {
  listeners.forEach((listener) => listener());
}

function initializeCart() {
  if (initialized || typeof window === "undefined") return;

  initialized = true;

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    cart = Array.isArray(stored) ? stored : [];
  } catch {
    cart = [];
  }
}

function subscribe(listener) {
  initializeCart();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  initializeCart();
  return cart;
}

function getServerSnapshot() {
  return EMPTY_ARRAY;
}

function saveCart(nextCart) {
  cart = nextCart;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Storage unavailable or quota exceeded
    }
  }

  emitChange();
}

export function CartProvider({ children }) {
  const items = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const [backendSummary, setBackendSummary] = useState(null);
  const [storeSettings, setStoreSettings] = useState({
    deliveryCharge: 40,
    freeDeliveryThreshold: 499,
  });

  // Fetch dynamic store delivery settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setStoreSettings({
            deliveryCharge: Number(data.deliveryCharge ?? 40),
            freeDeliveryThreshold: Number(data.freeDeliveryThreshold ?? 499),
          });
        }
      } catch {
        // Handled
      }
    }
    loadSettings();
  }, []);

  // Sync with backend API to compute server-side totals & verify items
  useEffect(() => {
    if (!items || items.length === 0) {
      return;
    }

    const controller = new AbortController();

    async function sync() {
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
          signal: controller.signal,
        });

        if (res.ok) {
          const data = await res.json();
          setBackendSummary(data.summary);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          // Offline fallback
        }
      }
    }

    sync();

    return () => controller.abort();
  }, [items]);

  const addToCart = useCallback((product, quantity = 1) => {
    if (!Number.isInteger(quantity) || quantity < 1) return;

    if (product.stock !== undefined && product.stock < 1) {
      throw new Error("This product is currently out of stock");
    }

    const existing = cart.find((item) => String(item.id) === String(product.id));
    const currentQuantity = existing?.quantity || 0;

    if (product.stock !== undefined && currentQuantity + quantity > product.stock) {
      throw new Error(`Only ${product.stock} packs available in stock`);
    }

    const nextCart = existing
      ? cart.map((item) =>
          String(item.id) === String(product.id)
            ? { ...item, quantity: currentQuantity + quantity }
            : item
        )
      : [
          ...cart,
          {
            id: product.id,
            name: product.name,
            price: Number(product.price),
            image: product.image,
            weight: product.weight,
            stock: product.stock,
            quantity,
          },
        ];

    saveCart(nextCart);
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    if (!Number.isInteger(quantity)) return;

    if (quantity <= 0) {
      saveCart(cart.filter((item) => String(item.id) !== String(productId)));
      return;
    }

    saveCart(
      cart.map((item) =>
        String(item.id) === String(productId)
          ? {
              ...item,
              quantity: item.stock !== undefined ? Math.min(quantity, item.stock) : quantity,
            }
          : item
      )
    );
  }, []);

  const removeFromCart = useCallback((productId) => {
    saveCart(cart.filter((item) => String(item.id) !== String(productId)));
  }, []);

  const clearCart = useCallback(() => {
    saveCart([]);
    setBackendSummary(null);
  }, []);

  const cartCount = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const localSubtotal = Number(
    items.reduce((total, item) => total + Number(item.price) * item.quantity, 0).toFixed(2)
  );

  const shippingFee =
    backendSummary?.shippingFee ??
    (localSubtotal >= storeSettings.freeDeliveryThreshold || localSubtotal === 0
      ? 0
      : storeSettings.deliveryCharge);
  const total = backendSummary?.total ?? Number((localSubtotal + shippingFee).toFixed(2));

  return (
    <CartContext.Provider
      value={{
        items,
        cartCount,
        subtotal: backendSummary?.subtotal ?? localSubtotal,
        shippingFee,
        total,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}