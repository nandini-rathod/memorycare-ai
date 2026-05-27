import "./globals.css";
import { Nunito, DM_Serif_Display } from "next/font/google";
import Providers from "@/components/Providers";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-dm-serif",
  weight: "400",
});

export const metadata = {
  title: "MemoryCare — Alzheimer's AI Companion",
  description: "A compassionate AI companion for Alzheimer's patients and their caregivers",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${nunito.variable} ${dmSerif.variable}`}>
      <body className="font-nunito antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
