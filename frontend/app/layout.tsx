import { Cairo } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";


const cairo = Cairo({ subsets: ["arabic"], weight: ["400", "500", "700"] });

export const metadata = {
  title: "Smart Attendance Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.className} bg-gray-50 text-gray-900`}>
         <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
