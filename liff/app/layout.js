import { LIFFProvider } from "@/app/providers";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LIFFProvider>{children}</LIFFProvider>
      </body>
    </html>
  );
}
