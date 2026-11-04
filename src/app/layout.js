import "./globals.css";
import { CartProvider } from "@/context/CartContext";

export const metadata = {
  title: {
    default: "Tiny Floramicro Greens",
    template: "%s | Tiny Floramicro Greens",
  },
  description:
    "Fresh, naturally grown microgreens for your everyday meals.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}