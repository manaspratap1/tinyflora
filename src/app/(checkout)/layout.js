import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";

export default function CheckoutLayout({ children }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}

