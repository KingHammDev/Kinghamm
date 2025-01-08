import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { initializeMssqlPool } from "@/lib/mssql";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "KingHamm App",
  description: "KingHamm",
};

initializeMssqlPool()
  .then(() => {
    console.log('MSSQL connection pool initialized');
  })
  .catch((err) => {
    console.error('Failed to initialize MSSQL connection pool:', err);
  });

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
