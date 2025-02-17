import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/app/ui/navbar";
import "bootstrap-icons/font/bootstrap-icons.css";
import SessionWrapper from "./components/SessionWrapper";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Roomio",
  description: "Apartment Management System",
};

export default function RootLayout({ children }) {
  return (
    <SessionWrapper>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <div className="flex min-h-screen bg-[#EBECE1]">
            <Navbar />
            <div className="flex-1 p-5 overflow-auto">{children}</div>
          </div>
        </body>
      </html>
    </SessionWrapper>
  );
}
