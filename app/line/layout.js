import { LIFFProvider } from "./providers";

export default function RootLayout({ children }) {
  return <LIFFProvider>{children}</LIFFProvider>;
}
