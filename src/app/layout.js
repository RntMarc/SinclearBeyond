import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
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
    <html lang="de" className={`${inter.variable} dark h-full`}>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
