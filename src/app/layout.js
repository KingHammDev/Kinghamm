import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { initializeMssqlPool } from "@/lib/mssql";
import { LanguageProvider } from '@/contexts/LanguageContext'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Clothes Management",
  description: "Clothes Management",
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
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
