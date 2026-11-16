import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ButadiProvider } from "@/context/ButadiContext";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BUTADI - Buku Tamu Digital Dinas Pendidikan & Kebudayaan Kota Kendari",
  description:
    "Sistem E-Receptionist, Buku Tamu Digital QR Code, Dashboard Eksekutif Kepala Dinas, dan Survei Kepuasan Masyarakat (SKM) Real-Time Dinas Pendidikan dan Kebudayaan Kota Kendari.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <ButadiProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="bg-[#0F2C59] text-blue-200 border-t border-blue-900/60 py-5 text-xs no-print">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div>
                <span className="font-bold text-white">
                  BUTADI (Buku Tamu Digital Dikbud Kendari)
                </span>{" "}
                &mdash; Pemerintah Kota Kendari, Sulawesi Tenggara
              </div>
              <div className="text-blue-300">
                Terintegrasi Real-Time 4 Portal &bull; Standar IKM PermenPAN-RB
                No. 14 Tahun 2017
              </div>
            </div>
          </footer>
        </ButadiProvider>
      </body>
    </html>
  );
}
