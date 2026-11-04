import { Suspense } from "react";
import ProductPage from "./ProductPage";

async function ProductPageWrapper({ params }) {
  const { id } = await params;
  return <ProductPage id={id} />;
}

export default function Page({ params }) {
  return (
    <Suspense fallback={<main style={{ padding: "35px 8% 80px" }}>Loading fresh microgreens...</main>}>
      <ProductPageWrapper params={params} />
    </Suspense>
  );
}