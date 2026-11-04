import { Suspense } from "react";
import { getStoreSettings, DEFAULT_STORE_SETTINGS } from "@/lib/settings";
import styles from "./page.module.css";

async function ContactDetails() {
  const settings = await getStoreSettings();
  return (
    <div className={styles.infoList}>
      <p className={styles.infoItem}>Email: {settings.contactEmail}</p>
      <p className={styles.infoItem}>Phone: {settings.contactPhone}</p>
      {settings.whatsappNumber && (
        <p className={styles.infoItem}>WhatsApp: {settings.whatsappNumber}</p>
      )}
      <p className={styles.infoItem}>Address: {settings.address}</p>
      <p className={styles.infoItem}>Hours: {settings.businessHours}</p>
    </div>
  );
}

function ContactFallback() {
  return (
    <div className={styles.infoList}>
      <p className={styles.infoItem}>Email: {DEFAULT_STORE_SETTINGS.contactEmail}</p>
      <p className={styles.infoItem}>Phone: {DEFAULT_STORE_SETTINGS.contactPhone}</p>
      <p className={styles.infoItem}>Address: {DEFAULT_STORE_SETTINGS.address}</p>
      <p className={styles.infoItem}>Hours: {DEFAULT_STORE_SETTINGS.businessHours}</p>
    </div>
  );
}

export default function ContactPage() {
  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>Get in touch</p>
      <h1 className={styles.title}>We&apos;d love to hear from you.</h1>

      <Suspense fallback={<ContactFallback />}>
        <ContactDetails />
      </Suspense>
    </main>
  );
}
