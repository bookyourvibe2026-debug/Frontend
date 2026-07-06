import type { Metadata } from "next";
import { WhatsAppWidget } from "@/components/WhatsAppWidget";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { CustomerAuthProvider } from "@/components/providers/CustomerAuthProvider";
import { GoogleAuthProvider } from "@/components/providers/GoogleAuthProvider";
import "./globals.css";

const THEME_INIT_SCRIPT = `
try {
  var t = localStorage.getItem("byv-theme");
  if (t) document.documentElement.setAttribute("data-theme", t);
} catch (e) {}
`;

export const metadata: Metadata = {
  title: "Book Your Vibe",
  description: "Sports booking, community, food, and admin platform frontend.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body
        className="min-h-full flex flex-col font-sans"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <GoogleAuthProvider>
            <CustomerAuthProvider>
              {children}
              <WhatsAppWidget />
            </CustomerAuthProvider>
          </GoogleAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
