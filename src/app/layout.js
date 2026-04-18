import { Cormorant_Garamond, Figtree } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const figtree = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Sinclear Beyond",
  description:
    "Deine Community. Kein Lärm. Chats, Kalender, Geburtstage und mehr – an einem Ort.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="de"
      className={`${cormorant.variable} ${figtree.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-[#0f110e] text-[#f0ebe0]">
        {children}
      </body>
    </html>
  );
}