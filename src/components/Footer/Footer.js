"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPinIcon, MailIcon, PhoneIcon } from "@/components/Icons";
import styles from "./Footer.module.css";

export default function Footer() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch {
        // Fallback to env
      }
    }
    loadSettings();
  }, []);

  const storeName = settings?.storeName || process.env.NEXT_PUBLIC_STORE_NAME || "Tiny Flora Microgreens";
  const tagline =
    process.env.NEXT_PUBLIC_STORE_TAGLINE ||
    "Pure nutrition, locally grown microgreens delivered fresh from seed to table.";
  const contactEmail = settings?.contactEmail || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@tinyflora.com";
  const contactPhone = settings?.contactPhone || process.env.NEXT_PUBLIC_CONTACT_PHONE || "+91XXXXXXXXXX";
  const storeAddress = settings?.address || process.env.NEXT_PUBLIC_STORE_ADDRESS || "Lucknow, Uttar Pradesh";
  const instagramUrl = settings?.instagramUrl || process.env.NEXT_PUBLIC_INSTAGRAM_URL || "";
  const facebookUrl = settings?.facebookUrl || process.env.NEXT_PUBLIC_FACEBOOK_URL || "";
  const twitterUrl = process.env.NEXT_PUBLIC_TWITTER_URL || "";

  return (
    <footer className={styles.footer}>
      <div className={styles.footerGrid}>
        {/* Brand column */}
        <div>
          <Link href="/" className={styles.brand}>
            {storeName}
          </Link>
          <p className={styles.tagline}>{tagline}</p>
          {storeAddress && (
            <p className={styles.address}>
              <MapPinIcon size={14} style={{ marginRight: "0.35rem", opacity: 0.8 }} />
              {storeAddress}
            </p>
          )}
        </div>

        {/* Navigation column */}
        <div>
          <h3 className={styles.colTitle}>Navigation</h3>
          <ul className={styles.linkList}>
            <li>
              <Link href="/shop" className={styles.linkItem}>
                Shop All Greens
              </Link>
            </li>
            <li>
              <Link href="/about" className={styles.linkItem}>
                Our Story
              </Link>
            </li>
            <li>
              <Link href="/cart" className={styles.linkItem}>
                View Cart
              </Link>
            </li>
            <li>
              <Link href="/contact" className={styles.linkItem}>
                Contact &amp; Support
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact & Social column */}
        <div>
          <h3 className={styles.colTitle}>Get In Touch</h3>
          <div className={styles.contactList}>
            <a href={`mailto:${contactEmail}`} className={styles.contactItem}>
              <MailIcon size={14} style={{ marginRight: "0.45rem", opacity: 0.85 }} />
              {contactEmail}
            </a>
            <a href={`tel:${contactPhone}`} className={styles.contactItem}>
              <PhoneIcon size={14} style={{ marginRight: "0.45rem", opacity: 0.85 }} />
              {contactPhone}
            </a>
          </div>

          <div className={styles.socialRow}>
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="Instagram"
              >
                <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            )}

            {facebookUrl && (
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="Facebook"
              >
                <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
            )}

            {twitterUrl && (
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="Twitter"
              >
                <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <span>© 2026 {storeName}. All rights reserved.</span>
        <div className={styles.bottomLinks}>
          <Link href="/contact">Privacy Policy</Link>
          <Link href="/contact">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
