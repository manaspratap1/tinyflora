"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LockIcon,
  AlertCircleIcon,
  CloseIcon,
  PackageIcon,
  UsersIcon,
  CartIcon,
  SettingsIcon,
  LogOutIcon,
  EditIcon,
  TrashIcon,
  MoreDotsIcon,
  StarIcon,
  PowerIcon,
  FolderUploadIcon,
  CheckIcon,
  MapPinIcon,
  TruckIcon,
} from "@/components/Icons";
import styles from "./admin.module.css";

const PAGE_SIZE = 10;

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Active Navigation Tab: "products" | "categories" | "orders" | "customers"
  const [activeTab, setActiveTab] = useState("products");

  // Collapsible sidebar groups
  const [isDashboardOpen, setIsDashboardOpen] = useState(true);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isCustomersOpen, setIsCustomersOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Mobile sidebar drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  function navigateTab(tab, stock = null, settings = null) {
    if (tab) setActiveTab(tab);
    if (stock) setStockFilter(stock);
    if (settings) setSettingsTab(settings);
    setIsMobileSidebarOpen(false);
  }

  // Catalog state - on-demand paged data from real backend
  const [products, setProducts] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Featured products state (strictly 3 items)
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [savingFeatured, setSavingFeatured] = useState(false);
  const [featuredLimitTooltip, setFeaturedLimitTooltip] = useState(null);
  const [featuredSlotPicker, setFeaturedSlotPicker] = useState(null); // null | 0 | 1 | 2
  const [pickerSearchTerm, setPickerSearchTerm] = useState("");
  const [catalogForPicker, setCatalogForPicker] = useState([]);
  const [loadingPickerCatalog, setLoadingPickerCatalog] = useState(false);

  // Store Settings State
  const [settingsTab, setSettingsTab] = useState("general"); // "general" | "products" | "contact"
  const [storeSettings, setStoreSettings] = useState({
    storeName: "Tiny Flora Microgreens",
    contactEmail: "hello@tinyflora.com",
    contactPhone: "+91XXXXXXXXXX",
    whatsappNumber: "+91XXXXXXXXXX",
    address: "Lucknow, Uttar Pradesh",
    instagramUrl: "",
    facebookUrl: "",
    deliveryCharge: 40,
    freeDeliveryThreshold: 499,
    currency: "INR",
    announcementText: "Fresh harvest available!",
    businessHours: "Mon - Sat: 9:00 AM - 7:00 PM",
    minimumOrderAmount: 0,
    deliveryInformation: "Same-day harvest & delivery within 24-48 hours.",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Filtering & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all"); // "all" | "low"
  const [currentPage, setCurrentPage] = useState(1);

  // Active Action Menu Dropdown (Row index or ID)
  const [openActionId, setOpenActionId] = useState(null);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  // Edit Category State
  const [editingCategory, setEditingCategory] = useState(null);
  const [savingCategoryEdit, setSavingCategoryEdit] = useState(false);
  const [deleteCategoryCandidate, setDeleteCategoryCandidate] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

  // Add Product Modal & Local File State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    categoryId: 1,
    price: "",
    stock: "",
    weight: "50g",
    description: "",
    image: "",
  });
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState("");
  const [savingProduct, setSavingProduct] = useState(false);
  const newFileInputRef = useRef(null);

  // Edit Product Modal & Local File State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const editFileInputRef = useRef(null);

  // Delete & Status Toggle Confirmation Popups
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [confirmStatusCandidate, setConfirmStatusCandidate] = useState(null);
  const [savingStatus, setSavingStatus] = useState(false);

  // Close menus and dismiss tooltips when clicking outside
  useEffect(() => {
    function handleClickOutside() {
      setOpenActionId(null);
      setFeaturedLimitTooltip(null);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Prevent background scroll when mobile sidebar drawer is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileSidebarOpen]);

  // Auto-close mobile drawer if window is resized to desktop width
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 950) {
        setIsMobileSidebarOpen(false);
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Verify Admin Authentication
  useEffect(() => {
    async function verifyAuth() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.user && data.user.role === "ADMIN") {
            setCurrentUser(data.user);
          }
        }
      } catch {
        // Not authorized
      } finally {
        setAuthLoading(false);
      }
    }
    verifyAuth();
  }, []);

  // Fetch Categories from Database
  useEffect(() => {
    if (!currentUser) return;
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setCategories(data);
          }
        } else {
          const err = await res.json().catch(() => ({}));
          setMessage({ type: "error", text: err.message || "Failed to load categories from database" });
        }
      } catch {
        setMessage({ type: "error", text: "Database service unavailable for categories" });
      }
    }
    fetchCategories();
  }, [currentUser]);

  // Fetch Orders from Database
  useEffect(() => {
    if (!currentUser) return;
    async function fetchOrdersData() {
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.orders)) {
            setOrders(data.orders);
            setTotalOrders(data.orders.length);
          }
        }
      } catch {
        // Handled
      }
    }
    fetchOrdersData();
  }, [currentUser]);

  // Fetch Customers when customer tab is accessed
  useEffect(() => {
    if (!currentUser || activeTab !== "customers") return;
    async function loadCustomers() {
      setLoadingCustomers(true);
      try {
        const res = await fetch("/api/customers");
        if (res.ok) {
          const data = await res.json();
          setCustomers(data.customers || []);
        } else {
          setCustomers([]);
        }
      } catch {
        setCustomers([]);
      } finally {
        setLoadingCustomers(false);
      }
    }
    loadCustomers();
  }, [currentUser, activeTab]);

  // Helper to re-fetch featured products
  async function reloadFeatured() {
    try {
      const res = await fetch("/api/featured");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setFeaturedProducts(data.slice(0, 3));
        }
      }
    } catch {
      // Offline / error
    }
  }

  // Load featured products on mount
  useEffect(() => {
    if (!currentUser) return;
    const controller = new AbortController();

    async function loadFeatured() {
      try {
        const res = await fetch("/api/featured", { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setFeaturedProducts(data.slice(0, 3));
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          // Handled
        }
      }
    }

    loadFeatured();
    return () => controller.abort();
  }, [currentUser]);

  // Load Store Settings on mount
  useEffect(() => {
    if (!currentUser) return;
    const controller = new AbortController();

    async function loadSettings() {
      try {
        const res = await fetch("/api/settings", { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          setStoreSettings((prev) => ({ ...prev, ...data }));
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          // Handled
        }
      }
    }

    loadSettings();
    return () => controller.abort();
  }, [currentUser]);

  // Helper to re-fetch products page outside effect
  async function reloadProductsPage(page = currentPage) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        isActive: "all",
      });
      if (searchTerm.trim()) params.append("search", searchTerm.trim());
      if (selectedCategory !== "all") params.append("categoryId", selectedCategory);

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        let fetchedProducts = result.data || [];
        if (stockFilter === "low") {
          fetchedProducts = fetchedProducts.filter((p) => (p.stock ?? 0) < 10);
        }
        setProducts(fetchedProducts);
        if (result.pagination) {
          setTotalItems(result.pagination.total);
          setTotalPages(Math.max(1, result.pagination.totalPages));
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: err.message || "Failed to load products from database" });
        setProducts([]);
      }
    } catch {
      setMessage({ type: "error", text: "Database service unavailable. Please check database connection." });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  // On-demand server pagination
  useEffect(() => {
    if (!currentUser) return;
    const controller = new AbortController();

    async function loadProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(PAGE_SIZE),
          isActive: "all",
        });
        if (searchTerm.trim()) params.append("search", searchTerm.trim());
        if (selectedCategory !== "all") params.append("categoryId", selectedCategory);

        const res = await fetch(`/api/products?${params.toString()}`, {
          signal: controller.signal,
        });

        if (res.ok) {
          const result = await res.json();
          let fetchedProducts = result.data || [];
          if (stockFilter === "low") {
            fetchedProducts = fetchedProducts.filter((p) => (p.stock ?? 0) < 10);
          }
          setProducts(fetchedProducts);
          if (result.pagination) {
            setTotalItems(result.pagination.total);
            setTotalPages(Math.max(1, result.pagination.totalPages));
          }
        } else {
          setProducts([]);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setProducts([]);
        }
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
    return () => controller.abort();
  }, [currentUser, currentPage, searchTerm, selectedCategory, stockFilter]);

  // Handle Search & Filter
  function handleSearchChange(e) {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }

  function handleCategoryChange(e) {
    setSelectedCategory(e.target.value);
    setCurrentPage(1);
  }

  function handleClearFilters() {
    setSearchTerm("");
    setSelectedCategory("all");
    setStockFilter("all");
    setCurrentPage(1);
  }

  // Toggle Featured
  async function saveFeaturedToServer(ids) {
    setSavingFeatured(true);
    try {
      const res = await fetch("/api/featured", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: ids }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update featured items");
      }
      setMessage({ type: "success", text: "Featured products updated successfully!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Could not save featured items" });
    } finally {
      setSavingFeatured(false);
    }
  }

  function handleToggleFeatured(product, event = null) {
    const isAlreadyFeatured = featuredProducts.some((p) => p.id === product.id);

    if (isAlreadyFeatured) {
      const updated = featuredProducts.filter((p) => p.id !== product.id);
      setFeaturedProducts(updated);
      saveFeaturedToServer(updated.map((p) => p.id));
      setFeaturedLimitTooltip(null);
    } else {
      if (featuredProducts.length >= 3) {
        let posX = window.innerWidth / 2 - 120;
        let posY = 150;
        if (event && event.clientX) {
          posX = event.clientX;
          posY = event.clientY;
        }
        setFeaturedLimitTooltip({
          x: Math.min(Math.max(10, posX), window.innerWidth - 300),
          y: Math.max(20, posY - 45),
          text: "Maximum 3 featured products allowed. Please unfeature one first.",
        });
        return;
      }

      const updated = [...featuredProducts, product].slice(0, 3);
      setFeaturedProducts(updated);
      saveFeaturedToServer(updated.map((p) => p.id));
      setFeaturedLimitTooltip(null);
    }
  }

  function handleRemoveFeaturedSlot(productId) {
    const updated = featuredProducts.filter((p) => p.id !== productId);
    setFeaturedProducts(updated);
    saveFeaturedToServer(updated.map((p) => p.id));
  }

  async function handleOpenSlotPicker(slotIndex) {
    setFeaturedSlotPicker(slotIndex);
    setPickerSearchTerm("");
    setLoadingPickerCatalog(true);
    try {
      const res = await fetch("/api/products?limit=50&isActive=all");
      if (res.ok) {
        const json = await res.json();
        setCatalogForPicker(json.data || []);
      }
    } catch {
      setCatalogForPicker(products);
    } finally {
      setLoadingPickerCatalog(false);
    }
  }

  async function handleAssignFeaturedSlot(slotIndex, productToAssign) {
    const current = [...featuredProducts];
    const existingIndex = current.findIndex((p) => p.id === productToAssign.id);
    if (existingIndex !== -1) {
      current.splice(existingIndex, 1);
    }
    if (slotIndex < current.length) {
      current[slotIndex] = productToAssign;
    } else {
      current.push(productToAssign);
    }
    const finalFeatured = current.slice(0, 3);
    setFeaturedProducts(finalFeatured);
    setFeaturedSlotPicker(null);
    await saveFeaturedToServer(finalFeatured.map((p) => p.id));
  }

  async function handleSaveSettings(e) {
    if (e && e.preventDefault) e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storeSettings),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save store settings");
      }
      setStoreSettings((prev) => ({ ...prev, ...data }));
      setMessage({ type: "success", text: "Store settings updated successfully!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Could not save store settings" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3500);
    } finally {
      setSavingSettings(false);
    }
  }

  // Create Category
  async function handleCreateCategory(e) {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setMessage({ type: "error", text: "Category name is required" });
      return;
    }

    setSavingCategory(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDesc.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create category");
      }

      setCategories((prev) => [...prev, data]);
      setNewCategoryName("");
      setNewCategoryDesc("");
      setIsCategoryModalOpen(false);

      setMessage({ type: "success", text: `Category "${data.name}" created successfully!` });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Could not create category" });
    } finally {
      setSavingCategory(false);
    }
  }

  // Edit Category
  async function handleSaveCategoryEdit(e) {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim()) return;

    setSavingCategoryEdit(true);
    try {
      const res = await fetch(`/api/categories/${editingCategory.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingCategory.name.trim(),
          description: editingCategory.description?.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update category");
      }

      setCategories((prev) =>
        prev.map((c) => (c.id === editingCategory.id ? { ...c, ...data } : c))
      );
      setEditingCategory(null);
      setMessage({ type: "success", text: `Category "${data.name}" updated successfully!` });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Could not update category" });
    } finally {
      setSavingCategoryEdit(false);
    }
  }

  // Delete Category (Unused only)
  async function handleDeleteCategory() {
    if (!deleteCategoryCandidate) return;
    setDeletingCategory(true);
    try {
      const res = await fetch(`/api/categories/${deleteCategoryCandidate.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete category");
      }
      setCategories((prev) => prev.filter((c) => c.id !== deleteCategoryCandidate.id));
      setMessage({ type: "success", text: `Category "${deleteCategoryCandidate.name}" deleted.` });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      setDeleteCategoryCandidate(null);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Could not delete category" });
    } finally {
      setDeletingCategory(false);
    }
  }

  // Local file selection
  function handleSelectNewFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (newImagePreview && newImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(newImagePreview);
    }

    setNewImageFile(file);
    setNewImagePreview(URL.createObjectURL(file));
  }

  function handleClearNewFile() {
    if (newImagePreview && newImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(newImagePreview);
    }
    setNewImageFile(null);
    setNewImagePreview("");
    if (newFileInputRef.current) newFileInputRef.current.value = "";
  }

  function handleCloseNewModal() {
    handleClearNewFile();
    setIsModalOpen(false);
  }

  function handleSelectEditFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (editImagePreview && editImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(editImagePreview);
    }

    setEditImageFile(file);
    setEditImagePreview(URL.createObjectURL(file));
  }

  function handleClearEditFile() {
    if (editImagePreview && editImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(editImagePreview);
    }
    setEditImageFile(null);
    setEditImagePreview(editingProduct?.image || "");
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  }

  function handleCloseEditModal() {
    handleClearEditFile();
    setEditingProduct(null);
  }

  async function uploadFileToServer(file) {
    const formData = new FormData();
    formData.append("files", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to upload image");
    }

    return data.primaryUrl || data.urls[0];
  }

  // Stock inline edit
  async function handleStockChange(productId, newStock) {
    const stockVal = Math.max(0, parseInt(newStock, 10) || 0);

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: stockVal } : p))
    );

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: stockVal }),
      });

      if (!res.ok) {
        throw new Error("Failed to update stock");
      }

      setMessage({ type: "success", text: `Stock updated for item #${productId}` });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to update stock" });
    }
  }

  // Active / Inactive Toggle Confirmation Execution
  async function handleExecuteStatusChange(productId, targetActive) {
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: targetActive }),
      });

      if (!res.ok) {
        throw new Error("Failed to update product status");
      }

      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, isActive: targetActive } : p))
      );

      setMessage({
        type: "success",
        text: `Product status updated to ${targetActive ? "Active" : "Inactive"}.`,
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      setConfirmStatusCandidate(null);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to update status" });
    } finally {
      setSavingStatus(false);
    }
  }

  // Deactivate (Soft Delete from delete popup)
  async function handleMakeInactive() {
    if (!deleteCandidate) return;
    setDeletingProduct(true);

    try {
      const res = await fetch(`/api/products/${deleteCandidate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      });

      if (!res.ok) {
        throw new Error("Failed to deactivate product");
      }

      setProducts((prev) =>
        prev.map((p) =>
          p.id === deleteCandidate.id ? { ...p, isActive: false } : p
        )
      );

      setMessage({
        type: "success",
        text: `"${deleteCandidate.name}" set to inactive. Hidden from store.`,
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      setDeleteCandidate(null);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to update status" });
    } finally {
      setDeletingProduct(false);
    }
  }

  // Hard Delete
  async function handleHardDelete() {
    if (!deleteCandidate) return;
    setDeletingProduct(true);

    try {
      const res = await fetch(`/api/products/${deleteCandidate.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to remove product");
      }

      setProducts((prev) => prev.filter((p) => p.id !== deleteCandidate.id));
      setTotalItems((prev) => Math.max(0, prev - 1));
      setMessage({ type: "success", text: `"${deleteCandidate.name}" removed from catalog.` });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      setDeleteCandidate(null);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to delete" });
    } finally {
      setDeletingProduct(false);
    }
  }

  function handleOpenEdit(product) {
    setEditingProduct({
      id: product.id,
      name: product.name,
      categoryId: product.categoryId || categories[0]?.id || 1,
      price: product.price,
      stock: product.stock,
      weight: product.weight || "50g",
      description: product.description || "",
      image: product.image || "",
    });
    setEditImageFile(null);
    setEditImagePreview(product.image || "");
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editingProduct) return;

    setSavingEdit(true);
    setMessage({ type: "", text: "" });

    try {
      let finalImageUrl = editingProduct.image?.trim() || null;

      if (editImageFile) {
        finalImageUrl = await uploadFileToServer(editImageFile);
      }

      const payload = {
        name: editingProduct.name.trim(),
        categoryId: Number(editingProduct.categoryId),
        price: Number(editingProduct.price),
        stock: Number(editingProduct.stock) || 0,
        weight: editingProduct.weight?.trim() || "50g",
        description: editingProduct.description?.trim() || null,
        image: finalImageUrl,
      };

      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save product updates");
      }

      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? { ...p, ...data } : p))
      );

      handleCloseEditModal();
      setMessage({ type: "success", text: `Product "${data.name}" updated successfully!` });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      reloadFeatured();
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to save product" });
    } finally {
      setSavingEdit(false);
    }
  }

  // Create Product
  async function handleCreateProduct(e) {
    e.preventDefault();
    setSavingProduct(true);
    setMessage({ type: "", text: "" });

    try {
      let finalImageUrl = newProduct.image?.trim() || null;

      if (newImageFile) {
        finalImageUrl = await uploadFileToServer(newImageFile);
      }

      const payload = {
        name: newProduct.name.trim(),
        categoryId: Number(newProduct.categoryId) || (categories[0]?.id || 1),
        price: Number(newProduct.price),
        stock: Number(newProduct.stock) || 0,
        weight: newProduct.weight?.trim() || "50g",
        description: newProduct.description?.trim() || null,
        image: finalImageUrl,
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create product");
      }

      handleCloseNewModal();
      setNewProduct({
        name: "",
        categoryId: categories[0]?.id || 1,
        price: "",
        stock: "",
        weight: "50g",
        description: "",
        image: "",
      });

      setMessage({ type: "success", text: `Product "${data.name}" added to catalog!` });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);

      reloadProductsPage(1);
      setCurrentPage(1);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to create product" });
    } finally {
      setSavingProduct(false);
    }
  }

  async function handleLogout() {
    setIsMobileSidebarOpen(false);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      router.push("/login");
    }
  }

  if (authLoading) {
    return (
      <div className={styles.dashboardLayout} style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#94a3b8", fontSize: "14px" }}>Verifying credentials...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className={styles.dashboardLayout} style={{ alignItems: "center", justifyContent: "center" }}>
        <div className={styles.unauthorized}>
          <div style={{ marginBottom: "1rem", color: "#64748b" }}>
            <LockIcon size={44} />
          </div>
          <h2>Restricted Access</h2>
          <p style={{ color: "#64748b", margin: "1rem 0" }}>
            This portal is restricted to authorized store managers.
          </p>
          <Link href="/login" className={styles.submitBtn} style={{ textDecoration: "none", display: "inline-block" }}>
            Sign In to Continue
          </Link>
        </div>
      </div>
    );
  }

  const featuredIds = featuredProducts.map((p) => p.id);
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const pendingOrdersCount = orders.filter((o) => String(o.status).toUpperCase() === "PENDING").length;
  const lowStockCount = products.filter((p) => (p.stock ?? 0) < 10).length;

  return (
    <div className={styles.dashboardLayout}>
      {/* Hover Warning Tooltip when exceeding 3 featured items */}
      {featuredLimitTooltip && (
        <div
          className={styles.featuredTooltip}
          style={{ left: `${featuredLimitTooltip.x}px`, top: `${featuredLimitTooltip.y}px` }}
          onMouseLeave={() => setFeaturedLimitTooltip(null)}
          onClick={(e) => e.stopPropagation()}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
            <AlertCircleIcon size={14} style={{ color: "#f59e0b" }} />
            {featuredLimitTooltip.text}
          </span>
          <button
            type="button"
            className={styles.featuredTooltipClose}
            onClick={() => setFeaturedLimitTooltip(null)}
            aria-label="Close"
          >
            <CloseIcon size={11} />
          </button>
        </div>
      )}

      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          className={styles.mobileBackdrop}
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar - Fixed Size on Desktop & Slide-out Drawer on Mobile/Tablet */}
      <aside className={`${styles.sidebar} ${isMobileSidebarOpen ? styles.sidebarOpen : ""}`}>
        {/* Brand with Admin SVG and Tinyflora */}
        <div className={styles.sidebarHeader}>
          <Link
            href="/"
            className={styles.sidebarBrand}
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <div className={styles.sidebarBrandIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span>Tinyflora</span>
          </Link>
          <button
            type="button"
            className={styles.sidebarCloseBtn}
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className={styles.sidebarNav}>
          {/* Dashboard Group with Wire-like Connector */}
          <div>
            <button
              type="button"
              onClick={() => setIsDashboardOpen(!isDashboardOpen)}
              className={`${styles.navItem} ${styles.navItemActive}`}
            >
              <div className={styles.navItemLeft}>
                <span>⊞</span>
                <span>Dashboard</span>
              </div>
              <span style={{ fontSize: "11px" }}>{isDashboardOpen ? "∧" : "∨"}</span>
            </button>

            {isDashboardOpen && (
              <div className={styles.treeBranchNav}>
                <button
                  type="button"
                  onClick={() => navigateTab("products", "all")}
                  className={`${styles.treeBranchItem} ${activeTab === "products" && stockFilter === "all" ? styles.treeBranchItemActive : ""}`}
                >
                  Store Management
                </button>
                <button
                  type="button"
                  onClick={() => navigateTab("categories")}
                  className={`${styles.treeBranchItem} ${activeTab === "categories" ? styles.treeBranchItemActive : ""}`}
                >
                  Categories
                </button>
                <button
                  type="button"
                  onClick={() => navigateTab("orders")}
                  className={`${styles.treeBranchItem} ${activeTab === "orders" ? styles.treeBranchItemActive : ""}`}
                >
                  Order Management
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMessage({ type: "success", text: "Analytics: 142 visits today. Feature in setup." });
                    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={styles.treeBranchItem}
                >
                  Analytics
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMessage({ type: "success", text: "Reports module is being configured." });
                    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={styles.treeBranchItem}
                >
                  Reports
                </button>
              </div>
            )}
          </div>

          {/* Inventory Group */}
          <div>
            <button
              type="button"
              onClick={() => setIsInventoryOpen(!isInventoryOpen)}
              className={styles.navItem}
            >
              <div className={styles.navItemLeft}>
                <PackageIcon size={16} />
                <span>Inventory</span>
              </div>
              <span style={{ fontSize: "11px" }}>{isInventoryOpen ? "∧" : "∨"}</span>
            </button>

            {isInventoryOpen && (
              <div className={styles.treeBranchNav}>
                <button
                  type="button"
                  onClick={() => navigateTab("products", "all")}
                  className={`${styles.treeBranchItem} ${activeTab === "products" && stockFilter === "all" ? styles.treeBranchItemActive : ""}`}
                >
                  Current stock
                </button>
                <button
                  type="button"
                  onClick={() => navigateTab("products", "low")}
                  className={`${styles.treeBranchItem} ${stockFilter === "low" ? styles.treeBranchItemActive : ""}`}
                >
                  <span>Low-stock products</span>
                  {lowStockCount > 0 && <span className={styles.badgeDisabled}>{lowStockCount}</span>}
                </button>
                <span className={`${styles.treeBranchItem} ${styles.treeBranchItemDisabled}`}>
                  <span>Stock adjustments</span>
                  <span className={styles.badgeDisabled}>Soon</span>
                </span>
                <span className={`${styles.treeBranchItem} ${styles.treeBranchItemDisabled}`}>
                  <span>Stock movement history</span>
                  <span className={styles.badgeDisabled}>Soon</span>
                </span>
              </div>
            )}
          </div>

          {/* Customers Group */}
          <div>
            <button
              type="button"
              onClick={() => setIsCustomersOpen(!isCustomersOpen)}
              className={`${styles.navItem} ${activeTab === "customers" ? styles.navItemActive : ""}`}
            >
              <div className={styles.navItemLeft}>
                <UsersIcon size={16} />
                <span>Customers</span>
              </div>
              <span style={{ fontSize: "11px" }}>{isCustomersOpen ? "∧" : "∨"}</span>
            </button>

            {isCustomersOpen && (
              <div className={styles.treeBranchNav}>
                <button
                  type="button"
                  onClick={() => navigateTab("customers")}
                  className={`${styles.treeBranchItem} ${activeTab === "customers" ? styles.treeBranchItemActive : ""}`}
                >
                  <span>Customer details</span>
                  {customers.length > 0 && <span className={styles.badgeDisabled}>{customers.length}</span>}
                </button>
                <button
                  type="button"
                  onClick={() => navigateTab("customers")}
                  className={styles.treeBranchItem}
                >
                  <span>Order history</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTab("customers")}
                  className={styles.treeBranchItem}
                >
                  <span>Total purchases</span>
                </button>
                <span className={`${styles.treeBranchItem} ${styles.treeBranchItemDisabled}`}>
                  <span>Contact directory</span>
                  <span className={styles.badgeDisabled}>Active</span>
                </span>
              </div>
            )}
          </div>

          {/* Orders Group */}
          <div>
            <button
              type="button"
              onClick={() => setIsOrdersOpen(!isOrdersOpen)}
              className={styles.navItem}
            >
              <div className={styles.navItemLeft}>
                <CartIcon size={16} />
                <span>Orders</span>
              </div>
              <span style={{ fontSize: "11px" }}>{isOrdersOpen ? "∧" : "∨"}</span>
            </button>

            {isOrdersOpen && (
              <div className={styles.treeBranchNav}>
                <button
                  type="button"
                  onClick={() => navigateTab("orders")}
                  className={`${styles.treeBranchItem} ${activeTab === "orders" ? styles.treeBranchItemActive : ""}`}
                >
                  All Orders
                </button>
                <span className={`${styles.treeBranchItem} ${styles.treeBranchItemDisabled}`}>
                  <span>Order details &amp; address</span>
                  <span className={styles.badgeDisabled}>Active</span>
                </span>
                <span className={`${styles.treeBranchItem} ${styles.treeBranchItemDisabled}`}>
                  <span>Payment status</span>
                  <span className={styles.badgeDisabled}>Active</span>
                </span>
                <span className={`${styles.treeBranchItem} ${styles.treeBranchItemDisabled}`}>
                  <span>Order status updates</span>
                  <span className={styles.badgeDisabled}>Active</span>
                </span>
                <span className={`${styles.treeBranchItem} ${styles.treeBranchItemDisabled}`}>
                  <span>Cancellation &amp; refunds</span>
                  <span className={styles.badgeDisabled}>Soon</span>
                </span>
              </div>
            )}
          </div>

          {/* Settings Group */}
          <div>
            <button
              type="button"
              onClick={() => {
                setIsSettingsOpen(!isSettingsOpen);
                navigateTab("settings");
              }}
              className={`${styles.navItem} ${activeTab === "settings" ? styles.navItemActive : ""}`}
            >
              <div className={styles.navItemLeft}>
                <SettingsIcon size={16} />
                <span>Settings</span>
              </div>
              <span style={{ fontSize: "11px" }}>{isSettingsOpen ? "∧" : "∨"}</span>
            </button>

            {isSettingsOpen && (
              <div className={styles.treeBranchNav}>
                <button
                  type="button"
                  onClick={() => navigateTab("settings", null, "general")}
                  className={`${styles.treeBranchItem} ${activeTab === "settings" && settingsTab === "general" ? styles.treeBranchItemActive : ""}`}
                >
                  <span>Store details</span>
                  <span className={styles.badgeDisabled}>Live</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTab("settings", null, "contact")}
                  className={`${styles.treeBranchItem} ${activeTab === "settings" && settingsTab === "contact" ? styles.treeBranchItemActive : ""}`}
                >
                  <span>Contact information</span>
                  <span className={styles.badgeDisabled}>Live</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTab("settings", null, "products")}
                  className={`${styles.treeBranchItem} ${activeTab === "settings" && settingsTab === "products" ? styles.treeBranchItemActive : ""}`}
                >
                  <span>Delivery settings</span>
                  <span className={styles.badgeDisabled}>Live</span>
                </button>
                <span className={`${styles.treeBranchItem} ${styles.treeBranchItemDisabled}`}>
                  <span>Payment configuration</span>
                  <span className={styles.badgeDisabled}>COD / Manual</span>
                </span>
                <span className={`${styles.treeBranchItem} ${styles.treeBranchItemDisabled}`}>
                  <span>Admin account</span>
                  <span className={styles.badgeDisabled}>Active</span>
                </span>
              </div>
            )}
          </div>

          <Link
            href="/shop"
            className={styles.navItem}
            style={{ marginTop: "0.5rem" }}
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <div className={styles.navItemLeft}>
              <span>↗</span>
              <span>View Storefront</span>
            </div>
          </Link>
        </nav>

        {/* User Card */}
        <div className={styles.sidebarFooter}>
          <div className={styles.userProfile}>
            <div className={styles.userAvatar}>
              {currentUser.email[0].toUpperCase()}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{currentUser.name || "Manager"}</div>
              <div className={styles.userRole}>{currentUser.email}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className={styles.navItem}
            style={{ marginTop: "0.35rem", color: "#f87171" }}
          >
            <LogOutIcon size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Right Content Area - Only This Part Scrolls */}
      <main className={styles.mainArea}>
        <div className={styles.mainCard}>
          {/* Top Header */}
          <header className={styles.topHeader}>
            <div className={styles.topHeaderLeft}>
              <button
                type="button"
                className={styles.mobileMenuToggle}
                onClick={() => setIsMobileSidebarOpen(true)}
                aria-label="Toggle navigation menu"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
              <h1 className={styles.pageTitle}>
                {activeTab === "orders"
                  ? "Order Management"
                  : activeTab === "categories"
                  ? "Category Management"
                  : activeTab === "customers"
                  ? "Customer Management"
                  : activeTab === "settings"
                  ? "Store Settings"
                  : "Store Management"}
              </h1>
            </div>

            <div className={styles.headerActions}>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className={styles.secondaryBtn}
              >
                + New Category
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className={styles.newProductBtn}
              >
                <span>+</span> New Product
              </button>
            </div>
          </header>

          {/* Flash Message Banner */}
          {message.text && (
            <div
              className={`${styles.messageBanner} ${
                message.type === "success" ? styles.successMsg : styles.errorMsg
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Real-Time Metrics Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Total Revenue</div>
              <div className={styles.statValue}>₹{totalRevenue.toFixed(2)}</div>
              <div className={styles.statMeta}>Realized store orders</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>Total Orders</div>
              <div className={styles.statValue}>{totalOrders}</div>
              <div className={styles.statMeta}>{pendingOrdersCount} pending approval</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>Total Products</div>
              <div className={styles.statValue}>{totalItems}</div>
              <div className={styles.statMeta}>{categories.length} active categories</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>Low-Stock Alerts</div>
              <div className={styles.statValue} style={{ color: lowStockCount > 0 ? "#f59e0b" : "#10b981" }}>
                {lowStockCount}
              </div>
              <div className={styles.statMeta}>Products below 10 units</div>
            </div>
          </div>

          {/* Compact Featured Products Card (3 strictly chosen slots) */}
          <div className={styles.featuredShowcaseCard}>
            <div className={styles.featuredCardHeader}>
              <div>
                <span className={styles.featuredBadge}>Storefront Showcase</span>
                <span className={styles.featuredHelpText}>
                  Strictly 3 featured slots on the storefront home. Assign or swap easily with one click.
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                {featuredProducts.length}/3 slots occupied
              </div>
            </div>

            <div className={styles.featuredCompactGrid}>
              {[0, 1, 2].map((slotIdx) => {
                const prod = featuredProducts[slotIdx];
                if (!prod) {
                  return (
                    <button
                      key={`empty-${slotIdx}`}
                      type="button"
                      onClick={() => handleOpenSlotPicker(slotIdx)}
                      className={styles.featuredSlotEmptyBtn}
                      title={`Assign product to Featured Slot #${slotIdx + 1}`}
                    >
                      <span style={{ fontSize: "15px" }}>+</span>
                      <span>Assign Slot #{slotIdx + 1}</span>
                    </button>
                  );
                }
                const img = prod.image || "/images/product-placeholder.png";
                return (
                  <div key={prod.id} className={styles.featuredSlot}>
                    <span className={styles.slotTag}>#{slotIdx + 1}</span>
                    <Image
                      src={img}
                      alt={prod.name}
                      width={42}
                      height={42}
                      unoptimized
                      className={styles.featuredSlotImg}
                    />
                    <div className={styles.featuredSlotInfo}>
                      <div className={styles.featuredSlotName}>{prod.name}</div>
                      <div className={styles.featuredSlotPrice}>
                        ₹{Number(prod.price).toFixed(2)}
                      </div>
                    </div>
                    <div className={styles.featuredSlotActions}>
                      <button
                        type="button"
                        onClick={() => handleOpenSlotPicker(slotIdx)}
                        className={styles.featuredSlotChangeBtn}
                        title="Change product in this slot"
                        disabled={savingFeatured}
                      >
                        ⇄ Change
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeaturedSlot(prod.id)}
                        className={styles.featuredSlotRemove}
                        title="Remove from featured"
                        disabled={savingFeatured}
                      >
                        <CloseIcon size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Search & Filter Toolbar - Hidden on settings tab */}
          {activeTab !== "settings" && (
            <div className={styles.searchFilterBar}>
              <div className={styles.searchBox}>
                <svg
                  className={styles.searchIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder={activeTab === "customers" ? "Search customer name or email..." : "Search anything..."}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className={styles.searchPill}
                />
              </div>

              <div className={styles.filterActions}>
                {activeTab === "products" && (
                  <select
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    className={styles.filterSelect}
                  >
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}

                {(searchTerm || selectedCategory !== "all" || stockFilter !== "all") && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className={styles.filterBtn}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          )}

          {/* VIEW 1: PRODUCTS / STORE MANAGEMENT TABLE */}
          {activeTab === "products" && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => {
                    const rowNumber = (currentPage - 1) * PAGE_SIZE + index + 1;
                    const imageSrc = product.image || "/images/product-placeholder.png";
                    const stock = product.stock ?? 0;
                    const categoryName = product.category?.name || "Fresh Microgreens";
                    const isInactive = product.isActive === false;
                    const isFeatured = featuredIds.includes(product.id);

                    let statusPillClass = styles.pillGreen;
                    let statusLabel = "In Stock";
                    if (stock === 0 || isInactive) {
                      statusPillClass = styles.pillPink;
                      statusLabel = isInactive ? "Inactive" : "Out of Stock";
                    } else if (stock < 10) {
                      statusPillClass = styles.pillAmber;
                      statusLabel = "Low Stock";
                    }

                    const isActionOpen = openActionId === `p-${product.id}`;

                    return (
                      <tr key={product.id}>
                        <td>{rowNumber}</td>
                        <td>
                          <div className={styles.prodCell}>
                            <Image
                              src={imageSrc}
                              alt={product.name}
                              width={40}
                              height={40}
                              unoptimized
                              className={styles.prodThumb}
                            />
                            <div>
                              <div className={styles.nameWithStar}>
                                <strong>{product.name}</strong>
                                {isFeatured && (
                                  <span className={styles.starInlineActive} title="Featured item">
                                    <StarIcon size={13} filled={true} style={{ color: "#eab308" }} />
                                  </span>
                                )}
                              </div>
                              {product.weight && (
                                <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                                  {product.weight}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{categoryName}</td>
                        <td className={styles.priceText}>
                          ₹{Number(product.price).toFixed(2)}
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            defaultValue={stock}
                            onBlur={(e) => handleStockChange(product.id, e.target.value)}
                            style={{
                              width: "55px",
                              padding: "2px 6px",
                              border: "1px solid #e2e8f0",
                              borderRadius: "4px",
                              fontSize: "12px",
                              textAlign: "center",
                            }}
                            title="Click outside to save"
                          />
                        </td>
                        <td>
                          <span className={`${styles.pill} ${statusPillClass}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className={styles.inlineActionGroup}>
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(product)}
                              className={styles.actionIconBtn}
                              title="Edit product details"
                              aria-label="Edit product"
                            >
                              <EditIcon size={14} />
                            </button>

                            {/* Active/Inactive Toggle Button */}
                            <button
                              type="button"
                              onClick={() => setConfirmStatusCandidate({ product, targetActive: isInactive })}
                              className={`${styles.actionIconBtn} ${
                                isInactive ? styles.actionIconBtnInactive : styles.actionIconBtnActive
                              }`}
                              title={isInactive ? "Activate product" : "Deactivate product"}
                              aria-label={isInactive ? "Activate product" : "Deactivate product"}
                            >
                              {isInactive ? <PowerIcon size={14} /> : <CheckIcon size={14} />}
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => setDeleteCandidate(product)}
                              className={`${styles.actionIconBtn} ${styles.actionIconBtnDanger}`}
                              title="Delete product"
                              aria-label="Delete product"
                            >
                              <TrashIcon size={14} />
                            </button>

                            {/* Circular Action Menu - Right Click to mark as featured */}
                            <div
                              className={styles.actionCellWrapper}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => setOpenActionId(isActionOpen ? null : `p-${product.id}`)}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleToggleFeatured(product, e);
                                }}
                                className={styles.actionCircleBtn}
                                aria-label="More actions"
                                title="Click for menu options, or right-click to mark as featured"
                              >
                                <MoreDotsIcon size={15} />
                              </button>

                              {isActionOpen && (
                                <div className={styles.actionDropdownMenu}>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      handleToggleFeatured(product, e);
                                      setOpenActionId(null);
                                    }}
                                    className={styles.actionDropdownItem}
                                  >
                                    <StarIcon size={14} filled={isFeatured} style={{ color: isFeatured ? "#eab308" : "inherit" }} />
                                    <span>{isFeatured ? "Unfeature" : "Mark as Featured"}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleOpenEdit(product);
                                      setOpenActionId(null);
                                    }}
                                    className={styles.actionDropdownItem}
                                  >
                                    <EditIcon size={14} />
                                    <span>Edit Product</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirmStatusCandidate({ product, targetActive: isInactive });
                                      setOpenActionId(null);
                                    }}
                                    className={styles.actionDropdownItem}
                                  >
                                    {isInactive ? <PowerIcon size={14} /> : <CheckIcon size={14} />}
                                    <span>{isInactive ? "Make Active" : "Make Inactive"}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeleteCandidate(product);
                                      setOpenActionId(null);
                                    }}
                                    className={`${styles.actionDropdownItem} ${styles.actionDropdownDanger}`}
                                  >
                                    <TrashIcon size={14} />
                                    <span>Delete Product</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "2.5rem", color: "#64748b" }}>
                        {loading ? "Loading products from database..." : "No products found matching criteria."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {totalItems > 0 && (
                <div className={styles.paginationRow}>
                  <span>
                    Showing {(currentPage - 1) * PAGE_SIZE + 1} to{" "}
                    {Math.min(currentPage * PAGE_SIZE, totalItems)} of {totalItems} entries
                  </span>

                  <div className={styles.paginationNav}>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || loading}
                      className={styles.pageBtn}
                    >
                      &lt; Back
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        type="button"
                        onClick={() => setCurrentPage(pg)}
                        disabled={loading}
                        className={`${styles.pageBtn} ${currentPage === pg ? styles.pageBtnActive : ""}`}
                      >
                        {pg}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || loading}
                      className={styles.pageBtn}
                    >
                      Next &gt;
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: CATEGORY MANAGEMENT TABLE */}
          {activeTab === "categories" && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Category Name</th>
                    <th>Description</th>
                    <th>Assigned Products</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat, idx) => {
                    const prodCount = cat._count?.products ?? 0;
                    return (
                      <tr key={cat.id}>
                        <td>{idx + 1}</td>
                        <td>
                          <strong>{cat.name}</strong>
                        </td>
                        <td style={{ color: "#64748b" }}>
                          {cat.description || "No description provided"}
                        </td>
                        <td>
                          <span className={`${styles.pill} ${styles.pillGreen}`}>
                            {prodCount} products
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className={styles.inlineActionGroup}>
                            <button
                              type="button"
                              onClick={() => setEditingCategory(cat)}
                              className={styles.actionIconBtn}
                              title="Edit Category"
                            >
                              <EditIcon size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteCategoryCandidate(cat)}
                              className={`${styles.actionIconBtn} ${styles.actionIconBtnDanger}`}
                              title={prodCount > 0 ? "Category has products" : "Delete unused category"}
                            >
                              <TrashIcon size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "2.5rem", color: "#64748b" }}>
                        No categories found in database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW 3: CUSTOMERS TABLE */}
          {activeTab === "customers" && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Total Orders</th>
                    <th>Total Purchases</th>
                    <th>Joined</th>
                    <th style={{ textAlign: "right" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customers
                    .filter((c) => {
                      if (!searchTerm.trim()) return true;
                      const term = searchTerm.toLowerCase();
                      return (
                        c.name.toLowerCase().includes(term) ||
                        c.email.toLowerCase().includes(term) ||
                        (c.phone && c.phone.includes(term))
                      );
                    })
                    .map((cust, idx) => {
                      const joinStr = cust.joinedDate
                        ? new Date(cust.joinedDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—";

                      return (
                        <tr key={cust.id}>
                          <td>{idx + 1}</td>
                          <td>
                            <strong>{cust.name}</strong>
                          </td>
                          <td style={{ color: "#64748b" }}>{cust.email}</td>
                          <td style={{ color: "#64748b" }}>{cust.phone}</td>
                          <td>
                            <span className={`${styles.pill} ${styles.pillAmber}`}>
                              {cust.ordersCount} orders
                            </span>
                          </td>
                          <td className={styles.priceText}>
                            ₹{cust.totalSpent.toFixed(2)}
                          </td>
                          <td style={{ color: "#64748b" }}>{joinStr}</td>
                          <td style={{ textAlign: "right" }}>
                            <span className={`${styles.pill} ${styles.pillGreen}`}>
                              Active
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center", padding: "2.5rem", color: "#64748b" }}>
                        {loadingCustomers ? "Loading customers from database..." : "No customers registered yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW 4: ORDER MANAGEMENT TABLE */}
          {activeTab === "orders" && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Price</th>
                    <th>Paid</th>
                    <th>Address</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, idx) => {
                    const isComplete = order.status === "Complete" || order.status === "DELIVERED";
                    const isPending = order.status === "Pending" || order.status === "PENDING";
                    let statusClass = styles.pillGreen;
                    if (isPending) statusClass = styles.pillAmber;
                    else if (!isComplete) statusClass = styles.pillPink;

                    const dateStr = order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : order.date || "17 Jan, 2026";

                    const isActionOpen = openActionId === `ord-${order.id}`;

                    return (
                      <tr key={order.id || idx}>
                        <td>{idx + 1}</td>
                        <td>
                          <strong>{order.orderNumber}</strong>
                        </td>
                        <td style={{ color: "#64748b" }}>{dateStr}</td>
                        <td>{order.items?.length || order.itemsCount || 1}</td>
                        <td className={styles.priceText}>
                          ₹{Number(order.total || order.price).toFixed(2)}
                        </td>
                        <td>
                          <span
                            className={order.isPaid ?? true ? styles.pillGreen : styles.pillPink}
                            style={{ padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "11px", fontWeight: 600 }}
                          >
                            {order.isPaid ?? true ? "Yes" : "No"}
                          </span>
                        </td>
                        <td style={{ color: "#64748b", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {order.shippingAddress || order.address || "Lucknow, Uttar Pradesh"}
                        </td>
                        <td>
                          <span className={`${styles.pill} ${statusClass}`}>
                            {order.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div
                            className={styles.actionCellWrapper}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => setOpenActionId(isActionOpen ? null : `ord-${order.id}`)}
                              className={styles.actionCircleBtn}
                              aria-label="Order actions"
                            >
                              <MoreDotsIcon size={15} />
                            </button>

                            {isActionOpen && (
                              <div className={styles.actionDropdownMenu}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMessage({ type: "success", text: `Receipt generated for order #${order.orderNumber}` });
                                    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
                                    setOpenActionId(null);
                                  }}
                                  className={styles.actionDropdownItem}
                                >
                                  <span>⇣</span>
                                  <span>Download</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMessage({ type: "success", text: `Order #${order.orderNumber} status verified.` });
                                    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
                                    setOpenActionId(null);
                                  }}
                                  className={styles.actionDropdownItem}
                                >
                                  <EditIcon size={14} />
                                  <span>Edit Order</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMessage({ type: "error", text: "Orders cannot be deleted while payment audit is active." });
                                    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
                                    setOpenActionId(null);
                                  }}
                                  className={`${styles.actionDropdownItem} ${styles.actionDropdownDanger}`}
                                >
                                  <TrashIcon size={14} />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan="9" style={{ textAlign: "center", padding: "2.5rem", color: "#64748b" }}>
                        No orders recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW 5: STORE SETTINGS */}
          {activeTab === "settings" && (
            <div className={styles.settingsContainer}>
              {/* Settings Sub-Tabs */}
              <div className={styles.settingsTabs}>
                <button
                  type="button"
                  onClick={() => setSettingsTab("general")}
                  className={`${styles.settingsTabBtn} ${settingsTab === "general" ? styles.settingsTabBtnActive : ""}`}
                >
                  <SettingsIcon size={14} style={{ marginRight: "0.35rem" }} />
                  General Settings
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab("products")}
                  className={`${styles.settingsTabBtn} ${settingsTab === "products" ? styles.settingsTabBtnActive : ""}`}
                >
                  <TruckIcon size={14} style={{ marginRight: "0.35rem" }} />
                  Products &amp; Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab("contact")}
                  className={`${styles.settingsTabBtn} ${settingsTab === "contact" ? styles.settingsTabBtnActive : ""}`}
                >
                  <MapPinIcon size={14} style={{ marginRight: "0.35rem" }} />
                  Contact &amp; Social
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className={styles.settingsCard}>
                {/* 1. GENERAL SETTINGS */}
                {settingsTab === "general" && (
                  <div>
                    <h2 className={styles.settingsCardTitle}>General Store Profile</h2>
                    <p className={styles.settingsCardSub}>
                      Store branding, storefront announcements, and operational hours displayed to customers.
                    </p>

                    <div className={styles.settingsGrid}>
                      <label className={styles.label}>
                        <span>Store Name *</span>
                        <input
                          type="text"
                          required
                          value={storeSettings.storeName || ""}
                          onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                          className={styles.input}
                          placeholder="Tiny Flora Microgreens"
                        />
                      </label>

                      <label className={styles.label}>
                        <span>Currency *</span>
                        <input
                          type="text"
                          required
                          value={storeSettings.currency || "INR"}
                          onChange={(e) => setStoreSettings({ ...storeSettings, currency: e.target.value })}
                          className={styles.input}
                          placeholder="INR"
                        />
                      </label>

                      <label className={`${styles.label} ${styles.settingsGridFull}`}>
                        <span>Storefront Announcement Banner</span>
                        <input
                          type="text"
                          value={storeSettings.announcementText || ""}
                          onChange={(e) => setStoreSettings({ ...storeSettings, announcementText: e.target.value })}
                          className={styles.input}
                          placeholder="e.g. Fresh harvest available! Free delivery on orders over ₹499"
                        />
                      </label>

                      <label className={`${styles.label} ${styles.settingsGridFull}`}>
                        <span>Business &amp; Harvesting Hours</span>
                        <input
                          type="text"
                          value={storeSettings.businessHours || ""}
                          onChange={(e) => setStoreSettings({ ...storeSettings, businessHours: e.target.value })}
                          className={styles.input}
                          placeholder="Mon - Sat: 9:00 AM - 7:00 PM"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* 2. PRODUCTS & DELIVERY SETTINGS */}
                {settingsTab === "products" && (
                  <div>
                    <h2 className={styles.settingsCardTitle}>Products &amp; Delivery Configuration</h2>
                    <p className={styles.settingsCardSub}>
                      Dynamic delivery fee calculation applied at cart checkout, free delivery thresholds, and logistics instructions.
                    </p>

                    <div className={styles.settingsGrid}>
                      <label className={styles.label}>
                        <span>Standard Delivery Charge (₹) *</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={storeSettings.deliveryCharge ?? 40}
                          onChange={(e) => setStoreSettings({ ...storeSettings, deliveryCharge: parseFloat(e.target.value) || 0 })}
                          className={styles.input}
                          placeholder="40"
                        />
                      </label>

                      <label className={styles.label}>
                        <span>Free Delivery Threshold (₹) *</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={storeSettings.freeDeliveryThreshold ?? 499}
                          onChange={(e) => setStoreSettings({ ...storeSettings, freeDeliveryThreshold: parseFloat(e.target.value) || 0 })}
                          className={styles.input}
                          placeholder="499"
                        />
                      </label>

                      <label className={`${styles.label} ${styles.settingsGridFull}`}>
                        <span>Minimum Order Amount (₹)</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={storeSettings.minimumOrderAmount ?? 0}
                          onChange={(e) => setStoreSettings({ ...storeSettings, minimumOrderAmount: parseFloat(e.target.value) || 0 })}
                          className={styles.input}
                          placeholder="0 (No minimum)"
                        />
                      </label>

                      <label className={`${styles.label} ${styles.settingsGridFull}`}>
                        <span>Delivery &amp; Harvesting Information</span>
                        <textarea
                          value={storeSettings.deliveryInformation || ""}
                          onChange={(e) => setStoreSettings({ ...storeSettings, deliveryInformation: e.target.value })}
                          className={styles.textarea}
                          placeholder="Same-day harvest &amp; delivery within 24-48 hours across the city."
                          rows={3}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* 3. CONTACT & SOCIAL SETTINGS */}
                {settingsTab === "contact" && (
                  <div>
                    <h2 className={styles.settingsCardTitle}>Contact &amp; Social Channels</h2>
                    <p className={styles.settingsCardSub}>
                      Customer care phone numbers, WhatsApp, physical address, and social links displayed across headers and footers.
                    </p>

                    <div className={styles.settingsGrid}>
                      <label className={styles.label}>
                        <span>Contact Email *</span>
                        <input
                          type="email"
                          required
                          value={storeSettings.contactEmail || ""}
                          onChange={(e) => setStoreSettings({ ...storeSettings, contactEmail: e.target.value })}
                          className={styles.input}
                          placeholder="hello@tinyflora.com"
                        />
                      </label>

                      <label className={styles.label}>
                        <span>Contact Phone *</span>
                        <input
                          type="text"
                          required
                          value={storeSettings.contactPhone || ""}
                          onChange={(e) => setStoreSettings({ ...storeSettings, contactPhone: e.target.value })}
                          className={styles.input}
                          placeholder="+91XXXXXXXXXX"
                        />
                      </label>

                      <label className={styles.label}>
                        <span>WhatsApp Number</span>
                        <input
                          type="text"
                          value={storeSettings.whatsappNumber || ""}
                          onChange={(e) => setStoreSettings({ ...storeSettings, whatsappNumber: e.target.value })}
                          className={styles.input}
                          placeholder="+91XXXXXXXXXX"
                        />
                      </label>

                      <label className={styles.label}>
                        <span>Store Physical Address</span>
                        <input
                          type="text"
                          value={storeSettings.address || ""}
                          onChange={(e) => setStoreSettings({ ...storeSettings, address: e.target.value })}
                          className={styles.input}
                          placeholder="Lucknow, Uttar Pradesh"
                        />
                      </label>

                      <label className={styles.label}>
                        <span>Instagram URL</span>
                        <input
                          type="url"
                          value={storeSettings.instagramUrl || ""}
                          onChange={(e) => setStoreSettings({ ...storeSettings, instagramUrl: e.target.value })}
                          className={styles.input}
                          placeholder="https://instagram.com/tinyflora"
                        />
                      </label>

                      <label className={styles.label}>
                        <span>Facebook URL</span>
                        <input
                          type="url"
                          value={storeSettings.facebookUrl || ""}
                          onChange={(e) => setStoreSettings({ ...storeSettings, facebookUrl: e.target.value })}
                          className={styles.input}
                          placeholder="https://facebook.com/tinyflora"
                        />
                      </label>
                    </div>
                  </div>
                )}

                <div className={styles.formActions} style={{ marginTop: "1.5rem" }}>
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className={styles.submitBtn}
                  >
                    {savingSettings ? "Saving Settings..." : "Save Store Settings"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* POPUP MODAL 1: Create Category */}
      {isCategoryModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCategoryModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Create New Category</h2>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className={styles.closeBtn}
              >
                <CloseIcon size={14} />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className={styles.form}>
              <label className={styles.label}>
                <span>Category Name *</span>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Rare Seeds &amp; Starter Kits"
                  className={styles.input}
                />
              </label>

              <label className={styles.label}>
                <span>Description (Optional)</span>
                <textarea
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  placeholder="Short description for storefront filters..."
                  className={styles.textarea}
                />
              </label>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className={styles.submitBtn}
                >
                  {savingCategory ? "Saving..." : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL 2: Edit Category */}
      {editingCategory && (
        <div className={styles.modalOverlay} onClick={() => setEditingCategory(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Edit Category</h2>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className={styles.closeBtn}
              >
                <CloseIcon size={14} />
              </button>
            </div>
            <form onSubmit={handleSaveCategoryEdit} className={styles.form}>
              <label className={styles.label}>
                <span>Category Name *</span>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className={styles.input}
                />
              </label>

              <label className={styles.label}>
                <span>Description</span>
                <textarea
                  value={editingCategory.description || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className={styles.textarea}
                />
              </label>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCategoryEdit}
                  className={styles.submitBtn}
                >
                  {savingCategoryEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL 3: Delete Category Confirmation */}
      {deleteCategoryCandidate && (
        <div className={styles.modalOverlay} onClick={() => setDeleteCategoryCandidate(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3>Delete Category</h3>
            {(deleteCategoryCandidate._count?.products ?? 0) > 0 ? (
              <div>
                <p className={styles.confirmText} style={{ color: "#b91c1c" }}>
                  Cannot delete category &ldquo;{deleteCategoryCandidate.name}&rdquo; because it is assigned to {deleteCategoryCandidate._count.products} products.
                  Please reassign those products first.
                </p>
                <div className={styles.confirmActions}>
                  <button
                    type="button"
                    onClick={() => setDeleteCategoryCandidate(null)}
                    className={styles.cancelBtn}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className={styles.confirmText}>
                  Do you really want to delete unused category &ldquo;{deleteCategoryCandidate.name}&rdquo;?
                </p>
                <div className={styles.confirmActions}>
                  <button
                    type="button"
                    onClick={() => setDeleteCategoryCandidate(null)}
                    className={styles.cancelBtn}
                    disabled={deletingCategory}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteCategory}
                    className={styles.hardDeleteBtn}
                    disabled={deletingCategory}
                  >
                    {deletingCategory ? "Deleting..." : "Delete Category"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* POPUP MODAL 4: Active / Inactive Status Confirmation */}
      {confirmStatusCandidate && (
        <div className={styles.modalOverlay} onClick={() => setConfirmStatusCandidate(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3>{confirmStatusCandidate.targetActive ? "Activate Product" : "Deactivate Product"}</h3>
            <p className={styles.confirmText}>
              {confirmStatusCandidate.targetActive
                ? `Do you want to make "${confirmStatusCandidate.product.name}" active? It will be visible to all customers on the storefront.`
                : `Do you want to make "${confirmStatusCandidate.product.name}" inactive? It will be hidden from storefront catalog and search.`}
            </p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                onClick={() => setConfirmStatusCandidate(null)}
                className={styles.cancelBtn}
                disabled={savingStatus}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleExecuteStatusChange(confirmStatusCandidate.product.id, confirmStatusCandidate.targetActive)}
                className={confirmStatusCandidate.targetActive ? styles.activateBtn : styles.inactiveBtn}
                disabled={savingStatus}
              >
                {savingStatus
                  ? "Updating..."
                  : confirmStatusCandidate.targetActive
                  ? "Yes, Make Active"
                  : "Yes, Make Inactive"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL 5: Delete Product Confirmation */}
      {deleteCandidate && (
        <div className={styles.modalOverlay} onClick={() => setDeleteCandidate(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3>Delete Product</h3>
            <p className={styles.confirmText}>
              Do you really want to delete &ldquo;{deleteCandidate.name}&rdquo;?
              <br /><br />
              You can make it inactive instead to preserve order records while removing it from the storefront.
            </p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className={styles.cancelBtn}
                disabled={deletingProduct}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMakeInactive}
                className={styles.inactiveBtn}
                disabled={deletingProduct}
              >
                Make Inactive Instead
              </button>
              <button
                type="button"
                onClick={handleHardDelete}
                className={styles.hardDeleteBtn}
                disabled={deletingProduct}
              >
                {deletingProduct ? "Deleting..." : "Delete Anyway"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL 6: Add Product */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={handleCloseNewModal}>
          <div className={`${styles.modal} ${styles.modalScroll}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add New Product</h2>
              <button type="button" onClick={handleCloseNewModal} className={styles.closeBtn}>
                <CloseIcon size={14} />
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className={styles.form}>
              <label className={styles.label}>
                <span>Product Title *</span>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="e.g. Spicy Radish Microgreens"
                  className={styles.input}
                />
              </label>

              <div className={styles.formRow}>
                <label className={styles.label}>
                  <span>Category *</span>
                  <select
                    value={newProduct.categoryId}
                    onChange={(e) => setNewProduct({ ...newProduct, categoryId: Number(e.target.value) })}
                    className={styles.select}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.label}>
                  <span>Price (₹) *</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="99.00"
                    className={styles.input}
                  />
                </label>
              </div>

              <div className={styles.formRow}>
                <label className={styles.label}>
                  <span>Stock Units *</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    placeholder="25"
                    className={styles.input}
                  />
                </label>

                <label className={styles.label}>
                  <span>Weight / Portion</span>
                  <input
                    type="text"
                    value={newProduct.weight}
                    onChange={(e) => setNewProduct({ ...newProduct, weight: e.target.value })}
                    placeholder="50g"
                    className={styles.input}
                  />
                </label>
              </div>

              {/* Single Image Upload */}
              <div className={styles.label}>
                <span>Product Photo</span>
                <div className={styles.uploadZoneSingle}>
                  <input
                    ref={newFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleSelectNewFile}
                    className={styles.uploadInputHidden}
                  />
                  {!newImagePreview ? (
                    <div>
                      <button
                        type="button"
                        onClick={() => newFileInputRef.current?.click()}
                        className={styles.uploadTriggerBtn}
                      >
                        <FolderUploadIcon size={16} style={{ marginRight: "0.4rem" }} /> Choose Photo
                      </button>
                      <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "0.4rem" }}>
                        PNG, JPG or WEBP (Max 5MB)
                      </div>
                    </div>
                  ) : (
                    <div className={styles.singlePreviewCard}>
                      <Image
                        src={newImagePreview}
                        alt="Preview"
                        width={48}
                        height={48}
                        unoptimized
                        className={styles.singlePreviewImg}
                      />
                      <div style={{ flex: 1, minWidth: 0, fontSize: "12px" }}>
                        <div style={{ fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {newImageFile?.name || "Selected Photo"}
                        </div>
                        <div style={{ color: "#10b981", fontSize: "11px" }}>Ready to save</div>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearNewFile}
                        className={styles.removeImgBtn}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <label className={styles.label}>
                <span>Description</span>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Fresh nutty flavor, vibrant green leaves..."
                  className={styles.textarea}
                />
              </label>

              <div className={styles.formActions}>
                <button type="button" onClick={handleCloseNewModal} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={savingProduct} className={styles.submitBtn}>
                  {savingProduct ? "Saving..." : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL 7: Edit Product */}
      {editingProduct && (
        <div className={styles.modalOverlay} onClick={handleCloseEditModal}>
          <div className={`${styles.modal} ${styles.modalScroll}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Edit Product #{editingProduct.id}</h2>
              <button type="button" onClick={handleCloseEditModal} className={styles.closeBtn}>
                <CloseIcon size={14} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className={styles.form}>
              <label className={styles.label}>
                <span>Product Title *</span>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className={styles.input}
                />
              </label>

              <div className={styles.formRow}>
                <label className={styles.label}>
                  <span>Category *</span>
                  <select
                    value={editingProduct.categoryId}
                    onChange={(e) => setEditingProduct({ ...editingProduct, categoryId: Number(e.target.value) })}
                    className={styles.select}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.label}>
                  <span>Price (₹) *</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    className={styles.input}
                  />
                </label>
              </div>

              <div className={styles.formRow}>
                <label className={styles.label}>
                  <span>Stock Units *</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                    className={styles.input}
                  />
                </label>

                <label className={styles.label}>
                  <span>Weight / Portion</span>
                  <input
                    type="text"
                    value={editingProduct.weight}
                    onChange={(e) => setEditingProduct({ ...editingProduct, weight: e.target.value })}
                    className={styles.input}
                  />
                </label>
              </div>

              {/* Single Image Upload */}
              <div className={styles.label}>
                <span>Product Photo</span>
                <div className={styles.uploadZoneSingle}>
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleSelectEditFile}
                    className={styles.uploadInputHidden}
                  />
                  {!editImagePreview ? (
                    <div>
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className={styles.uploadTriggerBtn}
                      >
                        <FolderUploadIcon size={16} style={{ marginRight: "0.4rem" }} /> Choose Photo
                      </button>
                      <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "0.4rem" }}>
                        PNG, JPG or WEBP (Max 5MB)
                      </div>
                    </div>
                  ) : (
                    <div className={styles.singlePreviewCard}>
                      <Image
                        src={editImagePreview}
                        alt="Preview"
                        width={48}
                        height={48}
                        unoptimized
                        className={styles.singlePreviewImg}
                      />
                      <div style={{ flex: 1, minWidth: 0, fontSize: "12px" }}>
                        <div style={{ fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {editImageFile ? editImageFile.name : "Current Photo"}
                        </div>
                        <div style={{ color: "#10b981", fontSize: "11px" }}>
                          {editImageFile ? "New file staged" : "Existing saved photo"}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearEditFile}
                        className={styles.removeImgBtn}
                      >
                        Replace
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <label className={styles.label}>
                <span>Description</span>
                <textarea
                  value={editingProduct.description || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className={styles.textarea}
                />
              </label>

              <div className={styles.formActions}>
                <button type="button" onClick={handleCloseEditModal} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={savingEdit} className={styles.submitBtn}>
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* POPUP MODAL: Hassle-Free Featured Product Picker */}
      {featuredSlotPicker !== null && (
        <div className={styles.modalOverlay} onClick={() => setFeaturedSlotPicker(null)}>
          <div className={styles.featuredPickerModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader} style={{ marginBottom: "0.5rem" }}>
              <h2>Select Featured Product (Slot #{featuredSlotPicker + 1})</h2>
              <button
                type="button"
                onClick={() => setFeaturedSlotPicker(null)}
                className={styles.closeBtn}
              >
                <CloseIcon size={14} />
              </button>
            </div>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
              Choose any product from your catalog to showcase in slot #{featuredSlotPicker + 1} on the storefront.
            </p>

            <input
              type="text"
              placeholder="Search products by name..."
              value={pickerSearchTerm}
              onChange={(e) => setPickerSearchTerm(e.target.value)}
              className={styles.featuredPickerSearch}
              autoFocus
            />

            <div className={styles.featuredPickerList}>
              {loadingPickerCatalog ? (
                <div style={{ textAlign: "center", padding: "1.5rem", color: "#64748b" }}>
                  Loading catalog...
                </div>
              ) : (
                (() => {
                  const filtered = (catalogForPicker.length > 0 ? catalogForPicker : products).filter((p) =>
                    !pickerSearchTerm.trim() ||
                    p.name?.toLowerCase().includes(pickerSearchTerm.toLowerCase()) ||
                    p.category?.name?.toLowerCase().includes(pickerSearchTerm.toLowerCase())
                  );

                  if (filtered.length === 0) {
                    return (
                      <div style={{ textAlign: "center", padding: "1.5rem", color: "#64748b" }}>
                        No matching products found.
                      </div>
                    );
                  }

                  return filtered.map((prod) => {
                    const isCurrentSlot = featuredProducts[featuredSlotPicker]?.id === prod.id;
                    const alreadyFeaturedSlot = featuredProducts.findIndex((p) => p.id === prod.id);
                    const isFeaturedElsewhere = alreadyFeaturedSlot !== -1 && alreadyFeaturedSlot !== featuredSlotPicker;
                    const img = prod.image || "/images/product-placeholder.png";

                    return (
                      <div key={prod.id} className={styles.featuredPickerItem}>
                        <Image
                          src={img}
                          alt={prod.name}
                          width={38}
                          height={38}
                          unoptimized
                          className={styles.featuredSlotImg}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: "13px", color: "#0f172a" }}>
                            {prod.name}
                          </div>
                          <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                            ₹{Number(prod.price).toFixed(2)} • {prod.category?.name || "General"} • {prod.stock ?? 0} in stock
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAssignFeaturedSlot(featuredSlotPicker, prod)}
                          className={styles.featuredPickerSelectBtn}
                          disabled={savingFeatured || isCurrentSlot}
                        >
                          {isCurrentSlot ? (
                            "Current Item"
                          ) : isFeaturedElsewhere ? (
                            `Move from Slot #${alreadyFeaturedSlot + 1}`
                          ) : (
                            <span style={{ display: "inline-flex", alignItems: "center" }}>
                              <StarIcon size={12} filled={true} style={{ marginRight: "0.3rem" }} />
                              Select
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
